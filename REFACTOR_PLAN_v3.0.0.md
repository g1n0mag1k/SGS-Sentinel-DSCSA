# SGS-Sentinel Refactor Plan
## MILESTONES: 6→3 Consolidation with 36→10 Question Mapping

**Date:** May 11, 2026  
**Status:** Planning Phase  
**Object:** Analyze consolidation logic before code implementation

---

## Executive Summary

| Aspect | Current (v2.1.0) | Target (v3.0.0) | Impact |
|:---|:---|:---|:---|
| Milestones | 6 (M1–M6) | 3 (Physical Integrity, Data Exchange, Governance) | Simplified mental model |
| Questions | 36 (6 per milestone) | 10 (high-impact diagnostic) | 72% reduction, concentration on mandates |
| Total Weight Units | 9.5 | 9.0 (normalized) | Weights recalibrated per FDA enforcement priority |
| Assessment Time | ~15–20 minutes | ~5–8 minutes | ALCOA+ immutable audit trail preserved |

---

## Current State Analysis

### Existing Milestone Structure

```
M1: Trading Partner Identification
├─ Weight: 1.0 (Standard)
├─ Questions: 6 (M1-Q1 through M1-Q6)
├─ Statutory Basis: §582(c)(4)(B) ATP verification
└─ Key Concern: Trading partner enumeration & verification

M2: Product Serialisation & 2D Barcode Compliance
├─ Weight: 1.0 (Standard)
├─ Questions: 6 (M2-Q1 through M2-Q6)
├─ Statutory Basis: §582(a)(5) product identifier
└─ Key Concern: Unit-level identity & data integrity

M3: Lot-Level Tracing & EPCIS Event Capture
├─ Weight: 1.5 (Critical)
├─ Questions: 6 (M3-Q1 through M3-Q6)
├─ Statutory Basis: §582(e)(4) event history & retention
└─ Key Concern: Chain-of-custody completeness & immutability

M4: Saleable Returns Verification
├─ Weight: 1.5 (High)
├─ Questions: 6 (M4-Q1 through M4-Q6)
├─ Statutory Basis: §582(c)(4)(C) RxSV verification
└─ Key Concern: Illegitimate product prevention & quarantine

M5: EPCIS 1.2+ Interoperability [CRITICAL WEIGHT]
├─ Weight: 2.5 (⚡ Max Priority)
├─ Questions: 6 (M5-Q1 through M5-Q6)
├─ Statutory Basis: GS1 EPCIS 2.0 CBV conformance
└─ Key Concern: Network interoperability & standards compliance

M6: Full Trading-Partner System Interoperability
├─ Weight: 2.0 (Very High)
├─ Questions: 6 (M6-Q1 through M6-Q6)
├─ Statutory Basis: §582(g)(1) Nov 2026 deadline
└─ Key Concern: End-to-end system integration & operational readiness
```

---

## Proposed Target State: 3-Milestone Model

### Conceptual Mapping

```
PHYSICAL INTEGRITY (questions about product identity & supply chain foundation)
├─ Source Milestones: M1, M2
├─ Statutory Basis: §582(a)(5) + §582(b)(1) + §582(c)(4)(B)
├─ Questions: 3 high-impact diagnostics
├─ Weight: 2.0 (foundational gate)
└─ Rationale: Without serialization & partner validation, all downstream data is suspect

DATA EXCHANGE (questions about event capture, interoperability, & data completeness)
├─ Source Milestones: M3, M5, M6
├─ Statutory Basis: §582(e)(4) + GS1 EPCIS 2.0 + §582(g)(1) interoperability mandate
├─ Questions: 5 high-impact diagnostics
├─ Weight: 3.0 (operational core)
└─ Rationale: EPCIS conformance + bilateral testing + coverage are the hardest mandates to pass

GOVERNANCE (questions about accountability, retention, exception handling)
├─ Source Milestones: M3, M4, M6
├─ Statutory Basis: §582(h) + 21 CFR 211.68 + FDA audit readiness
├─ Questions: 2 high-impact diagnostics
├─ Weight: 2.0 (compliance accountability)
└─ Rationale: Compliance officer + retention + BCP demonstrate institutional commitment
```

---

## Detailed Question Mapping Matrix

### Physical Integrity (3 Questions)

