PROJECT: "AI Startup Launch Team" — dark champagne-gold SaaS design system + core screens

═══════════════════════════════════════════
1. DESIGN SYSTEM FOUNDATION
═══════════════════════════════════════════

COLOR VARIABLES (create as Figma Variables, collection "Brand/Core"):
  bg/void            #050405
  bg/base            #0A0908
  bg/surface-1       #121110
  bg/surface-2       #1A1815
  border/hairline           #2A2722  (40% opacity variant: #2A2722 @ 0.4)
  border/hairline-strong    #43443E
  text/primary       #F5F3EF
  text/secondary     #A8A49C
  text/tertiary      #6E6B64
  accent/gold        #E7D296
  accent/gold-soft   #C9B98A
  accent/gold-glow   #E7D296 (use at 10% opacity for radial background glows, 200–400px blur)
  status/success     #B9C99A   (muted sage, NOT saturated green — stay in-palette for Green verdict)
  status/warning     #D9B36C   (muted amber — Amber verdict, close kin to accent/gold but desaturated)
  status/danger      #C97A63   (muted terracotta-red — Red verdict, never pure #FF0000)
  overlay/scrim      #000000 @ 25%

GRADIENTS:
  "Corner Glow"   — radial, from accent/gold-glow (10%) at 15%,15% to transparent at 70% radius
  "Hero Vignette" — linear, bg/void (0%) top to bg/base (100%) bottom, 180deg

TEXT STYLES (font: "General Sans" or "Switzer" — geometric grotesque, rounded terminals; fallback Inter):
  Display/H1        — 72px / 700 / line-height 100% / letter-spacing -1%      → text/primary, last line variant → accent/gold
  Heading/H2        — 44px / 600 / line-height 104% / letter-spacing -0.5%
  Heading/H3        — 22px / 600 / line-height 120%
  Body/Base         — 15px / 400 / line-height 150% → text/secondary
  Body/Small        — 13px / 400 / line-height 145% → text/tertiary
  Label/Eyebrow     — 11px / 500 / UPPERCASE / letter-spacing 12% → text/tertiary
  Label/Button      — 13px / 600 / UPPERCASE / letter-spacing 8%
  Label/Numeric-Tag — 11px / 500 / tabular-nums → text/tertiary  (format "01 /")

EFFECTS:
  Card hairline: 1px inside stroke, border/hairline
  Card hover: background bg/surface-1 → bg/surface-2, 150ms
  Focus ring (inputs): 1px accent/gold border + 0 0 0 3px accent/gold-glow @ 12%
  Button primary glow (hover): drop-shadow 0 0 24px accent/gold-glow @ 20%

RADIUS SCALE:
  radius/sm  = 8   (inputs, small cards)
  radius/md  = 12  (panels, dashboard cards)
  radius/pill = 999 (buttons, badges, chips)

SPACING SCALE (8px base):
  4, 8, 12, 16, 24, 32, 48, 64, 96, 128

═══════════════════════════════════════════
2. CORE COMPONENTS
═══════════════════════════════════════════

── Navbar ──
Frame: 1280x72, auto-layout horizontal, space-between, padding 0 32, fill bg/base, bottom stroke border/hairline 1px
  Left: logo mark (24x24) + wordmark "AI Startup Launch Team" (Body/Base, 600 weight, text/primary), gap 8
  Center: nav-link group, auto-layout horizontal gap 32 — "Platform" "Pipeline" "Pricing" (Body/Small, text/secondary, hover → text/primary)
  Right: auto-layout horizontal gap 12 — Secondary Ghost Button "View Sample Report" + Primary Pill Button "Start Validation — $20"

── Button/Primary (pill) ──
Auto-layout horizontal, padding 14 28, radius/pill, fill accent/gold, Label/Button in bg/void (dark text on gold)
Hover variant: fill accent/gold-soft + glow effect above

── Button/Secondary (ghost) ──
Auto-layout horizontal, padding 14 28, radius/pill, stroke border/hairline-strong 1px, fill transparent, Label/Button in text/primary

