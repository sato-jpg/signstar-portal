import { google } from 'googleapis';
import { withTimeout } from './utils';

/**
 * Googleカレンダーから予定を取得します。
 * @param {string} accessToken NextAuthから取得したアクセストークン
 */
export async function getGoogleCalendarEvents(accessToken) {
  if (!accessToken) {
    return { error: "Authentication required", data: [] };
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  // 1週間前から3ヶ月先までの予定を取得（過去分が多い場合に今日まで届かないのを防ぐ）
  const timeMinDate = new Date();
  timeMinDate.setDate(timeMinDate.getDate() - 7); 
  const timeMin = timeMinDate.toISOString(); 

  const timeMaxDate = new Date();
  timeMaxDate.setMonth(timeMaxDate.getMonth() + 3);
  const timeMax = timeMaxDate.toISOString();

  try {
    // 1. カレンダーリストの取得 (リトライ付き)
    let listRes;
    let retries = 2;
    while (retries >= 0) {
      try {
        listRes = await withTimeout(
          calendar.calendarList.list(), 
          15000, // 15秒に延長
          "Google Calendar List API"
        );
        if (listRes.error !== 'Timeout') break;
      } catch (e) {
        if (retries === 0) throw e;
      }
      console.log(`[CALENDAR] Retrying list fetch... (${retries} left)`);
      retries--;
    }

    if (!listRes || listRes.error === 'Timeout') {
        console.error("[CALENDAR] Failed to fetch calendar list after retries.");
        return { error: 'Timeout', data: [] };
    }
    
    const activeCalendars = listRes.data.items || [];
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    console.log(`[CALENDAR] Today is ${today}. Fetching from 7 days ago to ensure today is captured.`);
    
    // 2. 各カレンダーから並列で予定を取得
    const allEventsPromises = activeCalendars.map(async (cal) => {
      try {
        let res;
        let eventRetries = 1;
        while (eventRetries >= 0) {
          try {
            res = await withTimeout(
              calendar.events.list({
                calendarId: cal.id,
                timeMin: timeMin,
                timeMax: timeMax,
                maxResults: 2500, // 2500件まで取得して、過去の予定で今日が埋もれるのを防ぐ
                singleEvents: true,
                orderBy: 'startTime',
              }),
              15000, // 15秒に延長
              `Google Calendar Events API (${cal.id})`
            );
            if (res.error !== 'Timeout') break;
          } catch (e) {
            if (eventRetries === 0) throw e;
          }
          eventRetries--;
        }
        
        if (!res || res.error === 'Timeout') return [];

        const items = res.data.items || [];
        const todayEvents = items.filter(e => {
            const startStr = e.start.dateTime || e.start.date;
            const eventDate = new Date(startStr).toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
            return eventDate === today;
        });

        // 現場や重要人物の予定が0の場合、原因を探るために生データの一部を出す
        if (todayEvents.length === 0 && items.length > 0) {
            const firstItemStart = items[0].start.dateTime || items[0].start.date;
            console.log(`[CALENDAR] "${cal.summary}" has ${items.length} items, but NONE for today (${today}). First item starts at: ${firstItemStart}`);
        } else {
            console.log(`[CALENDAR] "${cal.summary}" found ${todayEvents.length} items for today.`);
        }

        return items.map(event => ({
          id: event.id,
          calendarId: cal.id,
          calendarSummary: cal.summary || "カレンダー",
          calendarColor: cal.backgroundColor || "#d71d1d",
          summary: event.summary || "無題の予定",
          start: event.start.dateTime || event.start.date,
          end: event.end.dateTime || event.end.date,
          location: event.location || "",
          description: event.description || "",
          link: event.htmlLink,
        }));
      } catch (e) {
        console.error(`Error fetching calendar ${cal.id}:`, e.message);
        return [];
      }
    });

    const results = await Promise.all(allEventsPromises);
    const events = results.flat().sort((a, b) => new Date(a.start) - new Date(b.start));

    console.log(`[SUCCESS] Google Calendar Fetched: ${events.length} events across ${activeCalendars.length} calendars.`);
    return { error: null, data: events };
  } catch (error) {
    console.error("Google Calendar API Error:", error);
    return { error: error.message, data: [] };
  }
}
