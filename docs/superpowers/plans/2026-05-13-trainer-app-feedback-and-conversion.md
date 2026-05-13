# Trainer-app: Goal, Conclusion, Rating & Conversion Flag — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the trainer mobile prototype so a trainer can capture the rehab goal at assessment, pick exercises from a curated dropdown, mark goal-outcome at the end, rate the client privately after End-OTP, and flag potential subscription leads. Send-report is gated on those required fields. Updated PDF includes the new sections.

**Architecture:** All edits happen in `trainer.html` and `trainer.css`. State lives as DOM attributes / textarea values, read on the fly when the PDF is generated. No backend, no localStorage, no admin-panel changes (deferred). The existing patterns (`.detail-section`, `.session-textarea`, `.muscle-power-row`-style pill rows, `.otp-card` gating) are reused; only a small amount of new CSS is added.

**Tech Stack:** Plain HTML / CSS / vanilla JS. PDF via jsPDF (already loaded). No build step. Manual browser verification (no test framework).

**Verification approach:** This is a static prototype with no test framework. Each task ends with an explicit "verify in browser" step listing exactly what to click and what to see. Open `trainer.html` in a browser (e.g. `open trainer.html` on macOS or with a local server) and step through the flow.

---

## File map

- **Modify** `trainer.html` — header rewrites (4 places), Goal block in Assessment, Exercise dropdown swap + new JS lookup, Conclusion block + JS, Rating/Feedback/Flag block + JS, Send-report gating update, PDF generator extension
- **Modify** `trainer.css` — add `.detail-bio`, `.outcome-pill-row` + `.outcome-pill`, `.rating-stars` + `.rating-star`, `.conversion-flag-chip`

No new files.

---

## Task 1: Three-line header (name / age·gender / date·time) on all 4 in-session screens

**Files:**
- Modify: `trainer.html` (4 `.detail-head` blocks: Session details, Start-OTP, Assessment, Session — currently around lines 153-160, 229-236, 275-282, 426-433)
- Modify: `trainer.css` (add `.detail-bio` rule near the existing `.detail-when` rule)

- [ ] **Step 1: Add `.detail-bio` CSS rule to `trainer.css`**

Find the existing `.detail-when` rule in `trainer.css` (it sets the muted date-time line under the name). Immediately after it, add:

```css
.detail-bio {
  margin-top: 2px;
  color: #2b2b2b;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.1px;
}
```

- [ ] **Step 2: Add `.detail-bio` line to the Session-details `.detail-head` block in `trainer.html`**

Locate the Session-details `.detail-head` block (around lines 153-160):

```html
<div class="detail-head">
  <h2 class="detail-name">Riya Sharma</h2>
  <div class="detail-when">
    <span>Wed, May 13, 2026</span>
    <span class="detail-when-sep">·</span>
    <span>10:30 AM</span>
  </div>
</div>
```

Insert a new `.detail-bio` line between `.detail-name` and `.detail-when`:

```html
<div class="detail-head">
  <h2 class="detail-name">Riya Sharma</h2>
  <div class="detail-bio">32 · Female</div>
  <div class="detail-when">
    <span>Wed, May 13, 2026</span>
    <span class="detail-when-sep">·</span>
    <span>10:30 AM</span>
  </div>
</div>
```

- [ ] **Step 3: Apply the same change to the Start-OTP, Assessment, and Session screens**

Apply the identical insertion (new `<div class="detail-bio">32 · Female</div>` between `.detail-name` and `.detail-when`) in three more places:

1. Start-OTP screen `.detail-head` (around lines 229-236)
2. Session screen `.detail-head` (around lines 275-282)
3. Assessment (`screen-examination`) `.detail-head` (around lines 426-433)

After this step, all four in-session screens show three lines: Name, Age · Gender, Date · Time.

- [ ] **Step 4: Verify in browser**

1. Open `trainer.html` in a browser.
2. From Home, tap Riya Sharma's session card. **See:** "Riya Sharma" / "32 · Female" / "Wed, May 13, 2026 · 10:30 AM" stacked.
3. Tap "Start session" → Start-OTP screen. **Same three-line header.**
4. Type any 4 digits, tap "Verify & start assessment" → Assessment screen. **Same three-line header.**
5. Tap "Continue to session" → Session screen. **Same three-line header.**

- [ ] **Step 5: Commit**

