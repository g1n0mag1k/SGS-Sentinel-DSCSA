# renderDualScorePanel() Refactoring Demo

## Overview
The `renderDualScorePanel(r)` function has been refactored to include a new **Section 3: Auditor Findings & Remediation** with three core components:

1. **Delta Interpretation** – Interprets score divergence (Readiness Gap vs. Integration Surplus)
2. **Gap Mapping** – Maps question IDs to question text and remediation steps from MILESTONES
3. **Flag Display** – Translates technical flags to plain-language "Technical Integrity Alerts"

---

## Test Scenario 1: Readiness Gap (Negative Delta)

### Input
```javascript
const mockResult = {
  deterministic_technical_score: 45,
  self_attested_score: 0.75,
  self_attested_grade: 'B',
  risk_tier: 'HIGH',
  attestation_verdict: 'COMPLIANT',
  score_delta: -30,  // Self-assessment exceeds technical by 30 points
  gaps: ['M5-Q2', 'M6-Q1'],
  flags: ['EPCIS_SCHEMA_VIOLATION', 'MISSING_PI_ELEMENTS']
};
```

### Expected Output in Section 3
- **Delta Interpretation**: Displays "Readiness Gap" (📊) warning stating:
  > "Self-assessment score exceeds deterministic technical capability by 30 points, indicating a significant execution gap between stated readiness and demonstrated EPCIS compliance. Prioritise infrastructure remediation before November 2026 deadline."

- **Identified Compliance Gaps**:
  - `M5-Q2`: "Does the EPCIS implementation expose a standards-compliant query interface capable of answering T-STAMP queries?" → Links to M5 (EPCIS Interop) remediation
  - `M6-Q1`: "Does the organisation have live EPCIS event exchange with ≥80% of its tier-1 trading partners?" → Links to M6 (Full Interop) remediation

- **Technical Integrity Alerts**:
  - 🚨 `EPCIS_SCHEMA_VIOLATION`: "EPCIS event payload violates GS1 CBV 2.0 schema. Review event structure against standard."
  - 🚨 `MISSING_PI_ELEMENTS`: "One or more DSCSA Product Identifier (PI) elements missing from barcode encoding."

---

## Test Scenario 2: Integration Surplus (Positive Delta)

### Input
```javascript
const mockResult = {
  deterministic_technical_score: 85,
  self_attested_score: 0.60,
  self_attested_grade: 'D',
  risk_tier: 'LOW',
  attestation_verdict: 'NON_COMPLIANT',
  score_delta: 25,  // Technical exceeds self-assessment by 25 points
  gaps: ['M2-Q3'],
  flags: ['GLN_CHECK_DIGIT_FAIL']
};
```

### Expected Output in Section 3
- **Delta Interpretation**: Displays "Integration Surplus" (✓) note stating:
  > "Technical score exceeds self-attestation by 25 points. This may indicate under-reported capabilities or EPCIS validation signals from upstream trading partners that your team has not fully acknowledged."

- **Identified Compliance Gaps**:
  - `M2-Q3`: "Is there an automated inline barcode verification system (ISO/IEC 15415 grader) on every packaging line?" → Links to M2 (Product Serialization) remediation

- **Technical Integrity Alerts**:
  - 🚨 `GLN_CHECK_DIGIT_FAIL`: "Invalid GS1 Global Location Number (GLN): Check digit validation failed. Regenerate GLN or verify manually."

---

## Test Scenario 3: Clean Report (No Gaps/Flags)

### Input
```javascript
const mockResult = {
  deterministic_technical_score: 88,
  self_attested_score: 0.90,
  self_attested_grade: 'A',
  risk_tier: 'LOW',
  attestation_verdict: 'COMPLIANT',
  score_delta: -2,  // Minor variance (< 15 threshold, no divergence alert)
  gaps: [],
  flags: []
};
```

### Expected Output in Section 3
- **No audit section displayed** (auditSectionHtml remains empty)
- Only Sections 1 & 2 are rendered (Score Grid + optional Divergence Alert)
- Clean, minimal report suitable for PDF export

---

## Helper Functions

### `getQuestionAndRemediation(questionId)`
Searches the MILESTONES constant for a matching question ID and returns:
- `milestoneId`: e.g., "M5"
- `milestoneTitle`: e.g., "EPCIS 1.2+ Interoperability"
- `questionText`: Full question text
- `remediationSteps`: Array of remediation objects with `title`, `detail`, optional `code`

**Example**:
```javascript
const lookup = getQuestionAndRemediation('M5-Q2');
// Returns all M5 remediation steps for quick action reference
```

### `getFlagExplanation(flag)`
Maps technical flag constants to human-readable descriptions:
- `GLN_CHECK_DIGIT_FAIL`
- `GLN_NOT_REGISTERED`
- `EPCIS_SCHEMA_VIOLATION`
- `MISSING_PI_ELEMENTS`
- `SERIALISATION_CONFLICT`
- `EVENT_TIMESTAMP_ANOMALY`
- `AGGREGATION_TREE_BROKEN`
- `TRANSACTION_ORPHAN`

Returns fallback explanation if flag is unknown.

---

## CSS Styling Features

### Print-Friendly Design
- `.audit-section` and child elements use `break-inside: avoid` for clean PDF pagination
- Enterprise color scheme integrates with existing Sui-Generis theme
- High contrast icons (📊, 🔍, ⚠️) for accessibility

### Responsive Layout
- Audit subsections stack vertically on mobile
- Gap and Flag items use badge-based design for compact display
- Remediation tags display inline for quick scanning

### Visual Hierarchy
- **Readiness Gap** subsections have 3px left border in warning orange
- **Integration Surplus** subsections have 3px left border in success green
- Gap ID badges use purple accent (distinct from milestone colors)
- Flags use red left border for immediate attention

---

## Integration with Backend

The backend API `/api/v1/assessment/dual-score` should return:
```json
{
  "deterministic_technical_score": 45,
  "self_attested_score": 0.75,
  "self_attested_grade": "B",
  "risk_tier": "HIGH",
  "attestation_verdict": "COMPLIANT",
  "score_delta": -30,
  "gaps": ["M5-Q2", "M6-Q1", ...],
  "flags": ["EPCIS_SCHEMA_VIOLATION", ...]
}
```

If backend is unavailable, the mock data generator (T-08) creates sample gaps and flags for testing.

---

## User Experience Flow

1. User completes DSCSA assessment (18+ questions)
2. Enters GLN(s) and facility name
3. Clicks "🚀 Submit Dual-Score Assessment"
4. Backend validates EPCIS payload, cross-checks deterministic signals
5. Returns dual-score result with gaps and flags
6. `renderDualScorePanel()` renders all three sections
7. User can print/export PDF with full audit trail

---

## Troubleshooting

| Issue | Resolution |
|-------|-----------|
| Gap ID not found | Function returns "Unknown question identifier (assess manually)" with audit-gap-unknown class |
| Flag not in map | `getFlagExplanation()` returns generic "Unknown technical flag detected" message |
| Empty gaps/flags | Audit section is hidden (conditional render) – Report shows only Score Grid + Divergence |
| Delta threshold | Only displays Delta Interpretation if \|score_delta\| > 15 (customizable) |

---

## Future Enhancements

- [ ] Add expandable remediation step details within audit section
- [ ] Export audit section to separate PDF report
- [ ] Link gaps directly to calendar reminders
- [ ] Add remediation cost/effort estimates
- [ ] Enable audit thread comments/annotations
