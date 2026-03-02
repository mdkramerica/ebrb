"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Download, FileText, Mail, Copy, CheckCircle,
  ChevronRight, BarChart3, ArrowRight, Loader2, X
} from "lucide-react";

// ─── Demo / fallback content (shown when no real session data exists) ─────────
const DEMO_RESUME = `ALEX MORGAN, MBA
Chicago, Illinois | alex.morgan@email.com | (312) 555-0192

VALUE PROPOSITION
Senior operations executive with 15 years of cross-functional leadership in pharmaceutical distribution and supply chain strategy. Trusted advisor to C-suite stakeholders with demonstrated success directing teams of 50+, driving $40M+ in cost savings, and building scalable infrastructure across high-compliance environments.

KEY ACCOMPLISHMENTS
• Directed end-to-end supply chain transformation across 12 distribution centers, reducing fulfillment cycle time by 34% and achieving $18M in annual cost savings.
• Led cross-functional team of 60 in executing FDA regulatory remediation program — zero findings at follow-up audit.
• Negotiated and integrated three third-party logistics partnerships, expanding distribution capacity by 40% without capital investment.
• Spearheaded ERP implementation across four business units, delivering on-time and $2M under budget.
• Established governance framework for vendor performance management, improving on-time delivery rates from 82% to 97%.

PROFESSIONAL EXPERIENCE

MERIDIAN PHARMA LOGISTICS — Chicago, IL
Vice President, Supply Chain Operations | 2019 – Present

Mandate: Provide strategic and operational leadership for pharmaceutical distribution network spanning 12 facilities and $800M in annual product movement, driving continuous improvement, regulatory compliance, and cost efficiency across the enterprise.

Selected Outcomes:
• Redesigned distribution network architecture, consolidating 4 redundant facilities and saving $18M annually.
• Built and led a 60-person operations team through two acquisitions and a complete ERP migration.
• Established quality management framework that achieved 100% on-time regulatory submission record.
• Directed COVID-19 supply continuity response, maintaining 99.2% service levels throughout peak disruption.

NORTHGATE DISTRIBUTION GROUP — Chicago, IL
Director, Operations | 2014 – 2019

Mandate: Lead operational strategy and daily execution for multi-site distribution network serving retail and institutional pharmaceutical clients across the Midwest.

Selected Outcomes:
• Grew operational capacity by 35% through process redesign and facility optimization.
• Reduced operating costs by $7.2M over three years through vendor renegotiation and lean initiatives.
• Launched a predictive inventory model that cut stockouts by 61%.`;

const DEMO_COVER_LETTER = `Alex Morgan, MBA
Chicago, Illinois | alex.morgan@email.com | (312) 555-0192

March 2, 2026

Hiring Committee
[Target Organization]
Re: Vice President, Supply Chain & Distribution Operations | Requisition #[ID]

With 15 years of progressive leadership in pharmaceutical supply chain operations — including six years as VP overseeing an $800M distribution network — I am confident in my readiness to deliver immediate impact in this role.

In my current position at Meridian Pharma Logistics, I direct supply chain operations across 12 facilities, leading a 60-person team while maintaining full regulatory compliance and driving measurable efficiency improvements. Most recently, I led a network redesign that eliminated four redundant distribution centers and generated $18M in annual savings — while simultaneously managing two acquisitions and a full ERP migration.

What distinguishes my background is the combination of operational depth and strategic reach. I have built governance frameworks, negotiated complex logistics partnerships, and led enterprise-wide technology implementations — all within the highly regulated pharmaceutical environment your organization operates in. My track record is not aspirational; it is demonstrated.

I would welcome the opportunity to discuss how my experience aligns with your priorities. I am available at your convenience.

Sincerely,
Alex Morgan, MBA`;

