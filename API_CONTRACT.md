# Dual-Score API Contract Reference

## Endpoint Specification

### Request
```
POST /api/v1/assessment/dual-score
Content-Type: application/json
Authorization: Bearer {sgs_token} [optional]
```

### Request Body
```json
{
  "epcis_payload": {
    "@context": "https://ref.gs1.org/standards/epcis/2.0.0/epcis-context.jsonld",
    "type": "EPCISDocument",
    "schemaVersion": "2.0",
    "creationDate": "2026-05-05T14:30:00Z",
    "metadata": {
      "root": { "gln": "0355555000003" }
    },
    "bizLocation": { "gln": "0355555000003" },
    "events": [
      {
        "type": "ObjectEvent",
        "eventTime": "2026-05-05T14:30:00Z",
        "bizStep": "commissioning",
        "action": "ADD",
        "readPoint": {
          "id": "urn:epc:id:sgln:0355555000003.0"
        }
      }
    ]
  },
  "attestation": {
    "answers": {
      "M1-Q1": "yes",
      "M1-Q2": "partial",
      "M2-Q1": "no",
      ...
    },
    "submitted_glns": ["0355555000003", "0355555000004"]
  },
  "facility_name": "Acme Pharmaceuticals Distribution Center"
}
```

### Response Structure
```json
{
  "deterministic_technical_score": 45,
  "self_attested_score": 0.75,
  "self_attested_grade": "B",
  "risk_tier": "HIGH",
  "attestation_verdict": "COMPLIANT",
  "score_delta": -30,
  "gaps": [
    "M5-Q2",
    "M6-Q1"
  ],
  "flags": [
    "EPCIS_SCHEMA_VIOLATION",
    "MISSING_PI_ELEMENTS"
  ]
}
```

---

## Response Field Definitions

### Scoring Fields

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `deterministic_technical_score` | integer | 0–100 | Backend validation score based on EPCIS signal analysis |
| `self_attested_score` | float | 0.0–1.0 | Normalized client-side assessment score (0–100 range) |
| `self_attested_grade` | string | A\|B\|C\|D\|F | Letter grade derived from self_attested_score |

### Verdict Fields

| Field | Type | Value | Meaning |
|-------|------|-------|---------|
| `attestation_verdict` | string | COMPLIANT \| NON_COMPLIANT | Overall compliance determination |
| `risk_tier` | string | LOW \| HIGH | Risk assessment based on technical score |

### Delta & Integrity

| Field | Type | Description |
|-------|------|-------------|
| `score_delta` | integer | Difference: `deterministic_technical_score - (self_attested_score * 100)` |

---

## Gap Identification Logic

### Gap Array (`gaps`)
Contains question IDs identified as compliance shortfalls during evaluation.

**Format**: Array of strings matching pattern `M[1-6]-Q[1-6]`

**Examples**:
- `"M1-Q3"` – ATP verification process missing
- `"M5-Q2"` – T-STAMP query endpoint not implemented
- `"M6-Q4"` – No formal DSCSA readiness audit in past 12 months

**Frontend Mapping**: The `getQuestionAndRemediation(questionId)` function:
1. Searches the MILESTONES constant for the question ID
2. Returns question text + linked remediation steps
3. Displays in "Identified Compliance Gaps" subsection

---

## Technical Flag Mapping

### Supported Flags

| Flag ID | Category | Frontend Label | Typical Triggers |
|---------|----------|----------------|-----------------|
| `GLN_CHECK_DIGIT_FAIL` | Identifier Validation | Invalid GS1 GLN | Check digit validation failure on submitted GLNs |
| `GLN_NOT_REGISTERED` | Registry Check | Unregistered GLN | GLN not found in GS1 US registry |
| `EPCIS_SCHEMA_VIOLATION` | EPCIS Validation | Schema Non-Conformance | Event payload violates GS1 CBV 2.0 XSD |
| `MISSING_PI_ELEMENTS` | PI Encoding | Missing PI Data | <4 DSCSA Product Identifier elements detected |
| `SERIALISATION_CONFLICT` | Master Data | Duplicate Serial | Serial number mapped to multiple GTINs |
| `EVENT_TIMESTAMP_ANOMALY` | Temporal Integrity | Invalid Timestamp | EventTime > now or outside operational window |
| `AGGREGATION_TREE_BROKEN` | Hierarchy Integrity | Broken Aggregation | Parent case/pallet not found in repository |
| `TRANSACTION_ORPHAN` | Reference Integrity | Missing Transaction Link | PO/Invoice referenced in event not in system |

**Frontend Handling**: The `getFlagExplanation(flag)` function maps each flag ID to a plain-language explanation (e.g., "Invalid GS1 Global Location Number..."). Unmapped flags trigger fallback: "Unknown technical flag detected. Contact your DSCSA compliance team for interpretation."

---

## Validation Rules

### Request Validation Pre-Conditions
1. **EPCIS Payload Structure**
   - Must include `@context`, `type: "EPCISDocument"`, `schemaVersion: "2.0"`
   - Must include valid `creationDate` (ISO 8601)
   - Events array must be non-empty
   
