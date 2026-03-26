import { Client } from '@notionhq/client';
import { withTimeout } from './utils';

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

/**
 * Notionから直接データを取得する公式SDKバージョン
 */
export async function getParkingProjects() {
  const databaseId = process.env.NOTION_DATABASE_ID_PARKING;
  
  if (!process.env.NOTION_TOKEN || !databaseId) {
    console.error("Notion configuration missing. TOKEN or DB_ID is empty.");
    return { error: "設定不足", data: [] };
  }

  try {
    console.log("Calling Notion API (SDK)... DB:", databaseId);
    
    // 1ヶ月前から取得
    const pastOneMonth = new Date();
    pastOneMonth.setMonth(pastOneMonth.getMonth() - 1);
    const startFrom = pastOneMonth.toISOString().split('T')[0];

    const queryPromise = notion.databases.query({
      database_id: databaseId,
      filter: {
        property: "納期",
        date: {
          on_or_after: startFrom,
        },
      },
      sorts: [
        {
          property: "納期",
          direction: "ascending",
        },
      ],
      page_size: 100, // 今日/昨日が漏れないように多めに取得
    });
    
    const response = await withTimeout(queryPromise, 10000, "Notion Parking API");
    
    if (response.error === 'Timeout') {
      return { error: 'Timeout', data: [] };
    }

    const projects = response.results.map((page) => {
      const p = page.properties;
      
      // 1. 現場名 (Title property)
      let name = "-";
      for (const key in p) {
        if (p[key].type === 'title') {
          name = p[key].title[0]?.plain_text || "-";
          break;
        }
      }

      // 2. ステータス (進捗 or ステータス or Status)
      const statusProp = p["進捗"] || p["ステータス"] || p["Status"];
      const progress = statusProp?.status?.name || statusProp?.select?.name || "-";

      // 3. 納期 (納期 or 納期目安 or 施工日 or 納品日 or Date)
      const dateProp = p["納期"] || p["納期目安"] || p["施工日"] || p["納品日"] || p["Date"];
      const date = dateProp?.date?.start || "";

      // 4. 得意先 (お客 or 得意先 or Client)
      const clientProp = p["お客"] || p["得意先"] || p["Client"];
      const client = clientProp?.select?.name || clientProp?.multi_select?.[0]?.name || "-";

      // 5. 納品 (DO/Action)
      const actionProp = p["納品"] || p["配送方法"];
      const action = actionProp?.select?.name || actionProp?.multi_select?.[0]?.name || "-";

      return {
        id: page.id,
        name: name,
        client: client,
        deadline: date ? date.split('-').slice(1).join('/') : "-", // MM/DD形式
        fullDate: date,
        progress: progress,
        action: action
      };
    });

    if (response.results.length > 0) {
        const props = Object.keys(response.results[0].properties);
        console.log(`[NOTION] Full list of properties found: ${props.join(", ")}`);
    }
    
    const dates = projects.map(p => p.fullDate).filter(Boolean);
    const dateRange = dates.length > 0 ? `${Math.min(...dates.map(d => new Date(d).getTime()))} to ${Math.max(...dates.map(d => new Date(d).getTime()))}` : "no dates";
    console.log(`[NOTION] Parking Data Fetched: ${projects.length} items. Date range: ${dateRange}`);
    return { error: null, data: projects, raw: response.results.slice(0, 5) };
  } catch (error) {
    console.error("Notion API Error:", error.message);
    return { error: error.message, data: [] };
  }
}

/**
 * 一般案件 (加藤案件等) を取得
 */
export async function getGeneralProjects() {
  const databaseId = process.env.NOTION_DATABASE_ID_GENERAL;
  
  if (!process.env.NOTION_TOKEN || !databaseId) {
    console.error("General Notion configuration missing.");
    return { error: "設定不足", data: [] };
  }

  try {
    const queryPromise = notion.databases.query({
      database_id: databaseId,
      // フィルターが原因でエラーになることがあるため、一旦外すか存在するプロパティを確認して修正
      sorts: [
        {
          timestamp: "last_edited_time",
          direction: "descending",
        },
      ],
      page_size: 15,
    });

    const response = await withTimeout(queryPromise, 10000, "Notion General API");

    if (response.error === 'Timeout') {
      return { error: 'Timeout', data: [] };
    }

    const projects = response.results.map((page) => {
      const p = page.properties;
      
      let name = "-";
      for (const key in p) {
        if (p[key].type === 'title') {
          name = p[key].title[0]?.plain_text || "-";
          break;
        }
      }

      // 進捗フィルターのエラーを避けるため、取得後にフィルタリングするか、フォールバックを利用
      const statusProp = p["進捗"] || p["ステータス"] || p["Status"] || p["順序"];
      const progress = statusProp?.status?.name || statusProp?.select?.name || statusProp?.number?.toString() || "-";

      const clientProp = p["お客"] || p["得意先"] || p["Client"] || p["得意先名"] || p["案件名"];
      const client = clientProp?.select?.name || clientProp?.multi_select?.[0]?.name || clientProp?.rich_text?.[0]?.plain_text || "-";

      return {
        id: page.id,
        name: name,
        client: client,
        progress: progress,
        isPriority: true,
        type: 'general'
      };
    });

    console.log(`[SUCCESS] General Notion Fetched: ${projects.length} items.`);
    return { error: null, data: projects };
  } catch (error) {
    console.error("General Notion API Error:", error.message);
    return { error: error.message, data: [] };
  }
}

export async function getFujimotoChecks() {
    // 同じDBを参照しているため同じ関数を利用
    return await getParkingProjects();
}

/**
 * 車両管理表からデータを取得
 */
export async function getVehicleStatus() {
  const databaseId = "305c6164-6c2c-8009-b5df-f3dd792d95d5";
  
  if (!process.env.NOTION_TOKEN) {
    return { error: "TOKEN不足", data: [] };
  }

  try {
    const pastOneMonth = new Date();
    pastOneMonth.setMonth(pastOneMonth.getMonth() - 1);
    const startFrom = pastOneMonth.toISOString();

    const queryPromise = notion.databases.query({
      database_id: databaseId,
      filter: {
        property: "日付",
        date: {
          on_or_after: startFrom,
        },
      },
      sorts: [
        {
          property: "日付",
          direction: "ascending",
        },
      ],
      page_size: 100, // 多めに取得
    });

    const response = await withTimeout(queryPromise, 10000, "Notion Vehicle API");

    if (response.error === 'Timeout') {
      return { error: 'Timeout', data: [] };
    }

    const vehicles = response.results.map((page) => {
      const p = page.properties;
      
      const vehicle = p["車両"]?.select?.name || "-";
      const user = p["使用者"]?.select?.name || "-";
      const project = p["案件"]?.title[0]?.plain_text || "-";
      const date = p["日付"]?.date?.start || "";
      const purpose = p["目的"]?.select?.name || "-";
      const isConfirmed = p["確定"]?.checkbox || false;

      return {
        id: page.id,
        vehicle,
        user,
        project,
        time: date ? new Date(date).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : "-",
        fullDate: date ? date.split('T')[0] : "",
        purpose,
        isConfirmed
      };
    });

    return { error: null, data: vehicles };
  } catch (error) {
    console.error("Notion Vehicle API Error:", error.message);
    return { error: error.message, data: [] };
  }
}