const DEMO_ATS: ATSReport = {
  beforeScore: 79,
  afterScore: 94,
  keywords: [
    { label: "Supply chain strategy", before: true, after: true },
    { label: "Cross-functional leadership", before: true, after: true },
    { label: "Regulatory compliance", before: false, after: true, note: "Added" },
    { label: "ERP implementation", before: true, after: true },
    { label: "Vendor management", before: false, after: true, note: "Added" },
    { label: "Continuous improvement", before: false, after: true, note: "Added" },
    { label: "P&L ownership", before: true, after: true },
    { label: "Team leadership 50+", before: false, after: true, note: "Added" },
  ],
  microAdjustments: [
    "Replace 'managed' with 'directed' in role mandate (matches posting language)",
    "Add 'enterprise-wide' qualifier to ERP bullet (posting uses this phrase 3x)",
    "Include specific compliance framework name (e.g. cGMP, GDP) in opening paragraph",
  ],
  finalAssessment: "Highly competitive. Your cross-functional depth and regulated-industry track record are rare at this level. Primary differentiation is the combination of cost reduction scale ($25M+) and zero-defect compliance record.",
};

const DEMO_REDLINE: RedlineChange[] = [
  { section: "Summary", type: "rewrite", before: "Experienced supply chain professional with 15 years in pharma distribution.", after: "VALUE PROPOSITION: Senior operations executive with 15 years of cross-functional leadership in pharmaceutical distribution and supply chain strategy.", reason: "Repositioned from credential-forward to leadership-forward. Removed 'experienced' (generic). Added scope and mandate." },
  { section: "Key Accomplishments", type: "add", before: "(section did not exist)", after: "6 cross-career quantified outcomes aligned to posting language", reason: "Increases 6-11 second skim impact. Hiring managers read this section first after the summary." },
  { section: "Role formatting", type: "rewrite", before: "VP, Supply Chain — Responsibilities included managing team, overseeing logistics...", after: "Mandate: Provide strategic and operational leadership for pharmaceutical distribution network spanning 12 facilities...", reason: "Converted task list to Mandate + Selected Outcomes. Scope indicators added (12 facilities, $800M, 60-person team)." },
];

type ActiveDoc = "resume" | "cover" | "ats";
type ActiveTab = "preview" | "redline";

interface ATSKeyword { label: string; before: boolean; after: boolean; note?: string; }
interface RedlineChange { section: string; type: string; before: string; after: string; reason: string; }
interface ATSReport { beforeScore: number; afterScore: number; keywords: ATSKeyword[]; microAdjustments?: string[]; finalAssessment?: string; }

interface Results {
  sessionId?: string;
  sessionToken?: string;
  resume?: string;
  coverLetter?: string;
  atsReport?: ATSReport;
  redlineChanges?: RedlineChange[];
  mandateAnalysis?: string;
  strategicAdvantage?: string;
}

interface Version { label: string; resume: string; coverLetter: string; }

// ─── PDF Download helper ──────────────────────────────────────────────────────
function downloadAsPDF(content: string, filename: string) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; margin: 1in; color: #1a1a2e; }
    pre { white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 11pt; }
  </style></head><body><pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.onload = () => { win.print(); };
  }
}

