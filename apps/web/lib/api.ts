import { DashboardOverview, Expense, Notification, User } from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message ?? "Unexpected API error");
  }
  return res.json() as Promise<T>;
}

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = LoginPayload & {
  name: string;
  relationship: string;
  role?: string;
};

export const api = {
  async login(payload: LoginPayload) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload)
    });
    return handleResponse<{ user: User }>(res);
  },

  async register(payload: RegisterPayload) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload)
    });
    return handleResponse<{ user: User }>(res);
  },

  async me() {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      credentials: "include"
    });
    return handleResponse<{ user: User }>(res);
  },

  async logout() {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include"
    });
  },

  async getDashboard() {
    const res = await fetch(`${API_BASE_URL}/dashboard`, {
      credentials: "include"
    });
    return handleResponse<{ overview: DashboardOverview }>(res);
  },

  async listExpenses() {
    const res = await fetch(`${API_BASE_URL}/expenses`, {
      credentials: "include"
    });
    return handleResponse<{ expenses: Expense[] }>(res);
  },

  async createExpense(payload: Partial<Expense> & { image?: File }) {
    const formData = new FormData();
    formData.append("category", payload.category || "");
    formData.append("amount", String(payload.amount || 0));
    formData.append("dueDate", payload.dueDate || "");
    if (payload.notes) {
      formData.append("notes", payload.notes);
    }
    if (payload.image) {
      formData.append("image", payload.image);
    }

    const res = await fetch(`${API_BASE_URL}/expenses`, {
      method: "POST",
      credentials: "include",
      body: formData
    });
    return handleResponse<{ expense: Expense }>(res);
  },

  async updateExpense(id: string, payload: Partial<Expense> & { image?: File }) {
    const formData = new FormData();
    if (payload.category) {
      formData.append("category", payload.category);
    }
    if (payload.amount !== undefined) {
      formData.append("amount", String(payload.amount));
    }
    if (payload.dueDate) {
      formData.append("dueDate", payload.dueDate);
    }
    if (payload.notes !== undefined) {
      formData.append("notes", payload.notes || "");
    }
    if (payload.image) {
      formData.append("image", payload.image);
    }

    const res = await fetch(`${API_BASE_URL}/expenses/${id}`, {
      method: "PUT",
      credentials: "include",
      body: formData
    });
    return handleResponse<{ expense: Expense }>(res);
  },

  async deleteExpense(id: string) {
    const res = await fetch(`${API_BASE_URL}/expenses/${id}`, {
      method: "DELETE",
      credentials: "include"
    });
    return handleResponse<{ success: boolean }>(res);
  },

  async listNotifications() {
    const res = await fetch(`${API_BASE_URL}/notifications`, {
      credentials: "include"
    });
    return handleResponse<{ notifications: Notification[] }>(res);
  },

  async createNotification(message: string, recipientIds?: string[]) {
    const res = await fetch(`${API_BASE_URL}/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ message, recipientIds })
    });
    return handleResponse<{ notification: Notification }>(res);
  },

  async listMembers() {
    const res = await fetch(`${API_BASE_URL}/members`, {
      credentials: "include"
    });
    return handleResponse<{ members: User[] }>(res);
  },

  async updateProfile(payload: { name: string }) {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload)
    });
    return handleResponse<{ user: User }>(res);
  },

  async updateMemberRole(memberId: string, role: "ADMIN" | "MEMBER" | "VIEW_ONLY") {
    const res = await fetch(`${API_BASE_URL}/members/${memberId}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ role })
    });
    return handleResponse<{ member: User }>(res);
  },

  async deleteMember(memberId: string) {
    const res = await fetch(`${API_BASE_URL}/members/${memberId}`, {
      method: "DELETE",
      credentials: "include"
    });
    return handleResponse<{ success: boolean }>(res);
  }
};

