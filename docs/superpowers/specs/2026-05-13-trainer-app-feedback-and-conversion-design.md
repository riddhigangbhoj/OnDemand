# Trainer-app: Goal, Conclusion, Rating & Conversion Flag

**Date:** 2026-05-13
**Scope:** `trainer.html` and `trainer.css` only. Admin-panel changes are out of scope for this iteration and captured at the bottom as follow-up.

## Overview

Extend the existing trainer mobile prototype so a trainer can:

1. Capture the client's rehab goal during assessment.
2. Pick exercises from a curated dropdown (with "Other" for new entries).
3. Record whether the goal was achieved at the end of the session.
4. Rate the client and leave optional feedback after End-OTP, privately.
5. Flag a client as a likely subscription lead.

All header rows across the in-session screens are updated to show `Age · Gender` underneath the client name, with the existing date/time on a third line.

## Current flow (for context)

`Home → Session details → Start-OTP → Assessment → Session (with End-OTP) → Send report → Home`

The four in-session screens (`Session details`, `Start-OTP`, `Assessment`, `Session`) all share a `detail-head` block today with name + date/time.

## Changes by screen

### A. Detail-head header rewrite (all 4 in-session screens)

Replace the current two-line `detail-head` (name + date·time) with three lines:

```
Riya Sharma                    ← .detail-name (unchanged)
32 · Female                    ← .detail-bio (NEW)
Wed, May 13, 2026 · 10:30 AM   ← .detail-when (unchanged content, now line 3)
```

- Hardcoded demo data: `32 · Female` for Riya Sharma.
- The bio line uses a slightly muted style, similar to `.detail-when`, but visually distinct so the two lines don't blur together.
- Applied identically on `Session details`, `Start-OTP`, `Assessment`, and `Session` screens.

### B. Assessment screen — add Goal block (top)

Insert a **Goal** block as the first `detail-section` on the Assessment screen, above Muscle power.

- Label: `Goal` (no optional tag — encouraged, but not blocked).
- Single `<textarea class="session-textarea">`, ~3 rows.
- Placeholder: *"What does the client want to achieve from this rehab plan?"*
- Demo pre-fill: *"Walk pain-free for 30 minutes within 6 weeks; reduce morning back stiffness."*
- Stored on the DOM (read by the PDF generator); not gating the Continue button.

### C. Session screen — Exercise dropdown with "Other"

Replace the free-text `Exercise name` input in the "Add exercise" form (`data-form="exercise"`) with a `<select>` dropdown.

Preset list (grouped by type via `<optgroup>`):

- **Mobility** — Cat-Cow stretch, Bird Dog, Thread the Needle, Hip CARs
- **Strengthening** — Glute bridge, Plank, Dead bug, Wall sit, Clamshell
- **Stretching** — Hamstring stretch, Piriformis stretch, Child's pose, Cobra
- **Balance** — Single-leg stand, Heel-to-toe walk, Bosu squat
- **Other…** (final option)

Behavior:

- Selecting a preset auto-fills the **Type** field with that exercise's category and makes it read-only.
- Selecting **Other…** reveals a free-text Name input, clears Type, and makes Type editable again.
- Reps remains a free-text input in both flows.
- Each preset's name → type mapping is held in a small in-script lookup map.

### D. Session screen — Conclusion block

Insert a new **Conclusion** `detail-section` after the **Recommendations** block and before the End-OTP card.

Two parts:

1. **Goal outcome** (required) — three pill-style buttons, single selection: `Achieved`, `Partially achieved`, `Not achieved`. Reuse the visual pattern of the muscle-power-row but with three larger pills.
2. **Notes** (optional) — `<textarea class="session-textarea">`, 3 rows. Placeholder: *"What did the client manage today? Anything that affected progress?"*

### E. Session screen — Rating, Feedback, and Conversion flag

Insert a new `detail-section` **after** the End-OTP card and **before** the Send-report CTA.

Components:

1. **Rate this client** (required) — label: *"How was the client today?"*. Five tappable star icons. Filled-state when selected; tapping star N fills 1..N. Stored as a `data-rating="N"` attribute.
2. **Feedback** (optional) — `<textarea class="session-textarea">`, 3 rows. Placeholder: *"Anything to note? (Won't be shared with the client.)"*
3. **Conversion-lead flag** — a togglable chip below the textarea: `⚑ Mark as conversion lead`. Toggling switches between un-flagged (outline style) and flagged (filled style with a check). Stored as a `data-conversion-flag="true|false"` attribute on the chip.

### F. Send-report gating

The `data-download-pdf` button is enabled only when **all** of the following are true:

- End-OTP is verified (already wired today)
- A goal-outcome pill is selected on the Conclusion block
- A star rating ≥ 1 is set

Until then, the button stays disabled (existing visual disabled style). No popup / no alert — just disabled state.

### G. PDF report — append new sections

The existing `generateSessionPDF()` is extended to append, in order, after the current "Special test" section:

1. **Goal** — from the Assessment screen textarea
2. **Conclusion** — selected outcome pill + notes textarea
3. **Trainer rating** — number of stars (e.g. `4 / 5`) + feedback textarea content if any
4. **Conversion flag** — only included if flagged: a single line "Flagged as potential subscription lead"

No layout rework — same `section()` / `body()` helpers as the rest of the report.

## Data & persistence

This is a static demo with no backend. All new state lives as DOM attributes / textarea values, read on the fly when the PDF is generated. No `localStorage`, no cross-page sync between `trainer.html` and `index.html`.

## What we are NOT doing

- No backend / API / network calls.
- No new screens — all additions are inline within existing screens.
- No edits to home / alerts / pending-plans sections of the trainer app.
- No edits to `index.html` or `styles.css` (admin panel) in this iteration.
- No localStorage or sync between trainer-app demo and admin-panel demo.

## Follow-up (admin panel — not in this iteration)

When we come back to the admin panel:

- Add a small **"Lead"** badge next to the client name in the Active clients list for any client whose latest session has the conversion flag set. Style matches existing alert pills.
- Add a filter chip on the Active tab — `Show conversion leads only` — that hides un-flagged rows.
- Demo: hardcode 1–2 existing clients with the badge so the filter is visible without running the trainer flow.

These changes apply to `index.html` and `styles.css` and are deferred.

## Visual / structural assumptions

- All new blocks reuse existing `.detail-section`, `.session-textarea`, and pill-button patterns where possible. New CSS is limited to:
  - `.detail-bio` for the new age/gender line
  - `.outcome-pill-row` + `.outcome-pill` for the three Conclusion pills
  - `.rating-stars` + `.rating-star` for the 5-star control
  - `.conversion-flag-chip` for the flag toggle

## Open assumptions worth flagging

- Hardcoded demo values (age `32`, gender `Female`, pre-filled goal) live in the HTML; real wiring is a follow-up.
- Star rating is purely visual (numeric value only); no half-stars.
- "Required" gating is enforced only by the Send-report button being disabled; no inline error messages.
