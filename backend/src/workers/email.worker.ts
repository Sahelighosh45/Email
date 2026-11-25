import "dotenv/config";
import { Resend } from "resend";
import { prisma } from "../db/prisma";
import {
  addEmailJob,
  rateLimiter,
  type EmailJobData,
} from "../queues/email.queue";
import { transporter } from "../utils/mailer";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

function getHourKey(date: Date): string {
  return date.toISOString().slice(0, 13);
}

function getNextHour(): Date {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d;
}

export async function processEmailJob(data: EmailJobData): Promise<void> {
  const { emailJobId, hourlyLimit } = data;

  const emailJob = await prisma.emailJob.findUnique({
    where: { id: emailJobId },
  });

  if (!emailJob || emailJob.status !== "SCHEDULED") {
    return;
  }

  const MAX_PER_HOUR =
    hourlyLimit !== undefined
      ? hourlyLimit
      : Number(process.env.MAX_EMAILS_PER_HOUR) || 0;

  const hourKey = getHourKey(new Date());
  const rateKey = `rate:${emailJob.senderEmail}:${hourKey}`;

  const newCount = await rateLimiter.incr(rateKey);

  if (MAX_PER_HOUR > 0 && newCount > MAX_PER_HOUR) {
    await rateLimiter.decr(rateKey);

    const nextHour = getNextHour();

    await prisma.emailJob.update({
      where: { id: emailJob.id },
      data: {
        scheduledAt: nextHour,
      },
    });

    await addEmailJob(
      emailJobId,
      Math.max(nextHour.getTime() - Date.now(), 1000),
      hourlyLimit
    );
    return;
  }

  try {
    if (resend) {
      await resend.emails.send({
        from: "ReachInbox <onboarding@resend.dev>",
        to: emailJob.recipientEmail,
        subject: emailJob.subject,
        text: emailJob.body,
      });
    } else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail({
        from: emailJob.senderEmail,
        to: emailJob.recipientEmail,
        subject: emailJob.subject,
        text: emailJob.body,
      });
    } else {
      console.log(
        `[ReachInbox Mock Mailer] Delivered "${emailJob.subject}" from ${emailJob.senderEmail} to ${emailJob.recipientEmail}`
      );
    }

    await prisma.emailJob.update({
      where: { id: emailJob.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
      },
    });
  } catch (error) {
    await rateLimiter.decr(rateKey);

    await prisma.emailJob.update({
      where: { id: emailJob.id },
      data: {
        status: "FAILED",
      },
    });

    console.error(`Failed to send email to ${emailJob.recipientEmail}:`, error);
    throw error;
  }
}