import { createSupabaseServer } from "@/lib/supabase/server";
import ChatClient from "./ChatClient";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string; intent?: string }>;
}) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const { conversation: conversationId, intent } = await searchParams;

  return (
    <ChatClient
      authed={!!user}
      initialConversationId={conversationId}
      initialIntent={intent}
    />
  );
}
