import { prisma } from "../db/prisma";
import { emailQueue } from "../queues/email.queue";
import { EmailStatus } from "@prisma/client";

async function test() {
  // 1️⃣ Any existing user (temporary Phase-1 hack)
  const user = await prisma.user.findFirst();

  if (!user) {
    throw new Error("❌ No user found. Create a user first.");
  }

  // 2️⃣ Create Email Job (ALL required fields)
  const job = await prisma.emailJob.create({
    data: {
      userId: user.id,
      senderEmail: "test@ethereal.email",
      recipientEmail: "your_email@gmail.com",
      subject: "Worker Phase 1 Test",
      body: "Email worker is finally working 🚀",
      scheduledAt: new Date(), // 🔥 REQUIRED
      status: EmailStatus.SCHEDULED,
    },
  });

  // 3️⃣ Push job to queue
  await emailQueue.add("process-email", {
    emailJobId: job.id,
  });

  console.log("📤 Email job created & queued:", job.id);
}

test();