2. **Attestation Answers**
   - Keys must match question IDs in MILESTONES
   - Values must be: `"yes"`, `"partial"`, `"no"`, or `null`
   - Minimum 18 questions answered (enforced client-side, validatable server-side)

3. **GLN Validation**
   - Each GLN must be exactly 13 digits
   - At least one GLN required
   - Check digit (last digit) must satisfy GS1 algorithm

### Response Validation Post-Conditions
1. **Score Consistency**
   - Both scores must be in valid ranges (0–100, 0.0–1.0)
   - `score_delta` must equal `deterministic_technical_score - (self_attested_score * 100)`
   - Grade must correspond to score band (A ≥90%, B ≥75%, etc.)

2. **Verdict Logic**
   - If `deterministic_technical_score >= 75` → `risk_tier = "LOW"`
   - If `self_attested_score * 100 >= 75` → `attestation_verdict = "COMPLIANT"`

3. **Collections Validity**
   - `gaps` array: All IDs must exist in MILESTONES
   - `flags` array: All values must be recognized flag IDs

---

## Error Handling

### HTTP Status Codes

| Status | Meaning | Frontend Response |
|--------|---------|-------------------|
| 200 | Success – Render dual-score results | `renderDualScorePanel(result)` |
| 400 | Bad request – Invalid payload structure | Show generic error; enable mock fallback |
| 401 | Unauthorized – Token invalid/missing | Prompt re-login |
| 422 | Unprocessable – Semantic error in data | Show field-level validation errors |
| 500 | Server error – Processing failure | Log error; enable mock fallback for UI testing |

### Mock Fallback (T-08)
If backend is unreachable (error thrown), frontend generates synthetic result:
```javascript
const mockResult = {
  deterministic_technical_score: Math.max(0, basePct - 18),
  self_attested_score: basePct / 100,
  self_attested_grade: /* grade logic */,
  risk_tier: techScore >= 75 ? 'LOW' : 'HIGH',
  attestation_verdict: basePct >= 75 ? 'COMPLIANT' : 'NON_COMPLIANT',
  score_delta: techScore - basePct,
  flags: [],  // Empty to simulate clean validation
  gaps: []
};
```

---

## Performance Expectations

| Operation | SLA | Comment |
|-----------|-----|---------|
| Request processing | ≤ 5sec | EPCIS schema validation + GLN check + signal analysis |
| Response serialization | ≤ 500ms | JSON stringify + compression |
| Network latency | ≤ 1sec | Typical for WAN edge |
| **Total end-to-end** | **≤ 8sec** | Recommended timeout threshold |

---

## Examples

### Scenario 1: High-Performing Facility
```javascript
{
  "deterministic_technical_score": 88,
  "self_attested_score": 0.90,
  "self_attested_grade": "A",
  "risk_tier": "LOW",
  "attestation_verdict": "COMPLIANT",
  "score_delta": -2,
  "gaps": [],
  "flags": []
}
// Frontend: Clean report, audit section hidden, PDF-ready
```

### Scenario 2: Significant Gap Detected
```javascript
{
  "deterministic_technical_score": 42,
  "self_attested_score": 0.72,
  "self_attested_grade": "C",
  "risk_tier": "HIGH",
  "attestation_verdict": "NON_COMPLIANT",
  "score_delta": -30,
  "gaps": ["M5-Q2", "M5-Q3", "M6-Q1", "M6-Q2"],
  "flags": ["EPCIS_SCHEMA_VIOLATION", "TRANSACTION_ORPHAN"]
}
// Frontend: Section 3 displays Readiness Gap alert + gap mapping + flags
```

### Scenario 3: Data Quality Issues
```javascript
{
  "deterministic_technical_score": 0,
  "self_attested_score": 0.50,
  "self_attested_grade": "D",
  "risk_tier": "HIGH",
  "attestation_verdict": "NON_COMPLIANT",
  "score_delta": -50,
  "gaps": ["M1-Q1", "M2-Q1"],
  "flags": ["GLN_CHECK_DIGIT_FAIL", "EPCIS_SCHEMA_VIOLATION", "AGGREGATION_TREE_BROKEN"]
}
// Frontend: Critical findings displayed prominently for immediate remediation
```

---

## Developer Notes

1. **Gaps Selection**: Use a deterministic algorithm (e.g., flag `M5-Q2` if `EPCIS_SCHEMA_VIOLATION` detected AND facility didn't answer "yes" to that question).

2. **Flag Generation**: Run EPCIS payload through GS1 CBV 2.0 validator; catch exceptions as `EPCIS_SCHEMA_VIOLATION`.

3. **Score Delta Threshold**: Frontend only displays delta interpretation if `|score_delta| > 15` (customize this constant as needed).

4. **Audit Trail**: Consider logging all requests, responses, and GLN/facility associations for compliance audit purposes.

5. **Token Handling**: The `sgs_token` in Authorization header is optional; missing token still triggers score calculation but may skip certain persistence/audit logging steps.
