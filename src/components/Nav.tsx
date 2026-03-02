"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { User } from "lucide-react";

export function Nav({ rightContent }: { rightContent?: React.ReactNode }) {
  const { user, loading } = useAuth();

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A3F5F]">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-7 h-7 border border-[#C5933A] flex items-center justify-center">
          <span className="text-[#C5933A] text-xs font-semibold">E</span>
        </div>
        <span className="text-[#F9F7F3] text-sm font-medium tracking-wider">EBRB</span>
      </Link>
      <div className="flex items-center gap-4">
        {rightContent}
        {!loading &&
          (user ? (
            <Link
              href="/profile"
              className="flex items-center gap-2 text-[#9CA3AF] hover:text-[#F9F7F3] text-sm transition-colors"
            >
              <User size={14} />
              <span className="hidden sm:inline">
                {user.email?.split("@")[0]}
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-[#9CA3AF] hover:text-[#F9F7F3] text-sm transition-colors"
            >
              Sign in
            </Link>
          ))}
      </div>
    </div>
  );
}
