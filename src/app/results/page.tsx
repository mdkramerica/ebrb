"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FileText, Mail, Copy, CheckCircle, ChevronRight, BarChart3, Lock,
  User, Linkedin, Mic, MessageSquare, Activity, Briefcase, Loader2, Plus,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Nav } from "@/components/Nav";
import { DOC_TYPE_LABELS, DOC_TYPE_TIER } from "@/lib/tiers";
import type { Tier } from "@/lib/tiers";

// ---------- Types ----------
interface AtsKeyword {
  label: string;
  before: boolean;
  after: boolean;
  note: string;
}

interface AtsReport {
  beforeScore: number;
  afterScore: number;
  keywords: AtsKeyword[];
  microAdjustments?: string[];
  finalAssessment: string;
}

interface DocIndex {
  id: string;
  docType: string;
  hasContent: boolean;
  createdAt: string;
}

interface Results {
  sessionToken?: string;
  sessionId?: string;
  intent?: string;
  resume: string;
  coverLetter: string;
  atsReport: AtsReport | string;
  documents?: DocIndex[];
}

// Extended doc types that can be generated on demand
const EXTENDED_DOC_TYPES = [
  "executive_bio",
  "linkedin_summary",
  "interview_stories",
  "traction_diagnostic",
  "positioning_brief",
  "board_bio",
  "speaking_intro",
] as const;


// Icons for each doc type
function DocIcon({ docType, size = 14 }: { docType: string; size?: number }) {
  const cls = `flex-shrink-0`;
  switch (docType) {
    case "resume": return <FileText size={size} className={cls} />;
    case "cover_letter": return <Mail size={size} className={cls} />;
    case "ats_report": return <BarChart3 size={size} className={cls} />;
    case "executive_bio": return <User size={size} className={cls} />;
    case "linkedin_summary": return <Linkedin size={size} className={cls} />;
    case "board_bio": return <Briefcase size={size} className={cls} />;
    case "speaking_intro": return <Mic size={size} className={cls} />;
    case "interview_stories": return <MessageSquare size={size} className={cls} />;
    case "traction_diagnostic": return <Activity size={size} className={cls} />;
    case "positioning_brief": return <Briefcase size={size} className={cls} />;
    default: return <FileText size={size} className={cls} />;
  }
}

// ---------- Demo fallbacks ----------
const DEMO_RESUME = `ALEX MORGAN, MBA — Supply Chain Executive
Chicago, Illinois | alex.morgan@email.com | (312) 555-0192

VALUE PROPOSITION
Senior operations executive with 15 years of cross-functional leadership in pharmaceutical distribution and supply chain strategy. Trusted advisor to C-suite with demonstrated success directing teams of 50+, driving $40M+ in cost savings, and building scalable infrastructure.

KEY ACCOMPLISHMENTS
• Directed end-to-end supply chain transformation across 12 distribution centers, reducing cycle time by 34% and achieving $18M annual savings.
• Led cross-functional team of 60 in executing FDA regulatory remediation program — zero findings at audit.
• Negotiated three third-party logistics partnerships, expanding capacity by 40% without capital investment.
• Spearheaded ERP implementation across four business units, on-time and $2M under budget.
• Established governance framework improving on-time delivery rates from 82% to 97%.

PROFESSIONAL EXPERIENCE

MERIDIAN PHARMA LOGISTICS — Chicago, IL
Vice President, Supply Chain Operations | 2019–Present
Mandate: Provide strategic and operational leadership for pharmaceutical distribution network spanning 12 facilities and $800M in annual product movement.
• Redesigned distribution network architecture, consolidating 4 redundant facilities and saving $18M annually.
• Built and led 60-person operations team through two acquisitions and full ERP migration.
• Achieved 100% on-time regulatory submission record.
• Maintained 99.2% service levels during COVID-19 supply continuity response.

NORTHGATE DISTRIBUTION GROUP — Chicago, IL
Director, Operations | 2014–2019
• Grew operational capacity by 35% through process redesign and facility optimization.
• Reduced operating costs by $7.2M over three years through vendor renegotiation and lean initiatives.
• Launched predictive inventory model that cut stockouts by 61%.`;

