"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, type LucideIcon } from "lucide-react";

export type AdventureTier = "free" | "free-preview" | "executive" | "unlimited";

export interface Adventure {
  id: string;
  title: string;
  outcome: string;
  inputs: string;
  tier: AdventureTier;
  href: string;
  icon: LucideIcon;
  primary?: boolean;
}

const tierLabel: Record<AdventureTier, string> = {
  free: "Free",
  "free-preview": "Free preview",
  executive: "Executive",
  unlimited: "Executive+",
};

const tierStyle: Record<AdventureTier, string> = {
  free: "text-[#3D8B5E] border-[#3D8B5E]/40 bg-[#3D8B5E]/10",
  "free-preview": "text-[#3D8B5E] border-[#3D8B5E]/40 bg-[#3D8B5E]/10",
  executive: "text-[#C5933A] border-[#C5933A]/40 bg-[#C5933A]/10",
  unlimited: "text-[#C5933A] border-[#C5933A]/40 bg-[#C5933A]/10",
};

export function AdventureCard({ adventure, compact = false }: { adventure: Adventure; compact?: boolean }) {
  const { title, outcome, inputs, tier, href, icon: Icon, primary } = adventure;
  const padding = compact ? "p-5" : "p-7";
  return (
    <Link
      href={href}
      className={`group flex flex-col ${padding} border transition-all duration-200 ${
        primary
          ? "bg-[#152338] border-[#C5933A]/40 hover:border-[#C5933A] md:col-span-2 lg:col-span-1"
          : "bg-[#0E1A2B] border-[#2A3F5F] hover:border-[#C5933A]/40 hover:bg-[#152338]"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`${primary ? "text-[#C5933A]" : "text-[#C5933A]/80 group-hover:text-[#C5933A]"} transition-colors`}>
          <Icon size={compact ? 18 : 22} />
        </div>
        <span
          className={`text-[10px] font-medium tracking-wider uppercase px-2 py-0.5 border ${tierStyle[tier]}`}
        >
          {tierLabel[tier]}
        </span>
      </div>
      <h3
        className={`font-display ${compact ? "text-lg" : "text-xl"} font-light text-[#F9F7F3] leading-snug mb-2`}
      >
        {title}
      </h3>
      <p className={`text-[#9CA3AF] ${compact ? "text-xs" : "text-sm"} leading-relaxed mb-5 flex-1`}>
        {outcome}
      </p>
      <div className="flex items-center justify-between pt-4 border-t border-[#2A3F5F]">
        <span className="text-[#6B7280] text-xs">{inputs}</span>
        <ArrowRight
          size={14}
          className="text-[#6B7280] group-hover:text-[#C5933A] group-hover:translate-x-1 transition-all"
        />
      </div>
    </Link>
  );
}

export function AdventureCardMotion({ adventure, index = 0 }: { adventure: Adventure; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      className={adventure.primary ? "md:col-span-2 lg:col-span-1" : ""}
    >
      <AdventureCard adventure={adventure} />
    </motion.div>
  );
}