```bash
git add trainer.html trainer.css
git commit -m "Add age/gender line under client name on in-session screens"
```

---

## Task 2: Goal block at top of Assessment screen

**Files:**
- Modify: `trainer.html` (Assessment screen — insert a new `.detail-section` before the Muscle-power section, around line 436)

- [ ] **Step 1: Insert the Goal block as the first `.detail-section` of the Assessment screen**

Find the Assessment screen's first `.detail-section` (the Muscle-power block, around line 436). Immediately above it (still inside `.screen-content`, after the closing `</div>` of `.detail-head`), insert:

```html
<!-- Goal -->
<div class="detail-section">
  <span class="detail-label">Goal</span>
  <textarea class="session-textarea" rows="3" placeholder="What does the client want to achieve from this rehab plan?">Walk pain-free for 30 minutes within 6 weeks; reduce morning back stiffness.</textarea>
</div>
```

- [ ] **Step 2: Verify in browser**

1. Reload `trainer.html`.
2. Navigate Home → Riya Sharma → Start session → Verify start (any 4 digits) → land on Assessment.
3. **See:** "Goal" label at the top with a textarea pre-filled with "Walk pain-free for 30 minutes within 6 weeks; reduce morning back stiffness." Above Muscle power.
4. Edit the textarea — text should be editable.

- [ ] **Step 3: Commit**

```bash
git add trainer.html
git commit -m "Add Goal block at top of Assessment screen"
```

---

## Task 3: Exercise dropdown with "Other" in Add-exercise form

**Files:**
- Modify: `trainer.html` (the Add-exercise form `data-form="exercise"` around lines 348-356, plus the `data-form-save="exercise"` JS handler around lines 870-903)

- [ ] **Step 1: Replace the free-text Name input with a `<select>` dropdown in the Add-exercise form**

Find the Add-exercise form (around lines 348-356):

```html
<div class="add-form add-form-stack" data-form="exercise" hidden>
  <input type="text" class="add-form-input exercise-form-name" placeholder="Exercise name (e.g. Plank)" />
  <input type="text" class="add-form-input exercise-form-type" placeholder="Type (e.g. Stability)" />
  <input type="text" class="add-form-input exercise-form-reps" placeholder="Reps (e.g. 3 sets × 30 s)" />
  <div class="add-form-actions">
    <button type="button" class="add-form-cancel" data-form-cancel="exercise">Cancel</button>
    <button type="button" class="add-form-save" data-form-save="exercise">Add exercise</button>
  </div>
</div>
```

Replace it with this version that uses a `<select>` for the name and adds an `exercise-form-name-other` free-text input that's hidden by default:

```html
<div class="add-form add-form-stack" data-form="exercise" hidden>
  <select class="add-form-input exercise-form-name-select">
    <option value="" disabled selected>Choose an exercise…</option>
    <optgroup label="Mobility">
      <option value="Cat-Cow stretch">Cat-Cow stretch</option>
      <option value="Bird Dog">Bird Dog</option>
      <option value="Thread the Needle">Thread the Needle</option>
      <option value="Hip CARs">Hip CARs</option>
    </optgroup>
    <optgroup label="Strengthening">
      <option value="Glute bridge">Glute bridge</option>
      <option value="Plank">Plank</option>
      <option value="Dead bug">Dead bug</option>
      <option value="Wall sit">Wall sit</option>
      <option value="Clamshell">Clamshell</option>
    </optgroup>
    <optgroup label="Stretching">
      <option value="Hamstring stretch">Hamstring stretch</option>
      <option value="Piriformis stretch">Piriformis stretch</option>
      <option value="Child's pose">Child's pose</option>
      <option value="Cobra">Cobra</option>
    </optgroup>
    <optgroup label="Balance">
      <option value="Single-leg stand">Single-leg stand</option>
      <option value="Heel-to-toe walk">Heel-to-toe walk</option>
      <option value="Bosu squat">Bosu squat</option>
    </optgroup>
    <option value="__other__">Other…</option>
  </select>
  <input type="text" class="add-form-input exercise-form-name-other" placeholder="Exercise name" hidden />
  <input type="text" class="add-form-input exercise-form-type" placeholder="Type (e.g. Stability)" />
  <input type="text" class="add-form-input exercise-form-reps" placeholder="Reps (e.g. 3 sets × 30 s)" />
  <div class="add-form-actions">
    <button type="button" class="add-form-cancel" data-form-cancel="exercise">Cancel</button>
    <button type="button" class="add-form-save" data-form-save="exercise">Add exercise</button>
  </div>
</div>
```

