import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/**
 * 有効期限切れのアクセストークンをリフレッシュトークンで更新します。
 */
async function refreshAccessToken(token) {
  try {
    console.log(`[AUTH] Attempting to refresh access token for: ${token.email}`);
    
    if (!token.refreshToken) {
      console.error("[AUTH] No refresh token available in token object.");
      throw new Error("No refresh token");
    }

    const url = "https://oauth2.googleapis.com/token";
    const body = new URLSearchParams({
      client_id: process.env.AUTH_GOOGLE_ID,
      client_secret: process.env.AUTH_GOOGLE_SECRET,
      grant_type: "refresh_token",
      refresh_token: token.refreshToken,
    });

    const response = await fetch(url, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      method: "POST",
      body: body.toString(),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      console.error("[AUTH] Google Token Refresh API Error Response:", refreshedTokens);
      throw refreshedTokens;
    }

    console.log("[AUTH] Successfully refreshed access token.");
    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: Math.floor(Date.now() / 1000 + refreshedTokens.expires_in),
      // リフレッシュトークンが新しく返ってこない場合もあるので、既存のものを保持
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("[AUTH] RefreshAccessTokenError occurred:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          scope: "openid profile email https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/gmail.readonly",
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // 初回ログイン時
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          expiresAt: account.expires_at,
          refreshToken: account.refresh_token,
        };
      }

      // トークンがまだ有効な場合
      if (Date.now() < (token.expiresAt || 0) * 1000) {
        return token;
      }

      // 有効期限切れの場合、リフレッシュを試みる
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
  },
  debug: true,
});
