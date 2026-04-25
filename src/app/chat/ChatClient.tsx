"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send, Plus, ArrowLeft, Loader2, MessageSquare, Lock } from "lucide-react";
import { Nav } from "@/components/Nav";

type Role = "user" | "assistant" | "system";

interface Message {
  id?: string;
  role: Role;
  content: string;
  createdAt?: string;
}

interface Conversation {
  id: string;
  intent: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

const INTENT_LABELS: Record<string, string> = {
  traction_diagnostic: "Traction Diagnostic",
  differentiation_discovery: "Differentiation Discovery",
  positioning_discovery: "Positioning Discovery",
  direct_improvement: "Resume Improvement",
  career_positioning: "Career Positioning",
  interview_prep: "Interview Prep",
  general_question: "General Guidance",
};

const STARTER_PROMPTS: Array<{ label: string; intent?: string }> = [
  { label: "I'm not getting interviews — help me figure out why.", intent: "traction_diagnostic" },
  { label: "I want to make my resume stand out from other candidates at my level.", intent: "differentiation_discovery" },
  { label: "I'm not sure how to position myself for the next step in my career.", intent: "positioning_discovery" },
  { label: "I have a job posting and want to tailor my resume for it.", intent: "direct_improvement" },
  { label: "I want to prepare for an upcoming executive interview.", intent: "interview_prep" },
];

export default function ChatClient({
  authed,
  initialConversationId,
  initialIntent,
}: {
  authed: boolean;
  initialConversationId?: string;
  initialIntent?: string;
}) {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    initialConversationId || null,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  // Null = unlimited (Executive+). Number = remaining after last send.
  const [remaining, setRemaining] = useState<number | null>(null);
  const [wallHit, setWallHit] = useState(false);
  const pendingIntentRef = useRef<string | undefined>(initialIntent);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  // On auth, claim any anonymous work this browser owns (conversations and
  // sessions stamped with the anon cookie) then load conversation list.
  useEffect(() => {
    if (!authed) return;
    const run = async () => {
      try {
        await fetch("/api/claim-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
      } catch (err) {
        console.warn("claim-session failed:", err);
      }
      fetch("/api/chat")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.conversations) setConversations(data.conversations);
        })
        .catch((err) => console.warn("Failed to load conversations:", err));
    };
    run();
  }, [authed]);

  // Load specific conversation (works for anon via anon_session_id cookie match).
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    setLoadingHistory(true);
    fetch(`/api/chat?conversationId=${encodeURIComponent(activeConversationId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.messages) {
          setMessages((data.messages as Message[]).filter((m) => m.role !== "system"));
        }
      })
      .catch((err) => console.warn("Failed to load conversation history:", err))
      .finally(() => setLoadingHistory(false));
  }, [activeConversationId]);

  const signupHref = `/signup?redirect=${encodeURIComponent(
    `/chat${activeConversationId ? `?conversation=${activeConversationId}` : ""}`,
  )}`;
  const loginHref = `/login?redirect=${encodeURIComponent(
    `/chat${activeConversationId ? `?conversation=${activeConversationId}` : ""}`,
  )}`;

  const sendMessage = async (text?: string, starterIntent?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || isStreaming || wallHit) return;

    setInput("");
    setError(null);

    const userMsg: Message = { role: "user", content: messageText };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setStreamingContent("");

    const payload: Record<string, unknown> = {
      conversationId: activeConversationId,
      message: messageText,
    };
    // Pass a preset intent only for the first message of a new conversation.
    if (!activeConversationId) {
      const intent = starterIntent ?? pendingIntentRef.current;
      if (intent) payload.intent = intent;
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        if (res.status === 402 && err.wallReason === "chat_cap") {
          setWallHit(true);
          setRemaining(0);
          setMessages((prev) => prev.slice(0, -1));
          setIsStreaming(false);
          return;
        }
        setError(err.error || "Something went wrong. Please try again.");
        setIsStreaming(false);
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      const convId = res.headers.get("X-Conversation-Id");
      if (convId && !activeConversationId) {
        setActiveConversationId(convId);
        // Once a conversation exists, no more preset intent.
        pendingIntentRef.current = undefined;
        router.replace(`/chat?conversation=${convId}`, { scroll: false });
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (!reader) throw new Error("No response stream");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              accumulated += data.content;
              setStreamingContent(accumulated);
            }
            if (data.done) {
              setMessages((prev) => [...prev, { role: "assistant", content: accumulated }]);
              setStreamingContent("");

              if (typeof data.messagesRemaining === "number") {
                setRemaining(data.messagesRemaining);
                if (data.messagesRemaining === 0) setWallHit(true);
              } else {
                setRemaining(null);
              }

              if (data.conversationId && !conversations.find((c) => c.id === data.conversationId)) {
                const newConv: Conversation = {
                  id: data.conversationId,
                  intent: data.intent,
                  status: "active",
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
                setConversations((prev) => [newConv, ...prev]);
              }
            }
            if (data.error) setError(data.error);
          } catch (err) {
            console.warn("Malformed SSE payload:", err);
          }
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      setError("Connection failed. Please try again.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setError(null);
    setRemaining(null);
    setWallHit(false);
    pendingIntentRef.current = initialIntent;
    router.replace("/chat", { scroll: false });
    inputRef.current?.focus();
  };

  const capBannerText = (() => {
    if (remaining === null) return null;
    if (remaining === 0 && !wallHit)
      return "That was your last free message in this conversation.";
    if (remaining > 0) return `${remaining} free message${remaining === 1 ? "" : "s"} left.`;
    return null;
  })();

  return (
    <div className="min-h-screen bg-[#0E1A2B] flex flex-col">
      <Nav
        rightContent={
          <Link
            href="/intake"
            className="text-[#9CA3AF] hover:text-[#F9F7F3] text-sm transition-colors"
          >
            Quick Analysis
          </Link>
        }
      />

      <div className="flex-1 flex min-h-0">
        <div className="w-64 border-r border-[#2A3F5F] flex flex-col overflow-hidden flex-shrink-0">
          <div className="p-4 flex items-center justify-between border-b border-[#2A3F5F]">
            <div className="text-xs text-[#6B7280] font-medium tracking-wider uppercase">
              Sessions
            </div>
            <button
              onClick={startNewConversation}
              className="flex items-center gap-1 text-[#C5933A] hover:text-[#A67C2E] text-xs transition-colors"
            >
              <Plus size={12} /> New
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {!authed ? (
              <div className="text-xs text-[#4A5568] px-2 py-4 leading-relaxed">
                <Link
                  href={loginHref}
                  className="text-[#C5933A] hover:text-[#A67C2E] transition-colors"
                >
                  Sign in
                </Link>{" "}
                to see your conversation history.
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-xs text-[#4A5568] px-2 py-4">
                No sessions yet. Start a conversation below.
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-sm transition-colors ${
                    activeConversationId === conv.id
                      ? "bg-[#152338] border-l-2 border-[#C5933A]"
                      : "hover:bg-[#152338]/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare size={10} className="text-[#6B7280] flex-shrink-0" />
                    <div
                      className={`text-xs font-medium truncate ${
                        activeConversationId === conv.id ? "text-[#F9F7F3]" : "text-[#9CA3AF]"
                      }`}
                    >
                      {(conv.intent && INTENT_LABELS[conv.intent]) || "Guided Session"}
                    </div>
                  </div>
                  <div className="text-[10px] text-[#4A5568] pl-4">
                    {new Date(conv.updated_at).toLocaleDateString()}
                  </div>
                </button>
              ))
            )}
          </div>

          {authed && (
            <div className="p-3 border-t border-[#2A3F5F]">
              <Link
                href="/profile"
                className="flex items-center gap-2 text-xs text-[#6B7280] hover:text-[#9CA3AF] transition-colors"
              >
                <ArrowLeft size={12} /> Back to profile
              </Link>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {!activeConversationId && messages.length === 0 && (
              <div className="max-w-2xl mx-auto pt-8">
                <div className="text-center mb-8">
                  <h1 className="font-display text-3xl text-[#F9F7F3] font-light mb-3">
                    Guided Session
                  </h1>
                  <p className="text-[#9CA3AF] text-sm leading-relaxed max-w-md mx-auto">
                    Describe your situation and the system will guide you through the right
                    experience — from diagnosing why you&rsquo;re not getting interviews to building
                    a complete executive résumé.
                  </p>
                  {!authed && (
                    <p className="text-[10px] text-[#6B7280] mt-4 uppercase tracking-wider">
                      Free preview · 5 messages per conversation
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-[#6B7280] font-medium tracking-wider uppercase mb-3">
                    Start with...
                  </div>
                  {STARTER_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(prompt.label, prompt.intent)}
                      className="w-full text-left px-4 py-3 border border-[#2A3F5F] hover:border-[#C5933A]/40 text-[#9CA3AF] hover:text-[#F9F7F3] text-sm transition-colors"
                    >
                      {prompt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loadingHistory && (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin text-[#C5933A]" />
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-2xl ${
                    msg.role === "user"
                      ? "bg-[#1E3049] text-[#F9F7F3] px-4 py-3 text-sm"
                      : "text-[#E5E7EB] text-sm leading-relaxed"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
                      {msg.content}
                    </div>
                  ) : (
                    <div>{msg.content}</div>
                  )}
                </div>
              </div>
            ))}

            {streamingContent && (
              <div className="flex justify-start">
                <div className="max-w-2xl text-[#E5E7EB] text-sm leading-relaxed">
                  <div className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
                    {streamingContent}
                    <span className="inline-block w-1.5 h-3 bg-[#C5933A] animate-pulse ml-0.5" />
                  </div>
                </div>
              </div>
            )}

            {isStreaming && !streamingContent && (
              <div className="flex justify-start">
                <div className="text-[#6B7280] text-xs flex items-center gap-2">
                  <Loader2 size={12} className="animate-spin text-[#C5933A]" />
                  Thinking...
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-center">
                <div className="bg-red-900/20 border border-red-900/40 text-red-400 text-xs px-4 py-3 max-w-md">
                  {error}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {wallHit && (
            <div className="border-t border-[#C5933A]/40 bg-[#152338] p-6">
              <div className="max-w-3xl mx-auto flex items-start gap-4">
                <Lock size={18} className="text-[#C5933A] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-[#F9F7F3] font-medium mb-1">
                    You&rsquo;ve reached the free message limit for this conversation.
                  </h3>
                  <p className="text-[#9CA3AF] text-sm leading-relaxed mb-4">
                    Sign up to save this conversation. Upgrade to Executive for unlimited
                    messages and downloadable documents.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={signupHref}
                      className="bg-[#C5933A] hover:bg-[#A67C2E] text-[#0E1A2B] font-semibold px-5 py-2.5 text-sm transition-colors"
                    >
                      Sign up to keep going
                    </Link>
                    <Link
                      href={loginHref}
                      className="border border-[#2A3F5F] hover:border-[#C5933A]/40 text-[#9CA3AF] hover:text-[#F9F7F3] px-5 py-2.5 text-sm transition-colors"
                    >
                      Already have an account? Sign in
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!wallHit && (
            <div className="border-t border-[#2A3F5F] p-4">
              <div className="max-w-3xl mx-auto flex items-end gap-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your situation, paste your resume, or ask a question..."
                  rows={3}
                  disabled={isStreaming}
                  className="flex-1 bg-[#152338] border border-[#2A3F5F] focus:border-[#C5933A]/60 text-[#F9F7F3] text-sm p-3 resize-none outline-none transition-colors placeholder:text-[#4A5568] leading-relaxed disabled:opacity-50"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isStreaming}
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-[#C5933A] hover:bg-[#A67C2E] disabled:opacity-40 disabled:cursor-not-allowed text-[#0E1A2B] transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
              <div className="max-w-3xl mx-auto mt-2 flex items-center justify-between text-[10px] text-[#4A5568]">
                <span>Press Enter to send · Shift+Enter for new line</span>
                {capBannerText && <span className="text-[#C5933A]">{capBannerText}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
