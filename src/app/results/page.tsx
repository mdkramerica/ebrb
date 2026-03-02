"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Download, FileText, Mail, Copy, CheckCircle, ChevronRight, BarChart3, ArrowRight } from "lucide-react";

// Demo content — always available
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

export default function ResultsPage() {
  const [activeDoc, setActiveDoc] = useState<"resume" | "cover" | "ats">("resume");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = activeDoc === "resume" ? DEMO_RESUME : activeDoc === "cover" ? DEMO_COVER : "ATS Report";
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (format: "pdf" | "docx" | "txt") => {
    const text = activeDoc === "resume" ? DEMO_RESUME : DEMO_COVER;
    const filename = `ebrb-${activeDoc}`;
    
    if (format === "txt") {
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === "pdf") {
      alert("PDF download: Open print dialog to save as PDF");
      window.print();
    } else if (format === "docx") {
      const html = `<html><head><meta charset="utf-8"><title>${filename}</title></head><body><pre>${text}</pre></body></html>`;
      const blob = new Blob([html], { type: "application/msword" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.doc`;
      a.click();
      URL.revokeObjectURL(url);
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
          <span className="text-[#3D8B5E] text-sm">Materials ready</span>
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
                  {doc === "resume" ? "Final version" : doc === "cover" ? "Balanced tone" : "79% → 94%"}
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
              <pre className="text-[#1A1A2E] text-xs leading-relaxed font-mono whitespace-pre-wrap">
                {activeDoc === "resume" ? DEMO_RESUME : activeDoc === "cover" ? DEMO_COVER : "ATS Keyword Analysis\n\nSupply chain strategy: ✓ Strong\nCross-functional leadership: ✓ Strong\nRegulatory compliance: ✓ Added\nERP implementation: ✓ Strong\nVendor management: ✓ Added\nTeam leadership 50+: ✓ Added\n\nOverall Match: 79% → 94% (Highly Competitive)"}
              </pre>
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