- [ ] **Step 2: Add the preset → type lookup map and dropdown change handler in the inline `<script>`**

In the inline `<script>` block of `trainer.html`, near the top of the script (just inside the `<script>` opening tag, before the existing nav code) add:

```javascript
// Preset exercise → type lookup
const EXERCISE_PRESETS = {
  'Cat-Cow stretch': 'Mobility',
  'Bird Dog': 'Mobility',
  'Thread the Needle': 'Mobility',
  'Hip CARs': 'Mobility',
  'Glute bridge': 'Strengthening',
  'Plank': 'Strengthening',
  'Dead bug': 'Strengthening',
  'Wall sit': 'Strengthening',
  'Clamshell': 'Strengthening',
  'Hamstring stretch': 'Stretching',
  'Piriformis stretch': 'Stretching',
  "Child's pose": 'Stretching',
  'Cobra': 'Stretching',
  'Single-leg stand': 'Balance',
  'Heel-to-toe walk': 'Balance',
  'Bosu squat': 'Balance',
};
```

Then, further down in the same script — inside the `document.addEventListener('click', (e) => { ... })` is for clicks; for `change` we need a separate listener. Add this near the bottom of the inline `<script>` (after the existing exercise-save handler):

```javascript
// Exercise dropdown: auto-fill Type or reveal Other input
document.addEventListener('change', (e) => {
  const sel = e.target.closest('.exercise-form-name-select');
  if (!sel) return;
  const form = sel.closest('[data-form="exercise"]');
  const otherInput = form.querySelector('.exercise-form-name-other');
  const typeInput = form.querySelector('.exercise-form-type');
  if (sel.value === '__other__') {
    otherInput.hidden = false;
    otherInput.value = '';
    otherInput.focus();
    typeInput.readOnly = false;
    typeInput.value = '';
  } else {
    otherInput.hidden = true;
    otherInput.value = '';
    typeInput.value = EXERCISE_PRESETS[sel.value] || '';
    typeInput.readOnly = true;
  }
});
```

- [ ] **Step 3: Update the Save handler to read from either the dropdown or the Other input**

Find the existing exercise-save handler (around lines 870-903 — the block starting `const exSave = e.target.closest('[data-form-save="exercise"]');`). Replace just the lines that read `name`, `type`, `reps` — currently:

```javascript
const exSave = e.target.closest('[data-form-save="exercise"]');
if (exSave) {
  const form = exSave.closest('[data-form="exercise"]');
  const name = form.querySelector('.exercise-form-name').value.trim();
  const type = form.querySelector('.exercise-form-type').value.trim();
  const reps = form.querySelector('.exercise-form-reps').value.trim();
  if (!name) { form.querySelector('.exercise-form-name').focus(); return; }
```

Change those four lines to read from the dropdown / other input:

```javascript
const exSave = e.target.closest('[data-form-save="exercise"]');
if (exSave) {
  const form = exSave.closest('[data-form="exercise"]');
  const sel = form.querySelector('.exercise-form-name-select');
  const otherInput = form.querySelector('.exercise-form-name-other');
  const name = (sel.value === '__other__' ? otherInput.value : sel.value).trim();
  const type = form.querySelector('.exercise-form-type').value.trim();
  const reps = form.querySelector('.exercise-form-reps').value.trim();
  if (!name) {
    if (sel.value === '__other__') otherInput.focus(); else sel.focus();
    return;
  }
```

Also, in the same block, the existing reset code is:

```javascript
form.querySelectorAll('input').forEach((i) => (i.value = ''));
form.hidden = true;
```

Replace it with a reset that also handles the dropdown and Other input:

```javascript
form.querySelectorAll('input').forEach((i) => (i.value = ''));
sel.value = '';
otherInput.hidden = true;
form.querySelector('.exercise-form-type').readOnly = false;
form.hidden = true;
```

- [ ] **Step 4: Verify in browser**

1. Reload `trainer.html`.
2. Go through the flow to the Session screen.
3. Tap "Add exercise" — form expands. **See:** dropdown placeholder "Choose an exercise…", grouped options.
4. Pick **Plank** — Type field auto-fills with "Strengthening" and goes read-only.
5. Type Reps "3 sets × 30 s" and tap "Add exercise" — new row appears in the list ("Plank · Strengthening · 3 sets × 30 s").
6. Tap "Add exercise" again. Pick **Other…** — a free-text Name input appears below the dropdown, Type clears and is editable again.
7. Type "Yoga twist" + "Mobility" + "2 sets × 8 reps", tap "Add exercise" — new row appears.