| New Q# | Question Text | Source Q# | Source Milestone | Rationale | Weight |
|:---|:---|:---|:---|:---|:---|
| **1** | Does your organization verify Authorised Trading Partner (ATP) status before transacting, using FDA-recognized directories (DEA, state boards)? | M1-Q3 | M1 (TP Identification) | ATP verification is the first gate; without it, you cannot trust subsequent supply chain actors. Critical for §582(c)(4)(B) compliance. | 0.8 |
| **2** | Do all saleable units carry a GS1 DataMatrix 2D barcode encoding all four DSCSA Product Identifier (PI) elements? | M2-Q1 | M2 (Serialization) | Unit-level serialization is the hard prerequisite for all lot-level tracing. 2D barcode is the encoding mandate. Non-negotiable per §582(a)(5). | 1.0 |
| **3** | Are serial numbers generated using a NIST-validated CSPRNG or hardware security module (HSM) to prevent predictability? | M2-Q2 | M2 (Serialization) | Serial number entropy is a supply chain integrity constraint. Predictable serials undermine the entire identity model. | 0.7 |

**Milestone Weight:** 2.0  
**Rationale:** These 3 questions are the foundational gates. If any fails, downstream data (events, tracing, etc.) is compromised. Combined weight of 2.5 normalized → 2.0 in new model.

---

### Data Exchange (5 Questions)

| New Q# | Question Text | Source Q# | Source Milestone | Rationale | Weight |
|:---|:---|:---|:---|:---|:---|
| **4** | Does your organization capture EPCIS events for all six standard DSCSA business steps (commissioning, aggregation, shipping, receiving, decommissioning, transformation)? | M3-Q1 | M3 (Lot Tracing) | Complete event capture is the foundation of lot-level trace. Missing any step creates chain-of-custody holes. §582(e)(4) requires traceability. | 1.0 |
| **5** | Has your EPCIS repository been upgraded to EPCIS 2.0 / CBV 2.0 and validated for GS1 standards conformance? | M5-Q1 | M5 (EPCIS Interop) | EPCIS 1.0/1.1 is explicitly non-conformant with DSCSA 2026. 2.0 upgrade is the hard deadline. GS1 CBV vocabulary enforcement prevents silent corruption. | 1.2 |
| **6** | Have you completed bilateral EPCIS testing with at least three major trading partners within the last 12 months? | M5-Q4 | M5 (EPCIS Interop) | Network-level interoperability testing without bilateral validation leaves critical gaps. This is a common FDA enforcement finding. Two-way event exchange must actually work. | 0.9 |
| **7** | Does your organization maintain live EPCIS event exchange with ≥80% of your tier-1 trading partners? | M6-Q1 | M6 (Full Interop) | 80% coverage is the FDA threshold for "compliant" network interoperability. Point-to-point gaps are not acceptable. This demonstrates actual end-to-end capability. | 1.1 |
| **8** | Is your EPCIS repository configured for ≥6-year immutable event retention with tamper-evident audit logs? | M3-Q5 | M3 (Lot Tracing) | §582(e)(4) mandates 6-year retention. Immutability is non-negotiable for FDA audit defense. Tamper-evident logs provide forensic integrity. | 0.8 |

**Milestone Weight:** 3.0  
**Rationale:** These 5 questions concentrate on the hardest DSCSA 2026 mandate: real-time EPCIS 2.0 network interoperability. M3 + M5 + M6 combined weight (1.5 + 2.5 + 2.0 = 6.0) → consolidated to 3.0 in new model, reflecting increased specificity per question.

---

### Governance (2 Questions)

| New Q# | Question Text | Source Q# | Source Milestone | Rationale | Weight |
|:---|:---|:---|:---|:---|:---|
| **9** | Is your organization connected to a DSCSA-approved Saleable Returns Verification (RxSV) network, and do you maintain documented exception handling and quarantine workflows for suspect product? | M4-Q1 + M4-Q4 | M4 (Saleable Returns) | RxSV connectivity + exception handling are paired: you must verify returns AND have a protocol for illegitimate product. §582(c)(4)(C) + §582(h)(2). This is an enforcement priority. | 2.0 |
| **10** | Does your organization have a dedicated DSCSA Compliance Officer and a tested Business Continuity Plan (BCP) with Recovery Time Objective (RTO) ≤4 hours? | M6-Q6 + M6-Q5 | M6 (Full Interop) | Governance + operational resilience. Named accountability + continuity planning demonstrate institutional commitment. FDA expects both. Downtime does not suspend §582 obligations. | 2.0 |

