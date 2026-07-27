import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@yourdomain.com";

export async function sendFormalLetter(params: {
  to: string[];
  cc?: string[];
  subject: string;
  content: string;
  replyTo?: string;
}): Promise<string> {
  const resend = getResend();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Times New Roman', Times, serif; color: #1a1a1a; max-width: 750px; margin: 40px auto; padding: 40px; }
    .letter-body { white-space: pre-line; line-height: 1.8; font-size: 14px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 11px; color: #666; }
  </style>
</head>
<body>
  <div class="letter-body">${params.content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
  <div class="footer">This letter was sent via Contract Administration Manager. The original signed version is the binding document.</div>
</body>
</html>`;

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: params.to,
    cc: params.cc,
    replyTo: params.replyTo,
    subject: params.subject,
    html: htmlContent,
    text: params.content,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
  return data?.id ?? "";
}

export async function sendInternalAlert(params: {
  to: string[];
  subject: string;
  text: string;
}): Promise<void> {
  const resend = getResend();
  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `[Contract Admin Alert] ${params.subject}`,
    text: params.text,
  });
}
