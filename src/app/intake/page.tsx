"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Upload, FileText, ChevronDown } from "lucide-react";
import { Nav } from "@/components/Nav";

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.35 } },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0, transition: { duration: 0.2 } }),
};

type Tone = "concise" | "balanced" | "detailed";
type Output = "resume" | "both" | "full";
type Context = "external" | "internal";

interface FormData {
  jobPosting: string;
  resume: string;
  tone: Tone;
  output: Output;
  context: Context;
}

export default function IntakePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState<FormData>({
    jobPosting: "",
    resume: "",
    tone: "balanced",
    output: "both",
    context: "external",
  });

  const totalSteps = 3;
  const progress = ((step + 1) / totalSteps) * 100;

  const goNext = () => { setDir(1); setStep((s) => s + 1); };
  const goBack = () => { setDir(-1); setStep((s) => s - 1); };

  const handleSubmit = () => {
    // Store in sessionStorage and navigate to process
    sessionStorage.setItem("ebrb_form", JSON.stringify(form));
    router.push("/process");
  };

  const canProceed = [
    form.jobPosting.trim().length > 50,
    form.resume.trim().length > 50,
    true,
  ][step];

  return (
    <div className="min-h-screen bg-[#0E1A2B] flex flex-col">
      <Nav
        rightContent={
          <div className="text-[#6B7280] text-sm">Step {step + 1} of {totalSteps}</div>
        }
      />

      {/* Progress bar */}
      <div className="h-px bg-[#2A3F5F] relative">
        <motion.div
          className="absolute inset-y-0 left-0 bg-[#C5933A]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait" custom={dir}>
            {step === 0 && (
              <motion.div key="step0" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit">
                <Step0 value={form.jobPosting} onChange={(v) => setForm((f) => ({ ...f, jobPosting: v }))} />
              </motion.div>
            )}
            {step === 1 && (
              <motion.div key="step1" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit">
                <Step1 value={form.resume} onChange={(v) => setForm((f) => ({ ...f, resume: v }))} />
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="step2" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit">
                <Step2 form={form} setForm={setForm} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10">
            <button
              onClick={goBack}
              disabled={step === 0}
              className="flex items-center gap-2 text-[#6B7280] hover:text-[#F9F7F3] text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft size={14} /> Back
            </button>
            {step < totalSteps - 1 ? (
              <button
                onClick={goNext}
                disabled={!canProceed}
                className="group flex items-center gap-2 bg-[#C5933A] hover:bg-[#A67C2E] disabled:opacity-40 disabled:cursor-not-allowed text-[#0E1A2B] font-semibold px-6 py-3 text-sm transition-all"
              >
                Continue <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed}
                className="group flex items-center gap-2 bg-[#C5933A] hover:bg-[#A67C2E] disabled:opacity-40 disabled:cursor-not-allowed text-[#0E1A2B] font-semibold px-6 py-3 text-sm transition-all"
              >
                Analyze & Build <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Step0({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px w-6 bg-[#C5933A]" />
        <span className="text-[#C5933A] text-xs font-medium tracking-[0.2em] uppercase">Step 1 of 3</span>
      </div>
      <h1 className="font-display text-3xl md:text-4xl font-light text-[#F9F7F3] mb-3">The job posting</h1>
      <p className="text-[#9CA3AF] text-sm mb-8 leading-relaxed">
        Paste the full job description. Include the job title, responsibilities, qualifications, and any ID numbers. The more complete, the better our analysis.
      </p>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[#6B7280] text-xs font-medium tracking-wider uppercase">Paste job posting</label>
          {value.length > 0 && <span className="text-[#C5933A] text-xs">{value.length} characters</span>}
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste the full job description here..."
          rows={12}
          className="w-full bg-[#152338] border border-[#2A3F5F] focus:border-[#C5933A]/60 text-[#F9F7F3] text-sm p-4 resize-none outline-none transition-colors placeholder:text-[#4A5568] leading-relaxed"
        />
      </div>
      <div className="flex items-center gap-3 text-[#4A5568] text-xs">
        <FileText size={12} />
        <span>Tip: Include the job ID if present — it helps with ATS language matching</span>
      </div>
    </div>
  );
}

function Step1({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px w-6 bg-[#C5933A]" />
        <span className="text-[#C5933A] text-xs font-medium tracking-[0.2em] uppercase">Step 2 of 3</span>
      </div>
      <h1 className="font-display text-3xl md:text-4xl font-light text-[#F9F7F3] mb-3">Your resume</h1>
      <p className="text-[#9CA3AF] text-sm mb-8 leading-relaxed">
        Paste your current resume as plain text. Don&rsquo;t worry about formatting — we&rsquo;ll handle that. We need the content: your experience, accomplishments, and credentials.
      </p>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[#6B7280] text-xs font-medium tracking-wider uppercase">Paste your resume</label>
          {value.length > 0 && <span className="text-[#C5933A] text-xs">{value.length} characters</span>}
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste your resume content here..."
          rows={12}
          className="w-full bg-[#152338] border border-[#2A3F5F] focus:border-[#C5933A]/60 text-[#F9F7F3] text-sm p-4 resize-none outline-none transition-colors placeholder:text-[#4A5568] leading-relaxed"
        />
      </div>
      <div className="flex items-center gap-3 text-[#4A5568] text-xs">
        <Upload size={12} />
        <span>LinkedIn PDF export works great — just paste the text content</span>
      </div>
    </div>
  );
}

function Step2({ form, setForm }: { form: FormData; setForm: React.Dispatch<React.SetStateAction<FormData>> }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px w-6 bg-[#C5933A]" />
        <span className="text-[#C5933A] text-xs font-medium tracking-[0.2em] uppercase">Step 3 of 3</span>
      </div>
      <h1 className="font-display text-3xl md:text-4xl font-light text-[#F9F7F3] mb-3">Preferences</h1>
      <p className="text-[#9CA3AF] text-sm mb-10 leading-relaxed">
        Two quick choices that shape your output. You can always change these and regenerate.
      </p>

      {/* Tone */}
      <div className="mb-8">
        <div className="text-[#6B7280] text-xs font-medium tracking-wider uppercase mb-4">Output Tone</div>
        <div className="grid grid-cols-3 gap-2">
          {([
            { val: "concise", label: "Concise", desc: "Tight, to the point" },
            { val: "balanced", label: "Balanced", desc: "Professional depth" },
            { val: "detailed", label: "Detailed", desc: "Full narrative" },
          ] as const).map((t) => (
            <button
              key={t.val}
              onClick={() => setForm((f) => ({ ...f, tone: t.val }))}
              className={`p-4 border text-left transition-all ${form.tone === t.val ? "border-[#C5933A] bg-[#C5933A]/10" : "border-[#2A3F5F] hover:border-[#4A5568]"}`}
            >
              <div className={`text-sm font-medium mb-1 ${form.tone === t.val ? "text-[#C5933A]" : "text-[#F9F7F3]"}`}>{t.label}</div>
              <div className="text-[#6B7280] text-xs">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Context */}
      <div className="mb-8">
        <div className="text-[#6B7280] text-xs font-medium tracking-wider uppercase mb-4">Application Context</div>
        <div className="grid grid-cols-2 gap-2">
          {([
            { val: "external", label: "External Application", desc: "Applying from outside the organization" },
            { val: "internal", label: "Internal Promotion", desc: "Competing for a role within my company" },
          ] as const).map((c) => (
            <button
              key={c.val}
              onClick={() => setForm((f) => ({ ...f, context: c.val }))}
              className={`p-4 border text-left transition-all ${form.context === c.val ? "border-[#C5933A] bg-[#C5933A]/10" : "border-[#2A3F5F] hover:border-[#4A5568]"}`}
            >
              <div className={`text-sm font-medium mb-1 ${form.context === c.val ? "text-[#C5933A]" : "text-[#F9F7F3]"}`}>{c.label}</div>
              <div className="text-[#6B7280] text-xs">{c.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Output */}
      <div>
        <div className="text-[#6B7280] text-xs font-medium tracking-wider uppercase mb-4">Output Package</div>
        <div className="space-y-2">
          {([
            { val: "resume", label: "Resume only", desc: "Tailored resume, PDF + Word" },
            { val: "both", label: "Resume + Cover Letter", desc: "Includes two tone variants of the cover letter" },
            { val: "full", label: "Full Package", desc: "Resume + Cover Letter + ATS Keyword Report" },
          ] as const).map((o) => (
            <button
              key={o.val}
              onClick={() => setForm((f) => ({ ...f, output: o.val }))}
              className={`w-full p-4 border text-left flex items-center justify-between transition-all ${form.output === o.val ? "border-[#C5933A] bg-[#C5933A]/10" : "border-[#2A3F5F] hover:border-[#4A5568]"}`}
            >
              <div>
                <div className={`text-sm font-medium ${form.output === o.val ? "text-[#C5933A]" : "text-[#F9F7F3]"}`}>{o.label}</div>
                <div className="text-[#6B7280] text-xs mt-0.5">{o.desc}</div>
              </div>
              <div className={`w-3 h-3 border flex-shrink-0 ${form.output === o.val ? "border-[#C5933A] bg-[#C5933A]" : "border-[#4A5568]"}`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
