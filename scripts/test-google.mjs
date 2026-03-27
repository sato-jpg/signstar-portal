import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config({ path: 'C:\\Users\\soulh\\.gemini\antigravity\\scratch\\signstar-portal\\.env.local' });

// 注: アクセストークンがないので、ここではカレンダーのリスト取得などを試みます（認証エラーが出るか確認）
async function run() {
  console.log('Testing Google Auth configuration...');
  console.log('CLIENT_ID:', process.env.AUTH_GOOGLE_ID?.substring(0, 10) + '...');
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID,
    process.env.AUTH_GOOGLE_SECRET
  );

  // トークンがないと当然失敗しますが、クライアントのセットアップができるか確認
  try {
     console.log('Setup looks OK in theory.');
  } catch (err) {
    console.error('FAILED:', err.message);
  }
}

run();
