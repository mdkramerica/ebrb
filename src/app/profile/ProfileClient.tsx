"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";
import {
  User, LogOut, FileText, Clock, ChevronRight,
  BookOpen, MessageSquare, Copy, CheckCircle,
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useState } from "react";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  tier: "free" | "executive" | "unlimited";
  created_at: string;
}

interface Session {
  id: string;
  created_at: string;
  job_posting: string;
  tone: string;
  context: string;
  intent?: string | null;
}

interface Achievement {
  id: string;
  content: string;
  role_context?: string | null;
  tags?: string[] | null;
  created_at: string;
}

interface Conversation {
  id: string;
  intent: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

const TIER_STYLES = {
  free: "border border-[#2A3F5F] text-[#6B7280]",
  executive: "border border-[#B8893E] text-[#B8893E] bg-[#B8893E]/10",
  unlimited: "bg-[#B8893E] text-[#0E1A2B]",
} as const;

const INTENT_LABELS: Record<string, string> = {
  traction_diagnostic: "Traction Diagnostic",
  differentiation_discovery: "Differentiation",
  positioning_discovery: "Positioning",
  direct_improvement: "Resume Build",
  career_positioning: "Career Positioning",
  interview_prep: "Interview Prep",
  general_question: "Guidance",
};

const INTENT_COLORS: Record<string, string> = {
  traction_diagnostic: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  differentiation_discovery: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  positioning_discovery: "text-purple-400 bg-purple-400/10 border-purple-400/30",
  direct_improvement: "text-green-400 bg-green-400/10 border-green-400/30",
  career_positioning: "text-sky-400 bg-sky-400/10 border-sky-400/30",
  interview_prep: "text-rose-400 bg-rose-400/10 border-rose-400/30",
};

export default function ProfileClient({
  user,
  profile,
  sessions,
  achievements,
  conversations,
}: {
  user: SupabaseUser;
  profile: Profile | null;
  sessions: Session[];
  achievements: Achievement[];
  conversations: Conversation[];
}) {
  const router = useRouter();
  const tier = profile?.tier || "free";
  const displayName = profile?.full_name || user.email?.split("@")[0] || "User";
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"history" | "achievements" | "conversations">("history");

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const copyAchievement = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0E1A2B] flex flex-col">
      {/* Nav */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A3F5F]">
        <Logo />
        <div className="flex items-center gap-4">
          <span className="text-[#9CA3AF] text-sm">{displayName}</span>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-[#6B7280] hover:text-[#F4EFE3] text-xs transition-colors"
          >
            <LogOut size={12} />
            Sign out
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px w-6 bg-[#B8893E]" />
          <span className="text-[#B8893E] text-xs font-medium tracking-[0.2em] uppercase">
            Your Profile
          </span>
        </div>

        <div className="grid md:grid-cols-[1fr_1.8fr] gap-8">
          {/* Left: profile card */}
          <div className="space-y-6">
            <div className="bg-[#152338] border border-[#2A3F5F] p-6">
              <div className="w-14 h-14 bg-[#0E1A2B] border border-[#2A3F5F] flex items-center justify-center mb-4">
                <User size={24} className="text-[#B8893E]" />
              </div>
              <div className="text-[#F4EFE3] font-medium mb-1">{displayName}</div>
              <div className="text-[#6B7280] text-sm mb-4">{user.email}</div>
              <div className="flex items-center gap-2 mb-4">
                <span
                  className={`text-[10px] font-medium tracking-wider uppercase px-2.5 py-1 ${TIER_STYLES[tier]}`}
                >
                  {tier}
                </span>
              </div>
              <div className="text-xs text-[#6B7280]">
                Member since{" "}
                {new Date(profile?.created_at || user.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>

            {/* Quick links */}
            <div className="space-y-2">
              <Link
                href="/intake"
                className="block w-full text-center text-xs text-[#B8893E] border border-[#B8893E]/30 py-2.5 hover:bg-[#B8893E]/10 transition-colors"
              >
                Open a new folio →
              </Link>
              <Link
                href="/chat"
                className="block w-full text-center text-xs text-[#9CA3AF] border border-[#2A3F5F] py-2.5 hover:bg-[#152338]/50 transition-colors"
              >
                Start guided session →
              </Link>
            </div>

            {/* Upgrade stub */}
            {tier === "free" && (
              <div className="bg-[#152338] border border-[#2A3F5F] p-6">
                <div className="text-xs text-[#B8893E] font-medium tracking-wider uppercase mb-2">
                  Upgrade your plan
                </div>
                <p className="text-[#9CA3AF] text-sm mb-4 leading-relaxed">
                  Get executive bio, LinkedIn summary, interview stories, guided sessions, and 5 folios per month.
                </p>
                <button
                  disabled
                  className="w-full bg-[#B8893E]/50 text-[#0E1A2B] font-semibold py-3 text-sm cursor-not-allowed"
                >
                  Coming Soon
                </button>
              </div>
            )}
          </div>

          {/* Right: tabbed content */}
          <div>
            {/* Tab bar */}
            <div className="flex border-b border-[#2A3F5F] mb-6">
              {[
                { key: "history", label: "Past Folios", icon: Clock },
                { key: "achievements", label: `Achievement Library${achievements.length > 0 ? ` (${achievements.length})` : ""}`, icon: BookOpen },
                { key: "conversations", label: `Sessions${conversations.length > 0 ? ` (${conversations.length})` : ""}`, icon: MessageSquare },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 -mb-px transition-colors ${
                    activeTab === tab.key
                      ? "border-[#B8893E] text-[#B8893E]"
                      : "border-transparent text-[#6B7280] hover:text-[#9CA3AF]"
                  }`}
                >
                  <tab.icon size={12} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Past Folios */}
            {activeTab === "history" && (
              <div>
                {sessions.length === 0 ? (
                  <div className="bg-[#152338] border border-[#2A3F5F] p-8 text-center">
                    <FileText size={24} className="text-[#2A3F5F] mx-auto mb-3" />
                    <p className="text-[#6B7280] text-sm mb-4">No folios yet</p>
                    <Link
                      href="/intake"
                      className="inline-block bg-[#B8893E] hover:bg-[#8E6A2E] text-[#0E1A2B] font-semibold px-6 py-2.5 text-sm transition-colors"
                    >
                      Open your first folio
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((s) => (
                      <Link
                        key={s.id}
                        href={`/results?session=${s.id}`}
                        className="block bg-[#152338] border border-[#2A3F5F] p-4 hover:border-[#B8893E]/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-[#F4EFE3] text-sm truncate">
                              {s.job_posting.slice(0, 100)}
                              {s.job_posting.length > 100 ? "..." : ""}
                            </p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {s.intent && INTENT_LABELS[s.intent] && (
                                <span className={`text-[10px] font-medium px-2 py-0.5 border rounded-sm ${INTENT_COLORS[s.intent] || "text-[#6B7280] border-[#2A3F5F]"}`}>
                                  {INTENT_LABELS[s.intent]}
                                </span>
                              )}
                              <span className="text-[10px] text-[#6B7280] uppercase tracking-wider">{s.tone}</span>
                              <span className="text-[#2A3F5F]">|</span>
                              <span className="text-[10px] text-[#6B7280] uppercase tracking-wider">{s.context}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-[10px] text-[#6B7280] whitespace-nowrap">
                              {new Date(s.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                            <ChevronRight size={12} className="text-[#6B7280]" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Achievement Library */}
            {activeTab === "achievements" && (
              <div>
                {achievements.length === 0 ? (
                  <div className="bg-[#152338] border border-[#2A3F5F] p-8 text-center">
                    <BookOpen size={24} className="text-[#2A3F5F] mx-auto mb-3" />
                    <p className="text-[#6B7280] text-sm mb-2">No saved achievements yet</p>
                    <p className="text-[#4A5568] text-xs leading-relaxed max-w-sm mx-auto">
                      Strong bullets that don&apos;t fit the primary folio are automatically saved here. Open a folio to build your library.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {achievements.map(ach => (
                      <div
                        key={ach.id}
                        className="bg-[#152338] border border-[#2A3F5F] p-4 group"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-[#F4EFE3] text-sm leading-relaxed flex-1">{ach.content}</p>
                          <button
                            onClick={() => copyAchievement(ach.id, ach.content)}
                            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[#6B7280] hover:text-[#B8893E]"
                          >
                            {copiedId === ach.id ? (
                              <CheckCircle size={14} className="text-[#3D5C4A]" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                        {(ach.role_context || (ach.tags && ach.tags.length > 0)) && (
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {ach.role_context && (
                              <span className="text-[10px] text-[#6B7280]">{ach.role_context}</span>
                            )}
                            {ach.tags?.map(tag => (
                              <span key={tag} className="text-[10px] text-[#4A5568] border border-[#2A3F5F] px-1.5 py-0.5 rounded-sm">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Guided Conversations */}
            {activeTab === "conversations" && (
              <div>
                {conversations.length === 0 ? (
                  <div className="bg-[#152338] border border-[#2A3F5F] p-8 text-center">
                    <MessageSquare size={24} className="text-[#2A3F5F] mx-auto mb-3" />
                    <p className="text-[#6B7280] text-sm mb-4">No guided sessions yet</p>
                    <Link
                      href="/chat"
                      className="inline-block bg-[#152338] hover:bg-[#1E3049] border border-[#B8893E]/30 text-[#B8893E] font-medium px-6 py-2.5 text-sm transition-colors"
                    >
                      Start a guided session
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversations.map(conv => (
                      <Link
                        key={conv.id}
                        href={`/chat?conversation=${conv.id}`}
                        className="block bg-[#152338] border border-[#2A3F5F] p-4 hover:border-[#B8893E]/30 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <MessageSquare size={14} className="text-[#6B7280] flex-shrink-0" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[#F4EFE3] text-sm">
                                  {(conv.intent && INTENT_LABELS[conv.intent]) || "Guided Session"}
                                </span>
                                {conv.intent && INTENT_COLORS[conv.intent] && (
                                  <span className={`text-[10px] font-medium px-1.5 py-0.5 border rounded-sm ${INTENT_COLORS[conv.intent]}`}>
                                    {INTENT_LABELS[conv.intent]}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-[#6B7280] mt-0.5">
                                Last active {new Date(conv.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </div>
                            </div>
                          </div>
                          <ChevronRight size={12} className="text-[#6B7280]" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
