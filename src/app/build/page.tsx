"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Award, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { Nav } from "@/components/Nav";

const deliverables = [
  { title: "Executive biography", desc: "Third-person, 300 words. Career arc, signature outcomes, forward positioning.", tier: "Executive" },
  { title: "LinkedIn About section", desc: "First-person, 200–300 words. Problem-solving focus, proof points, call to action.", tier: "Executive" },
  { title: "Interview STAR stories", desc: "Your resume bullets converted to Situation–Task–Action–Result narratives, plus anticipated questions.", tier: "Executive" },
  { title: "Board biography", desc: "Governance-focused third-person bio emphasizing oversight, risk, and strategic advisory.", tier: "Unlimited" },
  { title: "Speaking introduction", desc: "60-second moderator-ready intro (~150 words) with credentials and credibility buildup.", tier: "Unlimited" },
];

export default function BuildPage() {
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
            <Award size={22} className="text-[#B8893E]" />
            <span className="text-[#B8893E] text-xs font-medium tracking-[0.2em] uppercase">
              Executive presence
            </span>
          </div>

          <h1 className="font-display text-4xl md:text-5xl font-light text-[#F4EFE3] mb-6 leading-tight">
            Build your<br />
            <em className="text-[#B8893E] not-italic">executive presence</em>
          </h1>

          <p className="text-[#9CA3AF] text-lg leading-relaxed mb-10">
            One resume in, a full suite of brand assets out. Launching soon with single- and multi-doc generation. Preview what you&rsquo;ll get:
          </p>

          <div className="border border-[#2A3F5F] mb-10">
            {deliverables.map((d, i) => (
              <div
                key={d.title}
                className={`flex items-start gap-4 p-5 ${i < deliverables.length - 1 ? "border-b border-[#2A3F5F]" : ""}`}
              >
                <CheckCircle size={16} className="text-[#B8893E] mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-4 mb-1">
                    <h3 className="text-[#F4EFE3] font-medium text-base">{d.title}</h3>
                    <span
                      className={`text-[10px] font-medium tracking-wider uppercase px-2 py-0.5 border flex-shrink-0 ${
                        d.tier === "Executive"
                          ? "text-[#B8893E] border-[#B8893E]/40 bg-[#B8893E]/10"
                          : "text-[#D9BE85] border-[#D9BE85]/40 bg-[#D9BE85]/10"
                      }`}
                    >
                      {d.tier}
                    </span>
                  </div>
                  <p className="text-[#9CA3AF] text-sm leading-relaxed">{d.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#152338] border border-[#2A3F5F] p-6 mb-8">
            <div className="text-xs text-[#B8893E] font-medium tracking-wider uppercase mb-2">
              Available today
            </div>
            <p className="text-[#9CA3AF] text-sm leading-relaxed mb-5">
              If you run a full role-match analysis now, Executive bio and LinkedIn summary are already available as add-on documents from the results page.
            </p>
            <Link
              href="/intake"
              className="group inline-flex items-center gap-2 bg-[#B8893E] hover:bg-[#8E6A2E] text-[#0E1A2B] font-semibold px-6 py-3 text-sm transition-colors"
            >
              Start a role-match analysis
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
