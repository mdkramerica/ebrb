"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle, ChevronDown, Shield, Zap, Target, BarChart3, FileText, Lock, User } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const { user, loading } = useAuth();
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#0E1A2B]/95 backdrop-blur-sm border-b border-[#2A3F5F]" : "bg-transparent"}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 border border-[#C5933A] flex items-center justify-center">
            <span className="text-[#C5933A] text-xs font-semibold">E</span>
          </div>
          <span className="text-[#F9F7F3] text-sm font-medium tracking-wider">EBRB</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-[#9CA3AF] hover:text-[#F9F7F3] text-sm transition-colors">How It Works</a>
          <a href="#about" className="text-[#9CA3AF] hover:text-[#F9F7F3] text-sm transition-colors">About</a>
          <a href="#pricing" className="text-[#9CA3AF] hover:text-[#F9F7F3] text-sm transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-4">
          {!loading && (
            user ? (
              <Link
                href="/profile"
                className="flex items-center gap-2 text-[#9CA3AF] hover:text-[#F9F7F3] text-sm transition-colors"
              >
                <User size={14} />
                <span className="hidden sm:inline">{user.email?.split("@")[0]}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-[#9CA3AF] hover:text-[#F9F7F3] text-sm transition-colors"
              >
                Sign in
              </Link>
            )
          )}
          <Link href="/intake" className="bg-[#C5933A] hover:bg-[#A67C2E] text-[#0E1A2B] text-sm font-semibold px-5 py-2 transition-colors">
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(#C5933A 1px, transparent 1px), linear-gradient(90deg, #C5933A 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#C5933A]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-16">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-4xl">
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-8">
            <div className="h-px w-8 bg-[#C5933A]" />
            <span className="text-[#C5933A] text-xs font-medium tracking-[0.2em] uppercase">Built by a recruiter. Powered by AI.</span>
          </motion.div>
          <motion.h1 variants={fadeUp} className="font-display text-5xl md:text-7xl font-light text-[#F9F7F3] leading-[1.05] mb-6">
            We decode the job.<br />
            <em className="text-[#C5933A] not-italic">Then we reposition</em><br />
            you for it.
          </motion.h1>
          <motion.p variants={fadeUp} className="text-[#9CA3AF] text-lg md:text-xl font-light leading-relaxed mb-10 max-w-2xl">
            Most resume tools format what you give them. This one figures out what the employer actually needs — then rebuilds your story around that. Built on 30 years of executive recruiting expertise.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link href="/intake" className="group flex items-center gap-2 bg-[#C5933A] hover:bg-[#A67C2E] text-[#0E1A2B] font-semibold px-8 py-4 text-sm tracking-wide transition-all duration-200">
              Upload Resume + Job Posting
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#how-it-works" className="flex items-center gap-2 text-[#9CA3AF] hover:text-[#F9F7F3] text-sm transition-colors">
              See how it works <ChevronDown size={14} />
            </a>
          </motion.div>
          <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-6 mt-12 pt-12 border-t border-[#2A3F5F]">
            {["30 years in executive search", "Director through C-Suite", "~93% ATS match rate", "Submission-ready in minutes"].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <CheckCircle size={13} className="text-[#C5933A]" />
                <span className="text-[#9CA3AF] text-xs">{s}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <ChevronDown size={18} className="text-[#2A3F5F]" />
        </motion.div>
      </motion.div>
    </section>
  );
}

function TransformationDemo() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [active, setActive] = useState(0);
  const examples = [
    { label: "Summary rewrite", before: "Experienced epidemiologist with 22 years in public health, skilled in surveillance and data analysis.", insight: "Employer needs supervisory field leadership — not a senior individual contributor. Reframe around mandate and authority.", after: "Senior infectious disease epidemiologist with 22 years directing surveillance systems and cross-jurisdictional disease prevention strategy. Trusted advisor with demonstrated success supervising teams and translating complex data into systems-level action." },
    { label: "Experience bullet", before: "Responsible for COVID-19 case investigation and contact tracing coordination.", insight: "Missing scale, statewide authority, and data quality leadership — all high-weight signals in the posting.", after: "Directed statewide COVID-19 case investigation guidance during peak pandemic response for a population of 5.6M, strengthening data quality, training systems, and cross-agency coordination." },
    { label: "Role framing", before: "MDH Epidemiologist (2021–Present)\n• Conducted outbreak investigations\n• Provided consultation to partners\n• Supervised students", insight: "Task list. No mandate, no scope indicators, no supervisory authority stated explicitly. Reads as individual contributor.", after: "Mandate: Provide field epidemiology leadership for 12 rural counties and three tribal nations, directing surveillance systems and advancing statewide disease prevention strategy aligned with IDEPC priorities." },
  ];
  return (
    <section ref={ref} className="py-24 bg-[#0A1421]">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div initial="hidden" animate={inView ? "visible" : "hidden"} variants={stagger} className="text-center mb-16">
          <motion.div variants={fadeUp} className="flex justify-center mb-4"><div className="gold-rule" /></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-4xl md:text-5xl font-light text-[#F9F7F3] mb-4">What actually changes</motion.h2>
          <motion.p variants={fadeUp} className="text-[#9CA3AF] max-w-xl mx-auto">Not formatting — repositioning. See exactly what happens when we analyze a job posting against your experience.</motion.p>
        </motion.div>
        <div className="flex gap-1 mb-8 border-b border-[#2A3F5F]">
          {examples.map((e, i) => (
            <button key={i} onClick={() => setActive(i)} className={`px-5 py-3 text-sm transition-colors ${active === i ? "text-[#C5933A] border-b-2 border-[#C5933A] -mb-px" : "text-[#6B7280] hover:text-[#9CA3AF]"}`}>
              {e.label}
            </button>
          ))}
        </div>
        <motion.div key={active} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="grid md:grid-cols-3 gap-px bg-[#2A3F5F]">
          <div className="bg-[#152338] p-6">
            <div className="text-xs text-[#6B7280] font-medium tracking-wider uppercase mb-3">Before</div>
            <p className="text-[#9CA3AF] text-sm leading-relaxed whitespace-pre-line">{examples[active].before}</p>
          </div>
          <div className="bg-[#0E1A2B] p-6 relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C5933A] to-transparent" />
            <div className="flex items-center gap-2 mb-3"><Target size={12} className="text-[#C5933A]" /><div className="text-xs text-[#C5933A] font-medium tracking-wider uppercase">What we decoded</div></div>
            <p className="text-[#E8D5A3] text-sm leading-relaxed italic">{examples[active].insight}</p>
          </div>
          <div className="bg-[#152338] p-6 relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#3D8B5E] to-transparent" />
            <div className="flex items-center gap-2 mb-3"><CheckCircle size={12} className="text-[#3D8B5E]" /><div className="text-xs text-[#3D8B5E] font-medium tracking-wider uppercase">After</div></div>
            <p className="text-[#F9F7F3] text-sm leading-relaxed whitespace-pre-line">{examples[active].after}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const steps = [
    { num: "01", icon: <FileText size={20} className="text-[#C5933A]" />, title: "Upload resume + job posting", desc: "Paste or upload both. PDF, Word, or plain text.", time: "~2 min" },
    { num: "02", icon: <Target size={20} className="text-[#C5933A]" />, title: "We decode the employer's mandate", desc: "The actual problem they're hiring to solve, capability signals, and ATS language patterns.", time: "~60 sec" },
    { num: "03", icon: <BarChart3 size={20} className="text-[#C5933A]" />, title: "We reposition your story", desc: "Value proposition rewrite, Key Accomplishments, Mandate+Outcomes formatting, supervisory elevation.", time: "~90 sec" },
    { num: "04", icon: <Zap size={20} className="text-[#C5933A]" />, title: "Download submission-ready materials", desc: "Resume + cover letter + ATS report. PDF, Word, or Google Doc.", time: "Instant" },
  ];
  return (
    <section id="how-it-works" ref={ref} className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div initial="hidden" animate={inView ? "visible" : "hidden"} variants={stagger} className="mb-16">
          <motion.div variants={fadeUp} className="mb-4"><div className="gold-rule" /></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-4xl md:text-5xl font-light text-[#F9F7F3] mb-4">How it works</motion.h2>
          <motion.p variants={fadeUp} className="text-[#9CA3AF] max-w-xl">Four steps. One session. Submission-ready by the time you finish your coffee.</motion.p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-[#2A3F5F]">
          {steps.map((step, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1 }} className="bg-[#0E1A2B] p-8 relative group hover:bg-[#152338] transition-colors">
              <div className="text-[#2A3F5F] text-5xl font-display font-light absolute top-6 right-6 group-hover:text-[#C5933A]/20 transition-colors">{step.num}</div>
              <div className="mb-4">{step.icon}</div>
              <h3 className="text-[#F9F7F3] font-medium text-base mb-3 leading-snug pr-8">{step.title}</h3>
              <p className="text-[#6B7280] text-sm leading-relaxed mb-6">{step.desc}</p>
              <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#C5933A]" /><span className="text-[#C5933A] text-xs">{step.time}</span></div>
            </motion.div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <div className="h-px flex-1 bg-[#2A3F5F]" />
          <span className="text-[#6B7280] text-sm">Total: ~5 minutes</span>
        </div>
      </div>
    </section>
  );
}

function ATSSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const keywords = [
    { label: "Supervise", status: "gap" }, { label: "Field Services Unit", status: "gap" },
    { label: "Outbreak investigations", status: "strong" }, { label: "Surveillance systems", status: "strong" },
    { label: "Continuous Improvement", status: "gap" }, { label: "IDEPC", status: "strong" },
    { label: "Tribal public health", status: "strong" }, { label: "Emergency response", status: "partial" },
    { label: "Direct staff", status: "partial" }, { label: "Statewide coordination", status: "partial" },
  ];
  return (
    <section ref={ref} className="py-24 bg-[#0A1421]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div initial="hidden" animate={inView ? "visible" : "hidden"} variants={stagger}>
            <motion.div variants={fadeUp} className="mb-4"><div className="gold-rule" /></motion.div>
            <motion.h2 variants={fadeUp} className="font-display text-4xl md:text-5xl font-light text-[#F9F7F3] mb-6">ATS alignment,<br /><em className="text-[#C5933A] not-italic">not stuffing</em></motion.h2>
            <motion.p variants={fadeUp} className="text-[#9CA3AF] leading-relaxed mb-8">Structured alignment check across core functions, supervisory signals, and technical competencies — with exact micro-adjustments and before/after match estimates.</motion.p>
            <motion.div variants={fadeUp} className="flex items-center gap-8">
              <div><div className="text-4xl font-display font-light text-[#6B7280]">82%</div><div className="text-[#6B7280] text-xs mt-1">Before</div></div>
              <div className="h-px flex-1 bg-[#2A3F5F] relative overflow-hidden"><div className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#6B7280] to-[#C5933A]" style={{ width: "75%" }} /></div>
              <div><div className="text-4xl font-display font-light text-[#3D8B5E]">93%</div><div className="text-[#6B7280] text-xs mt-1">After</div></div>
            </motion.div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 24 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6, delay: 0.2 }} className="bg-[#152338] border border-[#2A3F5F] p-6">
            <div className="text-xs text-[#6B7280] font-medium tracking-wider uppercase mb-4">Keyword Alignment Report</div>
            <div className="flex flex-wrap gap-2">
              {keywords.map((k) => (
                <span key={k.label} className={`text-xs px-3 py-1.5 border ${k.status === "strong" ? "border-[#3D8B5E]/40 text-[#3D8B5E] bg-[#3D8B5E]/10" : k.status === "partial" ? "border-[#C5933A]/40 text-[#C5933A] bg-[#C5933A]/10" : "border-[#4A5568]/40 text-[#6B7280] bg-[#2A3F5F]/30"}`}>
                  {k.status === "strong" ? "✓ " : k.status === "partial" ? "⚠ " : "✗ "}{k.label}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-6 pt-4 border-t border-[#2A3F5F]">
              {[{ color: "bg-[#3D8B5E]", label: "Strong" }, { color: "bg-[#C5933A]", label: "Partial" }, { color: "bg-[#4A5568]", label: "Gap (easy fix)" }].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5"><div className={`w-2 h-2 ${l.color}`} /><span className="text-[#6B7280] text-xs">{l.label}</span></div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function AboutJohn() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <section id="about" ref={ref} className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div initial="hidden" animate={inView ? "visible" : "hidden"} variants={stagger}>
            <motion.div variants={fadeUp} className="mb-4"><div className="gold-rule" /></motion.div>
            <motion.p variants={fadeUp} className="font-display text-2xl md:text-3xl font-light text-[#F9F7F3] leading-relaxed mb-8 italic">
              &ldquo;Most resume tools were built by people who&rsquo;ve never hired anyone. This one was built by someone who has &mdash; for 30 years.&rdquo;
            </motion.p>
            <motion.div variants={fadeUp} className="space-y-4 text-[#9CA3AF] leading-relaxed text-sm">
              <p>John Nilon has spent three decades at the center of executive talent. Starting at Kenexa in 1994 — when it was a 40-person firm — then placing CEOs and their direct reports at VC-backed startups at Howard Fischer Associates, before founding J.N. Solutions in 2001.</p>
              <p>For 25 years, J.N. Solutions has been engaged to identify transformational leaders — Director through C-Suite — at companies ranging from emerging startups to Fortune 500s, across pharmaceutical, biotech, and clinical research.</p>
              <p>He built EBRB because he kept seeing the same problem: exceptional candidates underselling themselves with the wrong language for the wrong audience.</p>
            </motion.div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 24 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6, delay: 0.2 }} className="space-y-3">
            {[
              { num: "30+", label: "Years in executive search & talent acquisition" },
              { num: "25 yrs", label: "Leading J.N. Solutions" },
              { num: "Dir → C-Suite", label: "Level of executives placed" },
              { num: "F500 → Startups", label: "Range of client organizations" },
            ].map((c, i) => (
              <div key={i} className="flex items-center gap-6 bg-[#152338] border border-[#2A3F5F] p-5 hover:border-[#C5933A]/30 transition-colors">
                <div className="font-display text-2xl font-light text-[#C5933A] min-w-[110px]">{c.num}</div>
                <div className="text-[#9CA3AF] text-sm">{c.label}</div>
              </div>
            ))}
            <div className="bg-[#0E1A2B] border border-[#C5933A]/20 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={14} className="text-[#C5933A]" />
                <span className="text-[#C5933A] text-xs font-medium tracking-wider uppercase">The Insider Advantage</span>
              </div>
              <p className="text-[#9CA3AF] text-sm leading-relaxed">John knows what makes a hiring manager stop scrolling — because he was that hiring manager. Every recommendation in this tool comes from what he has seen actually work across thousands of executive searches.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const plans = [
    { name: "Preview", price: "Free", desc: "See the full analysis. Understand exactly what's holding your resume back.", features: ["Full mandate decoding", "Strategic positioning analysis", "Draft resume preview", "ATS gap overview"], cta: "Start Free", highlight: false },
    { name: "Executive", price: "$59", desc: "Everything for a single application. Download and submit today.", features: ["Full tailored resume", "Cover letter (2 tones)", "ATS keyword report", "PDF + Word + Google Doc", "Redline comparison"], cta: "Get Started", highlight: true },
    { name: "Unlimited", price: "$99/mo", desc: "Every application. Version history and priority processing.", features: ["Unlimited applications", "All Executive features", "Version history", "Priority AI processing", "Early access to features"], cta: "Subscribe", highlight: false },
  ];
  return (
    <section id="pricing" ref={ref} className="py-24 bg-[#0A1421]">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div initial="hidden" animate={inView ? "visible" : "hidden"} variants={stagger} className="text-center mb-16">
          <motion.div variants={fadeUp} className="flex justify-center mb-4"><div className="gold-rule" /></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-4xl md:text-5xl font-light text-[#F9F7F3] mb-4">Simple pricing</motion.h2>
          <motion.p variants={fadeUp} className="text-[#9CA3AF]">See the output before you pay. Every time.</motion.p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-px bg-[#2A3F5F]">
          {plans.map((plan, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1 }} className={`p-8 flex flex-col relative ${plan.highlight ? "bg-[#152338]" : "bg-[#0A1421]"}`}>
              {plan.highlight && <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C5933A] to-transparent" />}
              <div className="text-xs text-[#6B7280] font-medium tracking-wider uppercase mb-4">{plan.name}</div>
              <div className="font-display text-4xl font-light text-[#F9F7F3] mb-2">{plan.price}</div>
              <p className="text-[#6B7280] text-sm leading-relaxed mb-8">{plan.desc}</p>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle size={13} className="text-[#C5933A] mt-0.5 flex-shrink-0" />
                    <span className="text-[#9CA3AF] text-sm">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/intake" className={`text-center py-3 text-sm font-semibold transition-colors block ${plan.highlight ? "bg-[#C5933A] hover:bg-[#A67C2E] text-[#0E1A2B]" : "border border-[#2A3F5F] hover:border-[#C5933A]/40 text-[#9CA3AF] hover:text-[#F9F7F3]"}`}>
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(#C5933A 1px, transparent 1px), linear-gradient(90deg, #C5933A 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#C5933A]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <div className="flex justify-center mb-6"><div className="gold-rule" /></div>
        <h2 className="font-display text-4xl md:text-6xl font-light text-[#F9F7F3] mb-6 leading-tight">
          Your career deserves more<br />
          <em className="text-[#C5933A] not-italic">than a template.</em>
        </h2>
        <p className="text-[#9CA3AF] text-lg mb-10 leading-relaxed">Upload your resume and the job posting. We&rsquo;ll show you exactly what&rsquo;s missing — and fix it.</p>
        <Link href="/intake" className="group inline-flex items-center gap-3 bg-[#C5933A] hover:bg-[#A67C2E] text-[#0E1A2B] font-semibold px-10 py-5 text-base transition-all duration-200">
          Begin for Free
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </Link>
        <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
          <div className="flex items-center gap-2 text-[#6B7280] text-xs"><Lock size={11} /><span>Documents never stored without consent</span></div>
          <div className="flex items-center gap-2 text-[#6B7280] text-xs"><Shield size={11} /><span>Built by a recruiter. Not a template company.</span></div>
        </div>
      </div>
    </section>
  );
}
export default function Home() {
  return (
    <main>
      <Nav />
      <Hero />
      <TransformationDemo />
      <HowItWorks />
      <ATSSection />
      <AboutJohn />
      <Pricing />
      <FinalCTA />
    </main>
  );
}
