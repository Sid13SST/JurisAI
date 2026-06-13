import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  ArrowRight, 
  Play, 
  Check, 
  Star,
  FileCheck2,
  BrainCircuit,
  Eye,
  Activity,
  UserCheck2
} from 'lucide-react';
import { Logo } from '../components/ui/Logo';

export const Landing: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const navigate = useNavigate();

  const features = [
    {
      title: "Contract Risk Scoring",
      desc: "Instant compliance algorithms outputting a numeric risk score (0-100) mapped to four severity bands.",
      icon: <Activity className="text-[#EF4444]" />
    },
    {
      title: "Clause Extraction Engine",
      desc: "Deep neural networks parse commercial agreements to isolate indemnities, SLAs, and liability caps.",
      icon: <BrainCircuit className="text-[#06B6D4]" />
    },
    {
      title: "Executive Summarization",
      desc: "Automatically condenses 50-page complex legal drafts into bulleted summaries highlighting exposures.",
      icon: <FileCheck2 className="text-[#7C3AED]" />
    },
    {
      title: "AI Legal Copilot",
      desc: "Interactive mock sidebar assistant lets operations chat directly with their contract files in real-time.",
      icon: <Sparkles className="text-[#4F46E5]" />
    },
    {
      title: "Contract Comparison",
      desc: "Side-by-side comparative grids highlighting differences in indemnities, notice times, and liability limits.",
      icon: <UserCheck2 className="text-emerald-400" />
    },
    {
      title: "Visual Risk Mapping",
      desc: "Rich analytical scatter charts and compliance trends outlining contract performance parameters.",
      icon: <Eye className="text-amber-400" />
    }
  ];

  const steps = [
    {
      step: "01",
      title: "Ingest Contract",
      desc: "Upload PDF or DOCX agreement files. Automated parsing structures paragraphs and identifies document types."
    },
    {
      step: "02",
      title: "Deep AI Analysis",
      desc: "JurisAI engines scan individual paragraphs to extract standard commercial covenants and verify key clauses."
    },
    {
      step: "03",
      title: "Risk & Flags Scan",
      desc: "Proprietary models cross-reference legal boundaries, highlighting unlimited liabilities and missing clauses."
    },
    {
      step: "04",
      title: "Review Summaries",
      desc: "Access structured reports, review highlighted risks, download executive digests, or consult the AI assistant."
    }
  ];

  const testimonials = [
    {
      name: "Elizabeth Ross",
      role: "General Counsel at NovaLaw",
      comment: "JurisAI transformed our contract review cycles. What used to take our legal ops team 3 days is now audited and flagged for critical risks in 10 minutes. The clause extraction accuracy is unmatched.",
      rating: 5
    },
    {
      name: "Marcus Sterling",
      role: "VP Procurement at LexCorp",
      comment: "In procurement, speed is everything. JurisAI allows us to verify liability limits and indemnities instantly, ensuring all incoming logistics and vendor agreements adhere strictly to corporate policy.",
      rating: 5
    },
    {
      name: "Sophia Chen",
      role: "Head of Legal Operations at Apex",
      comment: "The circular risk dashboards and side-by-side contract comparison tools have become critical components of our workflow. The visual experience is highly polished and intuitive.",
      rating: 5
    }
  ];

  const pricing = [
    {
      name: "Starter Pilot",
      desc: "Perfect for testing AI contract parsing workflows.",
      price: billingPeriod === 'monthly' ? 0 : 0,
      features: [
        "Up to 5 contract uploads / month",
        "Standard Clause Extraction",
        "Risk Scoring (Low to High)",
        "Basic PDF Report Generation",
        "Single User Seat"
      ],
      cta: "Activate Free Trial",
      popular: false
    },
    {
      name: "Professional Plan",
      desc: "Advanced legal intelligence for growing operations.",
      price: billingPeriod === 'monthly' ? 199 : 149,
      features: [
        "Unlimited contract uploads",
        "Advanced Critical Risk Flags",
        "Interactive AI Chat Assistant",
        "Full Side-by-Side Comparison",
        "5 User Seats + Shared Vault",
        "Priority Support Channel"
      ],
      cta: "Get Started Now",
      popular: true
    },
    {
      name: "Enterprise Premium",
      desc: "Tailored models and strict compliance controls.",
      price: "Custom",
      features: [
        "Everything in Professional",
        "Custom Fine-Tuned AI Models",
        "SOC 2 Type II Secure Hosting",
        "API Integration Hooks",
        "Unlimited Seats",
        "Dedicated Legal Tech Advisor"
      ],
      cta: "Schedule Consultation",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-slate-100 flex flex-col">
      
      {/* Simple Landing Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0A0A0F]/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl flex h-16 items-center justify-between px-4 sm:px-6">
          <Logo showText={true} iconSize={32} />
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">Process Flow</a>
            <a href="#pricing" className="hover:text-white transition-colors">Licensing</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              to="/dashboard" 
              className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Sign In
            </Link>
            <Link 
              to="/dashboard" 
              className="rounded-full bg-gradient-to-r from-primary to-secondary px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-primary/20 hover:opacity-95 transition-all duration-300"
            >
              Enter Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute left-1/4 top-1/4 -z-10 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 -z-10 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />

        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
            
            {/* Left Hero Text */}
            <div className="lg:col-span-5 space-y-6 text-left">
              
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-2xs font-semibold text-indigo-400">
                <Sparkles size={12} className="animate-pulse" />
                <span>Next-Generation Legal Intelligence</span>
              </div>

              <h1 className="font-heading font-extrabold text-4xl sm:text-5xl leading-tight text-white tracking-tight">
                Understand Contract Risk <br />
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Before It Becomes a Problem
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-lg">
                AI-powered legal intelligence for automated clause extraction, circular risk grading, and instant bulleted executive summaries.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all duration-300"
                >
                  <span>Start Free Analysis</span>
                  <ArrowRight size={16} />
                </button>
                
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <Play size={14} className="fill-current text-indigo-400" />
                  <span>Watch System Demo</span>
                </button>
              </div>

            </div>

            {/* Right Hero Visual (Animated Dashboard Mockup Illustration) */}
            <div className="lg:col-span-7">
              <motion.div 
                className="relative rounded-2xl border border-white/10 bg-[#111827]/40 p-5 backdrop-blur-md shadow-2xl animate-float"
              >
                
                {/* Visual Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-red-500/80" />
                    <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                    <span className="h-3 w-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="rounded-lg bg-white/5 px-3 py-1 font-mono text-3xs text-slate-400 border border-white/5">
                    jurisai_platform_core_audit.py
                  </span>
                </div>

                {/* Visual Dashboard Screen Mock */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  
                  {/* Metric Box */}
                  <div className="rounded-xl border border-white/5 bg-white/3 p-3">
                    <span className="block text-3xs text-slate-500 uppercase tracking-wider font-bold">Analysis Yield</span>
                    <span className="mt-1 block text-lg font-extrabold text-white">99.8%</span>
                    <span className="text-3xs text-emerald-400 font-semibold flex items-center gap-0.5">
                      +4.2% <Sparkles size={8} />
                    </span>
                  </div>

                  {/* Metric Box */}
                  <div className="rounded-xl border border-[#EF4444]/20 bg-[#EF4444]/5 p-3">
                    <span className="block text-3xs text-[#EF4444]/80 uppercase tracking-wider font-bold">Risk Flags</span>
                    <span className="mt-1 block text-lg font-extrabold text-[#EF4444]">82 / 100</span>
                    <span className="text-3xs text-[#EF4444] font-semibold">Critical Band</span>
                  </div>

                  {/* Metric Box */}
                  <div className="rounded-xl border border-white/5 bg-white/3 p-3">
                    <span className="block text-3xs text-slate-500 uppercase tracking-wider font-bold">Clauses Scanned</span>
                    <span className="mt-1 block text-lg font-extrabold text-white">1,842</span>
                    <span className="text-3xs text-slate-400 font-medium">SOC2 Compliant</span>
                  </div>

                  {/* Simulated Extracted Clause Cards */}
                  <div className="col-span-3 rounded-xl border border-white/5 bg-[#111827]/80 p-3 space-y-2 text-left">
                    
                    <div className="flex items-center justify-between text-2xs font-semibold border-b border-white/5 pb-2">
                      <span className="text-slate-200">Extracted Covenants</span>
                      <span className="text-[#06B6D4] flex items-center gap-0.5">
                        <Sparkles size={10} /> Active Models
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-white/2 p-2 border border-white/5">
                      <div className="space-y-0.5">
                        <p className="text-2xs font-bold text-slate-200">Limitation of Liability</p>
                        <p className="text-3xs text-slate-500">Uncapped liability for service disruption</p>
                      </div>
                      <span className="rounded bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 text-3xs font-bold uppercase text-red-400">
                        Critical
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-white/2 p-2 border border-white/5">
                      <div className="space-y-0.5">
                        <p className="text-2xs font-bold text-slate-200">SLA Outages Guarantee</p>
                        <p className="text-3xs text-slate-500">99.0% uptime availability</p>
                      </div>
                      <span className="rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-3xs font-bold uppercase text-amber-400">
                        Warning
                      </span>
                    </div>

                  </div>

                </div>

              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="border-y border-white/5 bg-white/1 py-8 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-center text-3xs font-bold uppercase tracking-wider text-slate-500">
            Trusted by the World's Leading Corporate Teams
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-8 sm:gap-16 opacity-50 grayscale hover:grayscale-0 hover:opacity-80 transition-all duration-300">
            
            <div className="flex items-center gap-1">
              <span className="font-heading font-extrabold text-sm tracking-tight text-white">LEGALTECH</span>
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            </div>

            <div className="flex items-center gap-1">
              <span className="font-heading font-extrabold text-sm tracking-tight text-white">NOVALAW</span>
              <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
            </div>

            <div className="flex items-center gap-1">
              <span className="font-heading font-extrabold text-sm tracking-tight text-white">APEX LEGAL</span>
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            </div>

            <div className="flex items-center gap-1">
              <span className="font-heading font-extrabold text-sm tracking-tight text-white">LEXCORP</span>
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
            </div>

            <div className="flex items-center gap-1">
              <span className="font-heading font-extrabold text-sm tracking-tight text-white">FINTRUST</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </div>

          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl space-y-12">
          
          <div className="text-center max-w-xl mx-auto space-y-3">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-2xs font-bold uppercase tracking-wider text-primary">
              Core Capabilities
            </span>
            <h2 className="font-heading font-extrabold text-3xl text-white tracking-tight">
              Enterprise-Grade AI Architecture
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              JurisAI uses state-of-the-art specialized models trained specifically on commercial legal taxonomy to identify contract exposures.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feat, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.2 }}
                className="group rounded-2xl border border-white/5 bg-[#111827]/40 p-6 hover:border-primary/20 hover:bg-[#111827]/70 transition-all duration-300 cursor-pointer"
              >
                <span className="inline-block rounded-xl bg-white/5 p-3 group-hover:bg-primary/10 group-hover:text-white transition-all duration-300">
                  {feat.icon}
                </span>
                <h3 className="mt-4 font-heading font-bold text-sm text-slate-200 group-hover:text-white transition-colors">{feat.title}</h3>
                <p className="mt-2 text-2xs text-slate-400 leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* How It Works Timeline Section */}
      <section id="how-it-works" className="py-20 bg-white/1 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl space-y-12">
          
          <div className="text-center max-w-xl mx-auto space-y-3">
            <span className="rounded-full bg-secondary/10 px-3 py-1 text-2xs font-bold uppercase tracking-wider text-secondary">
              Audit Pipeline
            </span>
            <h2 className="font-heading font-extrabold text-3xl text-white tracking-tight">
              How JurisAI Works
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              From raw ingestion to structured executive compliance summaries — our visual legal pipeline operates in seconds.
            </p>
          </div>

          <div className="relative mx-auto max-w-xl space-y-8 before:absolute before:bottom-0 before:left-3 before:top-2 before:w-0.5 before:bg-white/5">
            {steps.map((st, idx) => (
              <div key={idx} className="relative pl-10 flex gap-4 items-start">
                {/* Glowing step marker */}
                <div className="absolute left-0 flex h-6.5 w-6.5 items-center justify-center rounded-full border border-primary/40 bg-[#0A0A0F] font-mono text-3xs font-extrabold text-indigo-400 ring-4 ring-[#0A0A0F] z-10">
                  {st.step}
                </div>
                
                <div className="rounded-xl border border-white/5 bg-[#111827]/20 p-5 hover:border-white/10 transition-colors w-full text-left">
                  <h3 className="font-heading font-bold text-xs text-slate-200">{st.title}</h3>
                  <p className="mt-1.5 text-2xs text-slate-400 leading-relaxed">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl space-y-12">
          
          <div className="text-center max-w-xl mx-auto space-y-3">
            <span className="rounded-full bg-accent/10 px-3 py-1 text-2xs font-bold uppercase tracking-wider text-cyan-400">
              Testimonials
            </span>
            <h2 className="font-heading font-extrabold text-3xl text-white tracking-tight">
              Validated by General Counsels
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((t, idx) => (
              <div 
                key={idx}
                className="rounded-2xl border border-white/5 bg-[#111827]/30 p-6 text-left flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Rating Stars */}
                  <div className="flex gap-1 text-amber-400">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} size={12} className="fill-current" />
                    ))}
                  </div>
                  
                  <p className="text-2xs text-slate-300 leading-relaxed italic">
                    "{t.comment}"
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-3 border-t border-white/5 pt-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-accent/50 to-primary/50 text-white font-semibold text-xs">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-200">{t.name}</h4>
                    <p className="text-3xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white/1 px-4 sm:px-6 border-t border-white/5">
        <div className="mx-auto max-w-7xl space-y-12">
          
          <div className="text-center max-w-xl mx-auto space-y-3">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-2xs font-bold uppercase tracking-wider text-primary">
              Pricing Options
            </span>
            <h2 className="font-heading font-extrabold text-3xl text-white tracking-tight">
              Flexible Plans for Every Team Size
            </h2>
            <p className="text-xs text-slate-400">
              Start with a trial sandbox and scale up as contract volumes expand.
            </p>

            {/* Toggle Billing Period */}
            <div className="flex items-center justify-center gap-3 pt-4">
              <span className={`text-2xs font-semibold ${billingPeriod === 'monthly' ? 'text-white' : 'text-slate-500'}`}>Monthly</span>
              <button 
                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
                className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-white/10 transition-colors duration-200 ease-in-out focus:outline-none"
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-indigo-500 shadow ring-0 transition duration-200 ease-in-out ${
                  billingPeriod === 'yearly' ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
              <span className={`text-2xs font-semibold ${billingPeriod === 'yearly' ? 'text-white' : 'text-slate-500'}`}>
                Yearly <strong className="text-emerald-400 text-3xs font-bold uppercase bg-emerald-500/10 px-1 py-0.5 rounded ml-1">Save 25%</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pricing.map((plan, idx) => (
              <div 
                key={idx}
                className={`relative rounded-2xl border bg-[#111827]/40 p-8 text-left flex flex-col justify-between transition-all duration-300 ${
                  plan.popular 
                    ? 'border-primary shadow-xl shadow-primary/10 scale-102 lg:scale-105 bg-[#111827]/60' 
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                {plan.popular && (
                  <span className="absolute right-4 top-4 rounded bg-primary px-2.5 py-0.5 text-3xs font-extrabold uppercase text-white tracking-wider">
                    Most Popular
                  </span>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="font-heading font-extrabold text-lg text-white">{plan.name}</h3>
                    <p className="mt-1 text-2xs text-slate-400">{plan.desc}</p>
                  </div>

                  <div className="flex items-baseline text-white">
                    <span className="text-3xl font-extrabold tracking-tight">
                      {typeof plan.price === 'number' ? `$${plan.price}` : plan.price}
                    </span>
                    {typeof plan.price === 'number' && (
                      <span className="ml-1 text-xs text-slate-500 font-semibold">/month</span>
                    )}
                  </div>

                  <ul className="space-y-3 border-t border-white/5 pt-6 text-xs text-slate-300">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2">
                        <Check size={14} className="text-indigo-400 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className={`w-full rounded-xl py-2.5 text-xs font-semibold text-center transition-all duration-300 ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/20 hover:opacity-95' 
                        : 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>

              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Footer Branding Links */}
      <footer className="border-t border-white/5 bg-[#08080E] py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-5 lg:gap-12 text-left">
            <div className="col-span-2 space-y-4">
              <Logo showText={true} iconSize={36} />
              <p className="max-w-xs text-xs text-slate-400 leading-relaxed">
                Understand contract risks instantly. JurisAI provides advanced legal intelligence workflows for modern contract pipelines.
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-200">Product</h4>
              <ul className="space-y-2 text-2xs text-slate-400">
                <li><Link to="/dashboard" className="hover:text-white transition-colors">Risk Scorer</Link></li>
                <li><Link to="/comparison" className="hover:text-white transition-colors">Compare Tool</Link></li>
                <li><Link to="/analytics" className="hover:text-white transition-colors">Compliance Board</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-200">Company</h4>
              <ul className="space-y-2 text-2xs text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Trust Center</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-200">Legal</h4>
              <ul className="space-y-2 text-2xs text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">SOC 2 Report</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center text-3xs text-slate-500 gap-4">
            <p>&copy; {new Date().getFullYear()} JurisAI Inc. All rights reserved. Visual demonstration prototype only.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-slate-300">Support Chat</a>
              <a href="#" className="hover:text-slate-300">Status Portal</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};
export default Landing;
