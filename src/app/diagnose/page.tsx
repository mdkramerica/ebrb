"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { HelpCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { Nav } from "@/components/Nav";

export default function DiagnosePage() {
  return (
    <main className="min-h-screen bg-[#0E1A2B]">
      <Nav />
      <div className="max-w-3xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/#adventures"
            className="inline-flex items-center gap-2 text-[#6B7280] hover:text-[#9CA3AF] text-sm mb-10 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to paths
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <HelpCircle size={22} className="text-[#B8893E]" />
            <span className="text-[#B8893E] text-xs font-medium tracking-[0.2em] uppercase">
              Diagnose
            </span>
          </div>

          <h1 className="font-display text-4xl md:text-5xl font-light text-[#F4EFE3] mb-6 leading-tight">
            Figure out why you&rsquo;re not<br />
            <em className="text-[#B8893E] not-italic">getting interviews</em>
          </h1>

          <p className="text-[#9CA3AF] text-lg leading-relaxed mb-10">
            This adventure is launching soon. It will tell you whether it&rsquo;s an <span className="text-[#F4EFE3]">Access gap</span> (keywords, ATS, headline) or a <span className="text-[#F4EFE3]">Selection gap</span> (positioning, outcome clarity) — and what to fix first. Just a resume, no job posting needed.
          </p>

          <div className="bg-[#152338] border border-[#2A3F5F] p-6 mb-8">
            <div className="text-xs text-[#B8893E] font-medium tracking-wider uppercase mb-2">
              In the meantime
            </div>
            <p className="text-[#9CA3AF] text-sm leading-relaxed mb-5">
              You can get a full diagnostic as part of the current resume-tailoring flow. It requires a job posting too, but the traction analysis inside the results is identical.
            </p>
            <Link
              href="/intake"
              className="group inline-flex items-center gap-2 bg-[#B8893E] hover:bg-[#8E6A2E] text-[#0E1A2B] font-semibold px-6 py-3 text-sm transition-colors"
            >
              Use the full tailoring flow
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <Link
            href="/chat"
            className="text-[#9CA3AF] hover:text-[#F4EFE3] text-sm transition-colors inline-flex items-center gap-2"
          >
            Or start a guided conversation instead
            <ArrowRight size={12} />
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
