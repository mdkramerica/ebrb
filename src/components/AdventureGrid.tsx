"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Target, HelpCircle, Compass, Award, MessageCircle, ArrowRight } from "lucide-react";
import { AdventureCard, AdventureCardMotion, type Adventure } from "./AdventureCard";

export const ADVENTURES: Adventure[] = [
  {
    id: "match",
    title: "Match me to a specific role",
    outcome: "Tailored resume, cover letter, ATS report, and a redline showing exactly what changed and why.",
    inputs: "Resume + job posting",
    tier: "free-preview",
    href: "/intake",
    icon: Target,
    primary: true,
  },
  {
    id: "diagnose",
    title: "Figure out why I'm not getting interviews",
    outcome: "Diagnose whether it's an Access gap (keywords, ATS) or a Selection gap (positioning, outcome clarity) — and what to fix first.",
    inputs: "Resume only",
    tier: "free",
    href: "/diagnose",
    icon: HelpCircle,
  },
  {
    id: "pitch",
    title: "Figure out how to pitch myself",
    outcome: "A guided conversation that surfaces your value proposition — what you reliably deliver, what you're hired to fix.",
    inputs: "Just a conversation",
    tier: "free",
    href: "/chat?intent=positioning_discovery",
    icon: Compass,
  },
  {
    id: "presence",
    title: "Build my executive presence",
    outcome: "Executive bio, LinkedIn summary, board bio, and speaking introductions — built from your resume.",
    inputs: "Resume",
    tier: "executive",
    href: "/build",
    icon: Award,
  },
  {
    id: "interview",
    title: "Prepare for an interview",
    outcome: "Convert your achievements into STAR stories and anticipate the questions a hiring committee will ask.",
    inputs: "Resume + optional job posting",
    tier: "executive",
    href: "/chat?intent=interview_prep",
    icon: MessageCircle,
  },
];

export function AdventureGrid({ id = "adventures" }: { id?: string }) {
  return (
    <section id={id} className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-12 max-w-2xl"
        >
          <div className="mb-4">
            <div className="gold-rule" />
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-light text-[#F9F7F3] mb-4">
            Where are you stuck?
          </h2>
          <p className="text-[#9CA3AF] leading-relaxed">
            EBRB isn&apos;t just a resume rewriter. Pick the path that matches where you are — each one asks only for what it needs.
          </p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ADVENTURES.map((adventure, i) => (
            <AdventureCardMotion key={adventure.id} adventure={adventure} index={i} />
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-10 flex items-center justify-center gap-2 text-sm"
        >
          <span className="text-[#6B7280]">Not sure where to start?</span>
          <Link
            href="/chat"
            className="group inline-flex items-center gap-1.5 text-[#C5933A] hover:text-[#E8D5A3] transition-colors"
          >
            Start a guided conversation
            <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export function AdventureGridCompact({ title = "Start a new adventure" }: { title?: string }) {
  return (
    <section className="py-8">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-light text-[#F9F7F3]">{title}</h2>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {ADVENTURES.map((adventure) => (
          <AdventureCard key={adventure.id} adventure={adventure} compact />
        ))}
      </div>
    </section>
  );
}
