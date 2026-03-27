import { getLatestEmailsGmail } from "@/lib/mail-gmail";
import { getParkingProjects, getVehicleStatus, getGeneralProjects } from "@/lib/notion";
import { getGoogleCalendarEvents } from "@/lib/google-calendar";
import { auth, signIn, signOut } from "@/auth";
import WeatherWidget from "@/app/components/WeatherWidget";
import CurrentDate from "@/app/components/CurrentDate";
import { LayoutDashboard, Truck, Mail, ExternalLink, Bell, User, ChevronRight, Car, Calendar, LogOut, LogIn } from "lucide-react";

const NOTION_URL = "https://www.notion.so/126c61646c2c8038820fd20478080e64";
const NOTION_VEHICLE_URL = "https://www.notion.so/305c61646c2c8009b5dff3dd792d95d5?v=305c61646c2c80a3bf42000c27218ac2";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import SignStarCockpit from "@/app/components/SignStarCockpit";

export default async function Home() {
  console.log("[SSR] ENV Check:", {
    hasMailUser: !!process.env.MAIL_USER,
    hasNotionToken: !!process.env.NOTION_TOKEN,
    hasGoogleId: !!process.env.AUTH_GOOGLE_ID,
  });
  const session = await auth();
  // セッションエラー（トークンリフレッシュ失敗など）のチェック
  const isAuthError = session?.error === "RefreshAccessTokenError";

  // 並列でデータ取得を試みる (Gmail API, Notion, Google Calendar)
  const [emailRes, notionRes, vehicleRes, calendarRes, generalRes] = await Promise.all([
    (session?.accessToken && !isAuthError)
      ? getLatestEmailsGmail(session.accessToken).catch((e) => {
          console.error("[GMAIL] Fetch Failed:", e.message);
          return { error: "Gmail Error", data: [] };
        })
      : Promise.resolve({ error: isAuthError ? "Re-login required" : null, data: [] }),
    getParkingProjects().catch((e) => {
      console.error("[NOTION] Parking Fetch Failed:", e.message);
      return { error: "Notion Parking Error", data: [] };
    }),
    getVehicleStatus().catch((e) => {
      console.error("[NOTION] Vehicle Fetch Failed:", e.message);
      return { error: "Notion Vehicle Error", data: [] };
    }),
    // 承認エラーがある場合は叩かない
    (session?.accessToken && !isAuthError)
      ? getGoogleCalendarEvents(session.accessToken).catch((e) => {
          console.error("[CALENDAR] Fetch Failed:", e.message);
          return { error: e.message, data: [] };
        })
      : Promise.resolve({ error: isAuthError ? "Re-login required" : null, data: [] }),
    getGeneralProjects().catch((e) => {
      console.error("[NOTION] General Fetch Failed:", e.message);
      return { error: "Notion General Error", data: [] };
    })
  ]);
  
  console.log(`[SSR] Page Load Data Check:`, {
    hasEmail: emailRes?.data?.length || 0,
    hasNotion: notionRes?.data?.length || 0,
    hasCalendar: calendarRes?.data?.length || 0,
    hasGeneral: generalRes?.data?.length || 0,
  });

    const initialData = {
      emails: emailRes?.data || [],
      emailError: emailRes?.error || null,
      projects: notionRes?.data || [],
      vehicles: vehicleRes?.data || [],
      calendarEvents: calendarRes?.data || [],
      calendarError: calendarRes?.error || null,
      generalProjects: generalRes?.data || [],
    };

  return <SignStarCockpit initialData={initialData} session={session} />;
}
