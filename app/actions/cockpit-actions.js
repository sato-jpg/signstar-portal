"use server";

import { Client } from "@notionhq/client";
import { google } from "googleapis";
import { auth } from "@/auth";
import { fetchEmailBodyGmail } from "@/lib/mail-gmail";
import { sendEmailSMTP } from "@/lib/mail-imap";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export async function completeConstructionAction(projectId, calendarEventId) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  console.log(`Starting Construction Complete Workflow for Project: ${projectId}`);

  const results = {
    notion: false,
    google: false,
    hp: "pending"
  };

  // 1. Notion 更新
  try {
    if (projectId && (projectId.startsWith("notion-") || projectId.startsWith("general-"))) {
      const realId = projectId.replace("notion-", "").replace("general-", "");
      await notion.pages.update({
        page_id: realId,
        properties: {
          "進捗": {
            status: { name: "完了" }
          }
        }
      });
      results.notion = true;
      console.log("Notion Status Updated to '完了'");
    }
  } catch (e) {
    console.error("Notion Update Failed:", e);
  }

  // 2. Google Calendar 更新 (色をグレーに)
  try {
    if (calendarEventId && calendarEventId.startsWith("cal-") && session.accessToken) {
      const realId = calendarEventId.replace("cal-", "");
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: session.accessToken });
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      await calendar.events.patch({
        calendarId: 'primary',
        eventId: realId,
        requestBody: {
          colorId: '8' // Gray in Google Calendar
        }
      });
      results.google = true;
      console.log("Google Calendar Event Color Updated to Gray");
    }
  } catch (e) {
    console.error("Google Calendar Update Failed:", e);
  }

  // 3. HP下書き作成 (Playwright)
  try {
    const { createHPDraft } = require("../../scripts/create-hp-draft");
    await createHPDraft(`施工完了: ${projectId}`, "サインスターの新しい施工事例がコックピットから自動生成されましたお！");
    results.hp = "draft_created";
    console.log("HP Draft Created.");
  } catch (e) {
    console.error("HP Draft Creation Failed:", e);
    results.hp = "failed";
  }

  return results;
}

export async function updateNotionStatusAction(projectId, statusName) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  console.log(`Updating Status for Project: ${projectId} to '${statusName}'`);

  try {
    const realId = projectId.replace("notion-", "").replace("general-", "").replace("park-", "");
    await notion.pages.update({
      page_id: realId,
      properties: {
        "進捗": {
          status: { name: statusName }
        }
      }
    });
    return { success: true };
  } catch (e) {
    console.error("Notion Status Update Failed:", e);
    return { success: false, error: e.message };
  }
}

export async function createGoogleEventAction(calendarId, eventData) {
  const session = await auth();
  if (!session || !session.accessToken) throw new Error("Unauthorized");

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: session.accessToken });
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  console.log("=== [START] createGoogleEventAction ===");
  console.log("CalendarId:", calendarId || 'primary');
  console.log("EventData:", JSON.stringify(eventData, null, 2));

  try {
    const res = await calendar.events.insert({
      calendarId: calendarId || 'primary',
      requestBody: {
        summary: eventData.title,
        description: eventData.description,
        start: {
          dateTime: eventData.start,
          timeZone: 'Asia/Tokyo',
        },
        end: {
          dateTime: eventData.end,
          timeZone: 'Asia/Tokyo',
        },
      },
    });
    console.log("=== [SUCCESS] Google Calendar Inserted ===");
    console.log("Res Data:", res.data.id, res.data.htmlLink);
    return { success: true, data: res.data };
  } catch (e) {
    console.error("=== [ERROR] Google Calendar Create Failed ===");
    console.error(e);
    return { success: false, error: e.message };
  }
}

export async function updateGoogleEventAction(calendarId, eventId, eventData) {
  const session = await auth();
  if (!session || !session.accessToken) throw new Error("Unauthorized");

  const realId = eventId.replace("cal-", "");
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: session.accessToken });
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    const res = await calendar.events.patch({
      calendarId: calendarId || 'primary',
      eventId: realId,
      requestBody: {
        summary: eventData.title,
        description: eventData.description,
        start: {
          dateTime: eventData.start,
          timeZone: 'Asia/Tokyo',
        },
        end: {
          dateTime: eventData.end,
          timeZone: 'Asia/Tokyo',
        },
      },
    });
    return { success: true, data: res.data };
  } catch (e) {
    console.error("Google Calendar Update Failed:", e);
    return { success: false, error: e.message };
  }
}

export async function createNotionProjectAction(dbType, projectData) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const databaseId = dbType === 'parking' 
    ? process.env.NOTION_DATABASE_ID_PARKING 
    : process.env.NOTION_DATABASE_ID_GENERAL;

  console.log("=== [START] createNotionProjectAction ===");
  console.log("DB Type:", dbType, "DB ID:", databaseId);
  console.log("Project Data:", JSON.stringify(projectData, null, 2));

  try {
    const res = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        "案件名": {
          title: [{ text: { content: projectData.title } }]
        },
        "顧客名": {
          rich_text: [{ text: { content: projectData.client || "" } }]
        },
        "進捗": {
          status: { name: projectData.status || "未着手" }
        },
        "日付": {
          date: { start: projectData.date }
        },
        "アクション": {
          select: { name: projectData.action || "施工" }
        }
      }
    });
    console.log("=== [SUCCESS] Notion Project Inserted ===");
    return { success: true, data: res };
  } catch (e) {
    console.error("=== [ERROR] Notion Create Failed ===");
    console.error(e);
    return { success: false, error: e.message };
  }
}

export async function fetchEmailBodyAction(uid) {
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const body = await fetchEmailBodyGmail(uid, session.accessToken);
    return { success: true, body };
  } catch (e) {
    console.error("fetchEmailBodyAction Error:", e);
    return { success: false, error: e.message };
  }
}

export async function sendEmailReplyAction(to, subject, text) {
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    await sendEmailSMTP({
      user: process.env.MAIL_USER,
      password: process.env.MAIL_PASSWORD,
      host: process.env.MAIL_HOST || "sign-star.sakura.ne.jp",
      to,
      subject,
      text,
      fromName: session.user.name || "SignStar",
    });
    return { success: true };
  } catch (e) {
    console.error("sendEmailReplyAction Error:", e);
    return { success: false, error: e.message };
  }
}
