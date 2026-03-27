import imaps from 'imap-simple';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: 'C:\\Users\\soulh\\.gemini\\antigravity\\scratch\\signstar-portal\\.env.local' });

const user = process.env.MAIL_USER;
const password = process.env.MAIL_PASSWORD;
const host = process.env.MAIL_HOST || 'sign-star.sakura.ne.jp';

console.log(`IMAP Connecting to ${host}:993 as ${user}...`);

const imapConfig = {
  imap: {
    user,
    password,
    host,
    port: 993,
    tls: true,
    authTimeout: 5000,
    connTimeout: 5000,
  },
};

async function run() {
  try {
    const connection = await imaps.connect(imapConfig);
    console.log('SUCCESS! IMAP connected.');
    await connection.openBox('INBOX');
    const searchCriteria = ['ALL'];
    const results = await connection.search(searchCriteria, { bodies: ['HEADER'] });
    console.log('Total messages:', results.length);
    connection.end();
  } catch (err) {
    console.error('FAILED:', err.message);
  }
}

run();