- [ ] **Step 5: Commit**

```bash
git add trainer.html
git commit -m "Add exercise dropdown with preset list and Other option"
```

---

## Task 4: Conclusion block on Session screen (outcome pills + notes)

**Files:**
- Modify: `trainer.html` (Session screen — insert a new `.detail-section` between Recommendations and the End-OTP card, around line 383)
- Modify: `trainer.css` (add `.outcome-pill-row` + `.outcome-pill` styles)

- [ ] **Step 1: Add `.outcome-pill-row` and `.outcome-pill` CSS to `trainer.css`**

Append to `trainer.css` (location: anywhere after `.muscle-power-row`):

```css
.outcome-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
  margin-bottom: 8px;
}
.outcome-pill {
  flex: 1 1 auto;
  min-width: 0;
  padding: 9px 12px;
  border-radius: 999px;
  border: 1px solid #d6d6d6;
  background: #fff;
  color: #2b2b2b;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease, color 120ms ease;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}
.outcome-pill:hover { border-color: #b9b9b9; }
.outcome-pill.active {
  background: #111;
  border-color: #111;
  color: #fff;
}
```

- [ ] **Step 2: Insert the Conclusion block between Recommendations and End-OTP**

Find the End-OTP comment in `trainer.html` (around line 383: `<!-- End OTP — required before downloading the report -->`). Immediately **above** that comment (and below the Recommendations `</div>`), insert:

```html
<!-- Conclusion -->
<div class="detail-section">
  <span class="detail-label">Conclusion</span>
  <div class="outcome-pill-row" id="outcome-pill-row">
    <button type="button" class="outcome-pill" data-outcome="achieved">Achieved</button>
    <button type="button" class="outcome-pill" data-outcome="partial">Partially achieved</button>
    <button type="button" class="outcome-pill" data-outcome="not">Not achieved</button>
  </div>
  <textarea class="session-textarea" id="conclusion-notes" rows="3" placeholder="What did the client manage today? Anything that affected progress?"></textarea>
</div>
```

- [ ] **Step 3: Wire up the outcome-pill selection in the inline `<script>`**

Add this near the bottom of the inline `<script>` (after the muscle-power picker block, around the existing `// Muscle-power picker` section):

```javascript
// Conclusion outcome picker (single selection)
document.querySelectorAll('.outcome-pill').forEach((btn) => {
  btn.addEventListener('click', () => {
    const row = btn.closest('.outcome-pill-row');
    row?.querySelectorAll('.outcome-pill').forEach((b) => b.classList.toggle('active', b === btn));
    refreshSendReportEnabled();
  });
});
```

