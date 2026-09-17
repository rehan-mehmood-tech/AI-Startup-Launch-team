import { supabase } from "@/lib/supabase/client";
import type { AgentId, ChatRow, MessagePayload, MessageRow, ReportBundle } from "@/lib/hitl/types";

/** Fired after any chat create/update so the sidebar can refresh its list. */
export const CHATS_CHANGED = "hitl:chats-changed";

function notify() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHATS_CHANGED));
}

function fail(error: { message: string; code?: string } | null, what: string): never {
  const missingTable = error?.code === "42P01" || error?.code === "PGRST205" || /does not exist|schema cache/i.test(error?.message ?? "");
  throw new Error(
    missingTable
      ? "Chat storage isn't set up yet: run backend/hitl_chat_schema.sql in the Supabase SQL Editor."
      : `Couldn't ${what}: ${error?.message ?? "unknown error"}`
  );
}

export type ChatSummary = Pick<ChatRow, "id" | "title" | "status" | "current_agent_index" | "updated_at">;

export async function listChats(): Promise<ChatSummary[]> {
  const { data, error } = await supabase
    .from("chats")
    .select("id,title,status,current_agent_index,updated_at")
    .order("updated_at", { ascending: false })
    .limit(200);
  if (error) fail(error, "load chats");
  return data as ChatSummary[];
}

export async function createChat(userId: string, title: string): Promise<ChatRow> {
  const { data, error } = await supabase
    .from("chats")
    .insert({ user_id: userId, title: title.slice(0, 120) || "New validation" })
    .select("*")
    .single();
  if (error) fail(error, "create the chat");
  notify();
  return data as ChatRow;
}

export async function getChat(id: string): Promise<ChatRow | null> {
  const { data, error } = await supabase.from("chats").select("*").eq("id", id).maybeSingle();
  if (error) fail(error, "load the chat");
  return data as ChatRow | null;
}

export async function updateChat(id: string, patch: Partial<Omit<ChatRow, "id" | "user_id">>): Promise<ChatRow> {
  const { data, error } = await supabase.from("chats").update(patch).eq("id", id).select("*").single();
  if (error) fail(error, "save the chat");
  notify();
  return data as ChatRow;
}

export async function renameChat(id: string, title: string): Promise<void> {
  const clean = title.trim().slice(0, 120);
  if (!clean) return;
  const { error } = await supabase.from("chats").update({ title: clean }).eq("id", id);
  if (error) fail(error, "rename the chat");
  notify();
}

/** Deletes the chat; its messages go with it (ON DELETE CASCADE). */
export async function deleteChat(id: string): Promise<void> {
  const { error, count } = await supabase.from("chats").delete({ count: "exact" }).eq("id", id);
  if (error) fail(error, "delete the chat");
  if (count === 0) throw new Error("Couldn't delete the chat: it no longer exists or you don't have access.");
  notify();
}

export async function getMessages(chatId: string): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });
  if (error) fail(error, "load messages");
  return data as MessageRow[];
}

export async function addMessage(msg: {
  chat_id: string;
  agent_id: AgentId;
  sender: MessageRow["sender"];
  content: string;
  payload: MessagePayload;
  options?: unknown;
}): Promise<MessageRow> {
  const { data, error } = await supabase.from("messages").insert(msg).select("*").single();
  if (error) fail(error, "save the message");
  // Bumps updated_at so the chat moves to the top of Recent Chats.
  await supabase.from("chats").update({ updated_at: new Date().toISOString() }).eq("id", msg.chat_id);
  notify();
  return data as MessageRow;
}

export async function getSharedReport(shareId: string): Promise<ReportBundle | null> {
  const { data, error } = await supabase.rpc("get_shared_report", { p_share_id: shareId });
  if (error) fail(error, "load the shared report");
  const row = (data as { title: string; report: ReportBundle }[] | null)?.[0];
  return row?.report ?? null;
}
