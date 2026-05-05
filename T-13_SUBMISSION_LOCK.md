# T-13: The "Submission Lock" Implementation Guide

## Overview
**T-13 (Submission Lock)** is the final safeguard ensuring that no PDF report can be exported without successful backend verification. This prevents unauthorized or unverified submissions from being distributed.

**Status**: ✅ **IMPLEMENTED**

---

## Core Architecture

### State Flow
```
Page Load
   ↓
Export PDF Button DISABLED
   ↓
User completes assessment & clicks "Submit"
   ↓
Backend validates & returns dual-score response
   ↓
Successful response received
   ↓
Export PDF Button ENABLED + Audit Reference Injected
   ↓
User can now "Export PDF" with official verification seal
   ↓
Reset Assessment
   ↓
Export PDF Button DISABLED again + Audit Reference cleared
```

---

## Implementation Details

### 1. Export PDF Button (Topbar)

**File**: `/workspaces/SGS-Sentinel-DSCSA/index.html` (Line ~367)

```html
<button id="export-pdf-btn" class="btn btn-ghost" disabled onclick="window.print()">
  ⎙ Export PDF
</button>
```

**Key Attributes**:
- `id="export-pdf-btn"` – Unique identifier for T-13 logic
- `disabled` – Button starts in disabled state by default
- `data-auditLogId` – Dynamic attribute set after successful submission (see below)
- `onclick="window.print()"` – Triggers browser's print dialog → PDF export

**CSS Styling** (Updated):
```css
.btn-ghost:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: var(--text-muted);
}

.btn-ghost:enabled {
  cursor: pointer;
}
```

Visual feedback: Disabled button appears faded; enabled button returns to normal hover state.

---

### 2. Submission Reference Display (Page Header)

**Location**: Page header, directly below main title

```html
<div id="submission-reference" style="...display:none;">
  Official Reference: <span id="audit-log-id-display">—</span>
</div>
```

**Initially Hidden**: `display:none` until successful submission.

**After Submission**: Displays format like:
```
Official Reference: MOCK-1714968756320-a7bx9c2k
```

---

### 3. Core T-13 Functions

#### A. Enable Button + Inject Audit Reference
**Function**: `renderDualScorePanel(r)` (Updated)

**Location**: Line ~1322 (after panel.innerHTML assignment)

```javascript
// T-13: Enable Export PDF button and inject audit reference
const exportBtn = document.getElementById('export-pdf-btn');
if (exportBtn && r.audit_log_id) {
  exportBtn.disabled = false;
  exportBtn.dataset.auditLogId = r.audit_log_id;
  
  // Display submission reference in header
  const refContainer = document.getElementById('submission-reference');
  const refDisplay = document.getElementById('audit-log-id-display');
  if (refContainer && refDisplay) {
    refDisplay.textContent = r.audit_log_id;
    refContainer.style.display = 'block';
  }
}
```

**Triggered**: Immediately after successful dual-score response is rendered.

#### B. Disable Button + Clear Audit Reference
**Function**: `resetAssessment()` (Updated)

**Location**: End of function

```javascript
// T-13: Disable Export PDF button and clear audit reference
const exportBtn = document.getElementById('export-pdf-btn');
if (exportBtn) {
  exportBtn.disabled = true;
  exportBtn.dataset.auditLogId = '';
}
const refContainer = document.getElementById('submission-reference');
if (refContainer) refContainer.style.display = 'none';
```

**Triggered**: When user clicks "Reset" and confirms action.

---

### 4. Mock Data Generation (T-08 + T-13)

**File**: `submitAssessment()` catch block