(`refreshSendReportEnabled` is defined in Task 6. For now this call is a forward reference — define a stub above the listener so reload doesn't error:)

```javascript
function refreshSendReportEnabled() { /* implemented in Task 6 */ }
```

Place that stub once, near the top of the inline script. Task 6 will replace it with the real version.

- [ ] **Step 4: Verify in browser**

1. Reload `trainer.html`.
2. Navigate to the Session screen.
3. Scroll past Recommendations. **See:** "Conclusion" label, three pills ("Achieved", "Partially achieved", "Not achieved"), and a notes textarea.
4. Tap each pill — only one stays highlighted (black) at a time.
5. Type a note in the textarea — should accept input.

- [ ] **Step 5: Commit**

```bash
git add trainer.html trainer.css
git commit -m "Add Conclusion block with outcome pills and notes"
```

---

## Task 5: Rating + Feedback + Conversion-flag block (after End-OTP, before Send-report)

**Files:**
- Modify: `trainer.html` (Session screen — insert a new `.detail-section` between the End-OTP `.otp-card` and the `.detail-cta` Send-report block, around line 401)
- Modify: `trainer.css` (add `.rating-stars`, `.rating-star`, `.conversion-flag-chip`)

- [ ] **Step 1: Add CSS for stars and the conversion-flag chip**

Append to `trainer.css`:

```css
.rating-stars {
  display: flex;
  gap: 6px;
  margin-top: 6px;
  margin-bottom: 12px;
}
.rating-star {
  background: none;
  border: none;
  padding: 2px 4px;
  cursor: pointer;
  font-size: 28px;
  line-height: 1;
  color: #d6d6d6;
  transition: color 120ms ease, transform 80ms ease;
}
.rating-star:hover { transform: scale(1.05); }
.rating-star.filled { color: #f5a524; }

.conversion-flag-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 9px 14px;
  border-radius: 999px;
  border: 1px solid #d6d6d6;
  background: #fff;
  color: #2b2b2b;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease, color 120ms ease;
}
.conversion-flag-chip:hover { border-color: #b9b9b9; }
.conversion-flag-chip[data-flagged="true"] {
  background: #fff5e6;
  border-color: #f5a524;
  color: #8a4f00;
}
.conversion-flag-icon { font-size: 14px; line-height: 1; }
```

- [ ] **Step 2: Insert the Rating block between End-OTP and Send-report**

In `trainer.html`, find the closing `</div>` of the End-OTP `.otp-card` (the one with `data-otp="end"`) — it's right above the `.detail-cta` block (around line 401-402). Insert this block between them:

```html
<!-- Trainer rating, feedback, and conversion flag -->
<div class="detail-section" id="trainer-rating-block">
  <span class="detail-label">How was the client today?</span>
  <div class="rating-stars" id="rating-stars" data-rating="0">
    <button type="button" class="rating-star" data-star="1" aria-label="1 star">★</button>
    <button type="button" class="rating-star" data-star="2" aria-label="2 stars">★</button>
    <button type="button" class="rating-star" data-star="3" aria-label="3 stars">★</button>
    <button type="button" class="rating-star" data-star="4" aria-label="4 stars">★</button>
    <button type="button" class="rating-star" data-star="5" aria-label="5 stars">★</button>
  </div>
  <textarea class="session-textarea" id="trainer-feedback" rows="3" placeholder="Anything to note? (Won't be shared with the client.)"></textarea>
  <button type="button" class="conversion-flag-chip" id="conversion-flag" data-flagged="false">
    <span class="conversion-flag-icon" aria-hidden="true">⚑</span>
    <span class="conversion-flag-label">Mark as conversion lead</span>
  </button>
</div>
```

- [ ] **Step 3: Wire star-rating and flag-toggle in the inline `<script>`**

Add this near the bottom of the inline `<script>`:

```javascript
// Star rating (1–5)
document.querySelectorAll('#rating-stars .rating-star').forEach((star) => {
  star.addEventListener('click', () => {
    const row = star.closest('#rating-stars');
    const value = Number(star.dataset.star);
    row.dataset.rating = String(value);
    row.querySelectorAll('.rating-star').forEach((s) => {
      s.classList.toggle('filled', Number(s.dataset.star) <= value);
    });
    refreshSendReportEnabled();
  });
});

// Conversion-lead flag toggle
const flagBtn = document.getElementById('conversion-flag');
if (flagBtn) {
  flagBtn.addEventListener('click', () => {
    const flagged = flagBtn.dataset.flagged === 'true';
    flagBtn.dataset.flagged = flagged ? 'false' : 'true';
    const label = flagBtn.querySelector('.conversion-flag-label');
    if (label) label.textContent = flagged ? 'Mark as conversion lead' : 'Flagged as conversion lead ✓';
  });
}
```

- [ ] **Step 4: Verify in browser**

1. Reload `trainer.html`.
2. Navigate Home → Riya Sharma → Start session → verify start → Continue to session → land on Session screen.
3. Scroll to the bottom. **See:** End-OTP card, then "How was the client today?" with 5 grey stars, a feedback textarea, and a `⚑ Mark as conversion lead` chip — all above the disabled "Send report" button.
4. Tap star 4 — stars 1–4 fill orange, star 5 stays grey.
5. Tap star 2 — stars 1–2 filled, 3–5 grey.
6. Tap the flag chip — turns highlighted, label becomes "Flagged as conversion lead ✓". Tap again — reverts.
7. Type some text in the feedback textarea — accepts input.

- [ ] **Step 5: Commit**

```bash
git add trainer.html trainer.css
git commit -m "Add trainer rating, feedback, and conversion-flag block"
```

---

## Task 6: Send-report gating (End-OTP + outcome pill + rating ≥ 1)

**Files:**
- Modify: `trainer.html` (replace the `refreshSendReportEnabled` stub from Task 4 and update the End-OTP verification flow to call it)

- [ ] **Step 1: Replace the `refreshSendReportEnabled` stub with the real implementation**

Find the stub `function refreshSendReportEnabled() { /* implemented in Task 6 */ }` from Task 4. Replace it with:

```javascript
function refreshSendReportEnabled() {
  const endCard = document.querySelector('.otp-card[data-otp="end"]');
  const endVerified = endCard?.dataset.verified === 'true';
  const outcomeChosen = !!document.querySelector('#outcome-pill-row .outcome-pill.active');
  const ratingRow = document.getElementById('rating-stars');
  const ratingValue = Number(ratingRow?.dataset.rating || '0');
  const ready = endVerified && outcomeChosen && ratingValue >= 1;
  document.querySelectorAll('[data-download-pdf]').forEach((btn) => {
    btn.disabled = !ready;
  });
}
```

- [ ] **Step 2: Call `refreshSendReportEnabled` from the End-OTP verify flow**

Find the existing `verifyOTP` function. At its very end (after the `document.querySelectorAll(selector).forEach(...)` line that re-enables the data-needs-end-verify buttons), add a single line:

```javascript
refreshSendReportEnabled();
```

This ensures the gating is re-evaluated the moment End-OTP is verified.

- [ ] **Step 3: Remove the now-redundant unconditional re-enable for End-verify**

In `verifyOTP`, the existing block:

```javascript
const selector = scope === 'start' ? '[data-needs-start-verify]' : '[data-needs-end-verify]';
document.querySelectorAll(selector).forEach((b) => { b.disabled = false; });
```

This unconditionally enables `[data-needs-end-verify]` (which is the Send-report button) on End-OTP success. We want gating, not unconditional enable. Change it to:

```javascript
const selector = scope === 'start' ? '[data-needs-start-verify]' : null;
if (selector) {
  document.querySelectorAll(selector).forEach((b) => { b.disabled = false; });
}
```

(Now Start-verify still unconditionally enables its dependent buttons. End-verify defers to `refreshSendReportEnabled` called in Step 2.)

- [ ] **Step 4: Verify in browser**

1. Reload `trainer.html`.
2. Go to Session screen. **See:** Send-report button is disabled (greyed out).
3. Verify End-OTP (any 4 digits, tap Verify). Send-report still disabled.
4. Pick an outcome pill (e.g. "Partially achieved"). Send-report still disabled.
5. Tap a star (e.g. 4). **Send-report becomes enabled.**
6. Tap the outcome pill again to deselect — actually, current implementation only allows switching, not deselecting. So switch to a different pill — Send-report stays enabled. ✓
7. As a sanity check: reload the page, get to the Session screen, set rating + outcome WITHOUT verifying End-OTP — Send-report stays disabled.

- [ ] **Step 5: Commit**

```bash
git add trainer.html
git commit -m "Gate Send-report on End-OTP, outcome pill, and rating"
```

---

## Task 7: Extend PDF report with Goal, Conclusion, Rating, Feedback, and Conversion flag

**Files:**
- Modify: `trainer.html` (the `generateSessionPDF` function — append new sections at the end, around lines 686-695)

- [ ] **Step 1: Add helpers and read the new fields inside `generateSessionPDF`**

Find the end of `generateSessionPDF` — currently the last lines before `doc.save(...)` are:

```javascript
const mp = document.querySelector('.muscle-power-btn.active');
section('Muscle power'); body(mp ? mp.dataset.power + ' / 5' : '—');

section('Additional findings'); body(getExamTextarea(0));
section('Special test'); body(getExamTextarea(1));

doc.save('session-report-riya-sharma.pdf');
```

Insert the new sections **between** the `Special test` section call and `doc.save(...)`:

```javascript
const mp = document.querySelector('.muscle-power-btn.active');
section('Muscle power'); body(mp ? mp.dataset.power + ' / 5' : '—');

section('Additional findings'); body(getExamTextarea(0));
section('Special test'); body(getExamTextarea(1));

// Goal (from Assessment)
const goalArea = document.querySelector('[data-screen="examination"] .session-textarea');
const goalText = (goalArea?.value || '').trim();
section('Goal'); body(goalText);

rule();

// Conclusion (outcome + notes)
const outcomeBtn = document.querySelector('#outcome-pill-row .outcome-pill.active');
const outcomeLabel = {
  achieved: 'Achieved',
  partial: 'Partially achieved',
  not: 'Not achieved',
}[outcomeBtn?.dataset.outcome] || '—';
const conclusionNotes = (document.getElementById('conclusion-notes')?.value || '').trim();
section('Conclusion');
body('Goal outcome: ' + outcomeLabel + (conclusionNotes ? '\n\nNotes: ' + conclusionNotes : ''));

// Trainer rating + feedback
const ratingRow = document.getElementById('rating-stars');
const ratingValue = Number(ratingRow?.dataset.rating || '0');
const feedbackText = (document.getElementById('trainer-feedback')?.value || '').trim();
section('Trainer rating');
body(ratingValue ? `${ratingValue} / 5` + (feedbackText ? '\n\nFeedback: ' + feedbackText : '') : '—');

// Conversion flag (only if set)
const flagBtnEl = document.getElementById('conversion-flag');
if (flagBtnEl?.dataset.flagged === 'true') {
  section('Internal flag');
  body('Flagged as potential subscription lead.');
}

doc.save('session-report-riya-sharma.pdf');
```

Note on the Goal lookup: the Assessment screen's first textarea is the new Goal block (added in Task 2). Since `getExamTextarea(0)` previously meant "Additional findings" (the first textarea), Task 2 has shifted things. **Verify in Step 2 of this task that the existing "Additional findings" / "Special test" sections still pull the correct textareas** — if Task 2 inserted a textarea before them, the indices have shifted by one.

- [ ] **Step 2: Fix the textarea indices for "Additional findings" and "Special test" if shifted by Task 2**

After Task 2 the textareas on the Assessment screen are, in order:

1. index 0 — Goal
2. index 1 — Additional findings
3. index 2 — Special test

The current code uses `getExamTextarea(0)` for "Additional findings" and `getExamTextarea(1)` for "Special test". Change those calls to:

```javascript
section('Additional findings'); body(getExamTextarea(1));
section('Special test'); body(getExamTextarea(2));
```

And update the new Goal lookup to use the indexed helper for consistency:

```javascript
section('Goal'); body(getExamTextarea(0));
```

(Remove the inline `goalArea` / `goalText` lines from Step 1 — `getExamTextarea(0)` replaces them.)

- [ ] **Step 3: Verify in browser**

1. Reload `trainer.html`.
2. Run a full session: Home → Riya Sharma → Start session → verify start → fill Assessment (leave Goal pre-filled, change Muscle power, edit findings) → Continue → on Session screen: leave equipment/exercises as-is, edit Recommendations, pick "Partially achieved", add notes, verify End-OTP, give 4 stars, type feedback, tap the flag chip.
3. Tap "Send report". A PDF downloads.
4. Open the PDF. **Confirm sections appear in order:** Service / Address / Description / Equipment / Exercises / Hands-on / Recommendations / (rule) / Examination heading / Muscle power / Additional findings / Special test / Goal / (rule) / Conclusion / Trainer rating / Internal flag.
5. Confirm "Additional findings" content matches what you typed in the Additional-findings textarea, NOT the Goal text. (Catches the index-shift bug.)
6. Confirm "Special test" content is correct.
7. Confirm "Internal flag" appears only because you tapped the flag chip — re-run without flagging and the section should be absent.

- [ ] **Step 4: Commit**

```bash
git add trainer.html
git commit -m "Append Goal, Conclusion, Rating, Feedback, and Flag to PDF report"
```

---

## Self-review notes

- **Spec coverage:** Header rewrite (Task 1) ✓, Goal block (Task 2) ✓, Exercise dropdown (Task 3) ✓, Conclusion block (Task 4) ✓, Rating + Feedback + Flag (Task 5) ✓, Send-report gating (Task 6) ✓, PDF report extension (Task 7) ✓. Admin-panel changes intentionally deferred per spec.
- **Type/method consistency:** `refreshSendReportEnabled` is stubbed in Task 4 and implemented in Task 6 — explicit forward reference noted in both tasks. Outcome `data-outcome` values (`achieved` / `partial` / `not`) match between Task 4 HTML and Task 7 PDF mapping. `data-rating`, `data-flagged` attribute names consistent across tasks.
- **Index-shift hazard:** Task 7 explicitly addresses the textarea-index shift caused by Task 2 inserting a textarea ahead of "Additional findings" and "Special test".
