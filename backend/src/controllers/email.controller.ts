import { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { addEmailJob, scheduleBulkEmails as scheduleQueueEmails } from "../queues/email.queue";

export const getEmails = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const scheduled = await prisma.emailJob.findMany({
      where: {
        userId: user.id,
        status: "SCHEDULED",
      },
      orderBy: { scheduledAt: "asc" },
    });

    const sent = await prisma.emailJob.findMany({
      where: {
        userId: user.id,
        status: "SENT",
      },
      orderBy: { sentAt: "desc" },
    });

    return res.json({
      scheduled: scheduled.map(mapEmail),
      sent: sent.map(mapEmail),
    });
  } catch (err) {
    console.error("GET EMAILS ERROR:", err);
    return res.status(500).json({ message: "Failed to fetch emails" });
  }
};

export const getEmailById = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id) {
      return res.status(400).json({ message: "Invalid email ID" });
    }

    const email = await prisma.emailJob.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!email) {
      return res.status(404).json({ message: "Email not found" });
    }

    return res.json({
      id: email.id,
      from: email.senderEmail,
      to: [email.recipientEmail],
      subject: email.subject,
      body: email.body,
      status: email.status,
      scheduleAt: email.scheduledAt,
      createdAt: email.createdAt,
      sentAt: email.sentAt,
    });
  } catch (err) {
    console.error("GET EMAIL BY ID ERROR:", err);
    return res.status(500).json({ message: "Failed to fetch email" });
  }
};

export const scheduleBulkEmails = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { to, emails, subject, body, scheduleAt, delayBetweenEmails = 0, hourlyLimit = 0 } = req.body;

    // Use whichever is provided
    const recipients = to || emails;
    
    console.log("📥 Bulk email request:", {
      user: user.email,
      recipients,
      emailCount: Array.isArray(recipients) ? recipients.length : 0,
      subject,
      bodyLength: body?.length,
      scheduleAt,
      delayBetweenEmails,
      hourlyLimit,
      fullBody: req.body // Debug
    });

    // Validation
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ 
        message: "Recipients required",
        received: req.body 
      });
    }

    if (!subject || !subject.trim()) {
      return res.status(400).json({ message: "Subject required" });
    }

    if (!body || !body.trim()) {
      return res.status(400).json({ message: "Body required" });
    }

    // Calculate base time
    const baseTime = scheduleAt
      ? new Date(scheduleAt).getTime()
      : Date.now();

    // Validate schedule time is not in past (allow 60s grace for "Now" requests)
    if (baseTime < Date.now() - 60_000) {
      return res.status(400).json({ message: "Schedule time cannot be in the past" });
    }

    const createdIds: string[] = [];

    // Create email job records in database
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      
      // Basic email validation (just check if not empty)
      if (!recipient || !recipient.trim()) {
        console.warn(` Skipping empty recipient at index ${i}`);
        continue;
      }

      const scheduledTime = new Date(baseTime + (i * delayBetweenEmails * 60 * 1000));

      try {
        const job = await prisma.emailJob.create({
          data: {
            userId: user.id,
            senderEmail: user.email,
            recipientEmail: recipient.trim(),
            subject: subject.trim(),
            body: body.trim(),
            scheduledAt: scheduledTime,
            status: "SCHEDULED",
          },
        });

        createdIds.push(job.id);
        console.log(`Created email job ${i+1}/${recipients.length}: ${job.id} for ${recipient}`);
      } catch (error) {
        console.error(` Failed to create email job for ${recipient}:`, error);
      }
    }

    if (createdIds.length === 0) {
      return res.status(400).json({ message: "No valid emails to schedule" });
    }

    // Calculate initial delay
    const initialDelay = Math.max(baseTime - Date.now(), 0);
    
    // Convert delayBetweenEmails from minutes to milliseconds for queue
    const delayBetweenEmailsMs = delayBetweenEmails * 60 * 1000;

    // Schedule all emails in queue with proper delays
    console.log(` Scheduling ${createdIds.length} emails in queue...`);
    await scheduleQueueEmails(
      createdIds,
      initialDelay,
      delayBetweenEmailsMs,
      hourlyLimit
    );

    console.log(` Successfully scheduled ${createdIds.length} emails`);

    return res.json({
      success: true,
      scheduledCount: createdIds.length,
      message: `Successfully scheduled ${createdIds.length} emails`,
    });
  } catch (err) {
    console.error(" BULK EMAIL ERROR:", err);
    return res.status(500).json({ 
      message: "Bulk scheduling failed",
      error: err instanceof Error ? err.message : "Unknown error"
    });
  }
};

// Helper function to create single email (optional)
export const createEmail = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      to: recipients,
      subject,
      body,
      scheduleAt,
    } = req.body;

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ message: "Recipients required" });
    }

    if (!subject || !body) {
      return res.status(400).json({ message: "Subject and body required" });
    }

    const scheduledTime = scheduleAt ? new Date(scheduleAt) : new Date();
    const delay = Math.max(scheduledTime.getTime() - Date.now(), 0);

    const emailJobs = [];

    for (const recipient of recipients) {
      const emailJob = await prisma.emailJob.create({
        data: {
          userId: user.id,
          senderEmail: user.email,
          recipientEmail: recipient,
          subject,
          body,
          scheduledAt: scheduledTime,
          status: "SCHEDULED",
        },
      });

      // Add to queue
      await addEmailJob(emailJob.id, delay);

      emailJobs.push(emailJob);
    }

    return res.json({
      success: true,
      emails: emailJobs.map(mapEmail),
    });
  } catch (err) {
    console.error("CREATE EMAIL ERROR:", err);
    return res.status(500).json({ message: "Failed to create email" });
  }
};

// Helper function to map database record to API response
const mapEmail = (job: any) => ({
  id: job.id,
  from: job.senderEmail,
  to: [job.recipientEmail],
  subject: job.subject,
  body: job.body,
  status: job.status,
  scheduleAt: job.scheduledAt,
  createdAt: job.createdAt,
  sentAt: job.sentAt,
});