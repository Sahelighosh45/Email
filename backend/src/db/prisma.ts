export type EmailStatus = "SCHEDULED" | "SENT" | "FAILED";

export interface User {
  id: string;
  googleId: string;
  name: string;
  email: string;
  avatar: string | null;
  createdAt: Date;
}

export interface EmailJob {
  id: string;
  userId: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  body: string;
  scheduledAt: Date;
  sentAt: Date | null;
  status: EmailStatus;
  createdAt: Date;
}

function createInMemoryPrisma() {
  const users: User[] = [];
  const emailJobs: EmailJob[] = [];

  const generateId = () =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return {
    user: {
      findUnique: async ({ where }: { where: { id?: string; googleId?: string; email?: string } }) => {
        return (
          users.find(
            (u) =>
              (where.id !== undefined && u.id === where.id) ||
              (where.googleId !== undefined && u.googleId === where.googleId) ||
              (where.email !== undefined && u.email === where.email)
          ) ?? null
        );
      },
      create: async ({
        data,
      }: {
        data: { id?: string; googleId: string; email: string; name?: string; avatar?: string | null };
      }) => {
        const user: User = {
          id: data.id || generateId(),
          googleId: data.googleId,
          email: data.email,
          name: data.name ?? "",
          avatar: data.avatar ?? "",
          createdAt: new Date(),
        };
        users.push(user);
        return user;
      },
    },
    emailJob: {
      findMany: async ({
        where,
        orderBy,
      }: {
        where?: { userId?: string; status?: EmailStatus };
        orderBy?: { scheduledAt?: "asc" | "desc"; sentAt?: "asc" | "desc" };
      } = {}) => {
        let result = emailJobs.filter((job) => {
          if (where?.userId !== undefined && job.userId !== where.userId) return false;
          if (where?.status !== undefined && job.status !== where.status) return false;
          return true;
        });

        if (orderBy?.scheduledAt) {
          const dir = orderBy.scheduledAt === "asc" ? 1 : -1;
          result = [...result].sort(
            (a, b) => (a.scheduledAt.getTime() - b.scheduledAt.getTime()) * dir
          );
        } else if (orderBy?.sentAt) {
          const dir = orderBy.sentAt === "asc" ? 1 : -1;
          result = [...result].sort(
            (a, b) => ((a.sentAt?.getTime() ?? 0) - (b.sentAt?.getTime() ?? 0)) * dir
          );
        }

        return result;
      },
      findFirst: async ({ where }: { where: { id?: string; userId?: string } }) => {
        return (
          emailJobs.find(
            (job) =>
              (where.id === undefined || job.id === where.id) &&
              (where.userId === undefined || job.userId === where.userId)
          ) ?? null
        );
      },
      findUnique: async ({ where }: { where: { id: string } }) => {
        return emailJobs.find((job) => job.id === where.id) ?? null;
      },
      create: async ({
        data,
      }: {
        data: {
          userId: string;
          senderEmail: string;
          recipientEmail: string;
          subject: string;
          body: string;
          scheduledAt: Date;
          status?: EmailStatus;
        };
      }) => {
        const job: EmailJob = {
          id: generateId(),
          userId: data.userId,
          senderEmail: data.senderEmail,
          recipientEmail: data.recipientEmail,
          subject: data.subject,
          body: data.body,
          scheduledAt: new Date(data.scheduledAt),
          sentAt: null,
          status: data.status ?? "SCHEDULED",
          createdAt: new Date(),
        };
        emailJobs.push(job);
        return job;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<Omit<EmailJob, "id" | "createdAt">>;
      }) => {
        const idx = emailJobs.findIndex((job) => job.id === where.id);
        if (idx === -1) {
          throw new Error(`EmailJob ${where.id} not found`);
        }
        emailJobs[idx] = { ...emailJobs[idx], ...data };
        return emailJobs[idx];
      },
    },
  };
}

type PrismaLike = ReturnType<typeof createInMemoryPrisma>;

const globalForPrisma = global as unknown as {
  prisma: PrismaLike | undefined;
};

function createPrisma(): PrismaLike {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes("/cloudsql/")) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { PrismaClient } = require("@prisma/client");
      return new PrismaClient({ log: ["error"] });
    } catch {
      // Fall back to in-memory store
    }
  }
  return createInMemoryPrisma();
}

export const prisma: PrismaLike =
  globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
