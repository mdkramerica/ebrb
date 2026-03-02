"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Circle, ArrowRight } from "lucide-react";

interface AnalysisStep {
  id: string;
  label: string;
  detail: string;
  duration: number;
}

const ANALYSIS_STEPS: AnalysisStep[] = [
  { id: "parse", label: "Parsing your documents", detail: "Reading job posting and resume content...", duration: 1200 },
  { id: "mandate", label: "Decoding employer mandate", detail: "Extracting the real reason this role exists — beyond the job title...", duration: 2000 },
  { id: "signals", label: "Identifying capability signals", detail: "Mapping supervisory language, governance structures, and screening criteria...", duration: 1800 },
  { id: "profile", label: "Analyzing your profile", detail: "Finding where you exceed, meet, and have language gaps against the mandate...", duration: 2200 },
  { id: "advantage", label: "Mapping your strategic advantage", detail: "Identifying rare combinations and unusual positioning opportunities...", duration: 1600 },
  { id: "vp", label: "Drafting value proposition", detail: "Rewriting from credential-forward to leadership-forward positioning...", duration: 2400 },
  { id: "accomplishments", label: "Building Key Accomplishments section", detail: "Extracting cross-career quantified outcomes aligned to posting language...", duration: 2000 },
  { id: "roles", label: "Reformatting experience sections", detail: "Converting task lists to Mandate + Selected Outcomes structure...", duration: 2600 },
  { id: "supervisory", label: "Elevating supervisory language", detail: "Surfacing and explicitly stating leadership, management, and direction experience...", duration: 1400 },
  { id: "ats", label: "Running ATS keyword alignment", detail: "Mapping before/after match percentages across core functions and competencies...", duration: 1800 },
  { id: "cover", label: "Generating cover letter", detail: "Writing role-specific letter with correct tone and internal/external positioning...", duration: 2200 },
  { id: "final", label: "Finalizing your materials", detail: "Formatting and preparing submission-ready documents...", duration: 1000 },
];

type StepStatus = "pending" | "running" | "done";

export default function ProcessPage() {
  const router = useRouter();
  const [statuses, setStatuses] = useState<Record<string, StepStatus>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [insight, setInsight] = useState("");
  const [done, setDone] = useState(false);

  const insights = [
    "Employers read resumes in 6–11 seconds. Your Value Proposition is the only section guaranteed to be read.",
    "The word 'responsible' is the #1 signal of an individual contributor mindset. We remove it everywhere.",
    "ATS systems weight repeated terms. Your job posting uses 'supervise' 7 times. That's a primary screen.",
    "Internal candidates win by projecting readiness — not aspiration. Your cover letter will reflect that.",
    "'Managed' and 'Led' are not equivalent. We use the specific verb that matches the posting's language.",
  ];

  useEffect(() => {
    let stepIndex = 0;
    let elapsed = 0;

    const runStep = (i: number) => {
      if (i >= ANALYSIS_STEPS.length) {
        setDone(true);
        return;
      }
      setCurrentStep(i);
      setStatuses((prev) => ({ ...prev, [ANALYSIS_STEPS[i].id]: "running" }));
      setInsight(insights[i % insights.length]);

      setTimeout(() => {
        setStatuses((prev) => ({ ...prev, [ANALYSIS_STEPS[i].id]: "done" }));
        runStep(i + 1);
      }, ANALYSIS_STEPS[i].duration);
    };

    const t = setTimeout(() => runStep(0), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (done) {
      const t = setTimeout(() => router.push("/results"), 1200);
      return () => clearTimeout(t);
    }
  }, [done, router]);

  const completedCount = Object.values(statuses).filter((s) => s === "done").length;
  const progress = (completedCount / ANALYSIS_STEPS.length) * 100;

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
        <div className="text-[#6B7280] text-sm">{completedCount} of {ANALYSIS_STEPS.length} complete</div>
      </div>

      {/* Progress bar */}
      <div className="h-px bg-[#2A3F5F] relative">
        <motion.div
          className="absolute inset-y-0 left-0 bg-[#C5933A]"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 grid md:grid-cols-2 gap-12 items-start">
        {/* Left: analysis log */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-6 bg-[#C5933A]" />
            <span className="text-[#C5933A] text-xs font-medium tracking-[0.2em] uppercase">Analysis in progress</span>
          </div>
          <h2 className="font-display text-2xl font-light text-[#F9F7F3] mb-8">
            Building your executive materials
          </h2>

          <div className="space-y-3">
            {ANALYSIS_STEPS.map((step, i) => {
              const status = statuses[step.id] || "pending";
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0.3 }}
                  animate={{ opacity: status === "pending" ? 0.3 : 1 }}
                  className="flex items-start gap-3"
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {status === "done" ? (
                      <CheckCircle size={14} className="text-[#3D8B5E]" />
                    ) : status === "running" ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-3.5 h-3.5 border border-[#C5933A] border-t-transparent rounded-full"
                      />
                    ) : (
                      <Circle size={14} className="text-[#2A3F5F]" />
                    )}
                  </div>
                  <div>
                    <div className={`text-sm ${status === "done" ? "text-[#6B7280]" : status === "running" ? "text-[#F9F7F3]" : "text-[#2A3F5F]"}`}>
                      {step.label}
                    </div>
                    {status === "running" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-xs text-[#C5933A]/70 mt-0.5"
                      >
                        {step.detail}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right: insight card + progress */}
        <div className="space-y-6">
          {/* Insight */}
          <div className="bg-[#152338] border border-[#2A3F5F] p-6">
            <div className="text-xs text-[#C5933A] font-medium tracking-wider uppercase mb-3">Recruiter insight</div>
            <AnimatePresence mode="wait">
              <motion.p
                key={insight}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
                className="text-[#9CA3AF] text-sm leading-relaxed italic"
              >
                &ldquo;{insight}&rdquo;
              </motion.p>
            </AnimatePresence>
            <div className="mt-4 pt-4 border-t border-[#2A3F5F]">
              <div className="text-xs text-[#6B7280]">— John Nilon, J.N. Solutions</div>
            </div>
          </div>

          {/* What you'll get */}
          <div className="bg-[#0A1421] border border-[#2A3F5F] p-6">
            <div className="text-xs text-[#6B7280] font-medium tracking-wider uppercase mb-4">You&rsquo;ll receive</div>
            <ul className="space-y-2.5">
              {[
                "Tailored resume with Value Proposition + Key Accomplishments",
                "Mandate + Outcomes structure for every role",
                "Cover letter in your selected tone",
                "ATS keyword alignment report with match %",
                "Redline comparison showing what changed and why",
                "PDF, Word, and Google Doc export",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle size={12} className="text-[#C5933A] mt-0.5 flex-shrink-0" />
                  <span className="text-[#9CA3AF] text-xs">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Done state */}
          <AnimatePresence>
            {done && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#3D8B5E]/10 border border-[#3D8B5E]/40 p-6 text-center"
              >
                <CheckCircle size={24} className="text-[#3D8B5E] mx-auto mb-3" />
                <div className="text-[#F9F7F3] font-medium mb-1">Your materials are ready</div>
                <div className="text-[#6B7280] text-xs">Taking you to your results...</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