const DEMO_COVER = `Alex Morgan, MBA
Chicago, Illinois | alex.morgan@email.com | (312) 555-0192

March 2, 2026

Hiring Committee
[Target Organization]

With 15 years of progressive leadership in pharmaceutical supply chain operations — including six years as VP overseeing an $800M distribution network — I am confident in my readiness to deliver immediate impact in this role.

In my current position at Meridian Pharma Logistics, I direct supply chain operations across 12 facilities, leading a 60-person team while maintaining full regulatory compliance and driving measurable efficiency improvements. Most recently, I led a network redesign that eliminated four redundant distribution centers and generated $18M in annual savings — while simultaneously managing two acquisitions and a full ERP migration.

What distinguishes my background is the combination of operational depth and strategic reach. I have built governance frameworks, negotiated complex logistics partnerships, and led enterprise-wide technology implementations — all within the highly regulated pharmaceutical environment your organization operates in.

I would welcome the opportunity to discuss how my experience aligns with your priorities. I am available at your convenience.

Sincerely,
Alex Morgan, MBA`;

const DEMO_ATS: AtsReport = {
  beforeScore: 79,
  afterScore: 94,
  keywords: [
    { label: "Supply chain strategy", before: true, after: true, note: "Strong" },
    { label: "Cross-functional leadership", before: true, after: true, note: "Strong" },
    { label: "Regulatory compliance", before: false, after: true, note: "Added" },
    { label: "ERP implementation", before: true, after: true, note: "Strong" },
    { label: "Vendor management", before: false, after: true, note: "Added" },
    { label: "Team leadership 50+", before: false, after: true, note: "Added" },
  ],
  finalAssessment: "Highly Competitive",
};

// ---------- Helpers ----------

function formatAtsText(ats: AtsReport): string {
  let text = `ATS Keyword Alignment Report\n\n`;
  text += `Before Score: ${ats.beforeScore}%\nAfter Score: ${ats.afterScore}%\n\n`;
  text += `Keywords:\n`;
  for (const kw of ats.keywords) {
    const before = kw.before ? "✓" : "✗";
    const after = kw.after ? "✓" : "✗";
    text += `  ${kw.label}: ${before} → ${after} (${kw.note})\n`;
  }
  if (ats.microAdjustments?.length) {
    text += `\nMicro-Adjustments:\n`;
    for (const adj of ats.microAdjustments) {
      text += `  • ${adj}\n`;
    }
  }
  text += `\nOverall Match: ${ats.beforeScore}% → ${ats.afterScore}% (${ats.finalAssessment})`;
  return text;
}

