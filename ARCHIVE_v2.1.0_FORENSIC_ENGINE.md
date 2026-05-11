# SGS-Sentinel Engineering Archive
**Version:** 2.1.0 — "Forensic Engine"  
**Archived:** May 11, 2026  
**Purpose:** Preservation of legacy 6-milestone weighted-compliance assessment model prior to 10-question diagnostic refactor.

---

## Table of Contents
1. [MILESTONES Constant](#milestones-constant)
2. [CSS Theme & Branding](#css-theme--branding)
3. [Engineering Architecture](#engineering-architecture)
4. [Notes on Removal](#notes-on-removal)

---

## MILESTONES Constant

Full JavaScript constant containing 6 assessment milestones (M1–M6) with weighted criticality scores and 36 total diagnostic questions. Each milestone maps to specific FDA/GS1 statutory requirements.

### Structure
- **M1**: Trading Partner Identification (Weight: 1.0, Standard)
- **M2**: Product Serialisation & 2D Barcode Compliance (Weight: 1.0, Standard)
- **M3**: Lot-Level Tracing & EPCIS Event Capture (Weight: 1.5, Critical)
- **M4**: Saleable Returns Verification (Weight: 1.5, High)
- **M5**: EPCIS 1.2+ Interoperability (Weight: 2.5, ⚡ Max Priority)
- **M6**: Full Trading-Partner System Interoperability (Weight: 2.0, Very High)

### Complete Data Model

```javascript
const MILESTONES = [
  {
    id: "M1",
    label: "M1",
    title: "Trading Partner Identification",
    description: "GS1 GLN registration, DUNS/DEA enumeration, and authorised trading partner (ATP) verification",
    weight: 1.0,
    weightLabel: "Standard",
    weightClass: "weight-standard",
    milestoneClass: "milestone-m1",
    colorVar: "var(--accent-cyan)",
    questions: [
      { id: "M1-Q1", text: "Has the organisation registered a GS1 Company Prefix (GCP) and obtained all required GTINs for every marketed pharmaceutical product?", hint: "Required for §582(a)(5) product identifier compliance. GCP registration at gs1us.org." },
      { id: "M1-Q2", text: "Are Global Location Numbers (GLNs) assigned to every facility involved in the pharmaceutical supply chain (manufacturing, distribution, dispensing sites)?", hint: "GLNs are the authoritative location identifiers for EPCIS readPointID and bizLocationID fields." },
      { id: "M1-Q3", text: "Does the organisation maintain an Authorised Trading Partner (ATP) list and verify ATP status before each transaction using FDA-recognised directories?", hint: "DSCSA §582(c)(4)(B) requires verification against DEA, FDA, or state board licensure." },
      { id: "M1-Q4", text: "Is there a documented, automated process for onboarding new trading partners that captures required identifiers (GLN, DEA, NPI, DUNS)?", hint: "Manual onboarding without identifier validation is a common audit finding." },
      { id: "M1-Q5", text: "Are trading partner licence status checks automated and run at least quarterly against FDA, DEA, and state board databases?", hint: "Annual-only checks leave windows for transacting with suspended or revoked entities." },
      { id: "M1-Q6", text: "Does the organisation participate in, or have a plan to connect to, an industry ATP verification network (e.g., RxSV, HDA shared services)?", hint: "Shared ATP networks reduce duplicate verification overhead and improve coverage." }
    ],
    remediationSteps: [
      { title: "Register GS1 Company Prefix", detail: "Navigate to gs1us.org → Join GS1 US → select Company Prefix tier based on unique product SKU count.", code: "# GTIN-14 structure for prescription drugs\n# [Indicator][GCP(7-9)][Item Ref][Check Digit]" }
    ]
  },
  {
    id: "M2",
    label: "M2",
    title: "Product Serialisation & 2D Barcode Compliance",
    description: "Unit-level serialisation (SNDC), GS1 DataMatrix 2D barcode encoding, and DSCSA product identifier (PI) elements",
    weight: 1.0,
    weightLabel: "Standard",
    weightClass: "weight-standard",
    milestoneClass: "milestone-m2",
    colorVar: "var(--accent-blue)",
    questions: [
      { id: "M2-Q1", text: "Does every saleable unit carry a GS1 DataMatrix 2D barcode encoding all four DSCSA Product Identifier (PI) elements?", hint: "§582(a)(5) mandates all four PI elements." },
      { id: "M2-Q2", text: "Are serial numbers generated using a NIST-validated CSPRNG or hardware security module (HSM)?", hint: "Serial number predictability is a supply chain integrity risk." },
      { id: "M2-Q3", text: "Is there an automated inline barcode verification system (ISO/IEC 15415 grader) on every packaging line?", hint: "ISO 15415 grade ≥ 1.5 (D) is the minimum acceptable." },
      { id: "M2-Q4", text: "Does the organisation's WMS/ERP commission (create) an EPCIS ObjectEvent with bizStep=commissioning for every new serial number?", hint: "Commissioning events are required before shipping." },
      { id: "M2-Q5", text: "Is there a documented serialisation master data governance process that maps GTIN→NDC?", hint: "GTIN-to-NDC mismatches cause event rejection." },
      { id: "M2-Q6", text: "Have downstream scanning workflows been upgraded to capture 2D DataMatrix?", hint: "Legacy 1D-only scanners cannot decode the PI." }
    ]
  },
  {
    id: "M3",
    label: "M3",
    title: "Lot-Level Tracing & EPCIS Event Capture",
    description: "Full EPCIS event history (commissioning, aggregation, shipping, receiving, decommissioning)",
    weight: 1.5,
    weightLabel: "Critical",
    weightClass: "weight-critical",
    milestoneClass: "milestone-m3",
    colorVar: "var(--accent-purple)",
    questions: [
      { id: "M3-Q1", text: "Does the organisation capture EPCIS events for all six standard DSCSA business steps?", hint: "All six steps must be captured for full lot-level trace." },
      { id: "M3-Q2", text: "Are EPCIS AggregationEvents generated whenever units are consolidated into cases or cases into pallets?", hint: "Missing aggregation events break lot-level trace trees." },
      { id: "M3-Q3", text: "Are EPCIS TransactionEvents generated linking each shipment to a Purchase Order or Invoice?", hint: "Transaction linkage is required." },
      { id: "M3-Q4", text: "Is there a defined data quality (DQ) SLA ensuring EPCIS events are captured within 24 hours?", hint: "Late events create holes in the chain-of-custody." },
      { id: "M3-Q5", text: "Does the EPCIS repository support ≥6-year immutable event retention with tamper-evident logs?", hint: "§582(e)(4) requires 6-year retention." },
      { id: "M3-Q6", text: "Is there an automated lot-level trace query capability returning a complete chain within 4 hours?", hint: "Manual investigation cannot meet 24-hour SLA." }
    ]
  },
  {
    id: "M4",
    label: "M4",
    title: "Saleable Returns Verification",
    description: "DSCSA-compliant saleable returns verification, RxSV network connectivity, and disposition event capture",
    weight: 1.5,
    weightLabel: "High",
    weightClass: "weight-high",
    milestoneClass: "milestone-m4",
    colorVar: "var(--accent-amber)",
    questions: [
      { id: "M4-Q1", text: "Is the organisation connected to a DSCSA-approved Saleable Returns Verification (RxSV) network?", hint: "§582(c)(4)(C) requires wholesalers to verify returned product." },
      { id: "M4-Q2", text: "Does the WMS trigger an automated serialised product verification before restock?", hint: "Unrestricted restocking is an enforcement violation." },
      { id: "M4-Q3", text: "Are EPCIS TransformationEvents captured for all saleable return processing?", hint: "Disposition without a corresponding EPCIS event creates an orphan." },
      { id: "M4-Q4", text: "Is there a documented and tested 'Suspect Product' quarantine workflow?", hint: "§582(h)(2) requires notification to FDA within 24 hours." },
      { id: "M4-Q5", text: "Does the organisation document which products qualify for DSCSA saleable returns exemptions?", hint: "Misapplying exemptions creates verification gaps." },
      { id: "M4-Q6", text: "Are all 3PLs handling product returns contractually bound to DSCSA requirements?", hint: "3PL non-compliance does not remove §582 liability." }
    ]
  },
  {
    id: "M5",
    label: "M5",
    title: "EPCIS 1.2+ Interoperability [CRITICAL WEIGHT]",
    description: "EPCIS 2.0 repository conformance, T-STAMP query/response, and GS1 Digital Link",
    weight: 2.5,
    weightLabel: "⚡ Max Priority",
    weightClass: "weight-critical",
    milestoneClass: "milestone-m5",
    colorVar: "var(--risk-critical)",
    questions: [
      { id: "M5-Q1", text: "Has the EPCIS repository been upgraded to EPCIS 2.0 / CBV 2.0 and validated?", hint: "EPCIS 1.0/1.1 is non-conformant with DSCSA 2026." },
      { id: "M5-Q2", text: "Does the EPCIS implementation expose a standards-compliant query interface capable of answering T-STAMP queries?", hint: "T-STAMP queries require response within 24 hours." },
      { id: "M5-Q3", text: "Are all EPCIS event EPCs encoded as GS1 Digital Link URIs?", hint: "Required for DSCSA 2026 network interoperability." },
      { id: "M5-Q4", text: "Has the organisation completed bilateral EPCIS testing with at least three major trading partners?", hint: "Network-level testing alone is insufficient." },
      { id: "M5-Q5", text: "Is the EPCIS event payload schema validated against GS1 CBV 2.0 at publish time?", hint: "CBV vocabulary violations silently corrupt interoperability." },
      { id: "M5-Q6", text: "Does the organisation have a defined EPCIS federation strategy?", hint: "Manual re-keying is an anti-pattern." }
    ]
  },
  {
    id: "M6",
    label: "M6",
    title: "Full Trading-Partner System Interoperability",
    description: "End-to-end T2T EPCIS exchange, network verification, and FDA audit readiness",
    weight: 2.0,
    weightLabel: "Very High",
    weightClass: "weight-critical",
    milestoneClass: "milestone-m6",
    colorVar: "var(--risk-high)",
    questions: [
      { id: "M6-Q1", text: "Does the organisation have live EPCIS event exchange with ≥80% of its tier-1 trading partners?", hint: "FDA considers ≥80% coverage the threshold." },
      { id: "M6-Q2", text: "Is there a network-level interoperability layer enabling event exchange without bilateral projects?", hint: "Point-to-point integrations do not scale." },
      { id: "M6-Q3", text: "Does the organisation maintain a live DSCSA compliance dashboard?", hint: "Lack of visibility causes late-detection of failures." },
      { id: "M6-Q4", text: "Has the organisation conducted a formal DSCSA readiness audit within the last 12 months?", hint: "Annual audits demonstrate good-faith compliance." },
      { id: "M6-Q5", text: "Is there a tested Business Continuity Plan (BCP) with RTO ≤4 hours?", hint: "EPCIS downtime does not suspend §582 obligations." },
      { id: "M6-Q6", text: "Does the organisation have a dedicated DSCSA Compliance Officer?", hint: "FDA expects a named compliance accountable party." }
    ]
  }
];
```

**Total Questions:** 36 (6 per milestone)  
**Total Weight:** 9.5 units (normalized across milestones)  
**Question Response Model:** `{ yes: 1.0, partial: 0.5, no: 0.0 }`

---

## CSS Theme & Branding

### Theme Variables (Sui-Generis Enterprise Dashboard)

```css
:root {
  /* Base Colors */
  --bg-base:        #0a0e1a;
  --bg-surface:     #0f1629;
  --bg-card:        #141d35;
  --bg-card-hover:  #1a2545;
  --border-subtle:  #1e2d50;
  --border-accent:  #2a3f70;

  /* Text */
  --text-primary:   #e8edf8;
  --text-secondary: #8fa3c9;
  --text-muted:     #4a5f85;

  /* Accent */
  --accent-blue:    #3b82f6;
  --accent-cyan:    #06b6d4;
  --accent-purple:  #8b5cf6;
  --accent-amber:   #f59e0b;

  /* Risk Tiers */
  --risk-critical:  #ef4444;
  --risk-high:      #f97316;
  --risk-medium:    #eab308;
  --risk-low:       #22c55e;
  --risk-minimal:   #06b6d4;

  /* Effects */
  --score-bar-bg:   #1a2545;
  --glow-blue:      0 0 20px rgba(59, 130, 246, 0.25);
  --glow-cyan:      0 0 20px rgba(6, 182, 212, 0.25);

  /* Typography */
  --font-sans: 'Segoe UI', system-ui, -apple-system, sans-serif;
  --font-mono: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;

  /* Spacing */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  --transition: all 0.2s ease;
}
```

### Branding Elements

**Brand Logo & Text:**
- Icon: `🛡️` (Shield emoji)
- Primary Name: `SGS-Sentinel`
- Tagline: `DSCSA 2026 Readiness Assessment`
- Font Weight: 800 (ultra-bold)
- Gradient: `linear-gradient(90deg, #e8edf8 0%, #8b9fc9 100%)`

**Badge System:**
```css
.badge-regulation {
  background: rgba(59, 130, 246, 0.15);
  color: var(--accent-blue);
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.badge-version {
  background: rgba(139, 92, 246, 0.12);
  color: var(--accent-purple);
  border: 1px solid rgba(139, 92, 246, 0.25);
}
```

**Milestone Color Mapping:**
```
M1 (Trading Partner ID)       → --accent-cyan    (#06b6d4)
M2 (Serialization)            → --accent-blue    (#3b82f6)
M3 (EPCIS Event Capture)      → --accent-purple  (#8b5cf6)
M4 (Saleable Returns)         → --accent-amber   (#f59e0b)
M5 (EPCIS Interoperability)   → --risk-critical  (#ef4444)
M6 (Full Interoperability)    → --risk-high      (#f97316)
```

### Note on "Adversarial" & "Cyber-Defense" Branding
**ARCHIVED STATUS:** No "Adversarial" or "Cyber-Defense" branding text found in v2.1.0. This appears to be a proposed future theme or variant not yet implemented in this release. The current schema uses strictly pharmaceutical compliance terminology aligned with FDA DSCSA requirements.

---

## Engineering Architecture

Extracted from [README.md](README.md) — Engineering Overview section.

### Weighted Compliance Scoring Model

The scoring model is **not** a checkbox survey. Each milestone maps to a specific statutory provision and carries a weight derived from FDA enforcement priorities.

| ID | Milestone | Statutory Basis | Weight | Rationale |
|:---|:---|:---|:---|:---|
| **M1** | Package-Level Serialization | §582(b)(1) | 25% | Hard prerequisite. |
| **M2** | EPCIS Version & Data Exchange | GS1 EPCIS | 20% | Interoperability mandate. |
| **M3** | VRS Connectivity | §582(e)(4) | 20% | Verification plumbing. |
| **M4** | T3 Data Retention (6 Years) | 21 CFR 211.68 | 15% | Auditable requirement. |
| **M5** | Aggregation Capability | §582(c)(4) | 10% | Saleable returns. |
| **M6** | Exception Handling | §582(h) | 10% | Illegitimate product. |

### Algorithmic Approach

**Weight Normalization:**
- Raw milestone weights are summed across all criteria
- Each criterion's normalized weight = `rawWeight / totalWeight`
- Aggregate score = Σ (criterion.passed ? normalizedWeight : 0)
- Final score is in range [0, 1]

**Scoring Logic (v2.1.0):**
1. Calculate milestone score as average of question responses
2. Weight each milestone score by its criticality multiplier
3. Completeness factor: milestone only contributes if ≥1 question is answered
4. Normalize total weighted score by total weight to arrive at 0–100 scale

### Security Design

**Prototype Pollution Guard:**  
All milestone scoring functions receive only primitive string values sourced from controlled dropdowns. No object merging or dynamic key assignment.

**Animation Correctness (Double rAF):**  
Uses `requestAnimationFrame` to eliminate race conditions on high-refresh-rate displays (120Hz+). Score circle SVG animations are frame-synced.

**GLN Validation (T-07):**
```javascript
const valid = /^\d{13}$/.test(el.value.trim());
// Only 13-digit numeric strings accepted; regex validated at input time.
```

### Technical Stack

| Layer | Technology |
|:---|:---|
| **Language** | Vanilla HTML/CSS/JavaScript |
| **Runtime Dependencies** | Zero (0) external libraries |
| **Build System** | None (static deployment) |
| **Hosting** | GitHub Pages + Actions CI/CD |
| **Data Storage** | In-browser sessionStorage (no backend) |
| **Compliance Framework** | ALCOA+ (Attributable, Legible, Contemporaneous, Original, Accurate, + resilience) |

---

## Notes on Removal

### v2.1.0 → v3.0.0 (Diagnostic Refactor)

The following components are **retained** in the refactor:
- ✅ `runAssessment()` function from `src/assessment.js` (hardened scoring logic)
- ✅ Weight normalization algorithm
- ✅ Strict-mode critical failure detection
- ✅ CSS theme variables
- ✅ ALCOA+ audit trail infrastructure

The following components are **deprecated** in v3.0.0:
- ❌ 6-milestone (`M1–M6`) structure → 10-question diagnostic
- ❌ Multi-level card UI with collapsible milestones
- ❌ Remediation guidance panels
- ❌ GLN input collector (`gln-collector` UI)
- ❌ Timeline section
- ❌ Dual-score comparison logic
- ❌ 36-question survey format

### Preservation Rationale

This archive preserves the complete legacy model for:
1. **Historical Audit Trail** — Documents the compliance assessment framework as of May 2026
2. **Reference Implementation** — Future variants can fork from this stable baseline
3. **Forensic Investigation** — If assessment results from this era need to be validated, the exact question set and weights are preserved
4. **Regulatory Evidence** — Demonstrates longitudinal evolution of DSCSA readiness assessment patterns

**Archive Hash:** SHA-256 of MILESTONES constant acts as immutable reference point.

---

**Created:** 2026-05-11T00:00:00Z  
**Archived By:** SGS-Sentinel Development Team  
**License:** MIT — As per SGS-Sentinel v2.1.0
