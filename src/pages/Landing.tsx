import React, { useState, Suspense, lazy } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  FileCheck2,
  BrainCircuit,
  Eye,
  Activity,
  UserCheck2,
  Sparkles,
  Star,
  Crosshair,
  ShieldAlert,
} from 'lucide-react';
import { Logo } from '../components/ui/Logo';

const RiskEngine3D = lazy(() =>
  import('../components/landing/RiskEngine3D').then((m) => ({ default: m.RiskEngine3D }))
);

export const Landing: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const navigate = useNavigate();

  const features = [
    {
      code: 'RSK-01',
      title: 'Contract Risk Scoring',
      desc: 'Instant compliance algorithms outputting a numeric risk score (0-100) mapped to four severity bands.',
      icon: <Activity size={18} />,
      band: 'critical',
    },
    {
      code: 'CLS-02',
      title: 'Clause Extraction Engine',
      desc: 'Deep neural networks parse commercial agreements to isolate indemnities, SLAs, and liability caps.',
      icon: <BrainCircuit size={18} />,
      band: 'clear',
    },
    {
      code: 'SUM-03',
      title: 'Executive Summarization',
      desc: 'Automatically condenses 50-page complex legal drafts into bulleted summaries highlighting exposures.',
      icon: <FileCheck2 size={18} />,
      band: 'clear',
    },
    {
      code: 'COP-04',
      title: 'AI Legal Copilot',
      desc: 'Interactive sidebar assistant lets operations chat directly with their contract files in real-time.',
      icon: <Sparkles size={18} />,
      band: 'clear',
    },
    {
      code: 'CMP-05',
      title: 'Contract Comparison',
      desc: 'Side-by-side comparative grids highlighting differences in indemnities, notice times, and liability limits.',
      icon: <UserCheck2 size={18} />,
      band: 'warning',
    },
    {
      code: 'MAP-06',
      title: 'Visual Risk Mapping',
      desc: 'Rich analytical scatter charts and compliance trends outlining contract performance parameters.',
      icon: <Eye size={18} />,
      band: 'warning',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Ingest Contract',
      desc: 'Upload PDF or DOCX agreement files. Automated parsing structures paragraphs and identifies document types.',
    },
    {
      step: '02',
      title: 'Deep AI Analysis',
      desc: 'JurisAI engines scan individual paragraphs to extract standard commercial covenants and verify key clauses.',
    },
    {
      step: '03',
      title: 'Risk & Flags Scan',
      desc: 'Proprietary models cross-reference legal boundaries, highlighting unlimited liabilities and missing clauses.',
    },
    {
      step: '04',
      title: 'Review Summaries',
      desc: 'Access structured reports, review highlighted risks, download executive digests, or consult the AI assistant.',
    },
  ];

  const testimonials = [
    {
      name: 'Elizabeth Ross',
      role: 'General Counsel at NovaLaw',
      comment:
        'JurisAI transformed our contract review cycles. What used to take our legal ops team 3 days is now audited and flagged for critical risks in 10 minutes. The clause extraction accuracy is unmatched.',
      rating: 5,
    },
    {
      name: 'Marcus Sterling',
      role: 'VP Procurement at LexCorp',
      comment:
        'In procurement, speed is everything. JurisAI allows us to verify liability limits and indemnities instantly, ensuring all incoming logistics and vendor agreements adhere strictly to corporate policy.',
      rating: 5,
    },
    {
      name: 'Sophia Chen',
      role: 'Head of Legal Operations at Apex',
      comment:
        'The circular risk dashboards and side-by-side contract comparison tools have become critical components of our workflow. The visual experience is highly polished and intuitive.',
      rating: 5,
    },
  ];

  const pricing = [
    {
      name: 'Starter Pilot',
      desc: 'Perfect for testing AI contract parsing workflows.',
      price: 0,
      features: [
        'Up to 5 contract uploads / month',
        'Standard Clause Extraction',
        'Risk Scoring (Low to High)',
        'Basic PDF Report Generation',
        'Single User Seat',
      ],
      cta: 'Activate Free Trial',
      popular: false,
    },
    {
      name: 'Professional Plan',
      desc: 'Advanced legal intelligence for growing operations.',
      price: billingPeriod === 'monthly' ? 199 : 149,
      features: [
        'Unlimited contract uploads',
        'Advanced Critical Risk Flags',
        'Interactive AI Chat Assistant',
        'Full Side-by-Side Comparison',
        '5 User Seats + Shared Vault',
        'Priority Support Channel',
      ],
      cta: 'Get Started Now',
      popular: true,
    },
    {
      name: 'Enterprise Premium',
      desc: 'Tailored models and strict compliance controls.',
      price: 'Custom' as const,
      features: [
        'Everything in Professional',
        'Custom Fine-Tuned AI Models',
        'SOC 2 Type II Secure Hosting',
        'API Integration Hooks',
        'Unlimited Seats',
        'Dedicated Legal Tech Advisor',
      ],
      cta: 'Schedule Consultation',
      popular: false,
    },
  ];

  const tickerItems = [
    'LIMITATION OF LIABILITY — UNCAPPED',
    'INDEMNIFICATION CLAUSE — DETECTED',
    'SLA UPTIME 99.0% — BELOW THRESHOLD',
    'TERMINATION FOR CONVENIENCE — MISSING',
    'GOVERNING LAW — DELAWARE',
    'AUTO-RENEWAL — 60 DAY NOTICE',
    'DATA PROCESSING ADDENDUM — GDPR',
  ];

  const bandColor = (band: string) =>
    band === 'critical'
      ? 'text-[#FF3B30] border-[#FF3B30]/30'
      : band === 'warning'
      ? 'text-[#F5A524] border-[#F5A524]/30'
      : 'text-forensic-mist border-forensic-line';

  return (
    <div className="min-h-screen bg-[#08080A] text-forensic-bone flex flex-col font-mono-tech selection:bg-[#FF3B30]/30">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-forensic-line bg-[#08080A]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo showText={true} iconSize={30} />
            <span className="hidden font-mono-tech text-[10px] uppercase tracking-[0.2em] text-forensic-mist sm:block">
              / risk engine
            </span>
          </div>

          <nav className="hidden items-center gap-7 font-mono-tech text-[11px] uppercase tracking-[0.15em] text-forensic-mist md:flex">
            <a href="#features" className="transition-colors hover:text-[#FF3B30]">
              Capabilities
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-[#FF3B30]">
              Pipeline
            </a>
            <a href="#pricing" className="transition-colors hover:text-[#FF3B30]">
              Licensing
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="hidden font-mono-tech text-[11px] uppercase tracking-[0.15em] text-forensic-mist transition-colors hover:text-forensic-bone sm:block"
            >
              Sign In
            </Link>
            <Link
              to="/dashboard"
              className="group inline-flex items-center gap-2 border border-[#FF3B30]/40 bg-[#FF3B30]/5 px-4 py-2 font-mono-tech text-[11px] uppercase tracking-[0.15em] text-[#FF3B30] transition-all hover:bg-[#FF3B30] hover:text-[#08080A]"
            >
              Enter Console
              <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-forensic-line">
        <div className="absolute inset-0 forensic-grid opacity-50" />
        <div className="pointer-events-none absolute -left-40 top-0 h-[480px] w-[480px] rounded-full bg-[#FF3B30]/10 blur-[120px]" />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:py-24">
          {/* Hero copy */}
          <div className="lg:col-span-5">
            <div className="mb-6 inline-flex items-center gap-2 border border-forensic-line bg-forensic-graphite px-3 py-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FF3B30]" />
              <span className="font-mono-tech text-[10px] uppercase tracking-[0.25em] text-forensic-mist">
                Live Forensic Analysis
              </span>
            </div>

            <h1 className="font-display text-4xl font-bold uppercase leading-[1.05] tracking-tight text-forensic-bone sm:text-5xl">
              Understand
              <br />
              Contract Risk
              <br />
              <span className="text-hazard-glow text-[#FF3B30]">Before It Bites.</span>
            </h1>

            <p className="mt-6 max-w-md font-mono-tech text-sm leading-relaxed text-forensic-bone">
              AI-powered legal intelligence. Automated clause extraction, numeric risk grading,
              and instant executive summaries — every exposure surfaced before signature.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="group inline-flex items-center gap-2 bg-[#FF3B30] px-6 py-3 font-mono-tech text-[12px] font-semibold uppercase tracking-[0.15em] text-[#08080A] transition-all hover:shadow-[0_0_30px_rgba(255,59,48,0.4)]"
              >
                <Crosshair size={15} />
                Run Analysis
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 border border-forensic-line bg-forensic-graphite px-6 py-3 font-mono-tech text-[12px] uppercase tracking-[0.15em] text-forensic-bone transition-colors hover:border-forensic-mist"
              >
                View Console
              </button>
            </div>

            {/* readout strip */}
            <div className="mt-10 grid max-w-md grid-cols-3 divide-x divide-forensic-line border border-forensic-line bg-forensic-graphite/60">
              {[
                { k: 'Yield', v: '99.8%' },
                { k: 'Avg Scan', v: '10min' },
                { k: 'Clauses', v: '1.8K' },
              ].map((m) => (
                <div key={m.k} className="px-4 py-3">
                  <div className="font-display text-xl font-bold text-forensic-bone">{m.v}</div>
                  <div className="font-mono-tech text-[9px] uppercase tracking-[0.2em] text-forensic-mist">
                    {m.k}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3D hero */}
          <div className="lg:col-span-7">
            <div className="relative h-[420px] w-full overflow-hidden border border-forensic-line bg-[#0A0A0C]/40 sm:h-[520px]">
              {/* HUD frame */}
              <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-2 font-mono-tech text-[9px] uppercase tracking-[0.2em] text-forensic-mist">
                <ShieldAlert size={12} className="text-[#FF3B30]" />
                contract_audit.scan
              </div>
              <div className="pointer-events-none absolute right-3 top-3 z-10 font-mono-tech text-[9px] uppercase tracking-[0.2em] text-[#FF3B30]">
                ● REC
              </div>
              <div className="pointer-events-none absolute bottom-3 left-3 z-10 font-mono-tech text-[9px] uppercase tracking-[0.2em] text-forensic-mist">
                risk_index: <span className="text-[#FF3B30]">82 / 100</span> · critical band
              </div>
              <div className="pointer-events-none absolute bottom-3 right-3 z-10 font-mono-tech text-[9px] uppercase tracking-[0.2em] text-forensic-mist">
                webgl · 60fps
              </div>
              <Suspense
                fallback={
                  <div className="flex h-full w-full items-center justify-center font-mono-tech text-[10px] uppercase tracking-[0.25em] text-forensic-mist">
                    <span className="animate-pulse">initializing scan…</span>
                  </div>
                }
              >
                <RiskEngine3D />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Clause ticker */}
        <div className="relative overflow-hidden border-t border-forensic-line bg-forensic-graphite py-2.5">
          <div className="flex w-max animate-[ticker-scroll_38s_linear_infinite] gap-10 whitespace-nowrap font-mono-tech text-[10px] uppercase tracking-[0.2em] text-forensic-mist">
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <span key={i} className="flex items-center gap-3">
                <span className="h-1 w-1 bg-[#FF3B30]" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-b border-forensic-line px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col gap-3 border-b border-forensic-line pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="font-mono-tech text-[10px] uppercase tracking-[0.3em] text-[#FF3B30]">
                § Core Capabilities
              </span>
              <h2 className="mt-2 font-display text-3xl font-bold uppercase tracking-tight text-forensic-bone">
                Enterprise-Grade AI Architecture
              </h2>
            </div>
            <p className="max-w-sm font-mono-tech text-[13px] leading-relaxed text-forensic-bone">
              State-of-the-art specialized models trained on commercial legal taxonomy to identify
              contract exposures with forensic precision.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-px border border-forensic-line bg-forensic-line sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feat, index) => (
              <motion.div
                key={index}
                whileHover={{ backgroundColor: 'rgba(19,19,23,1)' }}
                className="group relative bg-[#0A0A0C] p-6 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className={`inline-flex border bg-forensic-graphite p-2.5 ${bandColor(feat.band)}`}>
                    {feat.icon}
                  </span>
                  <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-forensic-mist">
                    {feat.code}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-base font-semibold uppercase tracking-wide text-forensic-bone">
                  {feat.title}
                </h3>
                <p className="mt-2 font-mono-tech text-[13px] leading-relaxed text-forensic-bone">
                  {feat.desc}
                </p>
                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#FF3B30] transition-all duration-300 group-hover:w-full" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-b border-forensic-line px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12">
            <span className="font-mono-tech text-[10px] uppercase tracking-[0.3em] text-[#FF3B30]">
              § Audit Pipeline
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold uppercase tracking-tight text-forensic-bone">
              From Ingest To Verdict
            </h2>
          </div>

          <motion.div
            className="grid grid-cols-1 gap-px border border-forensic-line bg-forensic-line md:grid-cols-4"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            transition={{ staggerChildren: 0.18 }}
          >
            {steps.map((st, idx) => (
              <motion.div
                key={idx}
                className="group relative overflow-hidden bg-[#0A0A0C] p-6"
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  show: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                {/* sweeping scan wash as each station activates */}
                <motion.span
                  className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#FF3B30]/10 to-transparent"
                  variants={{ hidden: { y: '-100%' }, show: { y: '100%' } }}
                  transition={{ duration: 0.9, ease: 'easeInOut', delay: idx * 0.18 }}
                />

                <div className="relative flex items-center gap-2">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FF3B30]" />
                  <span className="font-mono-tech text-[9px] uppercase tracking-[0.25em] text-forensic-mist">
                    Station {st.step}
                  </span>
                </div>

                <div className="relative font-display text-5xl font-bold text-forensic-line transition-colors duration-500 group-hover:text-[#FF3B30]/30">
                  {st.step}
                </div>

                {/* progress hairline fills left→right on reveal */}
                <motion.div
                  className="mt-4 h-px w-full origin-left bg-[#FF3B30]"
                  variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1 } }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: idx * 0.18 + 0.2 }}
                />

                <h3 className="relative mt-4 font-display text-sm font-semibold uppercase tracking-wide text-forensic-bone">
                  {st.title}
                </h3>
                <p className="relative mt-2 font-mono-tech text-[13px] leading-relaxed text-forensic-bone">
                  {st.desc}
                </p>

                {idx < steps.length - 1 && (
                  <motion.div
                    className="absolute -right-2 top-7 z-10 hidden md:block"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <ArrowRight size={14} className="text-[#FF3B30]" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-b border-forensic-line px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12">
            <span className="font-mono-tech text-[10px] uppercase tracking-[0.3em] text-[#FF3B30]">
              § Field Reports
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold uppercase tracking-tight text-forensic-bone">
              Validated By General Counsels
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="forensic-panel flex flex-col justify-between p-6"
              >
                <div>
                  <div className="flex gap-0.5 text-[#F5A524]">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} size={12} className="fill-current" />
                    ))}
                  </div>
                  <p className="mt-4 font-mono-tech text-[13px] leading-relaxed text-forensic-bone">
                    "{t.comment}"
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-3 border-t border-forensic-line pt-4">
                  <div className="flex h-9 w-9 items-center justify-center border border-[#FF3B30]/40 bg-[#FF3B30]/5 font-display text-xs font-bold text-[#FF3B30]">
                    {t.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="font-display text-xs font-semibold uppercase tracking-wide text-forensic-bone">
                      {t.name}
                    </h4>
                    <p className="font-mono-tech text-[10px] uppercase tracking-[0.15em] text-forensic-mist">
                      {t.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-b border-forensic-line px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-4 border-b border-forensic-line pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="font-mono-tech text-[10px] uppercase tracking-[0.3em] text-[#FF3B30]">
                § Licensing
              </span>
              <h2 className="mt-2 font-display text-3xl font-bold uppercase tracking-tight text-forensic-bone">
                Deploy At Any Scale
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`font-mono-tech text-[11px] uppercase tracking-[0.15em] ${
                  billingPeriod === 'monthly' ? 'text-forensic-bone' : 'text-forensic-mist'
                }`}
              >
                Monthly
              </span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
                className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer border border-forensic-line bg-forensic-graphite"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform bg-[#FF3B30] transition duration-200 ${
                    billingPeriod === 'yearly' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span
                className={`font-mono-tech text-[11px] uppercase tracking-[0.15em] ${
                  billingPeriod === 'yearly' ? 'text-forensic-bone' : 'text-forensic-mist'
                }`}
              >
                Yearly <span className="text-[#F5A524]">−25%</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-px border border-forensic-line bg-forensic-line lg:grid-cols-3">
            {pricing.map((plan, idx) => (
              <div
                key={idx}
                className={`relative flex flex-col justify-between bg-[#0A0A0C] p-8 ${
                  plan.popular ? 'bg-forensic-graphite' : ''
                }`}
              >
                {plan.popular && (
                  <span className="absolute right-0 top-0 bg-[#FF3B30] px-3 py-1 font-mono-tech text-[9px] font-bold uppercase tracking-[0.2em] text-[#08080A]">
                    Recommended
                  </span>
                )}
                <div>
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide text-forensic-bone">
                    {plan.name}
                  </h3>
                  <p className="mt-1 font-mono-tech text-[13px] leading-relaxed text-forensic-bone">
                    {plan.desc}
                  </p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-bold text-forensic-bone">
                      {typeof plan.price === 'number' ? `$${plan.price}` : plan.price}
                    </span>
                    {typeof plan.price === 'number' && (
                      <span className="font-mono-tech text-[11px] text-forensic-mist">/mo</span>
                    )}
                  </div>

                  <ul className="mt-6 space-y-3 border-t border-forensic-line pt-6">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2 font-mono-tech text-[12px] text-forensic-bone">
                        <Check size={13} className="mt-0.5 shrink-0 text-[#FF3B30]" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => navigate('/dashboard')}
                  className={`mt-8 w-full py-3 font-mono-tech text-[11px] font-semibold uppercase tracking-[0.15em] transition-all ${
                    plan.popular
                      ? 'bg-[#FF3B30] text-[#08080A] hover:shadow-[0_0_24px_rgba(255,59,48,0.35)]'
                      : 'border border-forensic-line bg-forensic-graphite text-forensic-bone hover:border-forensic-mist'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#08080A] px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-5 lg:gap-12">
            <div className="col-span-2 space-y-4">
              <Logo showText={true} iconSize={34} />
              <p className="max-w-xs font-mono-tech text-[13px] leading-relaxed text-forensic-bone">
                Forensic legal intelligence. Every exposure surfaced before signature.
              </p>
            </div>

            {[
              { h: 'Product', items: [['Risk Scorer', '/dashboard'], ['Compare Tool', '/comparison'], ['Compliance Board', '/analytics']] },
              { h: 'Company', items: [['About Us', '#'], ['Careers', '#'], ['Trust Center', '#']] },
              { h: 'Legal', items: [['Privacy Policy', '#'], ['Terms of Service', '#'], ['SOC 2 Report', '#']] },
            ].map((col) => (
              <div key={col.h} className="space-y-3">
                <h4 className="font-mono-tech text-[10px] font-semibold uppercase tracking-[0.2em] text-forensic-bone">
                  {col.h}
                </h4>
                <ul className="space-y-2 font-mono-tech text-[11px] text-forensic-mist">
                  {col.items.map(([label, href]) => (
                    <li key={label}>
                      <Link to={href} className="transition-colors hover:text-[#FF3B30]">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-forensic-line pt-6 font-mono-tech text-[10px] uppercase tracking-[0.15em] text-forensic-mist sm:flex-row">
            <p>&copy; {new Date().getFullYear()} JurisAI Inc. · Demonstration prototype.</p>
            <div className="flex gap-5">
              <a href="#" className="hover:text-forensic-bone">Support</a>
              <a href="#" className="hover:text-forensic-bone">Status</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