function parseAtsReport(raw: AtsReport | string): AtsReport {
  if (typeof raw === "string") {
    try { return JSON.parse(raw) as AtsReport; } catch { return DEMO_ATS; }
  }
  return raw;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------- Component ----------

export default function ResultsPage() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");

  const [activeDoc, setActiveDoc] = useState<string>("resume");
  const [copied, setCopied] = useState(false);
  const [resume, setResume] = useState(DEMO_RESUME);
  const [coverLetter, setCoverLetter] = useState(DEMO_COVER);
  const [atsReport, setAtsReport] = useState<AtsReport>(DEMO_ATS);
  const [isDemo, setIsDemo] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Extended docs content cache
  const [extendedDocs, setExtendedDocs] = useState<Record<string, string>>({});
  const [generatingDoc, setGeneratingDoc] = useState<string | null>(null);
  const [existingDocs, setExistingDocs] = useState<DocIndex[]>([]);

  // User tier (fetched from check-tier endpoint)
  const [userTier, setUserTier] = useState<Tier>("free");

  // Load user tier
  useEffect(() => {
    if (!user) return;
    fetch("/api/check-tier")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.tier) setUserTier(data.tier); })
      .catch(() => {});
  }, [user]);

  // Load results
  useEffect(() => {
    if (sessionId && user) {
      fetch(`/api/my-results?sessionId=${sessionId}`)
        .then(res => res.ok ? res.json() : Promise.reject())
        .then((data: Results) => {
          if (data.resume) {
            setResume(data.resume);
            setCoverLetter(data.coverLetter || DEMO_COVER);
            if (data.atsReport) setAtsReport(parseAtsReport(data.atsReport));
            if (data.sessionId) setCurrentSessionId(data.sessionId);
            if (data.documents) setExistingDocs(data.documents);
            setIsDemo(false);
          }
        })
        .catch(() => {});
      return;
    }

    let loaded = false;

    try {
      const raw = localStorage.getItem("ebrb_results");
      if (raw) {
        const data: Results = JSON.parse(raw);
        if (data.resume) {
          setResume(data.resume);
          setCoverLetter(data.coverLetter || DEMO_COVER);
          if (data.atsReport) setAtsReport(parseAtsReport(data.atsReport));
          if (data.sessionId) setCurrentSessionId(data.sessionId);
          if (data.documents) setExistingDocs(data.documents);
          setIsDemo(false);
          loaded = true;
        }
      }
    } catch {}

    if (!loaded && user) {
      fetch("/api/my-results")
        .then(res => res.ok ? res.json() : Promise.reject())
        .then((data: Results) => {
          if (data.resume) {
            setResume(data.resume);
            setCoverLetter(data.coverLetter || DEMO_COVER);
            if (data.atsReport) setAtsReport(parseAtsReport(data.atsReport));
            if (data.sessionId) setCurrentSessionId(data.sessionId);
            if (data.documents) setExistingDocs(data.documents);
            setIsDemo(false);
            localStorage.setItem("ebrb_results", JSON.stringify(data));
          }
        })
        .catch(() => {});
    }
  }, [user, sessionId]);

  // Claim anonymous session after login
  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem("ebrb_results");
      if (!raw) return;
      const { sessionToken } = JSON.parse(raw);
      if (sessionToken) {
        fetch("/api/claim-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionToken }),
        }).catch(console.error);
      }
    } catch {}
  }, [user]);

  const getActiveText = (): string => {
    if (activeDoc === "resume") return resume;
    if (activeDoc === "cover_letter") return coverLetter;
    if (activeDoc === "ats_report") return formatAtsText(atsReport);
    return extendedDocs[activeDoc] || "";
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async (format: "pdf" | "docx" | "txt") => {
    const text = getActiveText();
    const label = activeDoc.replace(/_/g, "-");
    const filename = `ebrb-${label}`;

    if (format === "txt") {
      downloadBlob(new Blob([text], { type: "text/plain" }), `${filename}.txt`);
    } else if (format === "pdf") {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "letter" });
      const margin = 50;
      const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
      const lineHeight = 14;
      doc.setFont("courier", "normal");
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(text, pageWidth) as string[];
      let y = margin;
      const pageHeight = doc.internal.pageSize.getHeight() - margin;
      for (const line of lines) {
        if (y + lineHeight > pageHeight) { doc.addPage(); y = margin; }
        doc.text(line, margin, y);
        y += lineHeight;
      }
      doc.save(`${filename}.pdf`);
    } else if (format === "docx") {
      const { Document, Packer, Paragraph, TextRun } = await import("docx");
      const paragraphs = text.split("\n").map(
        line => new Paragraph({
          children: [new TextRun({ text: line, font: "Calibri", size: 22 })],
          spacing: { after: 80 },
        })
      );
      const docFile = new Document({ sections: [{ children: paragraphs }] });
      const blob = await Packer.toBlob(docFile);
      downloadBlob(blob, `${filename}.docx`);
    }
  };

  const generateExtendedDoc = async (docType: string) => {
    if (!currentSessionId) return;
    setGeneratingDoc(docType);
    try {
      const res = await fetch("/api/generate-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: currentSessionId, docType }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Generation failed");
        return;
      }
      const data = await res.json();
      setExtendedDocs(prev => ({ ...prev, [docType]: data.content }));
      setExistingDocs(prev => [...prev, { id: data.docId, docType, hasContent: true, createdAt: new Date().toISOString() }]);
      setActiveDoc(docType);
    } catch {
      alert("Generation failed. Please try again.");
    } finally {
      setGeneratingDoc(null);
    }
  };

  const TIER_ORDER: Record<Tier, number> = { free: 0, executive: 1, unlimited: 2 };
  const tierSatisfies = (required: Tier) => TIER_ORDER[userTier] >= TIER_ORDER[required];

  // Determine which extended doc types are available (not yet generated)
  const generatedDocTypes = new Set(existingDocs.map(d => d.docType));
  const ungeneratedExtended = EXTENDED_DOC_TYPES.filter(dt => !generatedDocTypes.has(dt));

  return (
    <div className="min-h-screen bg-[#0E1A2B] flex flex-col">
      <Nav
        rightContent={
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-[#3D8B5E]" />
            <span className="text-[#3D8B5E] text-sm">
              {isDemo ? "Demo materials" : "Materials ready"}
            </span>
          </div>
        }
      />

      {/* Main content */}
      <div className="flex-1 grid lg:grid-cols-[240px_1fr_280px] gap-0 min-h-0">

        {/* Left sidebar */}
        <div className="border-r border-[#2A3F5F] p-4 flex flex-col overflow-y-auto">
          <div className="text-xs text-[#6B7280] font-medium tracking-wider uppercase mb-4 px-2">Your Documents</div>

          {/* Core documents */}
          <div className="space-y-1 mb-4">
            {[
              { key: "resume", label: "Resume", sub: "Final version" },
              { key: "cover_letter", label: "Cover Letter", sub: "Balanced tone" },
              { key: "ats_report", label: "ATS Report", sub: `${atsReport.beforeScore}% → ${atsReport.afterScore}%` },
            ].map(doc => (
              <button
                key={doc.key}
                onClick={() => setActiveDoc(doc.key)}
                className={`w-full text-left px-3 py-3 flex items-start gap-3 transition-colors ${
                  activeDoc === doc.key ? "bg-[#152338] border-l-2 border-[#C5933A]" : "hover:bg-[#152338]/50"
                }`}
              >
                <div className={`mt-0.5 ${activeDoc === doc.key ? "text-[#C5933A]" : "text-[#6B7280]"}`}>
                  <DocIcon docType={doc.key} />
                </div>
                <div>
                  <div className={`text-sm ${activeDoc === doc.key ? "text-[#F9F7F3]" : "text-[#9CA3AF]"}`}>{doc.label}</div>
                  <div className="text-xs text-[#6B7280]">{doc.sub}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Generated extended docs */}
          {existingDocs.filter(d => !["resume","cover_letter","ats_report"].includes(d.docType)).length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-[#4A5568] font-medium tracking-wider uppercase mb-2 px-2">Generated</div>
              <div className="space-y-1">
                {existingDocs
                  .filter(d => !["resume","cover_letter","ats_report"].includes(d.docType))
                  .map(doc => (
                    <button
                      key={doc.docType}
                      onClick={() => setActiveDoc(doc.docType)}
                      className={`w-full text-left px-3 py-2.5 flex items-start gap-3 transition-colors ${
                        activeDoc === doc.docType ? "bg-[#152338] border-l-2 border-[#C5933A]" : "hover:bg-[#152338]/50"
                      }`}
                    >
                      <div className={`mt-0.5 ${activeDoc === doc.docType ? "text-[#C5933A]" : "text-[#6B7280]"}`}>
                        <DocIcon docType={doc.docType} />
                      </div>
                      <div className={`text-sm ${activeDoc === doc.docType ? "text-[#F9F7F3]" : "text-[#9CA3AF]"}`}>
                        {DOC_TYPE_LABELS[doc.docType] || doc.docType}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Generate More section */}
          {!isDemo && ungeneratedExtended.length > 0 && (
            <div className="mt-auto pt-4 border-t border-[#2A3F5F]">
              <div className="text-xs text-[#6B7280] font-medium tracking-wider uppercase mb-3 px-2">Generate More</div>
              <div className="space-y-1.5">
                {ungeneratedExtended.map(docType => {
                  const required = DOC_TYPE_TIER[docType] as Tier;
                  const canGenerate = tierSatisfies(required) && !!currentSessionId;
                  const isGenerating = generatingDoc === docType;

                  return (
                    <button
                      key={docType}
                      onClick={() => canGenerate && generateExtendedDoc(docType)}
                      disabled={!canGenerate || !!generatingDoc}
                      title={!tierSatisfies(required) ? `Requires ${required} plan` : !currentSessionId ? "Sign in to generate" : ""}
                      className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 text-xs transition-colors rounded-sm ${
                        canGenerate && !generatingDoc
                          ? "text-[#9CA3AF] hover:text-[#F9F7F3] hover:bg-[#152338]/50 border border-[#2A3F5F] hover:border-[#4A5568]"
                          : "text-[#4A5568] border border-[#1E3049] cursor-not-allowed"
                      }`}
                    >
                      {isGenerating ? (
                        <Loader2 size={12} className="animate-spin text-[#C5933A] flex-shrink-0" />
                      ) : canGenerate ? (
                        <Plus size={12} className="flex-shrink-0 text-[#C5933A]" />
                      ) : (
                        <Lock size={12} className="flex-shrink-0" />
                      )}
                      <span>{DOC_TYPE_LABELS[docType]}</span>
                      {!tierSatisfies(required) && (
                        <span className="ml-auto text-[10px] text-[#4A5568] capitalize">{required}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Center: document preview */}
        <div className="flex flex-col min-h-0 overflow-hidden relative">
          <div className="flex items-center justify-between px-6 py-3 border-b border-[#2A3F5F] flex-shrink-0">
            <div className="text-sm text-[#F9F7F3]">
              {DOC_TYPE_LABELS[activeDoc] || "Preview"}
            </div>
            {user && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#F9F7F3] transition-colors"
              >
                {copied ? (
                  <><CheckCircle size={12} className="text-[#3D8B5E]" /> Copied</>
                ) : (
                  <><Copy size={12} /> Copy text</>
                )}
              </button>
            )}
          </div>

          <div className={`flex-1 overflow-auto p-6 bg-[#0A1421] ${!user && !authLoading ? "blur-sm pointer-events-none select-none" : ""}`}>
            <div className="max-w-2xl mx-auto bg-[#F9F7F3] p-10 shadow-2xl">
              {activeDoc === "ats_report" ? (
                <AtsReportView atsReport={atsReport} />
              ) : activeDoc === "resume" ? (
                <pre className="text-[#1A1A2E] text-xs leading-relaxed font-mono whitespace-pre-wrap">{resume}</pre>
              ) : activeDoc === "cover_letter" ? (
                <pre className="text-[#1A1A2E] text-xs leading-relaxed font-mono whitespace-pre-wrap">{coverLetter}</pre>
              ) : extendedDocs[activeDoc] ? (
                <pre className="text-[#1A1A2E] text-xs leading-relaxed font-mono whitespace-pre-wrap">{extendedDocs[activeDoc]}</pre>
              ) : generatingDoc === activeDoc ? (
                <div className="flex items-center gap-3 text-[#6B7280] text-sm py-12 justify-center">
                  <Loader2 size={16} className="animate-spin text-[#C5933A]" />
                  Generating {DOC_TYPE_LABELS[activeDoc]}...
                </div>
              ) : (
                <div className="text-[#6B7280] text-sm py-12 text-center">
                  Click the generate button to create this document.
                </div>
              )}
            </div>
          </div>

          {/* Auth gate overlay */}
          {!user && !authLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#0A1421]/60 backdrop-blur-[2px]">
              <div className="bg-[#0E1A2B] border border-[#2A3F5F] p-8 max-w-md text-center">
                <div className="w-12 h-12 border border-[#C5933A] flex items-center justify-center mx-auto mb-4">
                  <Lock size={20} className="text-[#C5933A]" />
                </div>
                <h3 className="font-display text-2xl text-[#F9F7F3] mb-3">Your materials are ready</h3>
                <p className="text-[#9CA3AF] text-sm mb-6 leading-relaxed">
                  Create a free account to view your full resume, cover letter, and ATS report. Download in PDF, Word, or plain text.
                </p>
                <Link
                  href="/signup?redirect=/results"
                  className="block w-full bg-[#C5933A] hover:bg-[#A67C2E] text-[#0E1A2B] font-semibold py-3 text-sm transition-colors mb-3"
                >
                  Create Free Account
                </Link>
                <Link
                  href="/login?redirect=/results"
                  className="block w-full border border-[#2A3F5F] hover:border-[#C5933A]/40 text-[#9CA3AF] hover:text-[#F9F7F3] py-3 text-sm transition-colors"
                >
                  Already have an account? Sign in
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right: export */}
        <div className="border-l border-[#2A3F5F] flex flex-col p-4 overflow-y-auto">
          <div className="text-xs text-[#6B7280] font-medium tracking-wider uppercase mb-3">Export</div>
          <div className="space-y-2">
            {(["PDF", "Word", "Plain Text"] as const).map((type) => {
              const needsTier = type !== "Plain Text";
              const canDownload = user && (!needsTier || tierSatisfies("executive"));
              return (
                <button
                  key={type}
                  onClick={() => canDownload && handleDownload(type === "PDF" ? "pdf" : type === "Word" ? "docx" : "txt")}
                  disabled={!canDownload}
                  title={user && needsTier && !tierSatisfies("executive") ? "Requires Executive plan" : ""}
                  className={`w-full flex items-center justify-between px-3 py-3 text-left text-xs font-medium transition-colors ${
                    canDownload
                      ? "bg-[#C5933A] hover:bg-[#A67C2E] text-[#0E1A2B]"
                      : "bg-[#2A3F5F] text-[#6B7280] cursor-not-allowed"
                  }`}
                >
                  <span>Download {type}</span>
                  <ChevronRight size={12} />
                </button>
              );
            })}
          </div>

          <div className="mt-6 pt-6 border-t border-[#2A3F5F]">
            <div className="text-xs text-[#C5933A] font-medium mb-3">Next Steps</div>
            <Link
              href="/intake"
              className="block w-full text-center text-xs text-[#C5933A] border border-[#C5933A]/30 py-2 hover:bg-[#C5933A]/10 transition-colors mb-2"
            >
              Analyze another job →
            </Link>
            <Link
              href="/chat"
              className="block w-full text-center text-xs text-[#9CA3AF] border border-[#2A3F5F] py-2 hover:bg-[#152338]/50 transition-colors"
            >
              Start guided session →
            </Link>
          </div>

          {!isDemo && (
            <div className="mt-4 pt-4 border-t border-[#2A3F5F]">
              <Link
                href="/profile"
                className="block w-full text-center text-xs text-[#6B7280] hover:text-[#9CA3AF] transition-colors"
              >
                View analysis history
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Extracted ATS report renderer
function AtsReportView({ atsReport }: { atsReport: AtsReport }) {
  return (
    <div className="text-[#1A1A2E] text-xs leading-relaxed">
      <h2 className="text-base font-bold mb-4">ATS Keyword Alignment Report</h2>
      <div className="flex items-center gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{atsReport.beforeScore}%</div>
          <div className="text-[10px] text-[#6B7280] uppercase">Before</div>
        </div>
        <div className="text-lg text-[#6B7280]">→</div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-700">{atsReport.afterScore}%</div>
          <div className="text-[10px] text-[#6B7280] uppercase">After</div>
        </div>
      </div>
      <table className="w-full text-xs border-collapse mb-4">
        <thead>
          <tr className="border-b border-[#E5E7EB]">
            <th className="text-left py-2 font-semibold">Keyword</th>
            <th className="text-center py-2 font-semibold">Before</th>
            <th className="text-center py-2 font-semibold">After</th>
            <th className="text-left py-2 font-semibold">Note</th>
          </tr>
        </thead>
        <tbody>
          {atsReport.keywords.map((kw, i) => (
            <tr key={i} className="border-b border-[#F3F4F6]">
              <td className="py-1.5">{kw.label}</td>
              <td className="text-center">{kw.before ? "✓" : "✗"}</td>
              <td className="text-center text-green-700">{kw.after ? "✓" : "✗"}</td>
              <td className="text-[#6B7280]">{kw.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {atsReport.microAdjustments && atsReport.microAdjustments.length > 0 && (
        <div className="mb-4">
          <div className="font-semibold mb-1">Micro-Adjustments</div>
          <ul className="list-disc list-inside space-y-0.5 text-[#4B5563]">
            {atsReport.microAdjustments.map((adj, i) => <li key={i}>{adj}</li>)}
          </ul>
        </div>
      )}
      <div className="pt-3 border-t border-[#E5E7EB] font-semibold">
        Overall: {atsReport.beforeScore}% → {atsReport.afterScore}% ({atsReport.finalAssessment})
      </div>
    </div>
  );
}
