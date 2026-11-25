// src/test/sendEmail.ts (fixed)
import { emailQueue } from "../queues/email.queue";

async function testSendEmail() {
  try {
    // Use correct EmailJobData interface
    await emailQueue.add(
      "process-email",
      { 
        emailJobId: "test-id-123",
        hourlyLimit: 1,
        delayBetweenEmails: 0 
      },
      {
        delay: 1000, // 1 second delay
      }
    );
    
    console.log("✅ Test email job added");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testSendEmail();