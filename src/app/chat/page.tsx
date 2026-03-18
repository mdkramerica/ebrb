import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import ChatClient from "./ChatClient";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string }>;
}) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/chat");
  }

  const { conversation: conversationId } = await searchParams;

  return <ChatClient userId={user.id} initialConversationId={conversationId} />;
}
