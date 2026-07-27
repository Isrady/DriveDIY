import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import type { EmailAccount } from "@/types";

function getOAuthClient(): OAuth2Client {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  );
}

export function getAuthUrl(): string {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.modify",
    ],
  });
}

export async function exchangeCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  email: string;
}> {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const { data: userInfo } = await oauth2.userinfo.get();

  return {
    access_token: tokens.access_token!,
    refresh_token: tokens.refresh_token!,
    expiry_date: tokens.expiry_date!,
    email: userInfo.email!,
  };
}

function getAuthClientForAccount(account: EmailAccount): OAuth2Client {
  const client = getOAuthClient();
  client.setCredentials({
    access_token: account.gmail_access_token,
    refresh_token: account.gmail_refresh_token,
    expiry_date: account.gmail_token_expiry
      ? new Date(account.gmail_token_expiry).getTime()
      : undefined,
  });
  return client;
}

export async function watchInbox(account: EmailAccount): Promise<{
  historyId: string;
  expiration: string;
}> {
  const auth = getAuthClientForAccount(account);
  const gmail = google.gmail({ version: "v1", auth });

  const { data } = await gmail.users.watch({
    userId: "me",
    requestBody: {
      topicName: `projects/${process.env.GOOGLE_CLOUD_PROJECT}/topics/gmail-notifications`,
      labelIds: ["INBOX"],
    },
  });

  return {
    historyId: String(data.historyId),
    expiration: String(data.expiration),
  };
}

export interface GmailMessage {
  messageId: string;
  threadId: string;
  subject: string;
  senderName: string;
  senderEmail: string;
  recipients: string[];
  cc: string[];
  bodyText: string;
  bodyHtml: string;
  receivedAt: string;
  direction: "inbound" | "outbound";
  ourEmail: string;
}

export async function fetchNewMessages(
  account: EmailAccount,
  startHistoryId: string
): Promise<GmailMessage[]> {
  const auth = getAuthClientForAccount(account);
  const gmail = google.gmail({ version: "v1", auth });

  const { data } = await gmail.users.history.list({
    userId: "me",
    startHistoryId: account.gmail_history_id ?? startHistoryId,
    historyTypes: ["messageAdded"],
  });

  if (!data.history) return [];

  const messages: GmailMessage[] = [];
  const seenIds = new Set<string>();

  for (const history of data.history) {
    for (const added of history.messagesAdded ?? []) {
      const msgId = added.message?.id;
      if (!msgId || seenIds.has(msgId)) continue;
      seenIds.add(msgId);

      try {
        const { data: msg } = await gmail.users.messages.get({
          userId: "me",
          id: msgId,
          format: "FULL",
        });

        const headers = msg.payload?.headers ?? [];
        const getHeader = (name: string) =>
          headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";

        const from = getHeader("From");
        const to = getHeader("To");
        const cc = getHeader("Cc");
        const subject = getHeader("Subject");
        const dateStr = getHeader("Date");

        // Parse sender
        const emailMatch = from.match(/<(.+?)>/);
        const senderEmail = emailMatch ? emailMatch[1] : from;
        const senderName = emailMatch ? from.split("<")[0].trim().replace(/"/g, "") : from;

        // Determine direction
        const direction: "inbound" | "outbound" = senderEmail.toLowerCase().includes(
          account.email_address.split("@")[1]
        )
          ? "outbound"
          : "inbound";

        // Extract body
        let bodyText = "";
        let bodyHtml = "";

        function extractBody(part: typeof msg.payload) {
          if (!part) return;
          if (part.mimeType === "text/plain" && part.body?.data) {
            bodyText += Buffer.from(part.body.data, "base64").toString("utf-8");
          } else if (part.mimeType === "text/html" && part.body?.data) {
            bodyHtml += Buffer.from(part.body.data, "base64").toString("utf-8");
          }
          for (const subPart of part.parts ?? []) {
            extractBody(subPart);
          }
        }
        extractBody(msg.payload);

        messages.push({
          messageId: msgId,
          threadId: msg.threadId ?? msgId,
          subject,
          senderName,
          senderEmail,
          recipients: to.split(",").map((s) => s.trim()).filter(Boolean),
          cc: cc ? cc.split(",").map((s) => s.trim()).filter(Boolean) : [],
          bodyText,
          bodyHtml,
          receivedAt: dateStr ? new Date(dateStr).toISOString() : new Date().toISOString(),
          direction,
          ourEmail: account.email_address,
        });
      } catch {
        // Skip messages that fail to fetch
      }
    }
  }

  return messages;
}
