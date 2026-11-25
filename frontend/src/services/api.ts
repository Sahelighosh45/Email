// src/services/api.ts
import type { Email, BulkEmailPayload } from "../types/email";

const API_BASE_URL = "";

export interface EmailResponse {
  scheduled: Email[];
  sent: Email[];
}

function makeHeaders(token?: string) {
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "Content-Type": "application/json",
  } as Record<string, string>;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function throwApiError(res: Response, fallback: string): Promise<never> {
  const err = await res.json().catch(() => ({}));
  throw new ApiError(err.message || fallback, res.status);
}

export const api = {
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      return res.ok;
    } catch {
      return false;
    }
  },

  async getEmails(token: string): Promise<EmailResponse> {
    const res = await fetch(`${API_BASE_URL}/email`, {
      headers: makeHeaders(token),
    });

    if (!res.ok) {
      await throwApiError(res, "Failed to fetch emails");
    }

    return res.json();
  },

  async getEmailDetail(token: string, id: string): Promise<Email> {
    const res = await fetch(`${API_BASE_URL}/email/${id}`, {
      headers: makeHeaders(token),
    });

    if (!res.ok) {
      await throwApiError(res, "Failed to fetch email");
    }

    return res.json();
  },

  async createEmail(
    token: string,
    payload: {
      to: string[];
      subject: string;
      body: string;
      scheduleAt?: string;
    }
  ): Promise<Email> {
    const res = await fetch(`${API_BASE_URL}/email`, {
      method: "POST",
      headers: makeHeaders(token),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      await throwApiError(res, "Failed to create email");
    }

    return res.json();
  },

  async scheduleBulk(
    token: string,
    payload: BulkEmailPayload
  ): Promise<{ success: boolean; scheduledCount: number }> {
    const res = await fetch(`${API_BASE_URL}/email/bulk`, {
      method: "POST",
      headers: makeHeaders(token),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      await throwApiError(res, "Bulk scheduling failed");
    }

    return res.json();
  },

  async getUserProfile(
    token: string
  ): Promise<{ email: string; name?: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: makeHeaders(token),
    });

    if (!res.ok) {
      await throwApiError(res, "Failed to fetch profile");
    }

    return res.json();
  },
};

export default api;
