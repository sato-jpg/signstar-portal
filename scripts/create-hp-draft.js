const { chromium } = require('playwright-chromium');
require('dotenv').config({ path: '.env.local' });

async function createHPDraft(title, content) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log("Logging into HP Admin...");
    await page.goto('http://sign-star.com/admin/');
    
    // ログイン (セレクタは一般的なものを想定しつつ、リトライ等で調整)
    await page.fill('input[name="user"]', process.env.HP_ADMIN_USER);
    await page.fill('input[name="pass"]', process.env.HP_ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/admin/**');
    console.log("Login Successful.");

    // 新規投稿ページへ (仮のURL/セレクタ)
    await page.goto('http://sign-star.com/admin/edit.php?mode=new');
    
    console.log("Creating Draft...");
    await page.fill('#title', title);
    await page.fill('#content', content);
    
    // 下書きとして保存
    await page.click('#save_draft'); 
    
    console.log("Draft Created Successfully.");
  } catch (e) {
    console.error("HP Automation Failed:", e.message);
  } finally {
    await browser.close();
  }
}

// コマンドライン引数があれば実行
if (process.argv[2]) {
  createHPDraft(process.argv[2], process.argv[3] || "施工事例の本文です。");
}

module.exports = { createHPDraft };
