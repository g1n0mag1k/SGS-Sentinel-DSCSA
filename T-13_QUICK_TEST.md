# T-13 Quick-Start Testing Guide

## Visual Verification (No Code Changes Needed)

### Test 1: Initial State
1. Open `index.html` in browser
2. **Verify**: Export PDF button (⎙ Export PDF) appears GRAYED OUT and DISABLED in topbar
3. **Expected**: Button has reduced opacity, muted border, cursor shows "not-allowed"
4. **Verify**: No "Official Reference" visible in page header
5. **Expected**: Only title and description visible

---

### Test 2: Complete Assessment → Submit
1. Answer at least 18 questions (click Yes/Partial/No buttons)
2. Enter facility name (optional)
3. Enter at least one valid 13-digit GLN in M1 section
4. Click "🚀 Submit Dual-Score Assessment" button
5. Wait for results to render

---

### Test 3: Verify Button Enabled + Reference Displayed
1. **Verify**: Export PDF button now BRIGHT, ENABLED (normal opacity)
2. **Expected**: Button is clickable, cursor shows pointer
3. **Verify**: "Official Reference: [ID]" appears below main title
4. **Expected**: Shows format like `Official Reference: MOCK-1714968756320-a7bx9c2k`
5. **Verify**: Reference displays in monospace font (differs from body text)

---

### Test 4: Export PDF
1. Click "⎙ Export PDF" button
2. Browser print dialog opens
3. Click "Save as PDF" or "Print to PDF"
4. **Verify**: PDF header includes "Official Reference: [audit_log_id]"
5. **Expected**: Reference appears in black text, boldface, at top of page
6. **Expected**: All three sections visible (Score Grid, Divergence, Auditor Findings)

---

### Test 5: Reset Assessment
1. Click "⟳ Reset" button (top-left)
2. Confirm dialog: "Reset all responses? This will clear your entire assessment."
3. **Verify**: Export PDF button GRAYED OUT again (disabled)
4. **Verify**: "Official Reference" disappears from header
5. **Expected**: Page returns to initial state (clean slate)

---

### Test 6: Verify Button State Persistence
1. After first submission (button enabled), refresh page (F5)
2. **Verify**: Export PDF button is DISABLED after refresh
3. **Reason**: State is not persisted (button enable only during current session)
4. **Expected**: User must re-submit to re-enable export

---

## Browser DevTools Inspection

### Inspect Export Button
```javascript
// In browser console:
document.getElementById('export-pdf-btn').disabled  // Should show: false (after submit)
document.getElementById('export-pdf-btn').dataset.auditLogId  // Should show: audit ID
```

### Inspect Submission Reference
```javascript
// In browser console:
const ref = document.getElementById('submission-reference');
ref.style.display  // Should show: 'block' (after submit)
document.getElementById('audit-log-id-display').textContent  // Shows: audit ID
```

---

## Mock Data Testing

### Trigger Mock Fallback
1. Open browser DevTools (F12) → Network tab
2. Check "Offline" mode (simulate no internet)
3. Complete assessment & submit
4. **Verify**: Still works (mock fallback triggered)
5. **Verify**: Export button still enables
6. **Verify**: Reference shows `MOCK-...` prefix (indicates mock data)

---

## PDF Content Verification

### Checklist for Exported PDF

- [ ] **Header Section**
  - [ ] Title: "DSCSA 2026 Interoperability Readiness Assessment"
  - [ ] Submission reference displayed: "Official Reference: [audit_log_id]"
  - [ ] Reference is bold and dark text (visible on white background)

- [ ] **Score Grid (Section 1)**
  - [ ] Self-attested readiness grade displayed
  - [ ] Deterministic technical score displayed
  - [ ] Verdict badges present

- [ ] **Divergence Alert (Section 2)** (if |delta| > 15)
  - [ ] "Integrity Divergence Detected" warning visible
  - [ ] Appropriate message (surplus vs. gap)

- [ ] **Auditor Findings (Section 3)** (if gaps/flags present)
  - [ ] "Section 3: Auditor Findings & Remediation" header visible
  - [ ] Delta interpretation subsection (if applicable)
  - [ ] Gaps list with question IDs and remediation tags
  - [ ] Flags list with explanations
  - [ ] Clean page breaks (no subsections split mid-page)

- [ ] **Styling**
  - [ ] Black text on white background
  - [ ] No topbar or buttons visible
  - [ ] All borders and colors preserved
  - [ ] Readable on standard paper size (8.5" x 11")

