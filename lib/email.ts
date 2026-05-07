import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}

function FROM() {
  return process.env.RESEND_FROM_EMAIL ?? "noreply@drivediy.ae";
}

export async function sendBookingConfirmation(params: {
  to: string;
  customerName: string;
  bayName: string;
  startTime: Date;
  endTime: Date;
  totalAED: number;
  bookingId: string;
}) {
  const dateStr = params.startTime.toLocaleString("en-AE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dubai",
  });

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#07070B;color:#BCC6D4;font-family:system-ui,sans-serif;padding:40px 20px;margin:0;">
  <div style="max-width:600px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:36px;letter-spacing:4px;margin:0;color:#BCC6D4;">
        DRIVE<span style="color:#FF5C2E;">DIY</span>
      </h1>
      <p style="font-size:11px;letter-spacing:3px;color:#BCC6D4;opacity:0.5;margin:8px 0 0;">
        YOUR BAY. YOUR TOOLS. YOUR BUILD.
      </p>
    </div>

    <div style="background:#0F0F13;border:1px solid #17171D;border-radius:12px;padding:32px;">
      <div style="background:#FF5C2E;color:#fff;display:inline-block;padding:4px 16px;border-radius:20px;font-size:12px;letter-spacing:2px;margin-bottom:24px;">
        BOOKING CONFIRMED
      </div>

      <h2 style="font-size:24px;color:#BCC6D4;margin:0 0 24px;">Hey ${params.customerName}!</h2>

      <p style="color:#BCC6D4;opacity:0.7;margin-bottom:24px;">
        Your bay is locked in. Here are your booking details:
      </p>

      <div style="background:#17171D;border-radius:8px;padding:20px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="color:#BCC6D4;opacity:0.5;font-size:12px;letter-spacing:1px;">BAY</span>
          <span style="color:#BCC6D4;font-weight:600;">${params.bayName}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="color:#BCC6D4;opacity:0.5;font-size:12px;letter-spacing:1px;">DATE & TIME</span>
          <span style="color:#BCC6D4;font-weight:600;">${dateStr}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="color:#BCC6D4;opacity:0.5;font-size:12px;letter-spacing:1px;">TOTAL</span>
          <span style="color:#FF5C2E;font-weight:600;font-size:18px;">AED ${params.totalAED}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:#BCC6D4;opacity:0.5;font-size:12px;letter-spacing:1px;">BOOKING ID</span>
          <span style="color:#BCC6D4;font-family:monospace;">${params.bookingId.slice(0, 8).toUpperCase()}</span>
        </div>
      </div>

      <div style="background:#17171D;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;color:#BCC6D4;opacity:0.6;">
          📍 <strong>Location:</strong> Al Quoz Industrial Area, Dubai<br>
          🕐 <strong>Check-in:</strong> Show this email or booking ID at the front desk<br>
          📞 <strong>Questions:</strong> WhatsApp us or reply to this email
        </p>
      </div>

      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/app"
         style="display:inline-block;background:#FF5C2E;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:13px;letter-spacing:2px;">
        VIEW BOOKING
      </a>
    </div>

    <p style="text-align:center;font-size:12px;color:#BCC6D4;opacity:0.3;margin-top:32px;">
      DriveDIY — Al Quoz, Dubai · <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color:#FF5C2E;text-decoration:none;">drivediy.ae</a>
    </p>
  </div>
</body>
</html>`;

  return getResend().emails.send({
    from: FROM(),
    to: params.to,
    subject: `Booking Confirmed — ${params.bayName} at DriveDIY`,
    html,
  });
}

export async function sendFollowUpEmail(params: {
  to: string;
  customerName: string;
  daysSinceVisit?: number;
}) {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#07070B;color:#BCC6D4;font-family:system-ui,sans-serif;padding:40px 20px;margin:0;">
  <div style="max-width:600px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:36px;letter-spacing:4px;margin:0;color:#BCC6D4;">
        DRIVE<span style="color:#FF5C2E;">DIY</span>
      </h1>
    </div>

    <div style="background:#0F0F13;border:1px solid #17171D;border-radius:12px;padding:32px;">
      <h2 style="font-size:24px;color:#BCC6D4;margin:0 0 16px;">Miss the bay, ${params.customerName}?</h2>

      <p style="color:#BCC6D4;opacity:0.7;line-height:1.6;margin-bottom:24px;">
        ${params.daysSinceVisit ? `It&apos;s been ${params.daysSinceVisit} days since your last session.` : "We haven't seen you in a while."}
        Whatever you're building, your bay is waiting.
      </p>

      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/app"
         style="display:inline-block;background:#FF5C2E;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:13px;letter-spacing:2px;">
        BOOK YOUR BAY
      </a>
    </div>
  </div>
</body>
</html>`;

  return getResend().emails.send({
    from: FROM(),
    to: params.to,
    subject: "Your bay is waiting — DriveDIY",
    html,
  });
}

export async function sendWelcomeEmail(params: {
  to: string;
  customerName: string;
}) {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#07070B;color:#BCC6D4;font-family:system-ui,sans-serif;padding:40px 20px;margin:0;">
  <div style="max-width:600px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:36px;letter-spacing:4px;margin:0;color:#BCC6D4;">
        DRIVE<span style="color:#FF5C2E;">DIY</span>
      </h1>
      <p style="font-size:11px;letter-spacing:3px;color:#BCC6D4;opacity:0.5;margin:8px 0 0;">
        YOUR BAY. YOUR TOOLS. YOUR BUILD.
      </p>
    </div>

    <div style="background:#0F0F13;border:1px solid #17171D;border-radius:12px;padding:32px;">
      <h2 style="font-size:24px;color:#BCC6D4;margin:0 0 16px;">Welcome to the garage, ${params.customerName}.</h2>

      <p style="color:#BCC6D4;opacity:0.7;line-height:1.6;margin-bottom:24px;">
        You're now part of Dubai's first DIY car servicing community.
        Book your first bay session and get your hands dirty.
      </p>

      <div style="background:#17171D;border-radius:8px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;color:#FF5C2E;font-size:13px;letter-spacing:1px;">WHAT'S INCLUDED</p>
        <p style="margin:0;font-size:13px;color:#BCC6D4;opacity:0.6;line-height:1.8;">
          🔧 Professional-grade tools<br>
          🏗️ 2-post and 4-post hydraulic lifts<br>
          📱 AI-powered build assistant<br>
          🎓 DIY Academy video guides<br>
          🤝 On-demand mechanic assist
        </p>
      </div>

      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/app"
         style="display:inline-block;background:#FF5C2E;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:13px;letter-spacing:2px;">
        BOOK FIRST SESSION
      </a>
    </div>
  </div>
</body>
</html>`;

  return getResend().emails.send({
    from: FROM(),
    to: params.to,
    subject: "Welcome to DriveDIY — Your bay is ready",
    html,
  });
}
