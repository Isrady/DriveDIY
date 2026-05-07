import { google } from "googleapis";
import { JWT } from "google-auth-library";

const TIMEZONE = "Asia/Dubai";

function getCalendarClient() {
  // For production: use service account
  // GOOGLE_SERVICE_ACCOUNT_KEY should be JSON string of service account key
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    const auth = new JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });
    return google.calendar({ version: "v3", auth });
  }

  // Fallback OAuth2 for development
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  return google.calendar({ version: "v3", auth });
}

export async function checkBayAvailability(
  calendarId: string,
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  try {
    const calendar = getCalendarClient();
    const { data } = await calendar.freebusy.query({
      requestBody: {
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
        timeZone: TIMEZONE,
        items: [{ id: calendarId }],
      },
    });

    const busySlots = data.calendars?.[calendarId]?.busy ?? [];
    return busySlots.length === 0;
  } catch {
    // If calendar check fails, allow booking to proceed (fail open)
    console.error("Calendar availability check failed");
    return true;
  }
}

export async function createBayBookingEvent(params: {
  calendarId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  description: string;
  bookingId: string;
  customerName?: string;
}): Promise<string | null> {
  try {
    const calendar = getCalendarClient();
    const { data } = await calendar.events.insert({
      calendarId: params.calendarId,
      requestBody: {
        summary: params.title,
        description: params.description,
        start: {
          dateTime: params.startTime.toISOString(),
          timeZone: TIMEZONE,
        },
        end: {
          dateTime: params.endTime.toISOString(),
          timeZone: TIMEZONE,
        },
        extendedProperties: {
          private: { bookingId: params.bookingId },
        },
        colorId: "11", // Tomato red for DriveDIY bookings
      },
    });
    return data.id ?? null;
  } catch {
    console.error("Failed to create calendar event");
    return null;
  }
}

export async function deleteBayBookingEvent(
  calendarId: string,
  eventId: string
): Promise<void> {
  try {
    const calendar = getCalendarClient();
    await calendar.events.delete({ calendarId, eventId });
  } catch {
    console.error("Failed to delete calendar event");
  }
}
