# ShelfWise Frontend Handoff

> Complete frontend specification for rebuilding the ShelfWise UI independently, then connecting to the clinical skincare backend.
>
> **Framework:** Next.js 16.4.2, App Router, React 19, TypeScript
> **Styling:** Tailwind CSS v4 + custom CSS design system
> **Animation:** Framer Motion 12.x
> **Icons:** Lucide React
> **Fonts:** Aspekta (display/body), Roboto Mono / Fira Code (monospace)

---

## Table of Contents

1. [Type Definitions](#1-type-definitions)
2. [Component Contracts](#2-component-contracts)
3. [Styling System](#3-styling-system)
4. [Animation Specifications](#4-animation-specifications)
5. [Data Flow](#5-data-flow)
6. [Mock Data Structures](#6-mock-data-structures)
7. [Backend Integration Points](#7-backend-integration-points)

---

## 1. Type Definitions

All TypeScript interfaces and types used across the frontend. Files are referenced relative to `src/`.

### 1.1 YouCam Types — `src/types/youcam.ts`

```typescript
/** A single skin concern detected by YouCam AI */
interface YouCamConcern {
  type: string;       // e.g. "hd_wrinkle", "hd_pore", "skin_type"
  uiScore: number;    // 0-100 normalized for UI display
  rawScore: number;    // 0-100 raw API confidence
  maskUrls: string[];  // Array of mask overlay URLs (PNG alpha masks)
}

/** Detected skin type from YouCam API */
interface YouCamSkinType {
  type: string;      // "Normal", "Oily", "Dry", "Combination"
  region: string;    // "whole" | "T-zone" | "cheeks" | etc.
}

/** Full YouCam scan result from API */
interface YouCamScanResult {
  concerns: YouCamConcern[];
  skinType: YouCamSkinType;
  skinAge: number;
  overallScore: number;
  timestamp: string;  // ISO 8601
}

/** A single output item from YouCam (used in raw API responses) */
interface YouCamOutputItem {
  type: string;
  score: number;
  value: string;
  mask: string[];
}
```

### 1.2 Engine Types — `src/types/engine.ts`

```typescript
/** Skin type classification */
type SkinType = "oily" | "dry" | "combination" | "normal";

/** Sensitivity flag */
type Sensitivity = "sensitive" | "normal";

/** A product on the user's shelf */
interface Product {
  id: string;
  name: string;
  brand: string;
  priceInr: number;
  priceUsd: number;
  daysSupply: number;
  roles: ProductRole[];
  usageTime: UsageTime[];
  activeIngredients: ActiveIngredient[];
  inciList: string[];
  targetConcerns: string[];
  irritancyScore: number;     // 0-10
  description: string;
  suitableSkinTypes: SkinType[];
  incompatibleSkinTypes: SkinType[];
  textureVehicle: TextureVehicle;
  safeForSensitive: boolean;
}

/** Product extended with quantity for shelf context */
interface ShelfProduct extends Product {
  quantity: number;
}

/** Functional role a product plays in a routine */
type ProductRole =
  | "cleanser"
  | "hydrator"
  | "exfoliant_aha_bha"
  | "retinoid"
  | "antioxidant_vit_c"
  | "barrier_repair"
  | "azelaic_treatment"
  | "niacinamide_pore"
  | "eye_treatment"
  | "sunscreen_spf";

/** Time of day the product is used */
type UsageTime = "AM" | "PM" | "BOTH";

/** Texture vehicle category */
type TextureVehicle =
  | "gel"
  | "light_fluid"
  | "lotion"
  | "rich_cream"
  | "balm_oil"
  | "foam_cleanser"
  | "cream_cleanser"
  | "cream";

/** An active ingredient in a product */
interface ActiveIngredient {
  name: string;
  concentration: string;  // e.g. "10%", "2%"
  function: string;       // e.g. "exfoliation", "hydration"
  concernTargets: string[];
}

/** Currency preference */
type Currency = "inr" | "usd";

/** Routine preference for product ordering */
type RoutinePreference = "barrier_first" | "cost_optimized";

/** Constraints passed to the engine */
interface EngineConstraints {
  budgetInr: number;
  budgetUsd: number;
  avoidedIngredients: string[];
  routinePreference: RoutinePreference;
  currency: Currency;
  userSkinType: SkinType;
  userSensitive: Sensitivity;
}

/** A biometric conflict — scan concern vs. product contraindication */
interface BiometricConflict {
  productName: string;
  conflictType: string;   // e.g. "high_irritancy_for_sensitive_skin"
  severity: "low" | "medium" | "high";
  explanation: string;
    productId?: string;
}

/** A chemical conflict — incompatible actives within the same routine */
interface ChemicalConflict {
  type: string;              // e.g. "retinoid_plus_aha_bha"
  severity: "low" | "medium" | "high";
  explanation: string;
  products: string[];      // product names involved
}

/** A redundancy — multiple products covering the same role */
interface RedundancyAlert {
  role: ProductRole;
  products: string[];      // product names
  explanation: string;
}

/** A vehicle compatibility issue between layered products */
interface VehicleCompatibilityIssue {
  productA: string;
  productB: string;
  issue: string;
  explanation: string;
}

/** A gap recommendation — a product the routine is missing */
interface GapRecommendation {
  concern: string;
  recommendedProduct: Product | null;
  explanation: string;
  priority: "high" | "medium" | "low";
}

/** A step in the AM/PM routine */
interface RoutineStep {
  step: number;
  productId: string;
  productName: string;
  role: ProductRole;
}

/** AM/PM routine schedule */
interface RoutineSchedule {
  AM: RoutineStep[];
  PM: RoutineStep[];
}

/** Clinical verdict */
interface Verdict {
  type: "buy_nothing" | "targeted_addition";
  message: string;
  totalCostInr: number;
  totalCostUsd: number;
  moneySavedInr: number;
  moneySavedUsd: number;
}

/** Audit trail metrics */
interface AuditTrail {
  productsAnalyzed: number;
  conflictsFound: number;
  redundanciesFound: number;
  gapsIdentified: number;
}

/** Full engine output */
interface EngineOutput {
  scanSummary: {
    overallScore: number;
    skinAge: number;
    skinType: string;
    priorityConcerns: Array<{ concern: string; score: number }>;
  };
  biometricConflicts: BiometricConflict[];
  chemicalConflicts: ChemicalConflict[];
  redundancyAlerts: RedundancyAlert[];
  gapRecommendations: GapRecommendation[];
  vehicleCompatibilityIssues: VehicleCompatibilityIssue[];
  finalRoutine: RoutineSchedule;
  verdict: Verdict;
  auditTrail: AuditTrail;
}
```

### 1.3 Parsed Scan — `src/lib/mock-scan.ts`

```typescript
/** Normalized scan data after YouCam response is parsed */
interface ParsedScan {
  concerns: YouCamConcern[];
  skinType: YouCamSkinType;
  skinAge: number;
  overallScore: number;
}
```

### 1.4 Skin Profile Types — `src/components/shelf/SkinTypeSelector.tsx`

```typescript
type SkinType = "oily" | "dry" | "combination" | "normal";
type Sensitivity = "sensitive" | "normal";

interface SkinProfile {
  type: SkinType;
  sensitive: Sensitivity;
}
```

---

## 2. Component Contracts

All components are React 19 client components (`use client`). Props, state, and callbacks are documented per component.

### 2.1 Root Orchestrator — `src/app/page.tsx`

**Purpose:** Main page that manages the 5-view state machine and calls the clinical engine.

**State:**
```typescript
type View = "landing" | "results" | "audit" | "product" | "verdict";

const [currentView, setCurrentView] = useState<View>("landing");
const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
const [selectedImage, setSelectedImage] = useState<string | null>(null);
const [scanData, setScanData] = useState<ParsedScan | null>(null);
const [shelf, setShelf] = useState<ShelfProduct[]>([]);
const [constraints, setConstraints] = useState<EngineConstraints>({
  budgetInr: 5000,
  budgetUsd: 60,
  avoidedIngredients: [],
  routinePreference: "barrier_first",
  currency: "inr",
  userSkinType: "normal",
  userSensitive: "normal",
});
const [engineResult, setEngineResult] = useState<EngineOutput | null>(null);
const [skinProfile, setSkinProfile] = useState<SkinProfile>({ type: "normal", sensitive: "normal" });
```

**`useEffect`:** When `scanData` and `shelf` change, calls `runBioInventoryEngine(scanData, shelf, constraints)` and updates `engineResult`.

**Child Components Rendered:**
| View | Component | Props |
|------|-----------|-------|
| `landing` | `ScanLanding` | `{ onStart, scanData, setScanData, selectedImage, setSelectedImage }` |
| `results` | `ScanResultsView` | `{ scan, onAudit, onBack, skinProfile, onSkinProfileChange, selectedImage }` |
| `audit` | `ShelfAuditView` | `{ scan, engineResult, shelf, onShelfChange, onProductSelect, onVerdict, onBack, onHome, constraints, setConstraints, skinProfile, onSkinProfileChange }` |
| `product` | _(reserved for product detail view)_ | — |
| `verdict` | `VerdictView` | `{ engineResult, scan, onRestart, onBack, onHome }` |

**Navigation callbacks:**
- `handleStart()` → sets `currentView` to `"results"`
- `handleAudit()` → sets `currentView` to `"audit"`
- `handleVerdict()` → sets `currentView` to `"verdict"`
- `handleBack()` → returns to previous view in the sequence
- `handleHome()` → sets `currentView` to `"landing"`
- `handleRestart()` → resets to landing, clears shelf and engineResult

---

### 2.2 Scan Landing — `src/components/scan/scan-landing.tsx`

**Props:**
```typescript
interface ScanLandingProps {
  onStart: () => void;
  scanData: ParsedScan | null;
  setScanData: (data: ParsedScan | null) => void;
  selectedImage: string | null;
  setSelectedImage: (img: string | null) => void;
}
```

**Features:**
- File input (accepts `image/*` only)
- Drag-and-drop zone (`upload-center` class)
- Global paste handler (listens for `paste` event on `document`)
- Calls `POST /api/youcam/scan` with form data `{ image: File }`, or falls back to `mockScan` on error
- Displays `ScanStage` and `ScanProgress` sub-components during processing
- On success: sets `scanData` and `selectedImage`, then calls `onStart()`

---

### 2.3 Scan Results View — `src/components/scan/scan-results-view.tsx`

**Props:**
```typescript
interface ScanResultsViewProps {
  scan: ParsedScan;
  onAudit: () => void;
  onBack: () => void;
  skinProfile: SkinProfile;
  onSkinProfileChange: (profile: SkinProfile) => void;
  selectedImage: string | null;
}
```

**Sub-components rendered:**
| Sub-component | Purpose |
|---------------|---------|
| `ScoreCard` | Animated score display with progress bar. Props: `{ label, value, maxValue?, className? }` |
| `ConcernTag` | Individual concern badge with color-coded score. Props: `{ concern, onRemove? }` |
| `DermalLayer3D` | 2D/3D toggleable skin visualization. Props: `{ scanData, selfieUrl? }` |
| `SkinTypeSelector` | Skin type and sensitivity picker. Props: `{ value, onChange, youcamDetected?, className? }` |

**Animation variants:**
```typescript
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.2 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 500, ease: [0.16, 1, 0.3, 1] } }
};
```

---

### 2.4 Shelf Audit View — `src/components/audit/shelf-audit-view.tsx`

**Props:**
```typescript
interface ShelfAuditViewProps {
  scan: ParsedScan;
  engineResult: EngineOutput | null;
  shelf: ShelfProduct[];
  onShelfChange: (shelf: ShelfProduct[]) => void;
  onProductSelect: (id: string) => void;
  onVerdict: () => void;
  onBack: () => void;
  onHome: () => void;
  constraints: EngineConstraints;
  setConstraints: (c: EngineConstraints) => void;
  skinProfile: SkinProfile;
  onSkinProfileChange: (profile: SkinProfile) => void;
}
```

**Internal state:**
```typescript
const [showINCIDrawer, setShowINCIDrawer] = useState(false);
const [inciText, setInciText] = useState("");
const [parsedINCI, setParsedINCI] = useState<string[]>([]);
const [activePersona, setActivePersona] = useState<string | null>(null);
const [showAddModal, setShowAddModal] = useState(false);
const [searchQuery, setSearchQuery] = useState("");
const [selectedCategory, setSelectedCategory] = useState<string>("all");
```

**Sub-components rendered:**
| Sub-component | Purpose | Props |
|---------------|---------|-------|
| `SkinTypeSelector` | Skin type picker | `{ value, onChange, youcamDetected? }` |
| `ShelfControls` | Budget slider, routine toggle, currency toggle | `{ shelf, constraints, setConstraints, onClearShelf }` |
| `ProductCard` | Product display in shelf/catalog | `{ product, onRemove?, onAdd?, onSelect?, showRemove?, showAdd? }` |
| `ConflictList` | Conflict display | `{ biometricConflicts, chemicalConflicts, redundancyAlerts }` |
| `MetricCard` | Metric stat card | `{ title, value, subtitle, color, icon }` |
| `RoutineColumn` | AM/PM routine display | `{ title, items, icon, accent }` |

**Personas (3 pre-built shelf archetypes):**
```typescript
const personas = [
  {
    id: "student",
    title: "Over-Exfoliating Student",
    subtitle: "Barrier compromised by actives overload",
    icon: GraduationCap,
    traits: ["3+ exfoliants active", "Daily glycolic + retinol", "Stripping foaming cleanser"],
    conflicts: ["Barrier destruction", "Chemical irritation cascade", "Photosensitivity risk"],
    color: "var(--ca-crimson)",
    glow: "rgba(153,27,27,0.15)",
    border: "rgba(153,27,27,0.3)",
  },
  {
    id: "clutter",
    title: "7-Step Clutter",
    subtitle: "Redundant actives, wasted budget",
    icon: Users,
    traits: ["2 Vitamin C serums", "Niacinamide × 3 products", "Dual retinoid overlap"],
    conflicts: ["Role redundancy × 4", "Ingredient incompatibility", "₹12,400/yr overspend"],
    color: "var(--ca-warning)",
    glow: "rgba(180,83,9,0.15)",
    border: "rgba(180,83,9,0.3)",
  },
  {
    id: "minimalist",
    title: "Balanced Minimalist",
    subtitle: "Clinically sound, cost-optimal",
    icon: Shield,
    traits: ["4 essential products", "AM/PM separation clean", "No conflicts detected"],
    conflicts: ["Zero biometric conflicts", "Zero chemical conflicts", "₹0 needed"],
    color: "var(--ca-success)",
    glow: "rgba(15,83,56,0.15)",
    border: "rgba(15,83,56,0.3)",
  },
];
```

**Categories for filtering:**
```typescript
const categories = [
  "all", "cleanser", "hydrator", "exfoliant_aha_bha", "retinoid",
  "antioxidant_vit_c", "barrier_repair", "azelaic_treatment",
  "niacinamide_pore", "eye_treatment", "sunscreen_spf"
];
```

---

### 2.5 Product Card — `src/components/audit/product-card.tsx`

**Props:**
```typescript
interface ProductCardProps {
  product: ShelfProduct;
  onRemove?: (id: string) => void;
  onAdd?: () => void;
  onSelect?: () => void;
  showRemove?: boolean;
  showAdd?: boolean;
}
```

**Static maps (defined in component):**
```typescript
const ROLE_LABELS: Record<string, string> = {
  cleanser: "Cleanser",
  hydrator: "Hydrator",
  exfoliant_aha_bha: "Exfoliant (AHA/BHA)",
  retinoid: "Retinoid",
  antioxidant_vit_c: "Antioxidant (Vitamin C)",
  barrier_repair: "Barrier Repair",
  azelaic_treatment: "Azelaic Treatment",
  niacinamide_pore: "Niacinamide / Pores",
  eye_treatment: "Eye Treatment",
  sunscreen_spf: "Sunscreen (SPF)",
};

const ROLE_ICONS: Record<string, React.ElementType> = {
  cleanser: ShowerHead,
  hydrator: Droplet,
  exfoliant_aha_bha: Scissors,
  retinoid: Sparkles,
  antioxidant_vit_c: Citrus,
  barrier_repair: Shield,
  azelaic_treatment: AlertCircle,
  niacinamide_pore: Wind,
  eye_treatment: Eye,
  sunscreen_spf: Sun,
};
```

> **Note:** This component imports icons from `lucide-react` *after* they are referenced in `ROLE_ICONS` (line 44 of the original). Due to ES module hoisting, this works at runtime. If rebuilding from scratch, move imports to the top.

---

### 2.6 Conflict List — `src/components/audit/conflict-list.tsx`

**Props:**
```typescript
interface ConflictListProps {
  biometricConflicts: BiometricConflict[];
  chemicalConflicts: ChemicalConflict[];
  redundancyAlerts: RedundancyAlert[];
}
```

**Sub-components:**
| Sub-component | Purpose |
|---------------|---------|
| `ConflictSection` | Renders a titled section of conflicts. Props: `{ title, icon, conflicts, renderItem }` |
| `ConflictItem` | Renders a single conflict with expandable detail. Props: `{ item, type }` |

**Behavior:** Each conflict is expandable — click to reveal `explanation` text.

---

### 2.7 Shelf Controls — `src/components/audit/shelf-controls.tsx`

**Props:**
```typescript
interface ShelfControlsProps {
  shelf: ShelfProduct[];
  constraints: EngineConstraints;
  setConstraints: (c: EngineConstraints) => void;
  onClearShelf: () => void;
}
```

**Features:**
- Budget slider (range input 0–10000 INR)
- Routine preference toggle ("Barrier First" / "Cost Optimized")
- Currency toggle (INR / USD)
- Clear shelf button (disabled when shelf is empty)

---

### 2.8 Skin Type Selector — `src/components/shelf/SkinTypeSelector.tsx`

**Props:**
```typescript
interface SkinTypeSelectorProps {
  value: { type: SkinType; sensitive: Sensitivity };
  onChange: (profile: { type: SkinType; sensitive: Sensitivity }) => void;
  youcamDetected?: SkinType;
  className?: string;
}
```

**Skin type options:**
| Type | Traits | Needs | Avoids |
|------|--------|-------|--------|
| oily | "Shiny, enlarged pores" | "Lightweight, oil-free" | "Heavy creams, waxes" |
| dry | "Tight, flaky" | "Rich, emollient" | "Alcohol, foaming agents" |
| combination | "Oily T-zone, dry cheeks" | "Balancing, targeted" | "Over-drying products" |
| normal | "Balanced, few issues" | "Gentle, varied" | "Harsh actives" |

**Features:**
- YouCam AI detection badge (shows detected type from scan)
- Sensitivity toggle with crimson color scheme

---

### 2.9 Currency Toggle — `src/components/ui/currency-toggle.tsx`

**Props:**
```typescript
interface CurrencyToggleProps {
  currency: Currency;
  onChange: (currency: Currency) => void;
}
```

**Renders:** Two toggle buttons — `₹ INR` and `$ USD`

---

### 2.10 Tilt Card — `src/components/ui/TiltCard.tsx`

**Props:**
```typescript
interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;       // default 15
  perspective?: number;   // default 1200
  scale?: number;         // default 1.05
  glass?: boolean;        // default true
  stone?: boolean;        // default false
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}
```

**Animation:** Uses Framer Motion with `useSpring` for tilt physics. `stiffness: 300, damping: 30` for spring physics. Mouse position drives `rotateX`/`rotateY` transforms on inner element.

---

### 2.11 Jade Sky (Gradient Background) — `src/components/ui/jade-sky.tsx`

**Props:**
```typescript
interface GradientBackgroundProps {
  className?: string;
  style?: React.CSSProperties;
}
```

**Behavior:** Renders a `div` with radial gradient backgrounds (moss green and jade tones). Pure CSS, no dependencies. Positioned absolutely to fill parent.

---

### 2.12 Dermal Layer 3D — `src/components/scan/DermalLayer3D.tsx`

**Props:**
```typescript
interface DermalLayer3DProps {
  scanData: {
    concerns: Array<{ type: string; uiScore: number; maskUrls: string[] }>;
    overallScore: number;
  };
  selfieUrl?: string;
}
```

**Layer data:**
```typescript
const layerData = [
  { id: "stratum", name: "Stratum Corneum", depth: 0, color: "rgba(246,244,240,0.9)", icon: Grid },
  { id: "epidermis", name: "Epidermis", depth: 1, color: "rgba(15,83,56,0.12)", icon: Zap },
  { id: "dermis", name: "Dermis", depth: 2, color: "rgba(153,27,27,0.08)", icon: Layers },
  { id: "hypodermis", name: "Hypodermis", depth: 3, color: "rgba(180,83,9,0.06)", icon: Grid },
];
```

**Modes:**
- **2D Precision:** Grid of mask overlays (up to 8 concern masks). Each mask shows its confidence score.
- **3D Exploded:** Interactive 3D stack with drag-to-rotate. Uses `useMotionValue` + `useSpring` for rotation. Mouse events on container, global listeners for drag.

**Animation details:**
- `useSpring({ stiffness: 200, damping: 25 })` for rotation
- Staggered layer appearance with delays (`0.1 + i * 0.05`)
- Depth pulsing animation (infinite scale animation per layer)

---

### 2.13 Verdict View — `src/components/audit/verdict-view.tsx`

**Props:**
```typescript
interface VerdictViewProps {
  engineResult: EngineOutput;
  scan: ParsedScan;
  onRestart: () => void;
  onBack: () => void;
  onHome: () => void;
}
```

**Verdict types:**
- `"buy_nothing"` — Green theme, `CheckCircle` icon, "Buy Nothing" subtitle
- `"targeted_addition"` — Gold theme, `AlertCircle` icon, "Targeted Addition" subtitle

**Sections:**
1. **Verdict Header** — Animated title, icon, cost message
2. **Cost Breakdown Ledger** — 3 `CostLedgerCard` columns (Current Shelf, New Purchases, Money Saved)
3. **Three-Column Verdict Ledger** — Keep / Pause / Add columns via `VerdictColumn`
4. **Routine Schedule** — AM/PM protocols via `RoutineScheduleColumn`
5. **Audit Trail** — 5 `AuditTrailCard` metrics (Products Analyzed, Biometric Conflicts, Chemical Conflicts, Redundancies, Gaps Addressed)
6. **CTA** — "New Analysis" and "Export Ledger" buttons

**Sub-components:**
| Component | Props |
|-----------|-------|
| `CostLedgerCard` | `{ title, inr, usd, note, accent, icon, highlight? }` |
| `VerdictColumn` | `{ title, subtitle, icon, accent, items, emptyMessage }` |
| `RoutineScheduleColumn` | `{ title, items, accent, icon }` |
| `AuditTrailCard` | `{ title, value, icon, accent }` |

---

## 3. Styling System

### 3.1 Color Palette (CSS Custom Properties)

**Primary semantic colors — `src/app/globals.css`:**

| Variable | Hex | Usage |
|----------|-----|-------|
| `--color-bioluminescent-lime` | `#cef79e` | Accent, micro-interactives, active states |
| `--color-abyssal-ink` | `#222f30` | Primary text, dark canvas |
| `--color-bone-white` | `#f7f7f5` | Light-section canvas, primary text on dark |
| `--color-paper` | `#ffffff` | Card surfaces on light sections |
| `--color-graphite` | `#4d5757` | Secondary body text, muted metadata |
| `--color-lichen` | `#c9cbbe` | Hairline borders, subtle dividers |
| `--color-tissue` | `#e7e8e1` | Alternate warm card surface |
| `--color-frost` | `#eeeeee` | Neutral light card surface |
| `--color-void` | `#000000` | Footer background |

**Surface tokens:**
| Variable | Maps to |
|----------|---------|
| `--surface-dark` | `--color-abyssal-ink` |
| `--surface-light` | `--color-bone-white` |
| `--surface-card` | `--color-paper` |
| `--surface-card-alt` | `--color-tissue` |
| `--surface-footer` | `--color-void` |

**Border tokens:**
| Variable | Value |
|----------|-------|
| `--border-hairline` | `--color-lichen` |
| `--border-soft` | `--color-graphite` |

**Accent tokens:**
| Variable | Value |
|----------|-------|
| `--color-accent` | `--color-bioluminescent-lime` |
| `--color-text-primary` | `--color-bone-white` |
| `--color-text-secondary` | `--color-graphite` |
| `--color-bg-page-light` | `--color-bone-white` |
| `--color-bg-page-dark` | `--color-abyssal-ink` |
| `--color-bg-card` | `--color-paper` |
| `--accent-fill` | `--color-bioluminescent-lime` |

### 3.2 "ca-" Prefixed Variables (Atelier System)

Used in the audit, results, and verdict views. These use a different naming convention (`--ca-*`) and represent the "atelier" color system:

| Variable | Description |
|----------|-------------|
| `--ca-studiomid` | Main background surface |
| `--ca-skin-neutral` | Skin-tone neutral for glows |
| `--ca-gold-warm` | Gold accent for warm highlights |
| `--ca-paper` | Primary text on card surfaces |
| `--ca-ink` | Primary text color |
| `--ca-ink-subtle` | Secondary text |
| `--ca-ink-muted` | Tertiary text |
| `--ca-ink-faint` | Quaternary text |
| `--ca-glass-bg` | Glass card background |
| `--ca-glass-border` | Glass card border |
| `--ca-stone-border` | Stone card border |
| `--ca-stone` | Stone card background |
| `--ca-crimson` | Error/danger accent |
| `--ca-crimson-glow` | Crimson glow for hover states |
| `--ca-warning` | Warning accent |
| `--ca-success` | Success accent |
| `--ca-emerald` | Emerald accent (for concern tags) |
| `--font-fira-code` | Font family for monospace displays |
| `--font-cormorant` | Font family for display headings in atelier views |

### 3.3 Typography System

**Fonts:**
- `--font-display`: `"Aspekta"`, `"Inter Tight"`, `"Sohne Buch"`, `"Helvetica Neue"`, sans-serif
- `--font-body`: `"Aspekta"`, `"Inter Tight"`, `"Sohne Buch"`, `"Helvetica Neue"`, sans-serif
- `--font-mono`: `"Roboto Mono"`, `"JetBrains Mono"`, `"Fira Code"`, monospace

**Font weight (single weight):**
- `--font-weight-regular: 400`

**Typography classes:**

| Class | Font | Size | Line-height | Letter-spacing | Color |
|-------|------|------|-------------|----------------|-------|
| `.text-display` | display | clamp(2.5rem, 6vw, 5rem) | 1.05 | -0.025em | `--color-bone-white` |
| `.text-h1` | display | clamp(2rem, 5vw, 3.5rem) | 1.15 | -0.02em | `--color-bone-white` |
| `.text-h2` | display | clamp(1.5rem, 4vw, 2.5rem) | 1.2 | -0.015em | `--color-bone-white` |
| `.text-h3` | display | clamp(1.25rem, 3vw, 1.75rem) | 1.25 | -0.01em | `--color-bone-white` |
| `.text-subheading` | mono | 13px | 1.23 | 0.02em | `--color-lichen` |
| `.text-body` | body | 18px | 1.5 | — | `--color-bone-white` |
| `.text-body-sm` | body | 16px | 1.5 | — | `--color-bone-white` |
| `.text-body-xs` | mono | 13px | 1.23 | -0.02em | `--color-bone-white` (opacity 0.7) |
| `.text-mono` | mono | 14px | — | 0.02em | `--color-bone-white` (opacity 0.8) |
| `.text-mono-lg` | mono | 15px | — | 0.01em | `--color-bone-white` (opacity 0.9) |

### 3.4 Radii System (4px base unit)

| Variable | Value |
|----------|-------|
| `--radius-nav` | 12px |
| `--radius-tags` | 9999px |
| `--radius-card` | 16px |
| `--radius-large-card` | 20px |
| `--radius-btn` | 8px |
| `--radius-pill` | 9999px |
| `--radius-circle` | 50% |
| `--radius-input` | 16px |
| `--radius-section` | 40px |

### 3.5 Spacing System (4px base unit)

| Variable | Value |
|----------|-------|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-7` | 28px |
| `--space-8` | 32px |
| `--space-9` | 44px |
| `--space-10` | 48px |
| `--space-11` | 88px |
| `--space-12` | 100px |
| `--space-13` | 160px |

### 3.6 Transition Tokens

| Variable | Value |
|----------|-------|
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--ease-out-circ` | `cubic-bezier(0.05, 0.7, 0.1, 1)` |
| `--duration-fast` | 150ms |
| `--duration-base` | 250ms |
| `--duration-slow` | 400ms |
| `--duration-slower` | 600ms |

### 3.7 Component Primitives (CSS Classes)

**Cards:**
- `.glass-card` — Surface card with hairline border, hover lift
- `.solid-card` — Surface card, no border
- `.atelier-glass` — Atelier glass surface (rgba background, blur)
- `.atelier-glass-elevated` — Elevated glass with ring hover
- `.stone-card` — Stone-toned card surface

**Buttons:**
- `.btn-primary` — Filled, lime border, bone-white fill, abyssal-ink text
- `.btn-arrow` — 40×40 square, lime fill, abyssal-ink arrow icon
- `.btn-ghost` — Outlined, transparent, bone-white text
- `.atelier-btn-primary` — Atelier primary button style
- `.atelier-btn-secondary` — Atelier secondary (ghost) button style
- `.upload-btn` — Lime-filled CTA with glow
- `.product-btn` — Product card action button
- `.rescan-btn` — Outlined lime button

**Badges:**
- `.badge` — Core badge base
- `.badge-sage` — Lime border, lime text
- `.badge-score` — Card-surface badge
- `.badge-confidence` — Confidence indicator
- `.badge-emerald` — Emerald badge
- `.badge-stone` — Stone badge

**Typography utilities:**
- `.text-display`, `.text-h1`, `.text-h2`, `.text-h3`
- `.text-subheading`, `.text-body`, `.text-body-sm`, `.text-body-xs`
- `.text-mono`, `.text-mono-lg`
- `.accent` — Applies `--color-bioluminescent-lime`
- `.confidence` — Lime color text
- `.diagnosis-badge` — Lime-accented diagnostic badge

**Layout primitives:**
- `.container` — Max-width 1200px, responsive padding
- `.section` — Section padding (var(--space-10) var(--space-5))
- `.atelier-container` — Atelier layout container
- `.ateliaer-section` — Atelier section padding

**Score display:**
- `.score-card` — Animated score card with progress bar
- `.score-bar` — Progress bar track
- `.score-fill` — Progress bar fill with `progress-fill` keyframe
- `.score-value` — Large numeric display (tabular-nums)
- `.score-percentile` — Percentile label

**Concern tags:**
- `.concern-tag` — Base concern tag
- `.concern-tag.primary` — Lime-accented primary
- `.concern-tag.warn` — Crimson-accented warning
- `.concern-tag.ok` — Lime-accented OK

**Product display:**
- `.product-card` — Product card with top accent border
- `.product-tag` — Small product category tag
- `.product-name`, `.product-description`, `.product-ingredients`
- `.product-price`, `.product-btn`

**Scan/animation:**
- `.scan-stage`, `.scan-record`, `.record-frame`, `.record-screen`
- `.reveal`, `.reveal-delay-1` through `.reveal-delay-6`
- `.animate-slide-up` — Custom Tailwind animation
- `.stagger-1` through `.stagger-6`

### 3.8 Custom Animations (CSS)

```css
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes float-gentle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

@keyframes scan-beam {
  0% { top: 8%; opacity: 0; }
  15% { opacity: 1; }
  85% { opacity: 1; }
  100% { top: 92%; opacity: 0; }
}

@keyframes rotate-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes progress-fill {
  from { width: 0%; }
  to { width: var(--progress-width); }
}

@keyframes blink-dot {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
```

### 3.9 Global Elements

**Header:**
```css
header {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  background: rgba(34, 47, 48, 0.72);
  backdrop-filter: blur(24px) saturate(180%);
  border-bottom: 1px solid var(--border-hairline);
}
```

**Footer:**
```css
footer {
  position: relative;
  padding: var(--space-8) var(--space-5);
  background: var(--surface-footer);
  border-top: 1px solid var(--border-hairline);
}
```

**Body:**
```css
body {
  background: var(--surface-dark);
  color: var(--color-bone-white);
  font-family: var(--font-body);
  min-height: 100vh;
  line-height: 1.5;
  font-size: 18px;
}
```

---

## 4. Animation Specifications

### 4.1 Framer Motion Variants

**Container (used in Scan Results View):**
```typescript
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.2 }
  }
};
```

**Item (used in Scan Results View):**
```typescript
const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 500, ease: [0.16, 1, 0.3, 1] }
  }
};
```

**Stagger values used across components:**
- `staggerChildren: 0.06` — Results view
- `stagger-1` through `stagger-6` — CSS animation delays (100ms increments)

### 4.2 Spring Physics Constants

| Component | Spring Config |
|-----------|---------------|
| TiltCard | `{ stiffness: 300, damping: 30 }` |
| DermalLayer3D (rotation) | `{ stiffness: 200, damping: 25 }` |
| Verdict header icon | `{ delay: 0.3, type: "spring", stiffness: 400, damping: 20 }` |
| ShelfAuditView product cards | `{ delay: 0.1 + index * 0.05, type: "spring", stiffness: 300, damping: 25 }` |
| ShelfAuditView catalog cards | `{ delay: index * 0.02 }` |
| INCI drawer | `{ type: "spring", stiffness: 300, damping: 25 }` |
| Add product modal | `{ type: "spring", stiffness: 300, damping: 25 }` |

### 4.3 Easing Functions

| Variable | CSS Value |
|----------|-----------|
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--ease-out-circ` | `cubic-bezier(0.05, 0.7, 0.1, 1)` |

**Framer Motion easings (inline):**
```typescript
// Used in item variants
ease: [0.16, 1, 0.3, 1]   // Expo ease-out
ease: [0.25, 0.46, 0.45, 0.94]  // Circ ease-out (for transitions)
```

### 4.4 Delays and Staggers

| Component | Delay Pattern |
|-----------|---------------|
| Reveals | `.reveal-delay-1` (100ms) through `.reveal-delay-6` (600ms) |
| Scan stage animations | 100ms per stage |
| DermalLayer3D layers | `0.3 + i * 0.05` (layer fade-in) |
| DermalLayer3D labels | `0.5 + i * 0.08` (staggered appearance) |
| Persona cards | `0.1 + i * 0.1` (staggered entrance) |
| Verdict columns | `stagger-3` (CSS) + `delay: 0.1 + i * 0.08` (Framer Motion) |
| Audit trail cards | `stagger-5` (CSS) |
| Final CTA buttons | `stagger-6` (CSS) |

### 4.5 AnimatePresence Usage

- **INCI Drawer:** Opens with opacity + scale + y interpolation; closes with reverse
- **Add Product Modal:** Same pattern as INCI drawer
- **Persona expand/collapse:** Height animation with `AnimatePresence`
- **Concern removal:** Exit animation on concern tags

---

## 5. Data Flow

### 5.1 State Machine Overview

```
[Landing] → (scan complete) → [Results] → (skin profile confirmed) → [Audit] → (verdict viewed) → [Verdict]
   ↑                                    ↓                          ↓                        ↓
   └─ onHome ───────────────────────────┴─ onBack ────────────────┴─ onBack ───────────────┘
```

**View transitions:**
| From | To | Trigger |
|------|----|---------|
| landing | results | `onStart()` after scan completes |
| results | audit | `onAudit()` after skin profile set |
| audit | verdict | `onVerdict()` after engine runs |
| verdict | landing | `onRestart()` — resets state |
| any | landing | `onHome()` — resets state |
| any | previous | `onBack()` — pops one view |

### 5.2 Engine Data Flow

```
User uploads selfie
  → ScanLanding: POST /api/youcam/scan (or fallback to mockScan)
  → ParsedScan { concerns, skinType, skinAge, overallScore }
  → ScanResultsView: User confirms skin profile
  → ShelfAuditView: Engine runs in useEffect
    → runBioInventoryEngine(scan, shelf, constraints) → EngineOutput
  → VerdictView: Displays EngineOutput.verdict + finalRoutine + auditTrail
```

### 5.3 Prop Drilling Map

```
src/app/page.tsx
  ├── ScanLanding
  │   ├── onStart → setCurrentView("results")
  │   ├── scanData → setScanData
  │   └── selectedImage → setSelectedImage
  │
  ├── ScanResultsView
  │   ├── scan ← scanData
  │   ├── onAudit → setCurrentView("audit")
  │   ├── onBack → setCurrentView("landing")
  │   └── skinProfile, onSkinProfileChange
  │
  ├── ShelfAuditView
  │   ├── scan ← scanData
  │   ├── engineResult ← computed in useEffect
  │   ├── shelf, onShelfChange (state sync)
  │   ├── onProductSelect → open product detail (future)
  │   ├── onVerdict → setCurrentView("verdict")
  │   ├── onBack → setCurrentView("results")
  │   ├── onHome → setCurrentView("landing")
  │   ├── constraints, setConstraints
  │   └── skinProfile, onSkinProfileChange
  │
  └── VerdictView
      ├── engineResult ← from parent state
      ├── scan ← scanData
      ├── onRestart → reset all state to landing
      ├── onBack → setCurrentView("audit")
      └── onHome → setCurrentView("landing")
```

### 5.4 Engine Input/Output Contract

**Input:**
```typescript
runBioInventoryEngine(
  scan: ParsedScan,
  shelf: ShelfProduct[],
  constraints: EngineConstraints
): EngineOutput
```

**Output fields used by UI:**
| Field | Component | Usage |
|-------|-----------|-------|
| `scanSummary.overallScore` | ShelfAuditView | Display in scan summary bar |
| `scanSummary.skinAge` | ShelfAuditView | Display in scan summary bar |
| `scanSummary.skinType` | ShelfAuditView | Display in scan summary bar |
| `scanSummary.priorityConcerns` | ShelfAuditView | Display priority concern list |
| `biometricConflicts` | ConflictList, VerdictView | Conflict display, Pause column |
| `chemicalConflicts` | ConflictList, VerdictView (AuditTrail) | Conflict display, count |
| `redundancyAlerts` | ConflictList, VerdictView (AuditTrail) | Redundancy display, count |
| `gapRecommendations` | VerdictView (Add column) | Product recommendations |
| `vehicleCompatibilityIssues` | (reserved) | Future display |
| `finalRoutine` | ShelfAuditView, VerdictView | AM/PM routine display |
| `verdict.type` | VerdictView | "buy_nothing" or "targeted_addition" |
| `verdict.totalCostInr/Usd` | VerdictView | Cost display |
| `verdict.moneySavedInr/Usd` | VerdictView | Savings display |
| `verdict.message` | VerdictView | Verdict description |
| `auditTrail.productsAnalyzed` | VerdictView | Audit trail metric |
| `auditTrail.conflictsFound` | VerdictView | Audit trail metric |
| `auditTrail.redundanciesFound` | VerdictView | Audit trail metric |
| `auditTrail.gapsIdentified` | VerdictView | Audit trail metric |

### 5.5 Currency Conversion

- Engine constraints hold both `budgetInr` and `budgetUsd`
- UI toggles between `inr`/`usd` display
- Product prices stored in both INR and USD
- Cost calculations (per day, per month) use `calculateCostPerDay` / `calculateCostPerMonth` from `src/data/catalog.ts`

---

## 6. Mock Data Structures

### 6.1 Mock Scan — `src/lib/mock-scan.ts`

```typescript
const mockScan: ParsedScan = {
  skinType: { type: "Normal", region: "whole" },
  skinAge: 28,
  overallScore: 86.33,
  concerns: [
    { type: "hd_wrinkle",           uiScore: 98, rawScore: 99, maskUrls: ["/demo-scan/mask_wrinkle.png"] },
    { type: "hd_pore",              uiScore: 91, rawScore: 94, maskUrls: ["/demo-scan/mask_pore.png"] },
    { type: "hd_texture",           uiScore: 86, rawScore: 90, maskUrls: ["/demo-scan/mask_texture.png"] },
    { type: "hd_acne",              uiScore: 96, rawScore: 98, maskUrls: ["/demo-scan/mask_acne.png"] },
    { type: "hd_oiliness",          uiScore: 83, rawScore: 84, maskUrls: ["/demo-scan/mask_oiliness.png"] },
    { type: "hd_radiance",          uiScore: 83, rawScore: 86, maskUrls: ["/demo-scan/mask_radiance.png"] },
    { type: "hd_eye_bag",           uiScore: 83, rawScore: 84, maskUrls: ["/demo-scan/mask_eye_bag.png"] },
    { type: "hd_age_spot",          uiScore: 96, rawScore: 98, maskUrls: ["/demo-scan/mask_age_spot.png"] },
    { type: "hd_dark_circle",       uiScore: 77, rawScore: 83, maskUrls: ["/demo-scan/mask_dark_circle.png"] },
    { type: "hd_droopy_upper_eyelid", uiScore: 84, rawScore: 86, maskUrls: ["/demo-scan/mask_droopy_upper.png"] },
    { type: "hd_droopy_lower_eyelid", uiScore: 71, rawScore: 58, maskUrls: ["/demo-scan/mask_droopy_lower.png"] },
    { type: "hd_firmness",          uiScore: 91, rawScore: 94, maskUrls: ["/demo-scan/mask_firmness.png"] },
    { type: "hd_moisture",          uiScore: 55, rawScore: 45, maskUrls: ["/demo-scan/mask_moisture.png"] },
    { type: "hd_redness",           uiScore: 83, rawScore: 85, maskUrls: ["/demo-scan/mask_redness.png"] },
    { type: "hd_tear_trough",       uiScore: 96, rawScore: 97, maskUrls: ["/demo-scan/mask_tear_trough.png"] },
    { type: "hd_skin_type",         uiScore: 0,  rawScore: 0,  maskUrls: [] },
  ],
};
```

### 6.2 Concern Labels and Colors

**16 YouCam HD Concerns + 1 SD concern:**
```typescript
const CONCERN_LABELS: Record<string, string> = {
  // SD concerns
  wrinkle: "Fine Lines & Wrinkles",
  pore: "Pore Visibility",
  texture: "Skin Texture",
  acne: "Acne & Blemishes",
  oiliness: "Oiliness / Sebum",
  radiance: "Radiance",
  eye_bag: "Eye Bags",
  age_spot: "Age Spots / Hyperpigmentation",
  dark_circle_v2: "Dark Circles",
  droopy_upper_eyelid: "Drooping Upper Eyelid",
  droopy_lower_eyelid: "Drooping Lower Eyelid",
  firmness: "Firmness",
  moisture: "Moisture / Hydration",
  redness: "Redness / Irritation",
  tear_trough: "Tear Trough Depth",
  skin_type: "Skin Type",

  // HD concerns (from YouCam API)
  hd_wrinkle: "Fine Lines & Wrinkles",
  hd_pore: "Pore Visibility",
  hd_texture: "Skin Texture",
  hd_acne: "Acne & Blemishes",
  hd_oiliness: "Oiliness / Sebum",
  hd_radiance: "Radiance",
  hd_eye_bag: "Eye Bags",
  hd_age_spot: "Age Spots / Hyperpigmentation",
  hd_dark_circle: "Dark Circles",
  hd_droopy_upper_eyelid: "Drooping Upper Eyelid",
  hd_droopy_lower_eyelid: "Drooping Lower Eyelid",
  hd_firmness: "Firmness",
  hd_moisture: "Moisture / Hydration",
  hd_redness: "Redness / Irritation",
  hd_tear_trough: "Tear Trough Depth",
  hd_skin_type: "Skin Type",
};
```

**Color thresholds:**
```typescript
const CONCERN_COLORS: Record<string, string> = {
  low: "#2ecc71",    // teal/green — score >= 85
  medium: "#f59e0b", // amber — score 60-84
  high: "#e74c3c",   // crimson — score < 60
};

function getConcernColor(score: number): string {
  if (score >= 85) return CONCERN_COLORS.low;
  if (score >= 60) return CONCERN_COLORS.medium;
  return CONCERN_COLORS.high;
}
```

### 6.3 Default Shelf — `src/lib/test-helpers.ts`

```typescript
function createDefaultShelf(): ShelfProduct[] {
  return [
    // gentle-cream-cleanser
    {
      id: "gentle-cream-cleanser",
      name: "Gentle Cream Cleanser",
      brand: "CeraVe",
      priceInr: 1299,
      priceUsd: 16,
      daysSupply: 120,
      roles: ["cleanser"],
      usageTime: ["AM", "PM"],
      activeIngredients: [
        { name: "Ceramides", concentration: "3:1:1", function: "barrier support", concernTargets: ["dryness", "barrier"] },
        { name: "Hyaluronic Acid", concentration: "0.2%", function: "hydration", concernTargets: ["dehydration"] },
      ],
      inciList: ["Aqua", "Glycerin", "Ceramide NP", "Ceramide AP", "Ceramide EOP", "Hyaluronic Acid", "Panthenol", "Niacinamide", "Carbomer", "Disodium EDTA", "Phenoxyethanol", "Chlorphenin", "Parfum"],
      targetConcerns: ["dryness", "sensitivity", "barrier"],
      irritancyScore: 1,
      description: "Non-foaming, ceramide-rich cleanser that removes impurities without stripping the skin barrier.",
      suitableSkinTypes: ["dry", "normal", "combination"],
      incompatibleSkinTypes: ["oily"],
      textureVehicle: "cream_cleanser",
      safeForSensitive: true,
      quantity: 1,
    },
    // ceramide-barrier-cream
    {
      id: "ceramide-barrier-cream",
      name: "Ceramide Barrier Cream",
      brand: "CeraVe",
      priceInr: 1899,
      priceUsd: 24,
      daysSupply: 75,
      roles: ["hydrator", "barrier_repair"],
      usageTime: ["PM"],
      activeIngredients: [
        { name: "Ceramides", concentration: "3:1:1", function: "barrier repair", concernTargets: ["barrier", "dryness"] },
        { name: "Cholesterol", concentration: "1%", function: "barrier support", concernTargets: ["barrier"] },
        { name: "Hyaluronic Acid", concentration: "0.5%", function: "hydration", concernTargets: ["dehydration"] },
      ],
      inciList: ["Aqua", "Glycerin", "Butyrospermum Parkii Shea Butter", "Cetyl Alcohol", "Cetearyl Alcohol", "Ceramide NP", "Ceramide AP", "Ceramide EOP", "Phytosphingosine", "Cholesterol", "Hyaluronic Acid", "Panthenol", "Pentylene Glycol", "Phenoxyethanol"],
      targetConcerns: ["barrier", "dryness", "texture"],
      irritancyScore: 1,
      description: "Rich ceramide cream that replenishes the skin barrier with 3 essential ceramides and cholesterol.",
      suitableSkinTypes: ["dry", "normal", "combination", "oily"],
      incompatibleSkinTypes: [],
      textureVehicle: "rich_cream",
      safeForSensitive: true,
      quantity: 1,
    },
    // mineral-spf50
    {
      id: "mineral-spf50",
      name: "Mineral SPF 50+",
      brand: "EltaMD",
      priceInr: 3495,
      priceUsd: 45,
      daysSupply: 60,
      roles: ["sunscreen_spf"],
      usageTime: ["AM"],
      activeIngredients: [
        { name: "Zinc Oxide", concentration: "9%", function: "UV protection", concernTargets: ["photoaging", "hyperpigmentation"] },
        { name: "Titanium Dioxide", concentration: "5.5%", function: "UV protection", concernTargets: ["photoaging"] },
      ],
      inciList: ["Water", "Squalane", "Cetyl Alcohol", "Cetearyl Alcohol", "Sorbitan Stearate", "Carbomer", "Triethanolamine", "Zinc Oxide", "Titanium Dioxide", "Hyaluronic Acid", "Tocopheryl Acetate", "Phenoxyethanol"],
      targetConcerns: ["photoaging", "hyperpigmentation", "redness"],
      irritancyScore: 1,
      description: "Broad-spectrum mineral sunscreen with 9% zinc oxide and 5.5% titanium dioxide for UVA/UVB protection.",
      suitableSkinTypes: ["dry", "normal", "combination", "oily", "sensitive"],
      incompatibleSkinTypes: [],
      textureVehicle: "lotion",
      safeForSensitive: true,
      quantity: 1,
    },
  ];
}
```

### 6.4 Product Catalog — `src/data/catalog.ts`

**21 products** covering all 10 functional roles and 8 texture vehicles. Full product definitions include `id`, `name`, `brand`, `priceInr`, `priceUsd`, `daysSupply`, `roles`, `usageTime`, `activeIngredients`, `inciList`, `targetConcerns`, `irritancyScore`, `description`, `suitableSkinTypes`, `incompatibleSkinTypes`, `textureVehicle`, `safeForSensitive`.

**Helper functions:**
```typescript
function getProductById(id: string): Product | undefined;
function getProductsByRole(role: ProductRole): Product[];
function getProductsByConcern(concern: string): Product[];
function calculateCostPerDay(product: Product, currency: Currency): number;
function calculateCostPerMonth(product: Product, currency: Currency): number;
```

---

## 7. Backend Integration Points

### 7.1 YouCam API — `POST /api/youcam/scan`

**Endpoint:** `/api/youcam/scan`

**Request:**
```typescript
Content-Type: multipart/form-data;
Body: {
  image: File;  // image/* MIME type
}
```

**Success Response (200):**
```typescript
YouCamScanResult = {
  concerns: YouCamConcern[];
  skinType: YouCamSkinType;
  skinAge: number;
  overallScore: number;
  timestamp: string;
}
```

**Error Response (4xx/5xx):**
```typescript
{
  error: string;  // Human-readable error message
}
```

**Fallback:** On any API error, the UI falls back to `mockScan` from `src/lib/mock-scan.ts`. The user sees a notification that fallback data is being used.

### 7.2 Engine Function — `src/lib/engine/optimizer.ts`

**Import:**
```typescript
import { runBioInventoryEngine } from "@/lib/engine/optimizer";
```

**Signature:**
```typescript
function runBioInventoryEngine(
  scan: ParsedScan,
  shelf: ShelfProduct[],
  constraints: EngineConstraints
): EngineOutput
```

**Called in:** `src/app/page.tsx` `useEffect` whenever `scanData`, `shelf`, or `constraints` change.

**Engine output contract (what the UI expects):**

| Path | Type | Description |
|------|------|-------------|
| `.scanSummary.overallScore` | `number` (0-100) | Overall skin score |
| `.scanSummary.skinAge` | `number` | Chronological skin age |
| `.scanSummary.skinType` | `string` | Detected skin type |
| `.scanSummary.priorityConcerns` | `Array<{concern: string, score: number}>` | Top concerns by score |
| `.biometricConflicts` | `BiometricConflict[]` | Conflicts between scan and products |
| `.chemicalConflicts` | `ChemicalConflict[]` | Ingredient incompatibilities |
| `.redundancyAlerts` | `RedundancyAlert[]` | Duplicate role products |
| `.gapRecommendations` | `GapRecommendation[]` | Missing product recommendations |
| `.vehicleCompatibilityIssues` | `VehicleCompatibilityIssue[]` | Texture layering issues |
| `.finalRoutine` | `RoutineSchedule` | `{ AM: RoutineStep[], PM: RoutineStep[] }` |
| `.verdict.type` | `"buy_nothing" \| "targeted_addition"` | Verdict classification |
| `.verdict.message` | `string` | Human-readable verdict |
| `.verdict.totalCostInr` | `number` | Total cost of new purchases (INR) |
| `.verdict.totalCostUsd` | `number` | Total cost of new purchases (USD) |
| `.verdict.moneySavedInr` | `number` | Savings vs generic routine (INR) |
| `.verdict.moneySavedUsd` | `number` | Savings vs generic routine (USD) |
| `.auditTrail.productsAnalyzed` | `number` | Count of products analyzed |
| `.auditTrail.conflictsFound` | `number` | Total conflicts found |
| `.auditTrail.redundanciesFound` | `number` | Redundant products |
| `.auditTrail.gapsIdentified` | `number` | Gaps identified |

### 7.3 Callback Contracts

**Page-level callbacks (passed from `page.tsx` to views):**

| Callback | Signature | Called by | Effect |
|----------|-----------|-----------|--------|
| `onStart` | `() => void` | ScanLanding | `setCurrentView("results")` |
| `onAudit` | `() => void` | ScanResultsView | `setCurrentView("audit")` |
| `onVerdict` | `() => void` | ShelfAuditView | `setCurrentView("verdict")` |
| `onBack` | `() => void` | View-specific | Pops one view back |
| `onHome` | `() => void` | Any view | `setCurrentView("landing")`, resets state |
| `onRestart` | `() => void` | VerdictView | Resets to landing, clears shelf/scan |
| `onProductSelect` | `(id: string) => void` | ShelfAuditView | Opens product detail (future) |
| `onShelfChange` | `(shelf: ShelfProduct[]) => void` | ShelfAuditView | Updates shelf state |
| `onSkinProfileChange` | `(profile: SkinProfile) => void` | ScanResultsView, ShelfAuditView | Updates skinProfile state |

**Component-level callbacks:**

| Component | Callback | Signature | Effect |
|-----------|----------|-----------|--------|
| `SkinTypeSelector` | `onChange` | `(profile: SkinProfile) => void` | Updates skin profile state |
| `CurrencyToggle` | `onChange` | `(currency: Currency) => void` | Updates constraints.currency |
| `ShelfControls` | `onClearShelf` | `() => void` | Empties the shelf array |
| `ProductCard` | `onRemove` | `(id: string) => void` | Removes product from shelf |
| `ProductCard` | `onAdd` | `() => void` | Adds product to shelf |
| `ProductCard` | `onSelect` | `() => void` | Opens product detail |

### 7.4 Data Contracts Summary

**State shape in `page.tsx`:**
```typescript
{
  currentView: "landing" | "results" | "audit" | "product" | "verdict",
  selectedProductId: string | null,
  selectedImage: string | null,
  scanData: ParsedScan | null,
  shelf: ShelfProduct[],
  constraints: EngineConstraints,
  engineResult: EngineOutput | null,
  skinProfile: { type: SkinType; sensitive: Sensitivity },
}
```

**Default constraints:**
```typescript
{
  budgetInr: 5000,
  budgetUsd: 60,
  avoidedIngredients: [],
  routinePreference: "barrier_first",
  currency: "inr",
  userSkinType: "normal",
  userSensitive: "normal",
}
```

### 7.5 Image Assets

- Sample selfie: `public/sample-selfie.jpg`
- Demo scan masks: `public/demo-scan/mask_*.png` (one per concern)
- All mask URLs are relative to `/public/demo-scan/`

### 7.6 Environment Configuration

**Required env vars:**
```
# If using a real YouCam API endpoint
NEXT_PUBLIC_YOUCAM_API_URL  (optional, defaults to local fallback)
NEXT_PUBLIC_APP_NAME=ShelfWise
```

**Dependencies (from `package.json`):**
| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.4.2 | Framework |
| `react` | 19.x | UI library |
| `framer-motion` | 12.x | Animations |
| `tailwindcss` | 4.x | Styling |
| `lucide-react` | latest | Icons |
| `@playwright/test` | latest | E2E testing |

---

## Appendix: Component File Map

```
src/
├── app/
│   ├── page.tsx                          # Root orchestrator
│   ├── layout.tsx                        # Layout with header
│   └── globals.css                       # Global styles + design system
├── types/
│   ├── youcam.ts                         # YouCam API types
│   └── engine.ts                         # Engine types
├── data/
│   └── catalog.ts                        # 21-product catalog
├── lib/
│   ├── mock-scan.ts                      # ParsedScan + mockScan + concern maps
│   ├── engine/
│   │   └── optimizer.ts                  # runBioInventoryEngine
│   └── test-helpers.ts                   # createDefaultShelf
├── components/
│   ├── ui/
│   │   ├── currency-toggle.tsx           # INR/USD toggle
│   │   ├── TiltCard.tsx                  # 3D tilt card wrapper
│   │   └── jade-sky.tsx                  # Gradient background
│   ├── shelf/
│   │   └── SkinTypeSelector.tsx          # Skin type + sensitivity
│   ├── scan/
│   │   ├── scan-landing.tsx              # Upload zone
│   │   ├── scan-results-view.tsx         # Results view (scores, concerns, 3D)
│   │   └── DermalLayer3D.tsx             # 2D/3D visualization
│   └── audit/
│       ├── shelf-audit-view.tsx          # Main audit view
│       ├── product-card.tsx              # Product display card
│       ├── conflict-list.tsx             # Conflict display
│       ├── shelf-controls.tsx            # Budget/routine/currency controls
│       └── verdict-view.tsx              # Final verdict
```
