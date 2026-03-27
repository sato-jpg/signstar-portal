import { google } from 'googleapis';

/**
 * Gmail APIから最新のメールを取得します。
 * @param {string} accessToken NextAuthから取得したアクセストークン
 */
export async function getLatestEmailsGmail(accessToken) {
  if (!accessToken) {
    return { error: "Authentication required", data: [] };
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  try {
    // 1. メッセージリストを取得 (最近の20件)
    // さくらインターネットから転送/受信されたメールを優先的に探すため、
    // ラベル名 "info@sign-star.com" がある場合はそれを条件にする
    // ない場合は単に最新を取得
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 20,
      q: 'to:info@sign-star.com OR label:info-sign-star-com OR "info@sign-star.com"' 
    });

    const messages = listRes.data.messages || [];
    if (messages.length === 0) {
      return { error: null, data: [] };
    }

    // 2. 各メッセージの断片を取得
    const emailPromises = messages.map(async (m) => {
      try {
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: m.id,
          format: 'full'
        });

        const headers = detail.data.payload.headers;
        const subject = headers.find(h => h.name === 'Subject')?.value || "(無題)";
        const fromRaw = headers.find(h => h.name === 'From')?.value || "Unknown";
        const dateRaw = headers.find(h => h.name === 'Date')?.value;
        const snippet = detail.data.snippet || "";

        let fromName = "Unknown";
        let fromEmail = "Unknown";
        const match = fromRaw.match(/(.*)<(.*)>/);
        if (match) {
          fromName = match[1].trim().replace(/^"|"$/g, '');
          fromEmail = match[2].trim();
        } else {
          fromEmail = fromRaw;
          fromName = fromRaw.split('@')[0];
        }

        return {
          id: detail.data.id,
          threadId: detail.data.threadId,
          subject,
          fromName,
          fromEmail,
          receivedDateTime: new Date(dateRaw || Date.now()),
          bodyPreview: snippet,
          isRead: !detail.data.labelIds?.includes('UNREAD'),
          from: {
            emailAddress: {
              name: fromName,
              address: fromEmail
            }
          }
        };
      } catch (err) {
        console.error(`Gmail Error for message ${m.id}:`, err);
        return null;
      }
    });

    const results = await Promise.all(emailPromises);
    const validEmails = results.filter(e => e !== null);

    return { error: null, data: validEmails };
  } catch (error) {
    console.error("Gmail API Error:", error);
    return { error: error.message, data: [] };
  }
}

/**
 * 特定のメッセージの本文を取得します
 */
export async function fetchEmailBodyGmail(messageId, accessToken) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  try {
    const detail = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });

    // 本文の抽出 (単純化のためtext/plainを優先)
    let body = "";
    const parts = detail.data.payload.parts || [];
    
    function getBody(parts) {
      for (const part of parts) {
        if (part.mimeType === 'text/plain' && part.body.data) {
          return Buffer.from(part.body.data, 'base64').toString();
        }
        if (part.parts) {
          const res = getBody(part.parts);
          if (res) return res;
        }
      }
      return null;
    }

    body = getBody(parts);
    
    if (!body && detail.data.payload.body?.data) {
      body = Buffer.from(detail.data.payload.body.data, 'base64').toString();
    }

    return body || "本文を表示できませんでした。";
  } catch (error) {
    console.error("Gmail Body API Error:", error);
    throw new Error("本文取得エラー");
  }
}
