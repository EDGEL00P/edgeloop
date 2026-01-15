/**
 * Chat Storage - Database operations for conversations and messages
 */

import { db } from "../db";
import { conversations, messages } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface ChatStorage {
  getConversation(id: number): Promise<typeof conversations.$inferSelect | undefined>;
  getAllConversations(): Promise<(typeof conversations.$inferSelect)[]>;
  createConversation(title: string): Promise<typeof conversations.$inferSelect>;
  deleteConversation(id: number): Promise<void>;
  getMessagesByConversation(conversationId: number): Promise<(typeof messages.$inferSelect)[]>;
  createMessage(conversationId: number, role: string, content: string): Promise<typeof messages.$inferSelect>;
}

/**
 * Database-backed chat storage implementation
 */
class DbChatStorage implements ChatStorage {
  async getConversation(id: number) {
    if (!db) throw new Error("Database unavailable");
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }

  async getAllConversations() {
    if (!db) throw new Error("Database unavailable");
    return db.select().from(conversations).orderBy(desc(conversations.createdAt));
  }

  async createConversation(title: string) {
    if (!db) throw new Error("Database unavailable");
    const [conversation] = await db.insert(conversations).values({ title }).returning();
    return conversation;
  }

  async deleteConversation(id: number) {
    if (!db) throw new Error("Database unavailable");
    await db.delete(messages).where(eq(messages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
  }

  async getMessagesByConversation(conversationId: number) {
    if (!db) throw new Error("Database unavailable");
    return db.select().from(messages).where(eq(messages.conversationId, conversationId));
  }

  async createMessage(conversationId: number, role: string, content: string) {
    if (!db) throw new Error("Database unavailable");
    const [message] = await db.insert(messages).values({ conversationId, role, content }).returning();
    return message;
  }
}

export const chatStorage = new DbChatStorage();
