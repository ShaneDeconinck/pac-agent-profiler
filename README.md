# PAC Agent Profiler

> **v0.1** — Early release. Agentically engineered with [Claude Code](https://claude.ai/claude-code) & Opus 4.6.

Interactive 3D risk assessment tool built for [trustedagentic.ai](https://trustedagentic.ai). Part of the [PAC Framework](https://shanedeconinck.be/framework) — helping enterprise decision-makers answer: **may this agent do this thing, and what do I need to build for that?**

[![Netlify Status](https://api.netlify.com/api/v1/badges/ace5cddb-fa49-461b-8e4e-861aa3a6b8c2/deploy-status)](https://app.netlify.com/projects/pac-agent-profiler/deploys)

## The Model

Six dimensions, one actionable answer.

| Dimension | What it is | Who controls it |
|-----------|-----------|----------------|
| **Blast Radius** (B1–B5) | What can the agent touch? | Fixed by the use case |
| **Reliability** (70–99.9%) | How often does it get it right? | Engineering investment |
| **Business Value** (V1–V4) | Why does it matter? | Strategic priority |
| **Governance Thresholds** | Where is the line drawn? | Policy / compliance |
| **Infrastructure** (I1–I5) | What guardrails are in place? | Platform engineering |
| **Autonomy** (A1–A5) | How much independence does it earn? | Determined by the above |

Infrastructure acts as a binary gate per autonomy level — no infrastructure, no entry.

> Risk is not a property of the tool. It's a property of how and where you use it.

## Quick Start

```bash
npm install
npm run dev
```

Open [localhost:5173](http://localhost:5173).

## How It Works

1. **Add use cases** — name, blast radius, reliability estimate, business value
2. **Base layer** shows Blast Radius × Reliability with governance threshold lines
3. **Toggle Autonomy** to see how high each case can go (3D view)
4. **Toggle Thresholds** to see the governance surface staircase
5. **Configure** thresholds via the gear icon to adjust governance parameters
6. **Share** your assessment via URL or export as JSON

Green dot = cleared to operate. Red dot = gap to close.

## Features

- Interactive 3D visualization (Three.js) with 2D/3D layer toggling
- 14 pre-loaded example cases with reliability sourced from frontier model benchmarks
- Custom case builder with infrastructure controls per autonomy level
- Configurable governance thresholds
- Shareable URLs and JSON import/export
- Responsive layout with mobile notice for small screens
- Help modal and step-by-step how-to guide

## Tech Stack

- [Vite](https://vitejs.dev) + vanilla JS
- [Three.js](https://threejs.org) for 3D visualization
- [Alpine.js](https://alpinejs.dev) for reactive UI
- [Tailwind CSS v4](https://tailwindcss.com) for styling

## Deploy

```bash
npm run build
```

Outputs to `dist/`. Configured for Netlify (`netlify.toml` included) — connect your GitHub repo and every push auto-deploys.

## License

[MIT](LICENSE) — © Shane Deconinck · [trustedagentic.ai](https://trustedagentic.ai)
