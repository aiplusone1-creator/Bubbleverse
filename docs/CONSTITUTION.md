# BUBBLEVERSE™ SYSTEM CONSTITUTION & ARCHITECTURAL CHARTER
*Immutable Engineering, Privacy, Print, and Operational Standards*

> This document is the canonical constitution for all developers, engineers, and AI coding agents working on the Bubbleverse codebase. It must be adhered to without exception.

For the exhaustive technical specification, module-by-module breakdown, and flowcharts, refer to [BUBBLEVERSE_MASTER_SPECIFICATION_AND_CONSTITUTION.md](file:///d:/Private/Bubbleverse/docs/BUBBLEVERSE_MASTER_SPECIFICATION_AND_CONSTITUTION.md).

---

### ARTICLE I: PRODUCT IDENTITY & BOUNDARIES
- **Section 1.1 (Core Offering)**: Bubbleverse is strictly a personalized illustrated hardcover children's storybook and keepsake company. All features must directly support this mission.
- **Section 1.2 (B2B Governance)**: B2B school portals and corporate gifting are extensions of the core engine and must never introduce separate disjointed architectures.
- **Section 1.3 (Framework Bloat Ban)**: Do not introduce third-party frameworks, paid hosting providers, or external microservices merely because a generic developer tutorial suggests them.

### ARTICLE II: TECH STACK SOVEREIGNTY & ARCHITECTURAL GOVERNANCE
- **Section 2.1 (Immutable Core Stack)**: The frontend stack is strictly React 18/19, TypeScript, Vite, Tailwind CSS, Radix UI, and Lucide icons.
- **Section 2.2 (Backend Boundaries)**: Backend services are governed by Supabase (PostgreSQL, Row Level Security, Edge Functions). All critical client operations MUST retain graceful standalone offline fallbacks (`localStore.ts` and `photoVault.ts`).
- **Section 2.3 (Worktree Discipline)**: Development must occur in the designated repository checkout. Do not spawn unauthorized Git worktrees or discard untracked user assets.

### ARTICLE III: CHILD PHOTO PRIVACY & ZERO-LEAK VAULT PROTOCOL
- **Section 3.1 (Git Commit Immunity)**: Never commit child photos, parent names, or personal identity data to Git repositories.
- **Section 3.2 (Storage Isolation)**: Child photos must NEVER be stored in public Vite configuration, public `/dist` directories, or unencrypted localStorage strings.
- **Section 3.3 (PhotoVault Isolation)**: All child photos must reside in the dedicated client IndexedDB `photoVault` or secure private Supabase storage buckets. Order objects store ONLY string vault keys (`photoVaultId`), stripping base64 data before serialization.

### ARTICLE IV: AMAZON KDP HARDCOVER MATHEMATICAL STANDARD
- **Section 4.1 (Physical Trim)**: All hardcover picture books must adhere strictly to 8.5" × 8.5" (215.9 mm × 215.9 mm).
- **Section 4.2 (Bleed Requirement)**: Interior pages require 0.125" (9 pt) bleed on top, bottom, and outside edges. Full page canvas is exactly 8.625" × 8.75" (621 pt × 630 pt).
- **Section 4.3 (Resolution Floor)**: Every illustration must satisfy strict 300 DPI preflight (2588 × 2625 px minimum). Sub-1000px images must be rejected with an upscale warning.
- **Section 4.4 (Binding Direction Parity)**: Arabic language books MUST use RTL (Right-to-Left) binding with right-hand recto gutters. English books use LTR binding. Zero 210×210 mm European A4 leftovers are permitted.

### ARTICLE V: STAGE 2 AI PROMPT CONTRACT & CHARACTER DNA LOCKING
- **Section 5.1 (5-Block Structure)**: Every illustration prompt must follow the 5-Block formula (Art Direction, Likeness Lock, Action, Environment, KDP Safe Zone).
- **Section 5.2 (Safe Zone Directive)**: Prompts must explicitly mandate keeping facial features within the center 75% safe area, leaving the bottom 25% clear for story text overlays.
- **Section 5.3 (Dynamic Adaptation)**: Poses, props, and outfits must adapt dynamically to the detected story theme (Dinosaurs, Space, Ocean, Fantasy, etc.). Hardcoding generic bubble outfits or glowing bubbles into unrelated themes is an explicit constitutional violation.

### ARTICLE VI: MULTI-CURRENCY PRICING & COMMERCE INTEGRITY
- **Section 6.1 (ISO Currency Standards)**: The platform recognizes three official currencies: Egyptian Pound (`EGP`), Saudi Riyal (`SAR`), and UAE Dirham (`AED`).
- **Section 6.2 (Gulf Parity Derivation)**: In the absence of an explicit AED price, the system must derive AED from SAR at exact 1:1 parity without artificial rounding degradation.
- **Section 6.3 (GWP Protection)**: Gift-with-Purchase (GWP) free items must strictly have price set to 0 and be immune from recursive GWP threshold evaluation.

### ARTICLE VII: LIQUID GLASS UI & DESIGN SYSTEM STANDARDS
- **Section 7.1 (Visual Identity)**: The user interface must preserve the Dark Cosmic Liquid Glass aesthetic (`bg-slate-950/85`, `backdrop-blur-2xl`, cyan-400 borders, soft rounded-2xl radii).
- **Section 7.2 (No Windows 98 Controls)**: Raw unstyled browser controls (especially square gray OS `<select>` elements) are strictly outlawed. All dropdowns must use `LiquidSelect` with centered text alignment and floating portals.
- **Section 7.3 (Bilingual Typography)**: Full typography parity between Fredoka (Latin) and Cairo (Arabic) with comprehensive RTL/LTR layout mirroring.

### ARTICLE VIII: QUALITY ASSURANCE, VERIFICATION & ZERO-WARNING LAW
- **Section 8.1 (Zero-Warning Linting)**: `npm run check` must pass with zero ESLint warnings and zero TypeScript compilation errors (`--max-warnings 0`).
- **Section 8.2 (Test Suite Inviolability)**: All automated test suites (Commerce, Studio, PDF Builder, GWP, Security, Architecture, Skills) must pass 100% prior to any release commit.
- **Section 8.3 (Assertion Integrity)**: Never disable unit test assertions or modify test checksums merely to make checks pass artificially.

### ARTICLE IX: OPERATIONAL POLICIES, MARGIN FLOORS & MANUFACTURING SOPS
- **Section 9.1 (Gross Margin Protection)**: Retail book pricing must maintain a minimum 65% gross margin over raw print and bind costs across all three operating countries.
- **Section 9.2 (Deposit Requirement)**: Custom orders require a non-refundable deposit (minimum 20–50%) prior to generating high-resolution illustration assets.
- **Section 9.3 (Checklist Verification)**: No book may be exported to the print engine until all 6 Studio Checklist gates have been verified by an administrator.

### ARTICLE X: WHATSAPP PROOFING & CUSTOMER SATISFACTION GUARANTEE
- **Section 10.1 (Pre-Print Parent Approval)**: Every personalized book must be proofed by the parent via WhatsApp digital draft before mechanical binding.
- **Section 10.2 (Reprint Protection)**: If a print defect occurs due to manufacturing error, a priority replacement copy must be dispatched within 48 hours at zero customer expense.

---
*Enacted by Bubbleverse Core Engineering — 2026*
