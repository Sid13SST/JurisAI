import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';

/* ------------------------------------------------------------------
   THE LEDGER — editorial legal-brief landing (Concept A prototype).
   Parchment + brass, Instrument Serif display, Newsreader body,
   §-numbered sections, hairline rules, wax-seal verdict stamp.
   No WebGL. Prototype route: /ledger
------------------------------------------------------------------- */

export const LandingLedger: React.FC = () => {
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const capabilities = [
    {
      mark: '01',
      title: 'Contract Risk Scoring',
      desc: 'Compliance algorithms return a numeric exposure index, 0–100, mapped to four severity bands.',
    },
    {
      mark: '02',
      title: 'Clause Extraction Engine',
      desc: 'Specialised models isolate indemnities, service levels and liability caps from commercial agreements.',
    },
    {
      mark: '03',
      title: 'Executive Summarization',
      desc: 'Fifty-page drafts condensed to a bulleted brief, every material exposure surfaced in plain language.',
    },
    {
      mark: '04',
      title: 'AI Legal Copilot',
      desc: 'A counsel-side assistant that reads alongside you and answers questions against the instrument itself.',
    },
    {
      mark: '05',
      title: 'Contract Comparison',
      desc: 'Side-by-side reconciliation of indemnities, notice periods and limitation clauses across versions.',
    },
    {
      mark: '06',
      title: 'Visual Risk Mapping',
      desc: 'Analytical charts and compliance trends rendered as a legible record of contract performance.',
    },
  ];

  const proceedings = [
    { step: 'I', title: 'Ingest', desc: 'Lodge a PDF or DOCX instrument. Parsing structures the paragraphs and identifies the document type.' },
    { step: 'II', title: 'Examine', desc: 'Engines read each paragraph to extract standard covenants and verify the presence of key clauses.' },
    { step: 'III', title: 'Adjudicate', desc: 'Models cross-reference legal boundaries, flagging uncapped liabilities and conspicuous omissions.' },
    { step: 'IV', title: 'Report', desc: 'A structured brief issues: highlighted risks, an executive digest, and counsel on the record.' },
  ];

  const endorsements = [
    {
      name: 'Elizabeth Ross',
      role: 'General Counsel, NovaLaw',
      comment:
        'What took our legal-ops team three days is now audited and flagged for critical risk in ten minutes. The clause extraction accuracy is, frankly, unmatched.',
    },
    {
      name: 'Marcus Sterling',
      role: 'VP Procurement, LexCorp',
      comment:
        'We verify liability limits and indemnities the moment a vendor agreement arrives. Nothing enters the pipeline out of policy.',
    },
    {
      name: 'Sophia Chen',
      role: 'Head of Legal Operations, Apex',
      comment:
        'The comparison and risk instruments are now load-bearing in our workflow. Polished, legible, and quietly authoritative.',
    },
  ];

  const schedule = [
    {
      name: 'Starter Pilot',
      desc: 'For testing the parsing workflow.',
      price: 0,
      features: ['5 instruments / month', 'Standard clause extraction', 'Risk scoring', 'Basic PDF report', 'Single seat'],
      cta: 'Open Account',
      featured: false,
    },
    {
      name: 'Professional',
      desc: 'For growing legal operations.',
      price: billingPeriod === 'monthly' ? 199 : 149,
      features: ['Unlimited instruments', 'Critical risk flags', 'AI copilot', 'Full comparison', '5 seats + shared vault', 'Priority channel'],
      cta: 'Retain JurisAI',
      featured: true,
    },
    {
      name: 'Enterprise',
      desc: 'For strict compliance regimes.',
      price: 'By Treaty' as const,
      features: ['Everything in Professional', 'Fine-tuned models', 'SOC 2 Type II hosting', 'API integration', 'Unlimited seats', 'Dedicated advisor'],
      cta: 'Request Terms',
      featured: false,
    },
  ];

  return (
    <div className="ledger-paper min-h-screen font-serif-body text-[#1A1714] selection:bg-[#B08A3E]/25">
      {/* Masthead */}
      <header className="sticky top-0 z-50 border-b border-[#C9BDA4] bg-[#F4EEE1]/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <div className="flex items-baseline gap-3">
            <Logo showText={true} iconSize={26} />
            <span className="hidden font-serif-body text-[11px] uppercase tracking-[0.3em] text-[#6E6557] sm:block">
              Counsel of Record
            </span>
          </div>
          <nav className="hidden items-center gap-8 font-serif-body text-[13px] tracking-wide text-[#1A1714] md:flex">
            <a href="#capabilities" className="transition-colors hover:text-[#8C6A28]">Capabilities</a>
            <a href="#proceedings" className="transition-colors hover:text-[#8C6A28]">Proceedings</a>
            <a href="#schedule" className="transition-colors hover:text-[#8C6A28]">Fee Schedule</a>
          </nav>
          <Link
            to="/dashboard"
            className="border border-[#8C6A28] px-4 py-1.5 font-serif-body text-[12px] uppercase tracking-[0.18em] text-[#8C6A28] transition-colors hover:bg-[#8C6A28] hover:text-[#F4EEE1]"
          >
            Enter Chambers
          </Link>
        </div>
      </header>

      {/* Hero — front page */}
      <section className="mx-auto max-w-5xl px-5 pb-16 pt-14">
        <div className="flex items-center justify-between font-serif-body text-[11px] uppercase tracking-[0.3em] text-[#6E6557]">
          <span>Vol. I · Commercial Legal Taxonomy</span>
          <span>Est. MMXXVI</span>
        </div>
        <hr className="ledger-rule-double my-4" />

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="ledger-index text-[12px] uppercase">§ The Brief</p>
            <h1 className="mt-3 font-serif-display text-6xl leading-[0.95] tracking-tight text-[#1A1714] sm:text-7xl">
              Understand contract risk
              <span className="italic text-[#8C6A28]"> before it becomes a problem.</span>
            </h1>
            <p className="ledger-dropcap mt-6 max-w-2xl text-[18px] leading-relaxed text-[#3A342C]">
              JurisAI reads commercial instruments the way counsel does — clause by clause — then issues a
              numeric exposure index, an extracted record of covenants, and an executive brief. Every risk is
              surfaced and placed on the record before a signature is ever applied.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-[#1A1714] px-6 py-3 font-serif-body text-[13px] uppercase tracking-[0.18em] text-[#F4EEE1] transition-opacity hover:opacity-90"
              >
                File a Contract
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="border-b border-[#8C6A28] pb-0.5 font-serif-body text-[14px] italic text-[#8C6A28] transition-colors hover:text-[#1A1714]"
              >
                Read the specimen brief →
              </button>
            </div>
          </div>

          {/* Verdict seal */}
          <div className="lg:col-span-4">
            <div className="border border-[#C9BDA4] bg-[#EDE5D4]/60 p-6 text-center">
              <p className="font-serif-body text-[11px] uppercase tracking-[0.3em] text-[#6E6557]">Risk Verdict</p>
              <div className="mx-auto mt-5 flex h-32 w-32 items-center justify-center rounded-full text-[#F4EEE1] ledger-seal">
                <div>
                  <div className="font-serif-display text-5xl leading-none">82</div>
                  <div className="font-serif-body text-[9px] uppercase tracking-[0.25em]">/ 100</div>
                </div>
              </div>
              <p className="mt-5 font-serif-display text-2xl italic text-[#8A2B22]">Critical Band</p>
              <hr className="ledger-rule my-4" />
              <dl className="space-y-2 text-left font-serif-body text-[13px] text-[#3A342C]">
                <div className="flex justify-between"><dt className="text-[#6E6557]">Clauses examined</dt><dd className="tabular-nums">1,842</dd></div>
                <div className="flex justify-between"><dt className="text-[#6E6557]">Yield</dt><dd className="tabular-nums">99.8%</dd></div>
                <div className="flex justify-between"><dt className="text-[#6E6557]">Time to brief</dt><dd className="tabular-nums">10 min</dd></div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities — numbered ledger */}
      <section id="capabilities" className="border-t border-[#C9BDA4] bg-[#EDE5D4]/40">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <div className="flex items-end justify-between">
            <h2 className="font-serif-display text-4xl tracking-tight text-[#1A1714]">The Faculties</h2>
            <span className="ledger-index text-[12px] uppercase">§ 01 — Index of Capabilities</span>
          </div>
          <hr className="ledger-rule mt-4" />

          <div className="grid grid-cols-1 md:grid-cols-2">
            {capabilities.map((c, i) => (
              <article
                key={c.mark}
                className={`group flex gap-5 border-[#C9BDA4] py-7 ${
                  i % 2 === 0 ? 'md:border-r md:pr-8' : 'md:pl-8'
                } ${i < capabilities.length - (capabilities.length % 2 === 0 ? 2 : 1) ? 'border-b' : ''}`}
              >
                <span className="font-serif-display text-5xl leading-none text-[#C9BDA4] transition-colors group-hover:text-[#B08A3E]">
                  {c.mark}
                </span>
                <div>
                  <h3 className="font-serif-display text-2xl text-[#1A1714]">{c.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-[#3A342C]">{c.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Proceedings */}
      <section id="proceedings" className="mx-auto max-w-5xl px-5 py-16">
        <div className="flex items-end justify-between">
          <h2 className="font-serif-display text-4xl tracking-tight text-[#1A1714]">Order of Proceedings</h2>
          <span className="ledger-index text-[12px] uppercase">§ 02 — Audit Pipeline</span>
        </div>
        <hr className="ledger-rule mt-4" />

        <div className="mt-8 grid grid-cols-1 gap-px bg-[#C9BDA4] sm:grid-cols-2 lg:grid-cols-4">
          {proceedings.map((p) => (
            <div key={p.step} className="bg-[#F4EEE1] p-6">
              <div className="font-serif-display text-3xl italic text-[#8C6A28]">{p.step}.</div>
              <h3 className="mt-3 font-serif-display text-2xl text-[#1A1714]">{p.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#3A342C]">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Endorsements */}
      <section className="border-y border-[#C9BDA4] bg-[#EDE5D4]/40">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <div className="flex items-end justify-between">
            <h2 className="font-serif-display text-4xl tracking-tight text-[#1A1714]">On the Record</h2>
            <span className="ledger-index text-[12px] uppercase">§ 03 — Endorsements</span>
          </div>
          <hr className="ledger-rule mt-4" />

          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
            {endorsements.map((e) => (
              <figure key={e.name} className="flex flex-col">
                <span className="font-serif-display text-5xl leading-none text-[#B08A3E]">“</span>
                <blockquote className="-mt-3 text-[16px] italic leading-relaxed text-[#3A342C]">
                  {e.comment}
                </blockquote>
                <figcaption className="mt-4 border-t border-[#C9BDA4] pt-3">
                  <div className="font-serif-display text-xl text-[#1A1714]">{e.name}</div>
                  <div className="font-serif-body text-[12px] uppercase tracking-[0.18em] text-[#6E6557]">{e.role}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Fee schedule */}
      <section id="schedule" className="mx-auto max-w-5xl px-5 py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-serif-display text-4xl tracking-tight text-[#1A1714]">Fee Schedule</h2>
          <div className="flex items-center gap-3 font-serif-body text-[13px]">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={billingPeriod === 'monthly' ? 'text-[#1A1714] underline decoration-[#B08A3E] underline-offset-4' : 'text-[#6E6557]'}
            >
              Monthly
            </button>
            <span className="text-[#C9BDA4]">/</span>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={billingPeriod === 'yearly' ? 'text-[#1A1714] underline decoration-[#B08A3E] underline-offset-4' : 'text-[#6E6557]'}
            >
              Yearly <span className="italic text-[#8A2B22]">(−25%)</span>
            </button>
          </div>
        </div>
        <hr className="ledger-rule mt-4" />

        <div className="mt-8 grid grid-cols-1 gap-px bg-[#C9BDA4] lg:grid-cols-3">
          {schedule.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col justify-between bg-[#F4EEE1] p-8 ${plan.featured ? 'bg-[#EDE5D4]' : ''}`}
            >
              {plan.featured && (
                <span className="absolute right-0 top-0 bg-[#8C6A28] px-3 py-1 font-serif-body text-[10px] uppercase tracking-[0.2em] text-[#F4EEE1]">
                  Retained
                </span>
              )}
              <div>
                <h3 className="font-serif-display text-3xl text-[#1A1714]">{plan.name}</h3>
                <p className="mt-1 font-serif-body text-[13px] italic text-[#6E6557]">{plan.desc}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-serif-display text-5xl text-[#1A1714]">
                    {typeof plan.price === 'number' ? `$${plan.price}` : plan.price}
                  </span>
                  {typeof plan.price === 'number' && (
                    <span className="font-serif-body text-[13px] text-[#6E6557]">/ mo</span>
                  )}
                </div>
                <hr className="ledger-rule my-5" />
                <ul className="space-y-2.5 font-serif-body text-[14px] text-[#3A342C]">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-[#B08A3E]">§</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className={`mt-8 w-full py-3 font-serif-body text-[13px] uppercase tracking-[0.18em] transition-all ${
                  plan.featured
                    ? 'bg-[#1A1714] text-[#F4EEE1] hover:opacity-90'
                    : 'border border-[#8C6A28] text-[#8C6A28] hover:bg-[#8C6A28] hover:text-[#F4EEE1]'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Colophon footer */}
      <footer className="border-t border-[#C9BDA4] bg-[#EDE5D4]/40">
        <div className="mx-auto max-w-5xl px-5 py-12">
          <hr className="ledger-rule-double mb-6" />
          <div className="flex flex-col items-center gap-4 text-center">
            <Logo showText={true} iconSize={30} />
            <p className="max-w-md font-serif-body text-[14px] italic leading-relaxed text-[#6E6557]">
              JurisAI — forensic legal intelligence for the modern contract pipeline. Every exposure surfaced
              before signature.
            </p>
            <div className="flex gap-6 font-serif-body text-[12px] uppercase tracking-[0.18em] text-[#6E6557]">
              <a href="#" className="hover:text-[#8C6A28]">Privacy</a>
              <a href="#" className="hover:text-[#8C6A28]">Terms</a>
              <a href="#" className="hover:text-[#8C6A28]">SOC 2</a>
            </div>
            <p className="mt-2 font-serif-body text-[11px] uppercase tracking-[0.3em] text-[#A89A7E]">
              Commercial Legal Taxonomy · Vol. I · &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingLedger;