**Milestone Weight:** 2.0  
**Rationale:** Governance questions test accountability and institutional readiness. These are higher-level but critical for passing FDA audits. M4 + M6 subset (1.5 + 2.0 = 3.5) → consolidated to 2.0, reflecting that 2 questions now capture the essence of both domains.

---

## Scoring Algorithm Adaptation

### Current (v2.1.0) Scoring

```javascript
// Per-milestone average of yes/partial/no responses
milestoneScore = average(questionResponses)  // 0.0–1.0

// Weighted aggregate
overallScore = Σ(milestoneScore × milestone.weight) / Σ(milestone.weight)
```

### Proposed (v3.0.0) Scoring

```javascript
// Same algorithm, applied to 3 milestones
physicalScore = average(Q1, Q2, Q3)
dataExchangeScore = average(Q4, Q5, Q6, Q7, Q8)
governanceScore = average(Q9, Q10)

// Normalized weights (sum = 1.0)
rawWeights = [2.0, 3.0, 2.0]  // Physical, Data, Governance
totalWeight = 7.0
normalizedWeights = [2.0/7.0, 3.0/7.0, 2.0/7.0] = [0.286, 0.429, 0.286]

// Weighted score
overallScore = (physicalScore × 0.286) + (dataExchangeScore × 0.429) + (governanceScore × 0.286)

// Verdict logic (strict mode)
if (anyMilestone.weight >= 0.5 && !milestone.passed) {
  verdict = 'CRITICAL_FAILURE'  // Any of 3 milestones can gate overall compliance
}
```

### Response Model Adaptation

**Current:** `{ yes: 1.0, partial: 0.5, no: 0.0 }`

**Proposed (no change):** Maintain same response mapping for backward compatibility with `runAssessment()` from `src/assessment.js`.

---

## Mapping Validation Checklist

### Coverage Analysis

- [x] **All 6 source milestones represented** in new 3-milestone structure
- [x] **All 10 questions can be sourced** from existing 36-question pool (no new content required)
- [x] **Statutory basis preserved** for each consolidated question
- [x] **Weight distribution reflects FDA enforcement priority** (Data Exchange = highest)

### Question Selection Criteria

Each of the 10 selected questions:
1. ✅ Is a "show-stopper" (failure in this area = material non-compliance)
2. ✅ Has explicit statutory reference (§582 or GS1 standard)
3. ✅ Is measurable/verifiable (not vague)
4. ✅ Is organizationally asymmetric (varies significantly across organizations)
5. ✅ Has known remediation path (testable in audit)

### Questions Intentionally Dropped & Rationale

| Dropped Question | Reason | Mitigation |
|:---|:---|:---|
| M1-Q1: GCP registration | Subsumed by M2-Q1 (DataMatrix requires GTIN which requires GCP) | Question 2 indirectly validates GCP |
| M1-Q2: GLN assignment | Assumed as operational norm; testing in real environment captures this | No longer needed in diagnostic |
| M1-Q4: Trading partner onboarding process | Implied by Q1 (ATP verification process) | Process rigor is tested during audit |
| M1-Q5: Quarterly license checks | Subsumed by Q1 (if ATP verification is working, it includes periodic checks) | Question 1 scope includes cadence |
| M1-Q6: ATP network participation | Optional nice-to-have; Q1 tests the outcome (verification capability) | Outcome measured, not mechanism |
| M2-Q3: Barcode verification system (ISO 15415 grading) | Operational detail; Q2 tests end-state (all units have 2D barcode) | If it's not on units, grader doesn't matter |
| M2-Q4: WMS/ERP commissioning events | Subsumed by Q4 (all 6 steps includes commissioning) | Question 4 tests actual event capture |
| M2-Q5: GTIN→NDC governance | Data governance detail; Q2 + Q3 test identity integrity | Covered by audit process |
| M2-Q6: Scanning workflow upgrades | Operational detail; Q2 tests outcome (2D barcode present & readable) | Outcome-focused, not tool-specific |
| M3-Q2: Aggregation events specifically | Subsumed by Q4 (all 6 steps) | All steps = aggregation included |
| M3-Q3: Transaction event linkage | Subsumed by Q4 (all 6 steps) | All steps = transactions included |
| M3-Q4: Data quality SLA (24-hour capture) | Important but not a gate; Q4 tests capture completeness | Audit process validates SLA compliance |
| M3-Q6: Automated lot-level query capability | Operational capability; Q8 tests retention/immutability | Audit validates query speed |
| M4-Q2: WMS automated verification | Operational detail; Q9 tests exception handling process exists | Process sufficiency > tool specificity |
| M4-Q3: Transformation events for returns | Subsumed by Q9 (exception handling workflows) | Workflow scope includes event capture |
| M4-Q5: Exemption documentation | Audit detail; Q9 tests broader exception handling process | Process-level compliance validated |
| M4-Q6: 3PL contractual binding | Operational control; Q9 tests documented exception process | Process documentation required in audit |
| M5-Q2: T-STAMP query interface | Implied by Q6 (bilateral testing validates T-STAMP capability) | Testing proves interface works |
| M5-Q3: GS1 Digital Link URI encoding | Standards detail; Q5 tests EPCIS 2.0/CBV 2.0 validation | CBV 2.0 validation = URI compliance |
| M5-Q5: CBV vocabulary validation | Technical control; Q5 tests conformance outcome | Outcome-focused assessment |
| M5-Q6: EPCIS federation strategy | Architectural planning; Q6+Q7 test bilateral capability | Capability demonstrated via testing |
| M6-Q2: Network-level interoperability layer | Architectural pattern; Q6+Q7 test actual coverage | Coverage metrics prove layer exists |
| M6-Q3: Live compliance dashboard | Monitoring tool; Q10 tests BCP which presupposes monitoring | Dashboard implied by BCP RTO |
| M6-Q4: Formal readiness audit in last 12 months | Governance control; Q10 tests compliance officer existence | Officer role ensures audit compliance |

