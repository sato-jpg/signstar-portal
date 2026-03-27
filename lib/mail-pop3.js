import POP3Client from 'node-pop3';
import { simpleParser } from 'mailparser';
import fs from 'fs';

function logDebug(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.appendFileSync('debug.log', line);
  } catch (e) {}
  console.log(msg);
}

const SPAM_KEYWORDS = [
  'ロレックス', 'コピー', '投資', '副業', 'Rolex', 'Watch',
  'Security Days', 'メルマガ', 'メールマガジン', 'newsletter', '配信停止'
];

export async function getLatestEmailsPOP3(config) {
  return Promise.race([
    fetchEmailsPOP3(config),
    new Promise((resolve) => setTimeout(() => resolve([]), 15000)) // 15秒
  ]);
}

async function fetchEmailsPOP3(config) {
  let host = config.host || 'nwapi001.sakura.ne.jp';
  logDebug(`--- POP3 Attempt (${host}:995) ---`);
  
  // 接続オプションの調整
  const pop3Options = {
    user: config.user,
    password: config.password,
    host: host,
    port: 995,
    tls: true,
    tlsOptions: { 
      rejectUnauthorized: false, 
      servername: host,
      minVersion: 'TLSv1.2' // さくらインターネット等の古いサーバー向け
    },
    timeout: 10000
  };

  const pop3 = new POP3Client(pop3Options);

  try {
    logDebug(`Connecting to ${host} (SSL/TLS)...`);
    const list = await pop3.command('LIST');
    logDebug(`POP3 Connected! Total messages: ${list?.length || 0}`);
    
    if (!list || list.length === 0) {
      await pop3.command('QUIT');
      return [];
    }

    // 最新の20件程度をチェックしてフィルタリングする
    const total = list.length;
    const checkCount = 20;
    const startIndex = Math.max(1, total - (checkCount - 1));
    const indices = [];
    for (let i = total; i >= startIndex; i--) {
      indices.push(i);
    }

    const emails = [];
    for (const index of indices) {
      try {
        const msg = await pop3.command('RETR', index.toString());
        const mail = await simpleParser(msg);
        
        const subject = mail.subject || '(無題)';
        const fromName = mail.from?.value[0]?.name || mail.from?.value[0]?.address || 'Unknown';
        const fromAddress = mail.from?.value[0]?.address || 'Unknown';
        
        // 迷惑メールフィルタ
        const textToTest = (subject + fromName + fromAddress).toLowerCase();
        const isSpam = SPAM_KEYWORDS.some(k => textToTest.includes(k.toLowerCase()));
        
        if (!isSpam) {
          emails.push({
            id: index,
            subject: subject,
            from: {
              emailAddress: {
                name: fromName,
                address: fromAddress,
              }
            },
            receivedDateTime: mail.date || new Date(),
            isRead: false,
          });
        }
        
        // 最大10件まで表示用に保持
        if (emails.length >= 10) break;

      } catch (e) {
        logDebug(`Error fetching message ${index}: ${e.message}`);
      }
    }

    await pop3.command('QUIT');
    return emails;
  } catch (error) {
    logDebug(`POP3 Error: ${error.message}`);
    try { await pop3.command('QUIT'); } catch (e) {}
    return [];
  }
}
