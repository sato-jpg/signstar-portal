export async function getLatestEmails(accessToken) {
  try {
    const response = await fetch(
      "https://graph.microsoft.com/v1.0/me/messages?$select=subject,from,receivedDateTime,isRead&$top=5",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Graph API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.value;
  } catch (error) {
    console.error("Error fetching emails:", error);
    return [];
  }
}