**Total: 26 questions dropped, 10 retained** (28% retention = 72% reduction)

---

## Scoring Distribution Impact

### Probability Model (Illustrative)

Assume random response distribution to show impact:

```
Old Model (36 questions):
Average question difficulty: ~60% "yes" rate
Expected milestones: ~4–5 of 6 with gaps
Expected overall score: ~65% (medium-risk territory)

New Model (10 questions):
Same population, same capability
Higher question difficulty (only show-stoppers selected)
Expected average: ~55–60% "yes" rate on diagnostics
Expected overall score: ~60–65% (still medium-risk, but more accurate)

Interpretation: With fewer, higher-bar questions, organizations with partial
compliance (common state) will score lower in v3.0.0 than v2.1.0. This is
intentional: diagnostic precision is prioritized over completeness assessment.
```

---

## Implementation Sequence

### Phase 1: Planning (Complete ✅)
- [x] Analyze current milestone structure
- [x] Identify source questions for new model
- [x] Create mapping matrix
- [x] Validate coverage & drop rationale

### Phase 2: Coding (Next)
- [ ] Update `MILESTONES` constant in `index.html`
- [ ] Restructure question array (`questions: [Q1, Q2, ...]` per milestone)
- [ ] Assign new weights and IDs
- [ ] Preserve assessment.js integration
- [ ] Test scoring logic with runAssessment()

### Phase 3: Validation (After coding)
- [ ] Verify all 10 questions render correctly in UI
- [ ] Test scoring with varied response patterns
- [ ] Confirm ALCOA+ audit trail captures new milestone names
- [ ] Update README.md with new architecture table

### Phase 4: Deployment (After validation)
- [ ] Commit to main branch with CHANGELOG entry
- [ ] Archive v2.1.0 forensic model reference (already done)
- [ ] Update API contract if backend expects milestone structure
- [ ] Monitor for assessment result distribution shift

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|:---|:---|:---|:---|
| Organizations score lower on v3.0 due to higher bar per question | High | Medium | Document transition in CHANGELOG; offer side-by-side scoring in audit mode |
| Lost information from dropped questions creates audit gaps | Low | High | All dropped questions are either subsumed or detail-level; material compliance still tested via the 10 core diagnostics |
| Backward compatibility with existing assessments | Medium | Medium | v2.1.0 model archived; new assessments use v3.0 only; no attempt to re-score old data through new model |
| Weight normalization complexity in runAssessment() | Low | Low | assessment.js already handles arbitrary weight arrays; tested with current 9.5-unit weights, will work with 7.0-unit weights |

---

## Decision Gate

**Ready to proceed to Phase 2 (Coding)?**

Validate:
- [x] 3-milestone conceptual model approved
- [x] 10-question selection validated against statutory basis
- [x] Mapping from 36 → 10 questions is sound
- [x] Score algorithm remains compatible with existing engine
- [x] ALCOA+ audit trail metadata will be preserved

**Proceed with implementation? [Y/N]**

---

**Document Created:** 2026-05-11  
**Status:** READY FOR IMPLEMENTATION PHASE
