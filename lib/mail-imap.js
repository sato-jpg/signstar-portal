const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');

export async function getLatestEmailsIMAP(config) {
  return Promise.race([
    fetchEmails(config),
    new Promise((resolve) => setTimeout(() => resolve([]), 10000)) // 10秒に延長
  ]);
}

async function fetchEmails(config) {
  const imapConfig = {
    imap: {
      user: config.user,
      password: config.password,
      host: config.host || 'nwapi001.sakura.ne.jp',
      port: 993,
      tls: true,
      authTimeout: 2000,
      connTimeout: 5000,
    },
  };

  try {
    const connection = await imaps.connect(imapConfig);
    await connection.openBox('INBOX');

    // 全件の件数を取得
    const searchCriteria = ['ALL'];
    const results = await connection.search(searchCriteria, { bodies: ['HEADER'] });
    
    if (results.length === 0) {
      connection.end();
      return [];
    }

    // 最新の200件を検索（迷惑メールを弾いた後にも十分な数が残るように多めに取る）
    const latestItems = results.slice(-200).reverse();

    // 除外キーワード（高頻度なスパムのみに絞り、通常の業務メールを拾えるようにする）
    const SPAM_KEYWORDS = [
      'ロレックス', 'コピー', '投資', '副業', 'Rolex', 'Watch',
      'Security Days', 'メルマガ', 'メールマガジン', 'newsletter', '配信停止'
    ];

    console.log('Search results total:', results.length);

    const emailsRaw = latestItems.map(item => {
      const header = item.parts.find(p => p.which === 'HEADER')?.body;
      if (!header) return null;

      // ヘッダーから情報を抽出
      const subject = header.subject ? header.subject[0] : "(無題)";
      const fromRaw = header.from ? header.from[0] : "Unknown <unknown@example.com>";
      
      // 送信者名とアドレスのパース
      let fromName = "Unknown";
      let fromEmail = "Unknown";
      const match = fromRaw.match(/(.*)<(.*)>/);
      if (match) {
        fromName = match[1].trim().replace(/^"|"$/g, '');
        fromEmail = match[2].trim();
      } else {
        fromEmail = fromRaw;
      }

      const receivedDateTime = item.attributes.date || new Date();
      const isRead = item.attributes.flags.includes('\\Seen');

      return {
        id: item.attributes.uid,
        subject,
        fromName,
        fromEmail,
        receivedDateTime,
        isRead
      };
    }).filter(e => e !== null);

    console.log('Parsed emailsRaw count:', emailsRaw.length);

    // フィルタリング: 迷惑メールを除去
    const filteredEmails = emailsRaw
      .filter(mail => {
        const textToTest = (mail.subject + mail.fromName + mail.fromEmail).toLowerCase();
        // ロレックスなどの明らかなスパムのみを弾く（看板屋さんの業務メールは残す）
        const isSpam = SPAM_KEYWORDS.some(k => textToTest.includes(k.toLowerCase()));
        return !isSpam;
      })
      .slice(0, 100);

    connection.end();
    
    // page.jsでの表示形式に合わせる
    return filteredEmails.map(mail => ({
      ...mail,
      from: {
        emailAddress: {
          name: mail.fromName,
          address: mail.fromEmail
        }
      }
    }));
  } catch (error) {
    console.error('IMAP Error:', error);
    return [];
  }
}

export async function fetchEmailBodyIMAP(uid, config) {
  const imapConfig = {
    imap: {
      user: config.user,
      password: config.password,
      host: config.host || 'nwapi001.sakura.ne.jp',
      port: 993,
      tls: true,
      authTimeout: 2000,
      connTimeout: 5000,
    },
  };

  try {
    const connection = await imaps.connect(imapConfig);
    await connection.openBox('INBOX');

    const searchCriteria = [['UID', uid]];
    const fetchOptions = { bodies: [''], struct: true }; // メッセージ全体を取得
    const results = await connection.search(searchCriteria, fetchOptions);

    if (results.length === 0) {
      connection.end();
      return "メールが見つかりませんでした。";
    }

    const item = results[0];
    const messagePart = item.parts.find(p => p.which === '');
    
    if (!messagePart) {
      connection.end();
      return "メッセージデータを読み取れませんでした。";
    }

    // mailparserで安全にパース
    const parsed = await simpleParser(messagePart.body);
    connection.end();

    // テキスト形式がメイン、無ければHTMLのテキスト抽出など
    return parsed.text || parsed.textAsHtml || "本文が空か、解析できない形式です。";

  } catch (error) {
    console.error('fetchEmailBodyIMAP Error:', error);
    throw new Error('メール本文の取得に失敗しました。');
  }
}

// nodemailer for sending
const nodemailer = require('nodemailer');

export async function sendEmailSMTP(config) {
  try {
    const transporter = nodemailer.createTransport({
      host: config.host || "nwapi001.sakura.ne.jp",
      port: 465, // SSL
      secure: true,
      auth: {
        user: config.user,
        pass: config.password,
      },
    });

    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.user}>`,
      to: config.to,
      subject: config.subject,
      text: config.text,
    });

    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error('sendEmailSMTP Error:', error);
    throw new Error('メールの送信に失敗しました。');
  }
}
