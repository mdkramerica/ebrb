"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Mail, Copy, CheckCircle, ChevronRight, BarChart3 } from "lucide-react";

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

interface Results {
  resume: string;
  coverLetter: string;
  atsReport: AtsReport | string;
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
    try {
      return JSON.parse(raw) as AtsReport;
    } catch {
      return DEMO_ATS;
    }
  }
  return raw;
}

function getActiveText(doc: "resume" | "cover" | "ats", resume: string, coverLetter: string, ats: AtsReport): string {
  if (doc === "resume") return resume;
  if (doc === "cover") return coverLetter;
  return formatAtsText(ats);
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
  const [activeDoc, setActiveDoc] = useState<"resume" | "cover" | "ats">("resume");
  const [copied, setCopied] = useState(false);
  const [resume, setResume] = useState(DEMO_RESUME);
  const [coverLetter, setCoverLetter] = useState(DEMO_COVER);
  const [atsReport, setAtsReport] = useState<AtsReport>(DEMO_ATS);
  const [isDemo, setIsDemo] = useState(true);

  // Load real results from sessionStorage on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("ebrb_results");
      if (!raw) return;
      const data: Results = JSON.parse(raw);
      if (data.resume) {
        setResume(data.resume);
        setIsDemo(false);
      }
      if (data.coverLetter) {
        setCoverLetter(data.coverLetter);
      }
      if (data.atsReport) {
        setAtsReport(parseAtsReport(data.atsReport));
      }
    } catch (e) {
      console.error("Failed to load results from session:", e);
    }
  }, []);

  const handleCopy = () => {
    const text = getActiveText(activeDoc, resume, coverLetter, atsReport);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async (format: "pdf" | "docx" | "txt") => {
    const text = getActiveText(activeDoc, resume, coverLetter, atsReport);
    const label = activeDoc === "resume" ? "resume" : activeDoc === "cover" ? "cover-letter" : "ats-report";
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
        if (y + lineHeight > pageHeight) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      }

      doc.save(`${filename}.pdf`);
    } else if (format === "docx") {
      const { Document, Packer, Paragraph, TextRun } = await import("docx");
      const paragraphs = text.split("\n").map(
        (line) =>
          new Paragraph({
            children: [new TextRun({ text: line, font: "Calibri", size: 22 })],
            spacing: { after: 80 },
          })
      );
      const docFile = new Document({
        sections: [{ children: paragraphs }],
      });
      const blob = await Packer.toBlob(docFile);
      downloadBlob(blob, `${filename}.docx`);
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
        <div className="flex items-center gap-2">
          <CheckCircle size={14} className="text-[#3D8B5E]" />
          <span className="text-[#3D8B5E] text-sm">
            {isDemo ? "Demo materials" : "Materials ready"}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 grid lg:grid-cols-[220px_1fr_280px] gap-0 min-h-0">
        {/* Left sidebar */}
        <div className="border-r border-[#2A3F5F] p-4 space-y-1 overflow-y-auto">
          <div className="text-xs text-[#6B7280] font-medium tracking-wider uppercase mb-4 px-2">Your Documents</div>
          {(["resume", "cover", "ats"] as const).map((doc) => (
            <button
              key={doc}
              onClick={() => setActiveDoc(doc)}
              className={`w-full text-left px-3 py-3 flex items-start gap-3 transition-colors ${
                activeDoc === doc ? "bg-[#152338] border-l-2 border-[#C5933A]" : "hover:bg-[#152338]/50"
              }`}
            >
              <div className={`mt-0.5 ${activeDoc === doc ? "text-[#C5933A]" : "text-[#6B7280]"}`}>
                {doc === "resume" && <FileText size={14} />}
                {doc === "cover" && <Mail size={14} />}
                {doc === "ats" && <BarChart3 size={14} />}
              </div>
              <div>
                <div className={`text-sm ${activeDoc === doc ? "text-[#F9F7F3]" : "text-[#9CA3AF]"}`}>
                  {doc === "resume" ? "Resume" : doc === "cover" ? "Cover Letter" : "ATS Report"}
                </div>
                <div className="text-xs text-[#6B7280]">
                  {doc === "resume"
                    ? "Final version"
                    : doc === "cover"
                    ? "Balanced tone"
                    : `${atsReport.beforeScore}% → ${atsReport.afterScore}%`}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Center: document preview */}
        <div className="flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-3 border-b border-[#2A3F5F] flex-shrink-0">
            <div className="text-sm text-[#F9F7F3]">Preview</div>
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
          </div>

          <div className="flex-1 overflow-auto p-6 bg-[#0A1421]">
            <div className="max-w-2xl mx-auto bg-[#F9F7F3] p-10 shadow-2xl">
              {activeDoc === "ats" ? (
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
                        {atsReport.microAdjustments.map((adj, i) => (
                          <li key={i}>{adj}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="pt-3 border-t border-[#E5E7EB] font-semibold">
                    Overall: {atsReport.beforeScore}% → {atsReport.afterScore}% ({atsReport.finalAssessment})
                  </div>
                </div>
              ) : (
                <pre className="text-[#1A1A2E] text-xs leading-relaxed font-mono whitespace-pre-wrap">
                  {activeDoc === "resume" ? resume : coverLetter}
                </pre>
              )}
            </div>
          </div>
        </div>

        {/* Right: export */}
        <div className="border-l border-[#2A3F5F] flex flex-col p-4 overflow-y-auto">
          <div className="text-xs text-[#6B7280] font-medium tracking-wider uppercase mb-3">Export</div>
          <div className="space-y-2">
            {(["PDF", "Word", "Plain Text"] as const).map((type) => (
              <button
                key={type}
                onClick={() => handleDownload(type === "PDF" ? "pdf" : type === "Word" ? "docx" : "txt")}
                className="w-full flex items-center justify-between px-3 py-3 text-left bg-[#C5933A] hover:bg-[#A67C2E] text-[#0E1A2B] text-xs font-medium transition-colors"
              >
                <span>Download {type}</span>
                <ChevronRight size={12} />
              </button>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-[#2A3F5F]">
            <div className="text-xs text-[#C5933A] font-medium mb-3">Next Steps</div>
            <Link
              href="/intake"
              className="block w-full text-center text-xs text-[#C5933A] border border-[#C5933A]/30 py-2 hover:bg-[#C5933A]/10 transition-colors"
            >
              Analyze another job →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
