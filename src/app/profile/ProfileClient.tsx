"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { User, LogOut, FileText, Clock, ChevronRight } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

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
}

const TIER_STYLES = {
  free: "border border-[#2A3F5F] text-[#6B7280]",
  executive: "border border-[#C5933A] text-[#C5933A] bg-[#C5933A]/10",
  unlimited: "bg-[#C5933A] text-[#0E1A2B]",
} as const;

export default function ProfileClient({
  user,
  profile,
  sessions,
}: {
  user: SupabaseUser;
  profile: Profile | null;
  sessions: Session[];
}) {
  const router = useRouter();
  const tier = profile?.tier || "free";
  const displayName = profile?.full_name || user.email?.split("@")[0] || "User";

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#0E1A2B] flex flex-col">
      {/* Nav */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A3F5F]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 border border-[#C5933A] flex items-center justify-center">
            <span className="text-[#C5933A] text-xs font-semibold">E</span>
          </div>
          <span className="text-[#F9F7F3] text-sm font-medium tracking-wider">EBRB</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-[#9CA3AF] text-sm">{displayName}</span>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-[#6B7280] hover:text-[#F9F7F3] text-xs transition-colors"
          >
            <LogOut size={12} />
            Sign out
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px w-6 bg-[#C5933A]" />
          <span className="text-[#C5933A] text-xs font-medium tracking-[0.2em] uppercase">
            Your Profile
          </span>
        </div>

        <div className="grid md:grid-cols-[1fr_1.5fr] gap-8">
          {/* Left: profile card */}
          <div className="space-y-6">
            <div className="bg-[#152338] border border-[#2A3F5F] p-6">
              <div className="w-14 h-14 bg-[#0E1A2B] border border-[#2A3F5F] flex items-center justify-center mb-4">
                <User size={24} className="text-[#C5933A]" />
              </div>
              <div className="text-[#F9F7F3] font-medium mb-1">{displayName}</div>
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

            {/* Upgrade stub */}
            {tier === "free" && (
              <div className="bg-[#152338] border border-[#2A3F5F] p-6">
                <div className="text-xs text-[#C5933A] font-medium tracking-wider uppercase mb-2">
                  Upgrade your plan
                </div>
                <p className="text-[#9CA3AF] text-sm mb-4 leading-relaxed">
                  Get unlimited analyses, cover letters, and priority processing.
                </p>
                <button
                  disabled
                  className="w-full bg-[#C5933A]/50 text-[#0E1A2B] font-semibold py-3 text-sm cursor-not-allowed"
                >
                  Coming Soon
                </button>
              </div>
            )}
          </div>

          {/* Right: analysis history */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock size={14} className="text-[#6B7280]" />
              <span className="text-xs text-[#6B7280] font-medium tracking-wider uppercase">
                Analysis History
              </span>
            </div>

            {sessions.length === 0 ? (
              <div className="bg-[#152338] border border-[#2A3F5F] p-8 text-center">
                <FileText size={24} className="text-[#2A3F5F] mx-auto mb-3" />
                <p className="text-[#6B7280] text-sm mb-4">No analyses yet</p>
                <Link
                  href="/intake"
                  className="inline-block bg-[#C5933A] hover:bg-[#A67C2E] text-[#0E1A2B] font-semibold px-6 py-2.5 text-sm transition-colors"
                >
                  Start your first analysis
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((s) => (
                  <Link
                    key={s.id}
                    href={`/results?session=${s.id}`}
                    className="block bg-[#152338] border border-[#2A3F5F] p-4 hover:border-[#C5933A]/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-[#F9F7F3] text-sm truncate">
                          {s.job_posting.slice(0, 100)}
                          {s.job_posting.length > 100 ? "..." : ""}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] text-[#6B7280] uppercase tracking-wider">
                            {s.tone}
                          </span>
                          <span className="text-[#2A3F5F]">|</span>
                          <span className="text-[10px] text-[#6B7280] uppercase tracking-wider">
                            {s.context}
                          </span>
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

            <div className="mt-4">
              <Link
                href="/intake"
                className="block w-full text-center text-xs text-[#C5933A] border border-[#C5933A]/30 py-2.5 hover:bg-[#C5933A]/10 transition-colors"
              >
                Start new analysis →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
