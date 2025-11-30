// src/tools/user-tools.ts
import { tool } from "@openai/agents";
import { z } from "zod";
import { users, User } from "../data/store.js";

export const createUser = tool({
  name: "create_user",
  description: "Create a new user",
  parameters: z.object({
    name: z.string().describe("User name"),
    email: z.string().describe("User email"),
    role: z.string().describe("User role (admin, manager, etc.)"),
  }),
  execute: async ({ name, email, role }) => {
    console.log('[create_user] Executing with params:', { name, email, role });
    const id = `USR-${Date.now()}`;
    const user: User = { id, name, email, role };
    users.set(id, user);
    return JSON.stringify(user, null, 2);
  },
});

export const getUser = tool({
  name: "get_user",
  description: "Get user by ID",
  parameters: z.object({
    id: z.string().describe("User ID"),
  }),
  execute: async ({ id }) => {
    console.log('[get_user] Executing with params:', { id });
    const user = users.get(id);
    return user ? JSON.stringify(user, null, 2) : JSON.stringify({ error: "User not found" });
  },
});

export const listUsers = tool({
  name: "list_users",
  description: "List users or search by name/email",
  parameters: z.object({
    query: z.string().nullable().describe("Search query"),
  }),
  execute: async ({ query }) => {
    console.log('[list_users] Executing with params:', { query });
    let allUsers = Array.from(users.values());
    if (query) {
      const lower = query.toLowerCase();
      allUsers = allUsers.filter(u => u.name.toLowerCase().includes(lower) || u.email.toLowerCase().includes(lower));
    }
    return JSON.stringify(allUsers, null, 2);
  },
});

export const updateUser = tool({
  name: "update_user",
  description: "Update user details",
  parameters: z.object({
    id: z.string().describe("User ID"),
    name: z.string().nullable(),
    email: z.string().nullable(),
    role: z.string().nullable(),
  }),
  execute: async ({ id, name, email, role }) => {
    console.log('[update_user] Executing with params:', { id, name, email, role });
    const user = users.get(id);
    if (!user) return JSON.stringify({ error: "User not found" });
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    users.set(id, user);
    return JSON.stringify(user, null, 2);
  },
});

export const deleteUser = tool({
  name: "delete_user",
  description: "Delete a user",
  parameters: z.object({ id: z.string() }),
  execute: async ({ id }) => {
    console.log('[delete_user] Executing with params:', { id });
    const deleted = users.delete(id);
    return JSON.stringify({ success: deleted }, null, 2);
  },
});
