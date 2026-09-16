AI Startup Launch Team — Motion Design, Interactive Variants & Lucide Icons Guide
Add-on to: "UI/UX Forensics & Master Figma Prompt" — Dark Obsidian (#050405) + Champagne Gold (#E7D296) system Purpose: make every component in the existing Figma file into a real Interactive Component / Component Set with Smart Animate prototype wiring.

PART 1 — LUCIDE ICONS MAPPING GUIDE
Global icon rules before the mapping tables:

Size tokens: icon/sm = 16px (inline with Body/Small, chips, list rows), icon/md = 20px (buttons, nav, card headers), icon/lg = 28px (agent node centers, empty states).
Stroke weight: 1.5px at 16/20px sizes, 1.75px at 28px — Lucide's default 2px reads too heavy against your hairline-driven system; override in Figma's icon component stroke property.
Color binding: icons never get their own hardcoded color — bind to text/tertiary (default/idle), text/primary (active/hover), or accent/gold (selected/success), or the relevant status/* token. Build one Icon component with a color variant property, not per-color duplicates.
Never mix filled and outline styles — Lucide is outline-only by default; keep every icon outline-only for consistency with the hairline aesthetic. Do not substitute solid/filled icon packs anywhere.
1.1 Navbar & Global Actions
Location	Lucide icon	Size	Color state
Logo mark (if not custom SVG)	Sparkles	20	accent/gold
"Platform" nav dropdown (if used)	ChevronDown	16	text/secondary
Secondary button "View Sample Report"	FileText (leading)	16	text/primary
Primary button "Start Validation"	ChevronRight (trailing)	16	bg/void (sits on gold fill)
Mobile menu trigger	Menu → X (toggle pair)	20	text/primary
Dev/technical toggle or "API mode" affordance	Terminal	16	text/tertiary
Notification/run-status bell (dashboard header)	Bell (+ dot badge using status/warning)	20	text/secondary
Account/profile menu trigger	User or CircleUserRound	20	text/secondary
Settings/workspace menu	Settings2	18	text/tertiary
1.2 Onboarding Chat & MCQ Chips
Location	Lucide icon	Size	Color state
Assistant message avatar mark	Bot or Sparkles inside the gold-ring circle	16	accent/gold
Chat input send button	Send (or ArrowUp for a more "typed command" feel — pick one, stay consistent)	18	bg/void on gold fill
Chat input attachment/context add	Paperclip	16	text/tertiary
MCQ chip — unselected default state	none required	—	—
MCQ chip — selected state	Check (leading, inside the chip once selected)	14	bg/void
MCQ chip — "Other / custom input" trigger	Plus (leading, rotates to none once expanded into text field)	14	text/secondary
Multi-select chip group header	MessageSquare (section icon, e.g. "Tell us more")	16	text/tertiary
Step validation error inline	AlertCircle	14	status/danger
Wizard step progress label	Circle (outline, used as the tiny step dot itself, not just decorative)	8 (custom small variant)	text/tertiary / accent/gold when complete
"Back" / "Skip this step" links	ArrowLeft / ArrowRight	16	text/secondary
Field-level helper tooltip trigger	Info	14	text/tertiary
Debounced-save indicator (autosave to Supabase)	Cloud → CloudCheck (idle → saved swap)	14	text/tertiary → status/success
1.3 Five-Agent Pipeline Execution Nodes
Each agent gets one fixed, permanent icon (identity marker inside the node, always visible) — do not swap icons based on status; status is communicated by the node's fill/stroke/glow only (Part 2). This keeps the pipeline scannable at a glance across runs.

Agent	Lucide icon (identity)	Size (inside node)	Supplementary icon for card footer
Chief Orchestrator (pre-flight)	ShieldCheck	16 inside a 32px node	Eye (for "reviewing inputs" microcopy)
Market Research Agent	Globe (primary) — Search as an alternate if Globe reads too generic	16	TrendingUp (market trend callouts), Users (audience/demographics data)
Product Strategist Agent	Layers (primary) — Cpu as an alternate for a more "engineered" feel	16	ListChecks (MVP must-have list), Palette (UI vibe/design tokens block)
Pricing Agent	DollarSign (primary) — pair with Calculator for the COGS/unit-economics tool-use moment specifically	16	TrendingUp (ROI projection), Scale (LTV:CAC ratio balance visual)
Marketing Agent	Megaphone	16	Send (channel posts), Hash (tagline/copy variations)
Chief Orchestrator (synthesis / final verdict)	ShieldCheck (same as pre-flight — reinforces it's the same agent bookending the run)	16	GitMerge (compiling 4 payloads into one dashboard, optional decorative use)
Node status ring (applies to ANY agent's node — status layer, separate from identity icon)	Lucide icon	Size	Notes
Pending	none (empty hollow circle only)	—	No icon = not started yet
Active/running	Loader2 (with a rotate animation, see Part 3) OR the agent's own identity icon at full opacity with a pulsing ring	16	Prefer identity icon + pulse over a generic spinner — keeps the agent's "face" visible while it works
Complete	Check (replaces identity icon inside the node once done, or sits as a small 10px badge bottom-right of the node)	14 (badge)	Small badge overlay is cleaner than replacing the identity icon entirely
Degraded (partial data / low confidence)	AlertTriangle (small badge)	14	status/warning color
Failed	X or CircleAlert (small badge)	14	status/danger color
1.4 Dashboard Cards, Verdict Banner & Resource Links
Location	Lucide icon	Size	Color state
Reality Check Banner — Green verdict	CircleCheckBig	24	status/success
Reality Check Banner — Amber verdict	AlertTriangle	24	status/warning
Reality Check Banner — Red verdict	OctagonAlert	24	status/danger
Failure Case Study inset card	History (leading label icon, "Historical precedent")	16	text/tertiary
Sub-Agent Result Card — "view full payload" link	ChevronRight or ArrowUpRight	14	accent/gold
Sub-Agent Result Card — confidence pill (data_confidence: low)	AlertTriangle (small, inline before the word "Low")	12	status/warning
Resource / Citation List row action	ExternalLink (trailing, "Open source ↗")	14	text/tertiary → accent/gold on hover
Resource row favicon fallback (no image)	Link2	16	text/tertiary
Downloadable PDF report CTA	FileDown	16	bg/void on gold fill
Re-run workspace action	RotateCcw	16	text/secondary
Copy-to-clipboard (any payload/JSON block)	Copy → Check (toggle on click, revert after 1.5s)	14	text/tertiary → status/success
FAQ accordion trigger	Plus → X (rotate 45°, see Part 3)	16	accent/gold
Low-Information-Warning banner	TriangleAlert	18	status/warning
Empty state (no workspaces yet)	Inbox or FolderOpen	28	text/tertiary
Workspace status chip — draft	PenLine	12	text/tertiary
Workspace status chip — running	Loader2 (spin)	12	accent/gold
Workspace status chip — delivered	BadgeCheck	12	status/success
Stripe checkout / unlock CTA	Lock → LockOpen (locked state → unlocked confirmation swap)	16	text/tertiary → status/success
PART 2 — CARD & BUTTON INTERACTIVE STATES (Figma Component Variants)
Build each of the following as a Component Set with a state variant property (default / hover / pressed / focus / disabled as applicable). Use Figma's native Interactive Components (While Hovering / While Pressing triggers) so these work live in prototype mode without Smart Animate.

2.1 Primary Gold Pill Button
State	Fill	Stroke	Y-offset	Shadow/Glow	Text/Icon color	Transition
Default	accent/gold #E7D296	none	0	none	bg/void	—
Hover	accent/gold-soft #C9B98A→ actually lighten, not soften: use #EEDDAA (slightly brighter than default, +6% luminance)	none	-2px (lift up)	drop-shadow: 0 8px 24px accent/gold-glow @ 24% (glow expands outward, larger blur than resting state)	bg/void	150ms ease-out, all properties
Pressed	#DCC383 (slightly darker/desaturated, -6% luminance from default)	none	+1px (settles down, past the resting 0 point — gives tactile "push")	glow collapses to 0 2px 8px accent/gold-glow @ 15%	bg/void	80ms ease-in (snappier than hover-in, matches physical press)
Focus (keyboard)	Default fill	+2px outer stroke ring, accent/gold @ 40%, offset 2px	0	none additional	bg/void	100ms
Disabled	bg/surface-2	1px border/hairline	0	none	text/tertiary	—
Figma build note: create the glow as a separate effect layer (not the native drop-shadow property alone) if you want the blur radius itself to animate — native Figma effects can Smart-Animate their blur/spread values between variants, so this works directly with Interactive Components, no plugin needed.

2.2 Secondary Ghost Button
State	Fill	Stroke	Text color	Transition
Default	transparent	1px border/hairline-strong #43443E	text/primary	—
Hover	bg/surface-1 @ 60%	1px accent/gold @ 50%	text/primary	150ms
Pressed	bg/surface-2	1px accent/gold @ 70%	text/primary	80ms
Disabled	transparent	1px border/hairline @ 40%	text/tertiary	—
2.3 MCQ Selection Chip
State	Fill	Stroke	Text color	Icon	Transition
Default (unselected)	transparent	1px border/hairline #2A2722	text/secondary	none	—
Hover (unselected)	bg/surface-1	1px border/hairline-strong	text/primary	none	120ms
Selected	accent/gold #E7D296 (fill sweeps in — see Smart Animate note below)	none	bg/void, weight 600	Check 14px fades in, bg/void	220ms ease-out: stroke-to-fill is the signature transition — animate stroke opacity → 0 while fill opacity → 100% simultaneously, not a hard cut
Selected + Hover	#EEDDAA (brighten, same delta as button hover)	none	bg/void	Check	120ms
Disabled	transparent	1px border/hairline @ 30%	text/tertiary @ 50%	none	—
Smart Animate wiring: Default → Selected is the one micro-interaction on this whole screen worth a dedicated prototype connection (On Click, Smart Animate, 220ms, Ease Out) rather than relying on native variant hover — because the border→fill sweep plus the Check icon fade-in reads much better as an authored animation than an instant swap.

2.4 Sub-Agent Bento / Result Card
State	Background	Border	Inner image	Elevation	Transition
Default	bg/surface-1 #121110	1px border/hairline	scale 1.0, opacity 100%	none	—
Hover	bg/surface-2 #1A1815	1px border/hairline-strong, brighten further to accent/gold @ 20% on the top edge only if the card is clickable/navigable	scale 1.02× (transform-origin center), opacity unchanged	drop-shadow: 0 12px 32px #000000 @ 30% (lift off the page)	280ms ease-out, image scale should lag slightly behind border/bg (stagger image transition +40ms delay for a subtle parallax feel)
Pressed/Active (if card is a nav target)	bg/surface-2	same as hover	scale 1.01× (settles slightly from hover's 1.02×)	reduced shadow 0 4px 16px #000000 @ 25%	100ms ease-in
Focus (keyboard nav)	Default bg	2px accent/gold @ 40% outer ring, offset 2px	Default	none	100ms
2.5 Agent Status Node (pipeline tracker — special case, state-driven not hover-driven)
This component's variants are driven by pipeline data state, not user interaction — build as a Component Set with property status = pending / active / complete / degraded / failed, swapped programmatically (or manually per prototype flow) rather than via hover/press.

Status	Fill	Ring/Stroke	Icon	Animation
Pending	transparent	1.5px border/hairline-strong	none	static
Active	accent/gold	outer 32px ring accent/gold-glow @ 20%	agent identity icon, bg/void	pulsing ring: scale 1.0→1.15→1.0, opacity 40%→0%→40%, 1.6s loop, ease-in-out (see Part 3.2)
Complete	accent/gold	none	Check badge overlay, bottom-right, 10px	one-shot scale-in 0.6→1.0 with slight overshoot (spring/bounce), 300ms
Degraded	status/warning	none	AlertTriangle badge	static, no loop
Failed	status/danger	none	X badge	static, no loop
PART 3 — SCROLL & ANIMATION PROTOTYPING SPECS (Smart Animate)
General Figma prototyping setup notes before the per-section specs:

Use "After Delay" triggers chained between layers for staggers, or a single Smart Animate on page load with layers pre-offset in the "before" frame — the staggered-layer method (below) is more maintainable for a marketing page with 4+ staggered elements.
All easing curves referenced below should be built as custom Bezier curves in Figma's animation easing picker: "Ease Out" ≈ (0, 0, 0.2, 1), "Ease In-Out" ≈ (0.4, 0, 0.2, 1), "Ease In" ≈ (0.4, 0, 1, 1).
For infinite/looping animations (node pulse, spinner), Figma prototypes need two frames (A→B) with a "loop" connection back to A, or use the Smart Animate + "After Delay 0ms" self-referencing loop pattern — set both connections to the same easing/duration for a seamless loop with no visible reset snap.
3.1 Hero Section Reveal (staggered fade-in + slide-up)
Build as one Smart Animate transition from Hero/Before frame → Hero/After frame. In the Before frame, every element listed below starts at opacity: 0 and translateY: +16px (moved down 16px from resting position); in After, all sit at final position/opacity 100%. Stagger is achieved by giving each layer a different "After Delay" before the transition begins, chained in sequence:

Element	Delay before animating	Duration	Easing	Y-offset traveled
1. Eyebrow badge	0ms	400ms	Ease Out	16px → 0
2. Display H1 (all 3 lines as one block, or split per-line for extra polish)	120ms	500ms	Ease Out	16px → 0
2b. (Optional upgrade) If splitting H1 per line: Line 1 at 120ms, Line 2 at 180ms, Line 3 (gold line) at 240ms — each line's own 500ms Ease Out	—	—	—	—
3. Subhead paragraph	320ms	400ms	Ease Out	12px → 0
4. CTA button row (primary + secondary, as one group)	440ms	400ms	Ease Out	12px → 0
5. Background wireframe mesh art	0ms (starts immediately, parallel to eyebrow)	900ms	Ease Out	fades opacity 0→100% only, no Y movement — it should feel like ambient lighting turning on, not sliding in
Total sequence completes at ~840ms — keep the whole hero reveal under ~1s so the page doesn't feel sluggish on repeat visits.

3.2 Pipeline Execution Stepper (Live/Looping states)
Node pulse (Active state loop):

Two keyframe variants: Active/Pulse-A (ring scale 100%, opacity 40%) and Active/Pulse-B (ring scale 115%, opacity 0%).
Smart Animate A→B: 800ms, Ease In-Out. Then B→A: 800ms, Ease In-Out, set as the return connection to complete the loop (total loop period 1.6s).
The identity icon inside the node stays static/full-opacity throughout — only the outer glow ring pulses, so the icon reads clearly even mid-pulse.
Rail progress fill (vertical line filling gold as each agent completes):

Model the rail as two stacked layers: a full-height border/hairline-strong track (bottom layer, static) and a gold accent/gold fill layer (top layer) clipped/masked to grow from height: 0% to height: X% where X = (completed node index / total nodes).
On each agent completion event, Smart Animate the fill layer's height from its previous % to its new %, 600ms, Ease In-Out — this should visually feel like liquid rising, not a snap-fill.
Chain this with the node's own Complete-state scale-in bounce (300ms, from Part 2.5) starting simultaneously with the rail-fill animation, so the node "arriving" and the rail "catching up to it" read as one connected motion.
Parallel-branch stage (Strategist + Pricing running concurrently):

The Y-branch connector (custom SVG) should draw itself in with a stroke-dashoffset animation mimicking an SVG "line draw" effect: 500ms, Ease Out, triggered the moment Market Research completes and both parallel nodes flip to active.
Both parallel nodes pulse independently using the same 1.6s loop spec above — they do not need to be synchronized to each other.
Status badge appearance (Complete/Degraded/Failed):

Badge overlay (Check/AlertTriangle/X) enters with scale 0.6 → 1.0 plus a slight overshoot to 1.1 → 1.0 (simulate spring). If Figma's easing picker doesn't support true spring physics, approximate with two chained Smart Animate steps: 0.6→1.1 (150ms, Ease Out) then 1.1→1.0 (120ms, Ease In-Out).
3.3 Dashboard Verdict Banner (Reality Check reveal)
Banner frame itself: fade-in opacity 0→100%, 500ms, Ease Out, no slide (this component should feel like it's "already there, illuminating" rather than sliding into view — reinforces gravity/seriousness).
Background glow blur pulse (ambient ONLY, subtle — this is a slow breathing effect, not attention-grabbing):
Two keyframes on the background glow layer: Glow-A (blur 60px, opacity 15%) ↔ Glow-B (blur 90px, opacity 22%).
Smart Animate both directions at 2.4s, Ease In-Out, looped — noticeably slower than the pipeline node pulse (1.6s) so the two looping animations don't feel rhythmically identical if both are visible on screen at once (they won't be, but keep the ratio in mind if you reuse the glow technique elsewhere).
Glow color is bound to the verdict's status token (status/success / status/warning / status/danger) — build the banner as a Component Set with a verdict property, and the glow color variant swaps automatically per verdict.
Verdict icon (CircleCheckBig / AlertTriangle / OctagonAlert): enters 100ms after the banner fade starts, with the same scale-overshoot spring-approximation pattern as node status badges (Part 3.2) for consistency.
Failure Case Study inset card (Amber/Red verdicts only): slides up 8px + fades in, 400ms Ease Out, delayed 300ms after the banner itself so it reads as a secondary reveal, not simultaneous.
3.4 Page Scroll Effects
Sticky glass navbar transition:

Figma prototype: use "While Scrolling" trigger (Scroll Position trigger) on the navbar frame, or fake it with a fixed-position overlay frame + an On-Scroll-triggered Smart Animate between Nav/Transparent and Nav/Solid variants at a defined scroll threshold (e.g., 80px scrolled).
Nav/Transparent (top of page): fill bg/base @ 0%, no bottom stroke, no shadow.
Nav/Solid (scrolled): fill bg/base @ 92% (allow a hint of blur/see-through if using a background blur effect — 12px backdrop blur if your Figma plan/plugin supports it, otherwise treat as fully opaque bg/base), bottom stroke border/hairline 1px, subtle drop-shadow: 0 8px 24px #000000 @ 20%.
Transition: 250ms, Ease Out, both fill-opacity and shadow-opacity animate together.
Bottom scroll-progress bar:

Thin bar (4px height), fixed to viewport bottom edge, full width track in border/hairline, fill in accent/gold.
Bind fill width to scroll percentage — in Figma prototyping this is typically simulated with discrete anchor frames (e.g., 0% / 25% / 50% / 75% / 100% scroll checkpoints) each with the bar at the matching width, connected by Smart Animate "While Scrolling" if your Figma version supports scroll-linked triggers; otherwise document this as a dev-handoff spec (width: {scrollPercent}%, CSS transition: width 100ms linear — deliberately linear, not eased, since it should track 1:1 with physical scroll input) since true scroll-linked fills are best implemented in code rather than faked in a click-through Figma prototype.
Reuse this exact same bar component for the onboarding wizard's step-progress indicator (Part 2/1.2 above) — same visual, different data source (step count instead of scroll %).
Quick reference: build order
Create the Icon base component (16/20/28px variants, color-bound) → swap in every icon from Part 1's tables.
Turn every button/chip/card into a Component Set per Part 2's state tables, wired with Figma's native Interactive Components (hover/press) — no prototyping connections needed for these.
Build the Agent Status Node as its own Component Set (status-driven, Part 2.5), then wire the two looping animations (pulse ring, rail fill) as separate Smart Animate prototype flows per Part 3.2.
Build the Hero reveal and Verdict Banner reveal as one-shot Smart Animate sequences per Part 3.1 and 3.3.
Document the scroll-linked navbar and progress bar (Part 3.4) as dev-handoff specs alongside a best-effort click-through Figma approximation — these two are the only pieces genuinely better implemented in code than faked in Figma.