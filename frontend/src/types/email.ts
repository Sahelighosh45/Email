// Email shown in dashboard
export interface Email {
  id: string;
  from: string;
  to: string[];
  subject: string;
  body: string;
  status: "SENT" | "SCHEDULED";
  scheduleAt?: string;
  createdAt: string;
}

// Payload used while scheduling bulk emails
export interface BulkEmailPayload {
  emails: string[];        // ✅ NOT `to`
  subject: string;
  body: string;
  scheduleAt: string;
  hourlyLimit?: number;
  delayBetweenEmails?: number;
}

