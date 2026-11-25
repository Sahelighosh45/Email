// In-memory email job scheduler and rate limiter (replaces BullMQ/Redis for AI Studio runtime)

export interface EmailJobData {
  emailJobId: string;
  hourlyLimit?: number;
  delayBetweenEmails?: number;
}

export const connection = null;
export const emailQueue = null;

// In-memory rate limit store
const inMemoryRateStore = new Map<string, { count: number; expiresAt: number }>();

export const rateLimiter = {
  async incr(key: string): Promise<number> {
    const now = Date.now();
    const existing = inMemoryRateStore.get(key);
    if (!existing || existing.expiresAt <= now) {
      inMemoryRateStore.set(key, { count: 1, expiresAt: now + 3600 * 1000 });
      return 1;
    }
    existing.count += 1;
    return existing.count;
  },
  async decr(key: string): Promise<void> {
    const existing = inMemoryRateStore.get(key);
    if (existing && existing.count > 0) {
      existing.count -= 1;
    }
  },
};

export async function addEmailJob(
  emailJobId: string,
  delayMs: number = 0,
  hourlyLimit?: number,
  delayBetweenEmails?: number
) {
  const jobData: EmailJobData = {
    emailJobId,
    hourlyLimit,
    delayBetweenEmails,
  };

  const safeDelay = Math.max(0, Math.min(delayMs, 2147483647));
  setTimeout(async () => {
    try {
      const { processEmailJob } = await import("../workers/email.worker");
      await processEmailJob(jobData);
    } catch (err) {
      console.error(`In-memory email job failed for ${emailJobId}:`, err);
    }
  }, safeDelay);

  return { id: emailJobId, data: jobData };
}

export async function scheduleBulkEmails(
  emailJobIds: string[],
  baseDelayMs: number = 0,
  delayBetweenEmailsMs: number = 0,
  hourlyLimit?: number
) {
  const jobs = [];

  for (let i = 0; i < emailJobIds.length; i++) {
    const emailJobId = emailJobIds[i];
    const jobDelay = baseDelayMs + i * delayBetweenEmailsMs;

    const job = await addEmailJob(
      emailJobId,
      jobDelay,
      hourlyLimit,
      delayBetweenEmailsMs / (60 * 1000)
    );

    jobs.push(job);
  }

  return jobs;
}
