// Light → dark blue scale for autonomy levels (distinct from green/red dot status)
export const AUT_COLORS = [
  null,
  { hex: 0x93c5fd, css: '#93c5fd' }, // L1 blue-300
  { hex: 0x60a5fa, css: '#60a5fa' }, // L2 blue-400
  { hex: 0x3b82f6, css: '#3b82f6' }, // L3 blue-500
  { hex: 0x2563eb, css: '#2563eb' }, // L4 blue-600
  { hex: 0x1d4ed8, css: '#1d4ed8' }, // L5 blue-700
]

export const AUT = [
  { l: 1, name: 'Suggestion', loop: 'human-in', inf: 'Open', infD: 'Bare model output' },
  { l: 2, name: 'Approve', loop: 'human-in', inf: 'Logged', infD: 'Audit trail — trace what it did' },
  { l: 3, name: 'Oversight', loop: 'human-on', inf: 'Verified', infD: '+ Identity & provenance' },
  { l: 4, name: 'Delegated', loop: 'human-over', inf: 'Authorized', infD: '+ Positive authority grants' },
  { l: 5, name: 'Autonomous', loop: 'no loop', inf: 'Contained', infD: '+ Sandbox & isolation' },
]

export const BIZ = [
  { l: 1, name: 'Incremental', d: 'Small efficiency gain' },
  { l: 2, name: 'Operational', d: 'Meaningful workflow improvement' },
  { l: 3, name: 'Strategic', d: 'Competitive advantage' },
  { l: 4, name: 'Transformative', d: 'Fundamentally changes the business' },
]

export const IMP = [
  { l: 1, name: 'Contained', d: 'Errors caught before impact, easily reversed', ex: 'Knowledge search, log analysis, code suggestions' },
  { l: 2, name: 'Recoverable', d: 'Small group affected, correctable with effort', ex: 'Ticket routing, CI/CD deploys, internal reports' },
  { l: 3, name: 'Exposed', d: 'Public-facing, hard to fully recall', ex: 'Support chat, outbound email, sales outreach' },
  { l: 4, name: 'Regulated', d: 'Compliance or legal consequences', ex: 'HR data, patient records, GDPR scope' },
  { l: 5, name: 'Irreversible', d: 'Can\'t undo — money, contracts, safety', ex: 'Payments, contracts, trading, legal filings' },
]
