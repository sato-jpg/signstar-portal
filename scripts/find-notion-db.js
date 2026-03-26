const { Client } = require('@notionhq/client');
require('dotenv').config({ path: '.env.local' });

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function findDB() {
  const pageId = "136c6164-6c2c-8004-a7de-c665e0c7d456";
  try {
    const response = await notion.blocks.children.list({ block_id: pageId });
    console.log("Blocks in page:");
    response.results.forEach(block => {
      if (block.type === 'child_database') {
        console.log(`FOUND DATABASE: ${block.child_database.title}`);
        console.log(`DATABASE ID: ${block.id}`);
      } else {
        console.log(`Block: ${block.type}`);
      }
    });
  } catch (e) {
    console.error("Error searching page:", e.message);
  }
}

findDB();