---

## Scenarios to Test

| Scenario | Steps | Expected Result |
|----------|-------|-----------------|
| **Happy Path** | Complete → Submit → Export | Export enabled; PDF includes reference |
| **Incomplete** | Answer <18 Qs → Submit | Alert + no state change |
| **No GLN** | Complete → No GLN entered → Submit | Alert + no state change |
| **Reset Flow** | Submit → Reset → Submit again | New audit_log_id generated each time |
| **Backend Down** | Submit (offline) | Mock fallback; export still enabled |
| **Fresh Tab** | Open new tab → Submit | Quick export (no session leak) |
| **PDF Look** | Export PDF → View in reader | Reference prominent, readable on print |

---

## Expected Error Handling

### Alert Messages (Should Still Occur)
- "Data Integrity Warning: Please answer at least 18 questions before submitting."
- "Data Integrity Warning: Please enter at least one valid 13-digit GLN before submitting."

### No Changes to Error Flow
- T-13 does NOT affect validation errors
- Submission lock only engages after successful response

---

## Browser Compatibility

| Browser | Status | Note |
|---------|--------|------|
| Chrome | ✅ Tested | window.print() works well |
| Firefox | ✅ Expected | Standard button disabled support |
| Safari | ✅ Expected | CSS print media queries supported |
| Edge | ✅ Expected | Chromium-based, same as Chrome |
| IE 11 | ⚠️ Risky | No CSS support for :disabled styling |

---

## Known Limitations

1. **Client-Side Lock Only**: DevTools can override disabled state (not tamper-proof)
   - **Mitigation**: Backend must validate audit_log_id on download/verification

2. **No Time-Based Auto-Disable**: Button doesn't expire after inactivity
   - **Enhancement**: Could be added (disable if >24hrs since submit)

3. **Session State Lost on Refresh**: Button resets to disabled
   - **Reason**: No session storage; by design for security
   - **Alternative**: Could store in sessionStorage if needed

4. **No Visual Countdown**: User doesn't see submission "freshness"
   - **Enhancement**: Could show timestamp next to reference (e.g., "Submitted 2 min ago")

---

## Next Steps for Backend Team

1. **Implement Endpoint**: `POST /api/v1/assessment/dual-score`
   - Must return `audit_log_id` in JSON response
   - Example: `{ ..., "audit_log_id": "SGS-2026-05-05-a8f92c4d" }`

2. **Generate Unique IDs**: Use UUID v4 or timestamp-based scheme
   - Ensure global uniqueness (no duplicates)
   - Make IDs non-sequential (security)

3. **Store Immutably**: Create audit_submissions table
   - Map audit_log_id → submission record
   - Include timestamp, facility, GLNs, responses, scores
   - Add "deleted_at" column (soft deletes for GDPR)

4. **Implement Verification Endpoint** (optional):
   - `GET /api/v1/audit/{audit_log_id}` 
   - Returns original submission data
   - Useful for compliance audits

5. **Add to Process**:
   - Send confirmation email with audit_log_id
   - Log all submissions in immutable audit trail
   - Set up 7-year retention policy (DSCSA §582(e)(4))

---

## Troubleshooting Quick Reference

| Problem | Check | Fix |
|---------|-------|-----|
| Button won't enable after submit | Dev console: exportBtn.disabled | Ensure mock/backend returns audit_log_id |
| Reference doesn't show | Dev console: refDisplay.textContent | Check renderDualScorePanel() is called |
| Button re-enables after F5 | (By design) | Refresh clears state; re-submit to enable |
| PDF missing reference | Print preview | Check @media print CSS rules |
| Button stays grayed out always | Check HTML has id="export-pdf-btn" | Verify button ID hasn't changed |
| Reference shows "undefined" | Dev console: r.audit_log_id | Backend not returning field |

---

## Success Criteria ✅

- [ ] Export PDF button disabled on initial page load
- [ ] Export PDF button enabled only after successful submission
- [ ] Submission reference displays in header with audit_log_id
- [ ] Reset button re-disables Export PDF and clears reference
- [ ] PDF export includes audit reference in readable format
- [ ] Mock fallback generates unique mock IDs each time
- [ ] No JavaScript errors in browser console
- [ ] All text visible in PDF preview (good rendering)
- [ ] Button states visually distinguishable (disabled/enabled clear)
- [ ] Audit reference displays consistently across test runs
