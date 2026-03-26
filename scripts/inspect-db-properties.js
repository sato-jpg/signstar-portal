const { Client } = require('@notionhq/client');
require('dotenv').config({ path: '.env.local' });

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function inspect(dbId, label) {
  console.log(`--- Inspecting ${label} (${dbId}) ---`);
  try {
    const response = await notion.databases.query({
      database_id: dbId,
      page_size: 1,
    });
    if (response.results.length === 0) {
      console.log("No data found.");
      return;
    }
    const props = response.results[0].properties;
    for (const key in props) {
      const p = props[key];
      let val = "n/a";
      if (p.type === 'select') val = p.select?.name;
      else if (p.type === 'status') val = p.status?.name;
      else if (p.type === 'rich_text') val = p.rich_text[0]?.plain_text;
      else if (p.type === 'title') val = p.title[0]?.plain_text;
      
      console.log(`${key} (${p.type}): ${val}`);
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

async function start() {
  await inspect(process.env.NOTION_DATABASE_ID_GENERAL, "GENERAL (Field)");
  await inspect(process.env.NOTION_DATABASE_ID_PARKING, "PARKING");
}

start();