── Badge/Eyebrow Pill ──
Auto-layout horizontal, padding 8 16, radius/pill, stroke border/hairline 1px, fill transparent, Label/Eyebrow centered

── Hero Section ──
Frame: 1280x760, auto-layout vertical, centered, gap 24, fill bg/void with "Corner Glow" gradient overlay top-right
  Badge/Eyebrow: "CURATED MULTI-AGENT VALIDATION"
  Display/H1, 3 manual line breaks, centered, max-width 760:
     Line 1 "Your idea."        → text/primary
     Line 2 "Your evidence."    → text/primary
     Line 3 "Your verdict."     → accent/gold
  Body/Base subhead, max-width 520, centered, text/secondary: "Every claim tested against live market data, unit economics, and startup failure precedent before you write a line of code."
  Button row: Primary Pill "Start Validation — $20"  +  text link "See a sample dashboard →" (Body/Small, text/secondary)
  Background asset: full-bleed SVG wireframe topographic mesh, anchored bottom, gold particle stroke on transparent, height ~340, bleeding past frame edges L/R

── Conversational Chat Box (onboarding wizard shell) ──
Frame: 720px wide, auto-layout vertical, gap 16, fill bg/surface-1, radius/md, stroke border/hairline 1px, padding 32
  Top: Label/Eyebrow "STEP 2 OF 5 — AUDIENCE" + thin progress bar (4px height, radius/pill, track border/hairline, fill accent/gold, width = %complete) — pinned full-width below eyebrow
  Assistant message bubble: fill bg/surface-2, radius/md, padding 16, Body/Base text/primary, max-width 85%, left-aligned, small avatar mark (20x20 gold-ring circle) top-left
  Input row (bottom, sticky): auto-layout horizontal, gap 8 —
     Text input: flex-grow, fill bg/base, stroke border/hairline 1px→accent/gold on focus, radius/sm, padding 12 16, Body/Base placeholder text/tertiary
     Send button: 44x44 square, radius/sm, fill accent/gold, centered arrow icon in bg/void

── Dynamic MCQ Chip Group ──
Auto-layout horizontal, wrap, gap 8
  Chip (unselected): auto-layout horizontal, padding 10 18, radius/pill, stroke border/hairline-strong 1px, fill transparent, Body/Small text/secondary
  Chip (selected): same shape, fill accent/gold, text in bg/void, weight 600
  Chip (custom-input trigger, e.g. "Other…"): dashed stroke border/hairline-strong, text/tertiary, opens inline text field on click

── Agent Status Card (pipeline execution tracker) ──
Full-width panel, fill bg/surface-1, radius/md, stroke border/hairline 1px, padding 32
Layout: vertical rail (left, 2px width, x=48) with 5 circular nodes (16px diameter) spaced evenly, connected by the rail line:
  Node states (Figma component variants):
     "pending"   → hollow circle, stroke border/hairline-strong, no fill
     "active"    → filled accent/gold, animated glow ring (outer 32px circle, accent/gold-glow 20%)
     "complete"  → filled accent/gold, small checkmark glyph in bg/void
     "degraded"  → filled status/warning, small "!" glyph
     "failed"    → filled status/danger, small "×" glyph
  Each node row (to the right of its node): Label/Numeric-Tag ("01") + Heading/H3 (agent name: "Market Research Agent") + Body/Small status line (text/tertiary: "Analyzing 4 competitors via live SERP data…") + optional elapsed-time chip (top-right, Body/Small, text/tertiary, tabular-nums)
  Parallel-stage variant: two nodes rendered at the same vertical position, rail splits into a Y-branch (use a custom SVG connector, gold stroke 1px, 60% opacity)

