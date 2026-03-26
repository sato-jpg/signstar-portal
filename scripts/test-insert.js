require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');
const { Client } = require('@notionhq/client');

async function testNotion() {
  const notion = new Client({ auth: process.env.NOTION_TOKEN });
  const databaseId = process.env.NOTION_DATABASE_ID_GENERAL;
  console.log("Testing Notion with DB:", databaseId);
  try {
    const res = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        "案件名": { title: [{ text: { content: "Test Cockpit Insert" } }] },
        "日付": { date: { start: "2026-03-21" } }
      }
    });
    console.log("Notion SUCCESS:", res.id);
  } catch (e) {
    console.error("Notion ERROR:", e.message);
  }
}

testNotion();
