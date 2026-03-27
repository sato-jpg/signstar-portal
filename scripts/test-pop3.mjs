import POP3Client from 'node-pop3';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: 'C:\\Users\\soulh\\.gemini\\antigravity\\scratch\\signstar-portal\\.env.local' });

const user = process.env.MAIL_USER;
const password = process.env.MAIL_PASSWORD;
const host = 'nwapi001.sakura.ne.jp';

console.log(`Connecting to ${host}:995 as ${user}...`);

const pop3 = new POP3Client({
  user,
  password,
  host,
  port: 110,
  tls: false,
  timeout: 10000
});

async function run() {
  try {
    console.log(`Commanding LIST...`);
    const list = await pop3.command('LIST');
    console.log('SUCCESS! Total messages:', list.length);
    await pop3.command('QUIT');
  } catch (err) {
    console.error('FAILED:', err.name, '-', err.message);
    try { await pop3.command('QUIT'); } catch (e) {}
  }
}

run();
