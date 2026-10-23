# ShelfWise — Devpost Submission

## Project Title
**ShelfWise: Clinical-Grade Skincare Intelligence**

## Tagline
*AI-powered skin analysis meets clinical inventory auditing to deliver a personalized, conflict-free skincare regimen — saving you money and preventing ingredient clashes.*

## The Problem
1 in 3 people use skincare products that counteract each other. The average household owns 12+ skincare products but uses only 60% optimally. Existing solutions either suggest generic routines or require expensive dermatologist consultations.

## The Solution
ShelfWise combines two powerful signals:

1. **YouCam V2.1 SD Skin Analysis API** — 16-concern clinical-grade skin analysis (wrinkles, pores, texture, acne, pigmentation, moisture, redness, dark circles, and more)
2. **Bio-Inventory Engine** — Detects biometric conflicts (scan-to-shelf), chemical conflicts (shelf-to-shelf), and redundancy gaps in your existing products

The result: a personalized audit that identifies what to keep, what to pause, and what to add — all backed by INCI ingredient parsing and cost-per-day calculations.

## Demo
**Live demo**: `npx next dev` → http://localhost:3000

1. Click "Try Verified Demo Scan" to see a real YouCam V2.1 analysis of all 16 concerns
2. Navigate through 5 views: Landing → Results → Shelf Audit → Product Detail → Verdict
3. Switch between 3 judge personas: Clinical, Apothecary, Minimalist
4. Toggle currency (INR/USD) and set your budget
5. View your AM/PM routine and cost savings

## Technical Implementation

### Phase 1: YouCam V2.1 API Integration
- Implemented full TypeScript type system for the 16 SD skin concerns
- Integrated the 16-credit SD endpoint with proper error handling
- Built CLI checks that validate API health and credit balance before scanning
- Downloaded all 16 concern mask PNGs for visualization
- Ephemeral processing — no selfies are stored or persisted

### Phase 2: Next.js Architecture
- Next.js 15 App Router with TypeScript
- Tailwind CSS v4 with Turbopack
- CSS variable-based design system (no external UI dependencies)
- Custom theme provider and toast system

### Phase 3: Bio-Inventory Engine
- **Scan-to-Shelf Detection**: Maps 16 skin concerns to conflicting ingredients (e.g., retinoids for wrinkles, niacinamide for pores)
- **Shelf-to-Shelf Detection**: 20+ incompatible ingredient pairs (retinoid + AHA/BHA, vitamin C + benzoyl peroxide, etc.)
- **Redundancy Detection**: Identifies duplicate functional roles and calculates money saved
- 80+ active ingredient database with role classification
- AM/PM routine scheduling based on product compatibility

### Phase 4: Clinical Apothecary UI
- Design tokens: `--ca-amber`, `--ca-cream`, `--ca-slate`, `--ca-medical`, `--ca-accent-blue/red/green`
- Typography: Cormorant Garamond (headings), Inter (body), Fira Code (monospace)
- Three judge personas with distinct editorial voices:
  - **Clinical**: Evidence-based, pH-balanced, irritation risk scoring
  - **Apothecary**: Synergy-focused, botanical layering philosophy
  - **Minimalist**: Efficiency-focused, 4-product routine optimization
- Currency toggle (INR/USD) with cost-per-day calculations

### Phase 5: UX Hardening
- Strict-mode Playwright selectors tested across all 5 views
- Interactive state management for shelf add/remove
- AM/PM routine visualization
- Accessibility compliant (ARIA labels, semantic headings)

### Phase 6: Testing & Documentation
- **Vitest**: 16 unit tests covering the engine (score directionality, conflict detection, redundancy, budget enforcement, currency toggle, Buy Nothing verdict)
- **Playwright**: 7 E2E tests covering the full 5-view navigation flow, persona switching, currency toggling, and theme switching

## Built With
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS v4
- **AI**: Perfect Corp YouCam V2.1 SD Skin Analysis API (16 concerns, 16 credits)
- **Testing**: Vitest (16 tests), Playwright (7 E2E tests)
- **Design**: Clinical Apothecary aesthetic with custom design system
- **Fonts**: Cormorant Garamond, Inter, Fira Code

## Key Features

### 🎯 16-Concern Skin Analysis
Wrinkles, pores, texture, acne, oiliness, radiance, eye bags, age spots, dark circles, drooping eyelids, firmness, moisture, redness, tear trough depth, and skin type — all scored and visualized with mask overlays.

### 🔬 Conflict Detection
- **Biometric conflicts**: Products that worsen your specific skin concerns
- **Chemical conflicts**: Ingredients that neutralize each other (20+ incompatible pairs)
- **Redundancy alerts**: Duplicate roles you're paying for twice

### 💰 Cost Optimization
- Currency toggle (INR/USD) with live budget enforcement
- Cost-per-day calculations per product
- "Buy Nothing" verdict mode — your shelf may already be perfect

### 🧴 Clinical Apothecary Aesthetic
Zero external UI dependencies. Custom CSS variables, three editorial judge voices, and a design system inspired by apothecary medicine labels and clinical dossiers.

## Challenges I Ran Into
- **Turbopack CSS resolution**: `@import` with `@/` paths doesn't work in Turbopack — inlined all design tokens into globals.css
- **Tailwind v4 + Turbopack**: `@apply` not supported in v4 — replaced with plain CSS classes
- **Font loading**: Font names with spaces need string literal imports from `next/font/google`
- **YouCam Buffer types**: API client needed `file as unknown as BodyInit` casting for Node 18+ compatibility
- **Playwright strict mode**: `locator("text=X")` matches multiple elements — refined selectors to use `h1.apothecary-title.first()` and `nth(1)`

## Accomplishments I'm Proud Of
- Built a complete bio-inventory engine with 3-layer conflict detection
- Implemented all 16 YouCam concern types with proper TypeScript schemas
- Created 16 passing vitest unit tests covering complex business logic
- Built 7 passing Playwright E2E tests covering the full user flow
- Designed a zero-dependency UI system with Clinical Apothecary aesthetic

## Screenshots
![Landing Page](https://localhost:3000/screenshot-landing.png)
![Scan Results](https://localhost:3000/screenshot-results.png)
![Shelf Audit](https://localhost:3000/screenshot-audit.png)
![Final Verdict](https://localhost:3000/screenshot-verdict.png)

## Live Demo
```bash
npm install
npm run dev
# Visit http://localhost:3000
```

## Links
- **Repository**: [ShelfWise GitHub](https://github.com/shelfwise/skin-analysis)
- **YouCam API**: [Perfect Corp](https://www.perfectcorp.com/developer)
- **Hackathon**: Perfect Corp YouCam API Skin AI & eCommerce VTO

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
