import { KintoneRestAPIClient } from "@kintone/rest-api-client";

const subdomain = process.env.KINTONE_SUBDOMAIN;
const apiToken = process.env.KINTONE_API_TOKEN;

const client = new KintoneRestAPIClient({
  baseUrl: `https://${subdomain}.cybozu.com`,
  auth: { apiToken },
});

export default client;

/**
 * 現場予定表 (Notionからの移行先) からデータを取得
 */
export async function getKintoneProjects() {
  const appId = process.env.KINTONE_APP_ID_PROJECTS;
  if (!appId) return { error: "Kintone App ID不足", data: [] };

  try {
    const { records } = await client.record.getRecords({
      app: appId,
      query: "status = '未完了' order by date asc limit 20",
    });
    return { error: null, data: records };
  } catch (error) {
    console.error("Kintone API Error:", error);
    return { error: error.message, data: [] };
  }
}

/**
 * 車両使用状況を取得
 */
export async function getKintoneVehicles() {
  const appId = process.env.KINTONE_APP_ID_VEHICLES;
  if (!appId) return { error: "Kintone App ID不足", data: [] };

  try {
    const { records } = await client.record.getRecords({
      app: appId,
      query: "date = TODAY() order by time asc",
    });
    return { error: null, data: records };
  } catch (error) {
    console.error("Kintone API Error:", error);
    return { error: error.message, data: [] };
  }
}
