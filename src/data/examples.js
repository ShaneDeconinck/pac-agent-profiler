// Infra: 1=Open, 2=Logged, 3=Verified, 4=Authorized, 5=Contained
const NONE = { 1: false, 2: false, 3: false, 4: false, 5: false }
const LOGGED = { 1: true, 2: true, 3: false, 4: false, 5: false }
const VERIFIED = { 1: true, 2: true, 3: true, 4: false, 5: false }
const AUTHORIZED = { 1: true, 2: true, 3: true, 4: true, 5: false }
const CONTAINED = { 1: true, 2: true, 3: true, 4: true, 5: true }

// Curated examples spanning low → high blast radius agent use cases
// Reliability calibrated from 2026 frontier model benchmarks (Opus 4.6, GPT-5.2, Gemini 3.1)
export const EXAMPLE_CASES = [
  // B1 — Contained: spread across autonomy levels to demonstrate L1–L5
  { name: 'Meeting summarizer', impact: 1, reliability: 88.0, bizValue: 1, spawns: false, infra: { ...LOGGED }, id: 'ex-1',
    source: 'Transcription WER 2.6% clean / 22% noisy (AssemblyAI 2026); summarization compounds errors' },
  { name: 'Internal knowledge search', impact: 1, reliability: 92.0, bizValue: 1, spawns: false, infra: { ...AUTHORIZED }, id: 'ex-0',
    source: 'RAG hallucination 5-15% on unstructured docs (Vectara 2024); curated KB near 98% (PMC 2024)' },
  { name: 'Log analysis & alerting', impact: 1, reliability: 97.0, bizValue: 2, spawns: false, infra: { ...CONTAINED }, id: 'ex-2',
    source: 'ML false-positive rate ~4.35% (PMC 2025); deep learning lowers FPR further' },
  { name: 'Code formatting agent', impact: 1, reliability: 99.0, bizValue: 1, spawns: false, infra: { ...CONTAINED }, id: 'ex-2b',
    source: 'Deterministic formatters (Prettier, Black) near-perfect; AI lint autofix 99%+ on style rules' },

  // B2 — Recoverable
  { name: 'Code review bot', impact: 2, reliability: 80.8, bizValue: 2, spawns: false, infra: { ...LOGGED }, id: 'ex-3',
    source: 'SWE-bench Verified: Opus 4.6 80.8%, GPT-5.2 80.0%, Gemini 3.1 80.6% (Feb 2026)' },
  { name: 'Ticket triage & routing', impact: 2, reliability: 95.0, bizValue: 2, spawns: false, infra: { ...VERIFIED }, id: 'ex-4',
    source: 'AI routing accuracy >90% (Turabit 2024); categorization >85% (MSPbots 2025)' },
  { name: 'CI/CD deploy assistant', impact: 2, reliability: 89.7, bizValue: 3, spawns: false, infra: { ...VERIFIED }, id: 'ex-5',
    source: 'Build failure prediction F1 0.89 XGBoost (Theses Journal 2025); deployment success 90-95% (DevOps.com)' },

  // B3 — Exposed (public-facing, hard to recall)
  { name: 'Customer support chatbot', impact: 3, reliability: 92.0, bizValue: 3, spawns: false, infra: { ...VERIFIED }, id: 'ex-6',
    source: 'Opus 4.6 \u03C4\u00B2-bench 99.3% telecom (Anthropic 2026); generative AI 92% intent accuracy (Sobot 2026)' },
  { name: 'Email drafting assistant', impact: 3, reliability: 91.0, bizValue: 2, spawns: false, infra: { ...LOGGED }, id: 'ex-7',
    source: 'GPT-5.2 hallucination rate 6.2% (OpenAI 2026); tone/style strong, factual claims riskier' },
  { name: 'Sales outreach agent', impact: 3, reliability: 85.0, bizValue: 3, spawns: true, infra: { ...VERIFIED }, id: 'ex-8',
    source: 'AI personalization +142% response (Salesforge 2025); multi-step agent pass@8 ~6% (arxiv 2602.16666)' },

  // B4 — Regulated (compliance/legal consequences)
  { name: 'HR onboarding assistant', impact: 4, reliability: 88.0, bizValue: 2, spawns: false, infra: { ...AUTHORIZED }, id: 'ex-9',
    source: '72% HR AI adoption (Hirebee 2025); avg data breach cost $4.88M (IBM 2024)' },
  { name: 'Patient intake processor', impact: 4, reliability: 83.0, bizValue: 3, spawns: false, infra: { ...AUTHORIZED }, id: 'ex-10',
    source: 'AI diagnostic accuracy 76-90% (DemandSage 2025); ICD coding exact match <50% broad tests (Sully AI)' },

  // B5 — Irreversible (money, contracts, safety)
  { name: 'Expense report processor', impact: 5, reliability: 95.0, bizValue: 2, spawns: false, infra: { ...AUTHORIZED }, id: 'ex-11',
    source: 'Receipt extraction high-90s% (Parseur 2026); 90% fewer manual errors with AI (ReceitPal 2024)' },
  { name: 'Invoice payment agent', impact: 5, reliability: 97.0, bizValue: 4, spawns: false, infra: { ...CONTAINED }, id: 'ex-12',
    source: 'ABBYY 99.5% field accuracy (Parseur 2026); GPT-4o+OCR 97% end-to-end (BusinessWareTech 2025)' },
]