// ─── Word (.docx-like) Download ───────────────────────────────────────────────
function downloadAsWord(content: string, filename: string) {
  const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office'
    xmlns:w='urn:schemas-microsoft-com:office:word'
    xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>${filename}</title>
    <style>body{font-family:Arial;font-size:11pt;margin:1in;} pre{white-space:pre-wrap;font-family:Arial;}</style>
    </head><body><pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body></html>`;
  const blob = new Blob([html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Plain text download ──────────────────────────────────────────────────────
function downloadAsText(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Google Apps Script generator ────────────────────────────────────────────
function generateGoogleAppsScript(content: string): string {
  const escaped = content.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
  return `function createEBRBDocument() {
  var doc = DocumentApp.create('Executive Resume — EBRB');
  var body = doc.getBody();
  body.setMarginTop(72).setMarginBottom(72).setMarginLeft(72).setMarginRight(72);
  var style = {};
  style[DocumentApp.Attribute.FONT_FAMILY] = 'Arial';
  style[DocumentApp.Attribute.FONT_SIZE] = 11;
  style[DocumentApp.Attribute.LINE_SPACING] = 1.15;
  
  var lines = '${escaped}'.split('\\n');
  lines.forEach(function(line) {
    if (line.trim() === '') {
      body.appendParagraph('');
    } else if (line.startsWith('•') || line.startsWith('-')) {
      var li = body.appendListItem(line.replace(/^[•\-]\s*/, ''));
      li.setGlyphType(DocumentApp.GlyphType.BULLET);
      li.setAttributes(style);
    } else {
      var p = body.appendParagraph(line);
      p.setAttributes(style);
    }
  });
  
  DocumentApp.getUi().alert('Document created: ' + doc.getUrl());
}`;
}

export default function ResultsPage() {
  const [activeDoc, setActiveDoc] = useState<ActiveDoc>("resume");
  const [activeTab, setActiveTab] = useState<ActiveTab>("preview");
  const [refineInput, setRefineInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [results, setResults] = useState<Results | null>(null);
  const [refining, setRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [currentVersion, setCurrentVersion] = useState(0);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const refineRef = useRef<HTMLInputElement>(null);

  // Load results from sessionStorage, fall back to demo content
  useEffect(() => {
    const raw = sessionStorage.getItem("ebrb_results");
    const parsed: Results | null = raw ? (() => { try { return JSON.parse(raw); } catch { return null; } })() : null;

    const resume = parsed?.resume || DEMO_RESUME;
    const coverLetter = parsed?.coverLetter || DEMO_COVER_LETTER;

    setResults(parsed || { resume, coverLetter, atsReport: DEMO_ATS, redlineChanges: DEMO_REDLINE });
    setVersions([{ label: "v1 — Original", resume, coverLetter }]);
    setCurrentVersion(0);
  }, []);

  // Current version content
  const currentResume = versions[currentVersion]?.resume || DEMO_RESUME;
  const currentCoverLetter = versions[currentVersion]?.coverLetter || DEMO_COVER_LETTER;
  const activeContent = activeDoc === "resume" ? currentResume : activeDoc === "cover" ? currentCoverLetter : "";
  const atsReport = results?.atsReport;
  const redlineChanges = results?.redlineChanges;

  const docLabel = activeDoc === "resume" ? "resume" : activeDoc === "cover" ? "cover-letter" : "ats-report";

  const handleCopy = () => {
    if (!activeContent) return;
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefine = async () => {
    if (!refineInput.trim() || refining) return;
    setRefining(true);
    setRefineError(null);
    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: results?.sessionId,
          instruction: refineInput,
          docType: activeDoc === "resume" ? "resume" : "cover_letter",
          currentContent: activeContent,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Refinement failed");
      if (data.refined) {
        const newVersion: Version = {
          label: `v${versions.length + 1} — ${refineInput.slice(0, 24)}${refineInput.length > 24 ? '…' : ''}`,
          resume: activeDoc === "resume" ? data.refined : currentResume,
          coverLetter: activeDoc === "cover" ? data.refined : currentCoverLetter,
        };
        const newVersions = [...versions, newVersion];
        setVersions(newVersions);
        setCurrentVersion(newVersions.length - 1);
        // Update sessionStorage
        const updated = { ...results, resume: newVersion.resume, coverLetter: newVersion.coverLetter };
        setResults(updated as Results);
        sessionStorage.setItem("ebrb_results", JSON.stringify(updated));
      }
      setRefineInput("");
    } catch (e: unknown) {
      setRefineError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setRefining(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleRefine(); }
  };

  const handleExport = (type: "pdf" | "word" | "text" | "script" | "email") => {
    const content = activeContent;
    const filename = `ebrb-${docLabel}-${versions[currentVersion]?.label.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'v1'}`;

    switch (type) {
      case "pdf":
        downloadAsPDF(content, filename);
        break;
      case "word":
        downloadAsWord(content, filename);
        break;
      case "text":
        downloadAsText(content, filename);
        break;
      case "script":
        setShowScriptModal(true);
        break;
      case "email":
        // mailto fallback
        const subject = encodeURIComponent("Your EBRB Executive Resume Materials");
        const body = encodeURIComponent(`Resume:\n\n${currentResume}\n\n---\n\nCover Letter:\n\n${currentCoverLetter}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 3000);
        break;
    }
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
        <div className="flex items-center gap-3">
          <CheckCircle size={14} className="text-[#3D8B5E]" />
          <span className="text-[#3D8B5E] text-sm">Materials ready</span>
          <span className="text-[#2A3F5F]">|</span>
          <Link href="/intake" className="text-[#9CA3AF] hover:text-[#F9F7F3] text-xs transition-colors">New analysis →</Link>
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-[220px_1fr_280px] min-h-0">

        {/* ── Left sidebar ─────────────────────────────────────────── */}
        <div className="border-r border-[#2A3F5F] p-4 space-y-1 overflow-y-auto">
          <div className="text-xs text-[#6B7280] font-medium tracking-wider uppercase mb-4 px-2">Your Documents</div>
          {([
            { id: "resume" as const, icon: <FileText size={14} />, label: "Resume", sub: "Tailored + repositioned" },
            { id: "cover" as const, icon: <Mail size={14} />, label: "Cover Letter", sub: currentCoverLetter ? "Ready" : "Included in package" },
            { id: "ats" as const, icon: <BarChart3 size={14} />, label: "ATS Report", sub: atsReport ? `${atsReport.beforeScore}% → ${atsReport.afterScore}%` : "Keyword analysis" },
          ]).map((doc) => (
            <button
              key={doc.id}
              onClick={() => setActiveDoc(doc.id)}
              className={`w-full text-left px-3 py-3 flex items-start gap-3 transition-colors ${
                activeDoc === doc.id ? "bg-[#152338] border-l-2 border-[#C5933A]" : "hover:bg-[#152338]/50"
              }`}
            >
              <div className={`mt-0.5 flex-shrink-0 ${activeDoc === doc.id ? "text-[#C5933A]" : "text-[#6B7280]"}`}>{doc.icon}</div>
              <div>
                <div className={`text-sm ${activeDoc === doc.id ? "text-[#F9F7F3]" : "text-[#9CA3AF]"}`}>{doc.label}</div>
                <div className="text-xs text-[#6B7280]">{doc.sub}</div>
              </div>
            </button>
          ))}

          {/* Version history */}
          {versions.length > 0 && (
            <div className="pt-4 mt-4 border-t border-[#2A3F5F]">
              <div className="text-xs text-[#6B7280] font-medium tracking-wider uppercase mb-3 px-2">Version History</div>
              {versions.map((v, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentVersion(i)}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors rounded ${
                    i === currentVersion
                      ? "text-[#C5933A] bg-[#C5933A]/10"
                      : "text-[#4A5568] hover:text-[#9CA3AF] hover:bg-[#152338]/50"
                  }`}
                >
                  {v.label} {i === currentVersion && <span className="text-[#6B7280]">(current)</span>}
                </button>
              ))}
            </div>
          )}

          {/* Mandate analysis */}
          {results?.mandateAnalysis && (
            <div className="pt-4 mt-4 border-t border-[#2A3F5F]">
              <div className="text-xs text-[#6B7280] font-medium tracking-wider uppercase mb-2 px-2">Mandate Analysis</div>
              <div className="px-2 text-xs text-[#6B7280] leading-relaxed line-clamp-6">
                {results.mandateAnalysis}
              </div>
            </div>
          )}
        </div>

        {/* ── Center: document preview ──────────────────────────────── */}
        <div className="flex flex-col min-h-0 overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-[#2A3F5F] flex-shrink-0">
            <div className="flex gap-1">
              {(["preview", "redline"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-4 py-1.5 text-xs capitalize transition-colors ${
                    activeTab === t ? "bg-[#152338] text-[#F9F7F3]" : "text-[#6B7280] hover:text-[#9CA3AF]"
                  }`}
                >
                  {t === "redline" ? "What changed" : t}
                </button>
              ))}
            </div>
            <button
              onClick={handleCopy}
              disabled={!activeContent}
              className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#F9F7F3] disabled:opacity-30 transition-colors"
            >
              {copied
                ? <><CheckCircle size={12} className="text-[#3D8B5E]" /> Copied</>
                : <><Copy size={12} /> Copy text</>
              }
            </button>
          </div>

          {/* Document area */}
          <div className="flex-1 overflow-auto p-6 bg-[#0A1421]">
            {activeTab === "preview" ? (
              <>
                {activeDoc === "ats" ? (
                  <ATSReport data={atsReport} />
                ) : activeDoc === "cover" ? (
                  <DocumentPreview content={currentCoverLetter} />
                ) : (
                  <DocumentPreview content={currentResume} />
                )}
              </>
            ) : (
              <RedlineView changes={redlineChanges} />
            )}
          </div>
        </div>

        {/* ── Right: refine + export ────────────────────────────────── */}
        <div className="border-l border-[#2A3F5F] flex flex-col overflow-y-auto">

          {/* Refine */}
          <div className="p-4 border-b border-[#2A3F5F]">
            <div className="text-xs text-[#6B7280] font-medium tracking-wider uppercase mb-3">Refine</div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {["More assertive", "Trim to 1 page", "Internal candidate", "Add metrics", "Sharpen tone"].map((chip) => (
                <button
                  key={chip}
                  onClick={() => { setRefineInput(chip); refineRef.current?.focus(); }}
                  className="text-xs px-2.5 py-1 border border-[#2A3F5F] text-[#9CA3AF] hover:border-[#C5933A]/40 hover:text-[#F9F7F3] transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                ref={refineRef}
                value={refineInput}
                onChange={(e) => setRefineInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Adjust for a COO role..."
                disabled={refining}
                className="flex-1 bg-[#152338] border border-[#2A3F5F] text-[#F9F7F3] text-xs p-2.5 outline-none focus:border-[#C5933A]/60 transition-colors placeholder:text-[#4A5568] disabled:opacity-50"
              />
              <button
                onClick={handleRefine}
                disabled={refining || !refineInput.trim() || activeDoc === "ats"}
                className="bg-[#C5933A] hover:bg-[#A67C2E] disabled:opacity-40 disabled:cursor-not-allowed text-[#0E1A2B] px-3 flex items-center transition-colors"
              >
                {refining
                  ? <Loader2 size={14} className="animate-spin" />
                  : <ArrowRight size={14} />
                }
              </button>
            </div>
            {refining && (
              <div className="mt-2 text-xs text-[#C5933A] flex items-center gap-1.5">
                <Loader2 size={10} className="animate-spin" />
                Refining… this takes ~20 seconds
              </div>
            )}
            {refineError && (
              <div className="mt-2 text-xs text-red-400">{refineError}</div>
            )}
            {activeDoc === "ats" && (
              <div className="mt-2 text-xs text-[#6B7280]">Select Resume or Cover Letter to refine</div>
            )}
          </div>

          {/* Export */}
          <div className="p-4 border-b border-[#2A3F5F]">
            <div className="text-xs text-[#6B7280] font-medium tracking-wider uppercase mb-3">Export</div>
            <div className="space-y-2">
              {([
                { type: "pdf" as const,    icon: <Download size={13} />, label: "Download PDF",           sub: "Opens print dialog",        primary: true  },
                { type: "word" as const,   icon: <Download size={13} />, label: "Download Word",          sub: ".doc format",               primary: false },
                { type: "text" as const,   icon: <FileText size={13} />, label: "Download Plain Text",    sub: "For ATS portals",           primary: false },
                { type: "script" as const, icon: <FileText size={13} />, label: "Google Apps Script",     sub: "Generate formatted Doc",    primary: false },
                { type: "email" as const,  icon: <Mail size={13} />,     label: emailSent ? "Opening email…" : "Email to myself", sub: "Via your email client", primary: false },
              ]).map((action) => (
                <button
                  key={action.type}
                  onClick={() => handleExport(action.type)}
                  disabled={false}
                  className={`w-full flex items-center justify-between px-3 py-3 text-left transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                    action.primary
                      ? "bg-[#C5933A] hover:bg-[#A67C2E] text-[#0E1A2B]"
                      : "border border-[#2A3F5F] hover:border-[#C5933A]/30 text-[#9CA3AF] hover:text-[#F9F7F3]"
                  }`}
                >
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

          {/* Next steps */}
          <div className="p-4">
            <div className="bg-[#152338] p-4">
              <div className="text-xs text-[#C5933A] font-medium mb-3">Next steps</div>
              <ul className="space-y-2">
                {[
                  "Interview prep for this role",
                  "LinkedIn headline optimization",
                  "Executive bio (board-ready)",
                  "Negotiate your offer",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                    <ChevronRight size={10} className="text-[#C5933A] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/intake"
                className="mt-4 w-full block text-center text-xs text-[#C5933A] border border-[#C5933A]/30 py-2 hover:bg-[#C5933A]/10 transition-colors"
              >
                Analyze another job →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Google Apps Script modal */}
      <AnimatePresence>
        {showScriptModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6"
            onClick={() => setShowScriptModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#152338] border border-[#2A3F5F] p-6 max-w-2xl w-full max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[#F9F7F3] font-medium">Google Apps Script</div>
                  <div className="text-[#6B7280] text-xs mt-1">Paste this into script.google.com → Run → Opens formatted Google Doc</div>
                </div>
                <button onClick={() => setShowScriptModal(false)} className="text-[#6B7280] hover:text-[#F9F7F3]">
                  <X size={16} />
                </button>
              </div>
              <pre className="flex-1 overflow-auto bg-[#0A1421] p-4 text-xs text-[#9CA3AF] font-mono leading-relaxed">
                {generateGoogleAppsScript(activeContent)}
              </pre>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generateGoogleAppsScript(activeContent));
                    setShowScriptModal(false);
                  }}
                  className="flex-1 bg-[#C5933A] hover:bg-[#A67C2E] text-[#0E1A2B] text-sm font-semibold py-2 transition-colors"
                >
                  Copy Script
                </button>
                <a
                  href="https://script.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 border border-[#2A3F5F] text-[#9CA3AF] hover:text-[#F9F7F3] text-xs flex items-center transition-colors"
                >
                  Open Google Script →
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Document Preview ─────────────────────────────────────────────────────────
function DocumentPreview({ content }: { content: string }) {
  return (
    <div className="max-w-2xl mx-auto bg-[#F9F7F3] p-10 shadow-2xl">
      <pre className="text-[#1A1A2E] text-xs leading-relaxed font-mono whitespace-pre-wrap">{content}</pre>
    </div>
  );
}

// ─── ATS Report ───────────────────────────────────────────────────────────────
function ATSReport({ data }: { data?: ATSReport }) {
  const keywords = data?.keywords || [];
  const before = data?.beforeScore ?? 82;
  const after = data?.afterScore ?? 93;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-[#152338] border border-[#2A3F5F] p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xs text-[#6B7280] uppercase tracking-wider mb-2">Overall ATS Match</div>
            <div className="flex items-center gap-6">
              <div><div className="text-3xl font-display font-light text-[#6B7280]">{before}%</div><div className="text-xs text-[#6B7280] mt-1">Before</div></div>
              <ArrowRight size={16} className="text-[#C5933A]" />
              <div><div className="text-3xl font-display font-light text-[#3D8B5E]">{after}%</div><div className="text-xs text-[#6B7280] mt-1">After</div></div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Status</div>
            <div className={`text-sm font-medium ${after >= 90 ? "text-[#3D8B5E]" : after >= 80 ? "text-[#C5933A]" : "text-red-400"}`}>
              {after >= 90 ? "Highly Competitive" : after >= 80 ? "Competitive" : "Needs Work"}
            </div>
          </div>
        </div>

        {keywords.length > 0 && (
          <div className="space-y-2">
            {keywords.map((k, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="text-xs text-[#9CA3AF] w-44 flex-shrink-0">{k.label}</div>
                <div className={`text-xs w-4 ${k.before ? "text-[#3D8B5E]" : "text-[#4A5568]"}`}>{k.before ? "✓" : "✗"}</div>
                <div className="text-[#6B7280] text-xs">→</div>
                <div className={`text-xs w-4 ${k.after ? "text-[#3D8B5E]" : "text-[#4A5568]"}`}>{k.after ? "✓" : "✗"}</div>
                {!k.before && k.after && <div className="text-[#C5933A] text-xs">Added</div>}
                {k.note && <div className="text-[#6B7280] text-xs italic">{k.note}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {data?.microAdjustments && data.microAdjustments.length > 0 && (
        <div className="bg-[#152338] border border-[#2A3F5F] p-5">
          <div className="text-xs text-[#6B7280] uppercase tracking-wider mb-3">Micro-Adjustments</div>
          <ul className="space-y-2">
            {data.microAdjustments.map((adj, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[#9CA3AF]">
                <ChevronRight size={10} className="text-[#C5933A] mt-0.5 flex-shrink-0" />
                {adj}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data?.finalAssessment && (
        <div className="bg-[#0A1421] border border-[#2A3F5F] p-5">
          <div className="text-xs text-[#C5933A] uppercase tracking-wider mb-2">Final Assessment</div>
          <p className="text-[#9CA3AF] text-sm leading-relaxed">{data.finalAssessment}</p>
        </div>
      )}
    </div>
  );
}

// ─── Redline View ─────────────────────────────────────────────────────────────
function RedlineView({ changes }: { changes?: RedlineChange[] }) {
  const fallback: RedlineChange[] = [
    { section: "Summary", type: "rewrite", before: "Credential-heavy description of experience", after: "Leadership-forward VALUE PROPOSITION aligned to employer mandate", reason: "Repositioned from credential-forward to leadership-forward positioning" },
    { section: "Key Accomplishments", type: "add", before: "(section did not exist)", after: "4-6 quantified cross-career outcomes aligned to posting language", reason: "Increases 6-11 second skim impact with hiring managers" },
    { section: "Role formatting", type: "rewrite", before: "Task list: 'Responsible for...'", after: "Mandate + Selected Outcomes structure with scope indicators", reason: "Converts duty lists to impact evidence" },
  ];

  const items = changes && changes.length > 0 ? changes : fallback;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {items.map((c, i) => (
        <div key={i} className="bg-[#152338] border border-[#2A3F5F] p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className={`text-xs px-2 py-0.5 ${c.type === "add" ? "bg-[#3D8B5E]/20 text-[#3D8B5E]" : c.type === "remove" ? "bg-red-900/20 text-red-400" : "bg-[#C5933A]/20 text-[#C5933A]"}`}>
              {c.type === "add" ? "Added" : c.type === "remove" ? "Removed" : "Rewritten"}
            </div>
            <div className="text-[#F9F7F3] text-sm font-medium">{c.section}</div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <div className="text-xs text-[#6B7280] mb-1">Before</div>
              <p className="text-[#6B7280] text-xs leading-relaxed">{c.before}</p>
            </div>
            <div>
              <div className="text-xs text-[#3D8B5E] mb-1">After</div>
              <p className="text-[#F9F7F3] text-xs leading-relaxed">{c.after}</p>
            </div>
          </div>
          <div className="pt-3 border-t border-[#2A3F5F]">
            <div className="text-xs text-[#C5933A]/70 italic">{c.reason}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
