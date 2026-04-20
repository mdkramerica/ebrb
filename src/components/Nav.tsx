"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Logo } from "@/components/Logo";
import { User } from "lucide-react";

export function Nav({ rightContent }: { rightContent?: React.ReactNode }) {
  const { user, loading } = useAuth();

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A3F5F]">
      <Logo />
      <div className="flex items-center gap-4">
        {rightContent}
        {!loading &&
          (user ? (
            <Link
              href="/profile"
              aria-label="Profile"
              className="flex items-center gap-2 text-[#9CA3AF] hover:text-[#F9F7F3] text-sm transition-colors"
            >
              <User size={14} aria-hidden="true" />
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
