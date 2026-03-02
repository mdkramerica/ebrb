"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Download, FileText, Mail, Copy, CheckCircle, ChevronRight, BarChart3, MessageSquare, ArrowRight } from "lucide-react";

type ActiveDoc = "resume" | "cover" | "ats";
type ActiveTab = "preview" | "redline";

const RESUME_PREVIEW = `SARA LOVETT, MPH
St. Paul, Minnesota | (704) 907-0568 | sara.lovett@state.mn.com

VALUE PROPOSITION
Senior infectious disease epidemiologist with 22 years of statewide and local public health leadership experience directing surveillance systems, outbreak investigations, and cross-jurisdictional disease prevention strategy. Trusted advisor to rural, tribal, and state partners with demonstrated success supervising teams, strengthening surveillance infrastructure, and translating complex epidemiologic data into operational, policy, and systems-level action.

KEY ACCOMPLISHMENTS
• Directed statewide COVID-19 case investigation and surveillance guidance during peak pandemic response for a population of 5.6 million, strengthening data quality processes, training systems, and cross-agency coordination.
• Strengthened infectious disease surveillance capacity across 12 rural counties and three tribal nations by enhancing reporting processes, outbreak coordination, and epidemiologic consultation.
• Supervised, assigned responsibilities to, mentored, and evaluated six epidemiology students within a CDC-funded vaccine effectiveness study.
• Led multi-agency fatality and prevention review boards for more than 15 years, translating findings into policy recommendations adopted by local government.
• Co-authored multiple CDC/MDH peer-reviewed studies; served as lead author on published case reports.

PROFESSIONAL EXPERIENCE

MINNESOTA DEPARTMENT OF HEALTH (MDH) — St. Paul, MN
Northwest District Epidemiologist | September 2021 – Present

Mandate: Provide field epidemiology leadership for 12 rural counties and three tribal nations, directing surveillance systems, coordinating outbreak investigations, supporting emergency preparedness and response, and advancing statewide infectious disease prevention strategy aligned with IDEPC priorities.

Selected Outcomes:
• Led regional outbreak investigations and provided real-time epidemiologic consultation to local and tribal health departments.
• Enhanced timeliness and completeness of communicable disease reporting through strengthened training processes.
• Assigned responsibilities, mentored, and evaluated six epidemiology students to ensure protocol adherence and data quality.
• Contributed to continuous quality improvement initiatives across surveillance systems.`;

const ATS_KEYWORDS = [
  { label: "Supervise", before: false, after: true },
  { label: "Field Services Unit", before: false, after: true },
  { label: "Outbreak investigations", before: true, after: true },
  { label: "Surveillance systems", before: true, after: true },
  { label: "Continuous Improvement", before: false, after: true },
  { label: "IDEPC", before: true, after: true },
  { label: "Tribal public health", before: true, after: true },
  { label: "Emergency response", before: false, after: true },
  { label: "Direct staff", before: false, after: true },
];

