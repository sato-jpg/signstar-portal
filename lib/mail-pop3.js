const POP3Client = require('node-pop3');
const { simpleParser } = require('mailparser');
const fs = require('fs');

function logDebug(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync('debug.log', line);
  console.log(msg);
}

export async function getLatestEmailsPOP3(config) {
  return Promise.race([
    fetchEmailsPOP3(config),
    new Promise((resolve) => setTimeout(() => resolve([]), 8000)) // POP3は少し時間がかかるので8秒
  ]);
}

async function fetchEmailsPOP3(config) {
  logDebug('--- POP3 Attempt (Port 110) ---');
  
  const pop3 = new POP3Client({
    user: config.user,
    password: config.password,
    host: config.host || 'sign-star.sakura.ne.jp',
    port: 110,
    tls: false,
    timeout: 10000
  });

  try {
    logDebug('Connecting to POP3 (110)...');
    // メッセージ一覧を取得
    const list = await pop3.command('LIST');
    logDebug(`POP3 SUCCESS! Count: ${list?.length || 0}`);
    
    if (!list || list.length === 0) {
      await pop3.command('QUIT');
      return [];
    }

    // 最新の5件を取得
    // POP3は1から始まるインデックスなので、最後から5つを特定
    const total = list.length;
    const startIndex = Math.max(1, total - 4);
    const indices = [];
    for (let i = total; i >= startIndex; i--) {
      indices.push(i);
    }

    const emails = await Promise.all(
      indices.map(async (index) => {
        try {
          const msg = await pop3.command('RETR', index.toString());
          const mail = await simpleParser(msg);
          
          return {
            id: index,
            subject: mail.subject || '(無題)',
            from: {
              emailAddress: {
                name: mail.from?.value[0]?.name || mail.from?.value[0]?.address || 'Unknown',
                address: mail.from?.value[0]?.address || 'Unknown',
              }
            },
            receivedDateTime: mail.date || new Date(),
            isRead: false, // POP3は既読状態を保持しません
          };
        } catch (e) {
          console.error(`Error fetching message ${index}:`, e);
          return null;
        }
      })
    );

    await pop3.command('QUIT');
    return emails.filter(e => e !== null);
  } catch (error) {
    logDebug(`POP3 Error: ${error.message}`);
    try { await pop3.command('QUIT'); } catch (e) {}
    return [];
  }
}