── Sub-Agent Result Card (3-up grid, dashboard) ──
Frame: 380x420, auto-layout vertical, fill bg/surface-1, radius/md, stroke border/hairline 1px, overflow hidden
  Visual area: top 65% height, fill bg/void, contains agent-specific generative SVG motif (see mapping table) centered, gold stroke, low opacity ambient glow behind
  Content area: padding 24, gap 8 —
     Label/Numeric-Tag + Label/Eyebrow inline ("01 / MARKET RESEARCH")
     Heading/H3 (e.g. "Competitive Landscape: Amber Risk")
     Body/Small, 2-line clamp, text/secondary
     Footer row: confidence pill (Badge/Eyebrow variant using status color) + "View full payload →" text link

── Reality Check Banner (Orchestrator verdict — hero of the dashboard) ──
Full-width frame, min-height 320, fill bg/void, radius/md, stroke 1px in the matching status color @ 30%, padding 48
  Uses overlay/scrim (25%) over a desaturated abstract background texture (reserve the "moody photographic" treatment here only)
  Content, centered vertically, left-aligned, max-width 640:
     Label/Eyebrow: "VALIDATION VERDICT"
     Display/H1 scaled to 48px: "Amber" in status/warning color, followed by Body/Base reasoning text
     Failure Case Study sub-block: Body/Small text/tertiary, cites matched historical failure (e.g. "Structural pattern matches Kozmo (1999–2001): ...") inside a bordered inset card, radius/sm, stroke border/hairline

── Pricing / Unlock Panel ──
Single continuous frame, 3 equal columns, NO gap between columns (seamless bento technique), fill bg/surface-1, radius/md, internal 1px vertical dividers border/hairline
  Each column, padding 32, vertical auto-layout gap 12:
     Label/Numeric-Tag + Label/Eyebrow ("01 / PREVIEW")
     Heading/H3 (tier name: "Free Preview" / "Full Unlock" / "Re-run")
     Price line: Heading/H2 scaled 28px ("$0" / "$20" / "$10")
     Body/Small description, 2 lines, text/secondary
     Text-link CTA (not a filled button — lower emphasis), Body/Small, accent/gold, weight 600, "Get started →"

── Resource / Citation List Row ──
Auto-layout horizontal, space-between, padding 20 0, bottom stroke border/hairline 1px
  Left: Label/Numeric-Tag + Body/Base text/primary (source title)
  Right: Body/Small text/tertiary action label ("Open source ↗")

── FAQ Accordion Cell ──
2x2 grid, each cell: padding 24, stroke border/hairline 1px, fill bg/surface-1
  Header row: Body/Base text/primary question + "+" icon (rotates 45° to "×" on expand) in accent/gold
  Expanded body: Body/Small text/secondary, 200ms height transition

═══════════════════════════════════════════
3. SCREEN FRAMES TO BUILD (Desktop 1440, Mobile 390)
═══════════════════════════════════════════

1. Landing Page — Navbar, Hero, Bento Feature Grid (4x2, "Architecture / Evidence / Policy / Cost / Security / Reliability" → relabel to product's own pillars: "Market Truth / Product Focus / Unit Economics / Go-To-Market"), 3-up Sub-Agent teaser cards, Vertical Timeline ("How validation works" 4-step), Pricing Panel, Footer (with giant low-opacity wordmark)
2. Onboarding Wizard — Chat Box shell, MCQ Chip Group states, step progress bar, mobile-responsive stacked variant
3. Pipeline Execution Tracker (full-screen "running" state) — Agent Status Card at full width, live elapsed-timer, Supabase-Realtime-style incremental reveal states
4. Compiled Dashboard — Reality Check Banner at top, 4x Sub-Agent Result Cards below in a responsive grid, Resource/Citation List, downloadable-PDF CTA
5. Checkout / Unlock Screen — Pricing Panel (3-column: Preview / Unlock / Re-run), Stripe-style form fields reusing the Chat Box input styling
6. FAQ / Low-Information-Warning explainer — 2x2 Accordion grid + inline warning banner variant (status/warning bordered card)

Build all frames using AUTO-LAYOUT throughout (no absolute positioning except background SVG art layers). Every text layer must be bound to the Text Styles above; every color must be bound to the Color Variables above — no hardcoded hex values on any layer, so the whole system can be re-themed from one place later.