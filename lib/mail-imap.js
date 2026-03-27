import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import fs from 'fs';

function logDebug(msg) {
  const line = `[${new Date().toISOString()}] [IMAP] ${msg}\n`;
  try {
    // Vercelでは書き込めないことが多いが、ローカルデバッグのために試行
    fs.appendFileSync('debug.log', line);
  } catch (e) {}
  console.log(`[IMAP] ${msg}`);
}

export async function getLatestEmailsIMAP(config) {
  return Promise.race([
    fetchEmails(config),
    new Promise((resolve) => {
      setTimeout(() => {
        logDebug("TIMEOUT! Fetching took more than 20s");
        resolve([]);
      }, 20000);
    })
  ]);
}

async function fetchEmails(config) {
  const host = config.host || 'nwapi001.sakura.ne.jp';
  logDebug(`--- IMAP Attempt (${host}:993) ---`);

  const imapConfig = {
    imap: {
      user: config.user,
      password: config.password,
      host: host,
      port: 993,
      tls: true,
      authTimeout: 5000,
      connTimeout: 10000,
      tlsOptions: {
        rejectUnauthorized: false,
        servername: host,
        minVersion: 'TLSv1.2'
      }
    },
  };

  try {
    logDebug(`Connecting to IMAP server...`);
    const connection = await imaps.connect(imapConfig);
    logDebug(`Connected! Opening INBOX...`);
    await connection.openBox('INBOX');

    const searchCriteria = ['ALL'];
    const results = await connection.search(searchCriteria, { bodies: ['HEADER'] });
    logDebug(`Found ${results.length} total messages.`);
    
    if (results.length === 0) {
      connection.end();
      return [];
    }

    // 最新の50件
    const latestItems = results.slice(-50).reverse();

    const SPAM_KEYWORDS = [
      'ロレックス', 'コピー', '投資', '副業', 'Rolex', 'Watch',
      'Security Days', 'メルマガ', 'メールマガジン', 'newsletter', '配信停止'
    ];

    const emailsRaw = latestItems.map(item => {
      const header = item.parts.find(p => p.which === 'HEADER')?.body;
      if (!header) return null;

      const subject = header.subject ? header.subject[0] : "(無題)";
      const fromRaw = header.from ? header.from[0] : "Unknown <unknown@example.com>";
      
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

    const filteredEmails = emailsRaw
      .filter(mail => {
        const textToTest = (mail.subject + mail.fromName + mail.fromEmail).toLowerCase();
        return !SPAM_KEYWORDS.some(k => textToTest.includes(k.toLowerCase()));
      })
      .slice(0, 15);

    logDebug(`Returning ${filteredEmails.length} filtered emails.`);
    connection.end();
    
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
    logDebug(`CRITICAL ERROR: ${error.message}`);
    console.error('[IMAP] Fetch Error:', error);
    return [];
  }
}

export async function fetchEmailBodyIMAP(uid, config) {
  const host = config.host || 'nwapi001.sakura.ne.jp';
  const imapConfig = {
    imap: {
      user: config.user,
      password: config.password,
      host: host,
      port: 993,
      tls: true,
      tlsOptions: {
        rejectUnauthorized: false,
        servername: host,
        minVersion: 'TLSv1.2'
      }
    },
  };

  try {
    const connection = await imaps.connect(imapConfig);
    await connection.openBox('INBOX');

    const searchCriteria = [['UID', uid]];
    const fetchOptions = { bodies: [''], struct: true }; 
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

    const parsed = await simpleParser(messagePart.body);
    connection.end();

    return parsed.text || parsed.textAsHtml || "本文が空か、解析できない形式です。";
  } catch (error) {
    console.error('[IMAP] Body Fetch Error:', error);
    throw new Error('本文取得エラー');
  }
}

// nodemailer for sending
import nodemailer from 'nodemailer';

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