export default function ResultsPage() {
  const [activeDoc, setActiveDoc] = useState<ActiveDoc>("resume");
  const [activeTab, setActiveTab] = useState<ActiveTab>("preview");
  const [refineInput, setRefineInput] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(RESUME_PREVIEW);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <div className="flex items-center gap-2">
          <CheckCircle size={14} className="text-[#3D8B5E]" />
          <span className="text-[#3D8B5E] text-sm">Materials ready</span>
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-[220px_1fr_300px] gap-0">

        {/* Left sidebar — doc selector */}
        <div className="border-r border-[#2A3F5F] p-4 space-y-1">
          <div className="text-xs text-[#6B7280] font-medium tracking-wider uppercase mb-4 px-2">Your Documents</div>
          {([
            { id: "resume", icon: <FileText size={14} />, label: "Resume", sub: "Final version" },
            { id: "cover", icon: <Mail size={14} />, label: "Cover Letter", sub: "Balanced tone" },
            { id: "ats", icon: <BarChart3 size={14} />, label: "ATS Report", sub: "82% → 93%" },
          ] as const).map((doc) => (
            <button
              key={doc.id}
              onClick={() => setActiveDoc(doc.id)}
              className={`w-full text-left px-3 py-3 flex items-start gap-3 transition-colors ${activeDoc === doc.id ? "bg-[#152338] border-l-2 border-[#C5933A]" : "hover:bg-[#152338]/50"}`}
            >
              <div className={`mt-0.5 ${activeDoc === doc.id ? "text-[#C5933A]" : "text-[#6B7280]"}`}>{doc.icon}</div>
              <div>
                <div className={`text-sm ${activeDoc === doc.id ? "text-[#F9F7F3]" : "text-[#9CA3AF]"}`}>{doc.label}</div>
                <div className="text-xs text-[#6B7280]">{doc.sub}</div>
              </div>
            </button>
          ))}

          <div className="pt-4 mt-4 border-t border-[#2A3F5F]">
            <div className="text-xs text-[#6B7280] font-medium tracking-wider uppercase mb-3 px-2">Versions</div>
            {["v1 — Initial", "v2 — Refined"].map((v, i) => (
              <button key={i} className={`w-full text-left px-3 py-2 text-xs transition-colors ${i === 1 ? "text-[#C5933A]" : "text-[#4A5568] hover:text-[#6B7280]"}`}>
                {v} {i === 1 && "(current)"}
              </button>
            ))}
          </div>
        </div>

        {/* Center — preview */}
        <div className="flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-[#2A3F5F]">
            <div className="flex gap-1">
              {(["preview", "redline"] as const).map((t) => (
                <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-1.5 text-xs capitalize transition-colors ${activeTab === t ? "bg-[#152338] text-[#F9F7F3]" : "text-[#6B7280] hover:text-[#9CA3AF]"}`}>
                  {t === "redline" ? "What changed" : t}
                </button>
              ))}
            </div>
            <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#F9F7F3] transition-colors">
              {copied ? <><CheckCircle size={12} className="text-[#3D8B5E]" /> Copied</> : <><Copy size={12} /> Copy text</>}
            </button>
          </div>

          {/* Document */}
          <div className="flex-1 overflow-auto p-8 bg-[#0A1421]">
            {activeTab === "preview" ? (
              activeDoc === "ats" ? (
                <ATSReport keywords={ATS_KEYWORDS} />
              ) : (
                <div className="max-w-2xl mx-auto bg-[#F9F7F3] p-10 shadow-2xl">
                  <pre className="text-[#1A1A2E] text-xs leading-relaxed font-mono whitespace-pre-wrap">{RESUME_PREVIEW}</pre>
                </div>
              )
            ) : (
              <RedlineView />
            )}
          </div>
        </div>

        {/* Right — refinement + export */}
        <div className="border-l border-[#2A3F5F] flex flex-col">
          {/* Refinement */}
          <div className="p-4 border-b border-[#2A3F5F]">
            <div className="text-xs text-[#6B7280] font-medium tracking-wider uppercase mb-3">Refine</div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {["More assertive", "Trim to 1 page", "Internal candidate", "Add metrics", "Sharpen tone"].map((chip) => (
                <button key={chip} onClick={() => setRefineInput(chip)} className="text-xs px-2.5 py-1 border border-[#2A3F5F] text-[#9CA3AF] hover:border-[#C5933A]/40 hover:text-[#F9F7F3] transition-colors">
                  {chip}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={refineInput}
                onChange={(e) => setRefineInput(e.target.value)}
                placeholder="e.g. Adjust for a COO role..."
                className="flex-1 bg-[#152338] border border-[#2A3F5F] text-[#F9F7F3] text-xs p-2.5 outline-none focus:border-[#C5933A]/60 transition-colors placeholder:text-[#4A5568]"
              />
              <button className="bg-[#C5933A] hover:bg-[#A67C2E] text-[#0E1A2B] px-3 flex items-center transition-colors">
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Export */}
          <div className="p-4 flex-1">
            <div className="text-xs text-[#6B7280] font-medium tracking-wider uppercase mb-3">Export</div>
            <div className="space-y-2">
              {[
                { icon: <Download size={13} />, label: "Download PDF", sub: "ATS-optimized", primary: true },
                { icon: <Download size={13} />, label: "Download Word", sub: ".docx format", primary: false },
                { icon: <FileText size={13} />, label: "Google Apps Script", sub: "Generate formatted Doc", primary: false },
                { icon: <Mail size={13} />, label: "Email everything", sub: "All files to your inbox", primary: false },
              ].map((action) => (
                <button key={action.label} className={`w-full flex items-center justify-between px-3 py-3 text-left transition-colors ${action.primary ? "bg-[#C5933A] hover:bg-[#A67C2E] text-[#0E1A2B]" : "border border-[#2A3F5F] hover:border-[#C5933A]/30 text-[#9CA3AF] hover:text-[#F9F7F3]"}`}>
                  <div className="flex items-center gap-2">
                    {action.icon}
                    <div>
                      <div className={`text-xs font-medium ${action.primary ? "text-[#0E1A2B]" : ""}`}>{action.label}</div>
                      <div className={`text-xs ${action.primary ? "text-[#0E1A2B]/70" : "text-[#6B7280]"}`}>{action.sub}</div>
                    </div>
                  </div>
                  <ChevronRight size={12} />
                </button>
              ))}
            </div>
          </div>

          {/* Upsell / next steps */}
          <div className="p-4 border-t border-[#2A3F5F]">
            <div className="bg-[#152338] p-4">
              <div className="text-xs text-[#C5933A] font-medium mb-2">Next steps</div>
              <ul className="space-y-1.5">
                {["Interview prep for this role", "LinkedIn headline optimization", "Executive bio (board-ready)"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-[#9CA3AF] cursor-pointer hover:text-[#F9F7F3] transition-colors">
                    <ChevronRight size={10} className="text-[#C5933A]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ATSReport({ keywords }: { keywords: { label: string; before: boolean; after: boolean }[] }) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-[#152338] border border-[#2A3F5F] p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Overall ATS Match</div>
            <div className="flex items-center gap-6">
              <div><div className="text-3xl font-display font-light text-[#6B7280]">82%</div><div className="text-xs text-[#6B7280]">Before</div></div>
              <ArrowRight size={16} className="text-[#C5933A]" />
              <div><div className="text-3xl font-display font-light text-[#3D8B5E]">93%</div><div className="text-xs text-[#6B7280]">After</div></div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Status</div>
            <div className="text-[#3D8B5E] text-sm font-medium">Highly Competitive</div>
          </div>
        </div>
        <div className="space-y-2">
          {keywords.map((k) => (
            <div key={k.label} className="flex items-center gap-3">
              <div className="text-xs text-[#9CA3AF] w-40 flex-shrink-0">{k.label}</div>
              <div className={`w-4 h-4 flex items-center justify-center text-xs ${k.before ? "text-[#3D8B5E]" : "text-[#4A5568]"}`}>{k.before ? "✓" : "✗"}</div>
              <div className="text-[#6B7280] text-xs">→</div>
              <div className={`w-4 h-4 flex items-center justify-center text-xs ${k.after ? "text-[#3D8B5E]" : "text-[#4A5568]"}`}>{k.after ? "✓" : "✗"}</div>
              {!k.before && k.after && <div className="text-[#C5933A] text-xs">Added</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RedlineView() {
  const changes = [
    { section: "Summary", type: "rewrite", before: "Experienced epidemiologist with 22 years...", after: "Senior infectious disease epidemiologist with 22 years directing surveillance systems...", reason: "Repositioned from credential-heavy to leadership value proposition" },
    { section: "Section added", type: "add", before: "(none)", after: "KEY ACCOMPLISHMENTS — 5 cross-career quantified outcomes", reason: "Increases 6-11 second skim impact; directly mirrors posting language" },
    { section: "MDH Role mandate", type: "rewrite", before: "MDH Epidemiologist responsibilities included...", after: "Mandate: Provide field epidemiology leadership for 12 rural counties...", reason: "Converted task list to mandate + outcomes structure" },
  ];
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {changes.map((c, i) => (
        <div key={i} className="bg-[#152338] border border-[#2A3F5F] p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className={`text-xs px-2 py-0.5 ${c.type === "add" ? "bg-[#3D8B5E]/20 text-[#3D8B5E]" : "bg-[#C5933A]/20 text-[#C5933A]"}`}>{c.type === "add" ? "Added" : "Rewritten"}</div>
            <div className="text-[#F9F7F3] text-sm font-medium">{c.section}</div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><div className="text-xs text-[#6B7280] mb-1">Before</div><p className="text-[#6B7280] text-xs leading-relaxed">{c.before}</p></div>
            <div><div className="text-xs text-[#3D8B5E] mb-1">After</div><p className="text-[#F9F7F3] text-xs leading-relaxed">{c.after}</p></div>
          </div>
          <div className="pt-3 border-t border-[#2A3F5F]">
            <div className="text-xs text-[#C5933A]/70 italic">{c.reason}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