```javascript
const mockResult = {
  deterministic_technical_score: techScore,
  self_attested_score: basePct / 100,
  self_attested_grade: basePct >= 90 ? 'A' : basePct >= 75 ? 'B' : ...,
  risk_tier: techScore >= 75 ? 'LOW' : 'HIGH',
  attestation_verdict: basePct >= 75 ? 'COMPLIANT' : 'NON_COMPLIANT',
  score_delta: techScore - basePct,
  flags: [],
  gaps: [],
  audit_log_id: `MOCK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
};
```

**Format**: `MOCK-[timestamp]-[random-alphanumeric]`
- `[timestamp]`: Millisecond epoch (e.g., 1714968756320)
- `[random-alphanumeric]`: 9-character unique suffix

**Example**: `MOCK-1714968756320-a7bx9c2k`

---

### 5. Backend API Contract

#### Request
```json
POST /api/v1/assessment/dual-score
{
  "epcis_payload": { ... },
  "attestation": { ... },
  "facility_name": "..."
}
```

#### Response (Updated with T-13)
```json
{
  "deterministic_technical_score": 88,
  "self_attested_score": 0.90,
  "self_attested_grade": "A",
  "risk_tier": "LOW",
  "attestation_verdict": "COMPLIANT",
  "score_delta": -2,
  "gaps": [],
  "flags": [],
  "audit_log_id": "SGS-2026-05-05-a8f92c4d-e7b1"
}
```

**New Field**: `audit_log_id` (string)
- **Purpose**: Unique identifier for this submission + verification
- **Format**: Backend may use UUID, timestamp-based, or custom scheme
- **Required**: Yes (T-13 relies on this)
- **Immutable**: Once generated, should not change

---

### 6. Print Stylesheet (PDF Export Optimization)

**File**: `<style>` section, `@media print` query (Updated)

```css
@media print {
  .topbar, .response-group, .btn, .card-header { pointer-events: none; }
  .topbar-actions { display: none; }
  body { background: #fff; color: #000; }
  .assessment-card .card-body { display: block !important; }
  #submission-reference { display: block !important; color: #000; }
  #audit-log-id-display { font-weight: bold; }
}
```

**Key Changes**:
- `.topbar-actions` → `display: none` (hides disabled Export PDF button in PDF)
- `#submission-reference` → Forces display in PDF with `color: #000` for visibility
- `#audit-log-id-display` → Bold font for emphasis in printed output

---

## User Experience Flow

### Scenario 1: New Assessment (Initial State)
1. Page loads
2. **Export PDF button**: Disabled ✗, grayed out, with tooltip "(Awaiting submission)"
3. User answers ≥18 questions, enters GLN(s), clicks "Submit"
4. Assessment POSTs to backend → receives dual-score response with `audit_log_id`
5. `renderDualScorePanel()` fires
6. **Export PDF button**: Enabled ✓, bright, clickable
7. **Submission Reference**: Displays in header (e.g., "Official Reference: SGS-2026-05-05-a8f92c4d...")
8. User clicks "Export PDF"
9. Report exports to PDF with audit reference visible in header

### Scenario 2: Successful Export → Reset
1. User successfully exports PDF
2. User clicks "Reset" button
3. Confirmation dialog: "Reset all responses? This will clear your entire assessment."
4. On confirm:
   - All responses cleared ✓
   - Score displays reset to "—" ✓
   - **Export PDF button**: Disabled ✗ again
   - **Submission Reference**: Hidden ✗
5. Assessment ready for fresh start

### Scenario 3: Backend Unavailable (Mock Fallback)
1. User submits assessment
2. Backend unreachable → catch error
3. Mock fallback triggered
4. Mock generates synthetic `audit_log_id: "MOCK-[timestamp]-[uniqueid]"`
5. `renderDualScorePanel()` still enables Export PDF
6. User can export for **testing/development only** (marked as MOCK)
7. In production, backend should always return real audit_log_id

---

## Security Implications

### What T-13 Prevents
- ✓ Exporting unverified or incomplete assessments
- ✓ Bypassing backend scoring logic
- ✓ Producing reports without official timestamp/reference
- ✓ Tampering with submission metadata

### What T-13 Does NOT Prevent
- ✗ Browser developer tools can still enable the button (not tamper-proof client-side)
- ✗ User could screenshot or export incomplete state
- **Recommendation**: Pair with server-side validation; treat audit_log_id as immutable in database

### Backend Responsibility
1. Generate unique, non-guessable `audit_log_id` per submission
2. Store mapping: `audit_log_id → [timestamp, facility_name, GLNs, responses, scores]`
3. Query endpoint to verify: `GET /api/v1/audit/{audit_log_id}` → returns full submission record
4. Reject duplicate submissions with same audit_log_id

---

## Testing Checklist

- [ ] **Initial State**: Page loads → Export PDF button is disabled
- [ ] **Incomplete Submission**: User tries export without answering 18+ questions or GLN → No enable
- [ ] **Successful Submission**: User completes, clicks submit → Export PDF enables, reference displays
- [ ] **PDF Content**: Export PDF → PDF includes audit reference in header
- [ ] **Reset Workflow**: After export, click reset → Button disables, reference hides
- [ ] **Mock Fallback**: Disable backend → Mock still enables button (for UI testing)
- [ ] **Multiple Submissions**: Submit → export → reset → submit again → audit_log_id changes
- [ ] **Data Persistence**: F5 page refresh after export → Does button state persist? (Should not unless backend session exists)

---

## CSS Classes Reference

| Class | State | Visual |
|-------|-------|--------|
| `.btn-ghost` | Default | Text button, transparent background |
| `.btn-ghost:hover:not(:disabled)` | Hovered (enabled) | Card background, accent border |
| `.btn-ghost:disabled` | Disabled | Opacity 0.4, muted border, not-allowed cursor |
| `.btn-ghost:enabled` | Enabled | Normal, pointer cursor |
| `#submission-reference` | Hidden (initial) | `display: none` |
| `#submission-reference` | Visible (after submit) | `display: block` |

---

## Environment Variables & Configuration

**None required for T-13**. However, recommended backend configs:

```plaintext
AUDIT_LOG_RETENTION_DAYS=2555  # 7 years per DSCSA §582(e)(4)
AUDIT_LOG_ID_PREFIX=SGS        # Easily identify source
AUDIT_LOG_ID_LENGTH=32         # UUID or equivalent
SUBMISSION_LOCK_TIMEOUT=3600   # Disable button after 1hr inactivity
```

---

## Troubleshooting

| Issue | Cause | Resolution |
|-------|-------|-----------|
| Export PDF button stays disabled after submit | Backend didn't return `audit_log_id` | Check API response; ensure mock includes audit_log_id |
| Reference displays but PDF blank | Print stylesheet issue | Check `@media print` rules; test in different browsers |
| Button re-enables after reset | Data not clearing | Verify resetAssessment() clears .dataset.auditLogId |
| PDF includes disabled button | Print rule not applied | Add `.topbar-actions { display: none }` to print media |
| Reference shows "—" instead of ID | renderDualScorePanel() not called | Check submitAssessment() success path |

---

## Future Enhancements

- [ ] Add server-side audit trail verification endpoint
- [ ] Implement progressive PDF stamping (watermark with submission time)
- [ ] Add "View Original Submission" button to retrieve historical audit_log by ID
- [ ] Integrate with document management system (DMS) for archival
- [ ] Add 2FA or digital signature step before PDF export
- [ ] Implement time-locked exports (button auto-disables after 24hrs)
- [ ] Email confirmation with audit_log_id to facility contact

---

## References

- **DSCSA §582(e)(4)**: 6-year immutable event retention requirement
- **Target Date**: November 27, 2026 (DSCSA interoperability deadline)
- **Related Tasks**: T-08 (Mock data), Section 3 (Auditor Findings), API Contract
