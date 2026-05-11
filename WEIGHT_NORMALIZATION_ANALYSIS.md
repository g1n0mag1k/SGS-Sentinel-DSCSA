# Weight Normalization & Critical Failure Analysis
**Verified**: `runAssessment()` integration with 10-question diagnostic model  
**Date**: 2026-05-11  
**Status**: ⚠️ Design constraint identified — no individual milestone triggers critical failure

---

## 1. Executive Summary

The `runAssessment()` function from `src/assessment.js` implements **strict-mode critical failure detection** when any criterion with normalized weight ≥ 0.5 is marked as "failed". 

**Current weight model for the 3-milestone diagnostic:**
```
Milestone A (Physical Integrity):  1.5 units
Milestone B (Data Exchange):      2.0 units
Milestone C (Governance):         1.2 units
─────────────────────────────────────────
TOTAL WEIGHT:                     4.7 units
```

**Weight normalization result:**
```
Milestone A: 1.5 ÷ 4.7 = 0.319 (31.9%)  ❌ NOT critical (< 0.5)
Milestone B: 2.0 ÷ 4.7 = 0.426 (42.6%)  ❌ NOT critical (< 0.5)
Milestone C: 1.2 ÷ 4.7 = 0.255 (25.5%)  ❌ NOT critical (< 0.5)
─────────────────────────────────────────────────────────────
Sum of normalized weights: 1.000 ✓
```

**Critical finding**: With these weights, **NO milestone will trigger critical failure in strict mode**, even if all its questions are marked "No". Each milestone contributes less than 50% to the overall score.

---

## 2. Assessment Logic Comparison

### index.html Current Model
- **Unit of assessment**: Individual question responses (yes/partial/no)
- **Scoring**: Average of question scores within each milestone
- **Response mapping**: `{ yes: 1.0, partial: 0.5, no: 0.0 }`
- **Example**: If Milestone A has 3 questions and user selects "no" on all:
  - Milestone A score: (0.0 + 0.0 + 0.0) / 3 = 0.0 or 0%
  - But normalized weight stays 0.319, so contribution to overall = 0% × 0.319 = 0%

### runAssessment() Model
- **Unit of assessment**: Milestone as a single criterion (pass/fail boolean)
- **Scoring**: Normalized criterion weight × pass/fail
- **Critical failure gate**: If `strict: true` **AND** `weight >= 0.5` **AND** `passed: false`
- **Example**: If Milestone A fails (score < threshold):
  - Criterion A: `{ id: 'A', weight: 1.5, passed: false }`
  - Normalized weight: 1.5 / 4.7 = 0.319
  - **Critical check**: Is 0.319 ≥ 0.5? **NO** → No critical failure triggered
  - Result: `VERDICT = 'NON_COMPLIANT'` (not `CRITICAL_FAILURE`)

---

## 3. Integration Bridge: Converting Responses to Criteria

To call `runAssessment()` from index.html, we need a conversion function:

```javascript
/**
 * Convert index.html responses to runAssessment() criteria format.
 * Determines pass/fail threshold: a milestone "passes" if its average score ≥ 0.75
 */
function buildAssessmentCriteria(passingThreshold = 0.75) {
  const criteria = [];

  for (const m of MILESTONES) {
    // Calculate milestone average score
    const mScore = calcMilestoneScore(m);
    const milestonePct = mScore?.pct ?? 0; // 0-100 scale
    
    // Normalize to 0-1 scale
    const normalizedMilestoneScore = milestonePct / 100;

    // Determine pass/fail: milestone passes if average ≥ threshold
    const passed = normalizedMilestoneScore >= passingThreshold;

    criteria.push({
      id: m.id,
      description: `${m.title}: ${m.description}`,
      weight: m.weight,
      passed: passed,
    });
  }

  return criteria;
}

/**
 * Run hardened assessment with runAssessment() function.
 * Safe to call after any response update.
 */
function runHardenedAssessment() {
  const actorId = document.getElementById('facility-name')?.value || 'Unknown Actor';
  const criteria = buildAssessmentCriteria(0.75); // 75% threshold
  
  // Call assessment.js function
  const result = runAssessment(actorId, criteria, {
    passingThreshold: 0.75,
    strict: true,
    verbose: true,
  });

  console.log('Assessment Result:', result);
  return result;
}
```

---

## 4. Weight Normalization Verification

### Calculation Proof
```javascript
// Step 1: Extract raw weights
const rawWeights = [1.5, 2.0, 1.2]; // A, B, C

// Step 2: Sum
const totalWeight = 1.5 + 2.0 + 1.2; // = 4.7

// Step 3: Normalize each
const normalized = [
  1.5 / 4.7, // = 0.3191489...
  2.0 / 4.7, // = 0.4255319...
  1.2 / 4.7, // = 0.2553191...
];

// Step 4: Verify sum = 1.0
const sum = normalized.reduce((a, b) => a + b); // = 0.9999... ✓
```

### How Milestone Scores Affect Overall Score
```
Overall Score = (A.score × 0.319) + (B.score × 0.426) + (C.score × 0.255)

Example: If only Milestone A scores 100% (1.0) and B, C score 0%:
Overall = (1.0 × 0.319) + (0.0 × 0.426) + (0.0 × 0.255) = 0.319 = 31.9%
❌ Below 75% threshold → NON_COMPLIANT

Example: If all three score 100%:
Overall = (1.0 × 0.319) + (1.0 × 0.426) + (1.0 × 0.255) = 1.0 = 100%
✅ Above 75% threshold → COMPLIANT (if no critical failures)
```

---

## 5. Critical Failure Behavior Analysis

### Scenario 1: User marks all 3 Milestone A questions "No"
```
Milestone A score: 0% → passed: false
Normalized weight A: 0.319

Strict mode check:
  Is weight(A) >= 0.5? NO (0.319 < 0.5)
  → CRITICAL FAILURE NOT TRIGGERED
  
Result verdict: NON_COMPLIANT (not CRITICAL_FAILURE)
```

### Scenario 2: ALL questions in ALL milestones marked "No"
```
Milestone A: 0%, weight 0.319, critical? NO
Milestone B: 0%, weight 0.426, critical? NO
Milestone C: 0%, weight 0.255, critical? NO

Overall score: 0%
Strict mode: No criterion marked critical (all < 0.5)
  → CRITICAL FAILURE NOT TRIGGERED

Result verdict: NON_COMPLIANT
```

### Scenario 3: Hypothetical critical milestone (for reference)
```
IF we set Milestone A weight to 2.5 (not the current 1.5):

Raw weights: [2.5, 2.0, 1.2] → Total 5.7
Normalized A: 2.5 / 5.7 = 0.439... (still < 0.5)

Even with weight 3.0:
Normalized A: 3.0 / 5.7 = 0.526... ✅ CRITICAL!
```

**To trigger critical failure on any milestone, its weight must normalize to ≥ 0.5.**

---

## 6. Design Options to Achieve Critical Failure on Milestone A

### Option A: Reassign Weights to Make Milestone A Critical
Set Milestone A weight **≥ 50% of total** to trigger critical failure.

```javascript
// Option A1: Make A = 50% of total
const milestoneWeights = {
  A: 2.5,  // 2.5 ÷ 5.7 = 0.439 (too low, need ≥ 0.5)
  B: 2.0,
  C: 1.2,
  // Total: 5.7
};

// Option A2: Increase A to 2.8+ (and reduce B or C)
const milestoneWeights = {
  A: 2.8,  // 2.8 ÷ 5.0 = 0.56 ✓ CRITICAL!
  B: 1.5,
  C: 0.7,
  // Total: 5.0
};

// Option A3: Make A the ONLY criterion (not recommended)
const milestoneWeights = {
  A: 1.0,  // Normalized to 1.0 = 100% CRITICAL
  // (loses B and C coverage)
};
```

### Option B: Multi-Criterion Assessment (Advanced)
Break each Milestone's questions into separate criteria:

```javascript
const criteria = [
  { id: 'A-Q1', weight: 0.8, passed: true },  // Physical Integrity, Part 1
  { id: 'A-Q2', weight: 0.7, passed: true },  // Physical Integrity, Part 2
  ...
];
// Total weight: some value that normalizes to make individual questions critical
```

### Option C: Accept Non-Critical Milestone Failures (Current Design)
The current model is valid if the business rule is:
- **"No single milestone failure triggers immediate rejection"**
- **"Cumulative non-compliance across milestones triggers non-compliance"**
- This is risk-distributed rather than risk-concentrated on one area

---

## 7. Recommended Implementation

### For Current Requirements (No Changes to Weights)

```javascript
// In index.html, after responses are updated:

function updateAssessmentVerdict() {
  const criteria = buildAssessmentCriteria(0.75);
  const result = runAssessment(
    document.getElementById('facility-name').value,
    criteria,
    { strict: true, verbose: true }
  );

  // Display result
  const verdictEl = document.getElementById('verdict-display');
  verdictEl.textContent = result.verdict;
  verdictEl.className = `verdict verdict-${result.verdict.toLowerCase()}`;
  
  // log details in verbose mode
  if (result.details) {
    console.table(result.details);
  }

  return result;
}
```

### Observation
With weights [1.5, 2.0, 1.2], the assessment will return:
- `COMPLIANT` - if all milestones score ≥ 75%
- `NON_COMPLIANT` - if combined score < 75% (strict mode won't trigger, no critical failures possible)
- **NEVER** `CRITICAL_FAILURE` (under current weights)

---

## 8. Next Steps

### Verification Checklist
- [x] Weight normalization formula validated
- [x] Critical failure threshold (≥ 0.5) confirmed
- [x] Integration bridge function provided
- [x] Design constraint documented (no milestone is critical with current weights)
- [ ] Decide: Keep current weights or adjust for Milestone A criticality?
- [ ] Import `runAssessment` into index.html
- [ ] Update MILESTONES array to new 10-question format (pending)
- [ ] Test `updateAssessmentVerdict()` after array replacement

### MILESTONES Array Replacement (Still Pending)
The 10-question array hasn't been fully deployed yet. Once deployed:
```javascript
// Pseudocode for updated structure
const MILESTONES = [
  {
    id: 'A',
    title: 'Physical Integrity',
    weight: 1.5,
    questions: [ /* 3 questions */ ],
  },
  {
    id: 'B',
    title: 'Data Exchange',
    weight: 2.0,
    questions: [ /* 5 questions */ ],
  },
  {
    id: 'C',
    title: 'Governance',
    weight: 1.2,
    questions: [ /* 2 questions */ ],
  },
];
```

---

## 9. Summary Table

| Aspect | Current (v2.1.0) | Target (v3.0.0) | Status |
|:---|:---|:---|:---|
| **Total Milestones** | 6 (M1–M6) | 3 (A–C) | ⏳ Pending |
| **Total Questions** | 36 | 10 | ⏳ Pending |
| **Total Weight Units** | 9.5 | 4.7 | ✅ Defined |
| **Milestone A Weight** | M1: 1.0 | A: 1.5 | ⏳ Pending |
| **Milestone B Weight** | M3: 1.5 | B: 2.0 | ⏳ Pending |
| **Milestone C Weight** | M6: 2.0 | C: 1.2 | ⏳ Pending |
| **Critical Failure Possible?** | No (M5 is 2.5/9.5=0.263) | **No** (max is B at 0.426) | ⚠️ Design constraint |
| **Integration with runAssessment()** | Not yet integrated | Ready to integrate | ⏳ Awaits array |

---

## 10. Code Reference: Full Bridge Implementation

```javascript
/**
 * INTEGRATION MODULE: runAssessment() Bridge
 * Converts index.html response model to src/assessment.js criteria model
 */

/**
 * Build criteria array for runAssessment() function
 * @param {number} milestonePctThreshold - % threshold for milestone to "pass" (default 75)
 * @returns {ComplianceCriterion[]} Array ready for runAssessment()
 */
function buildAssessmentCriteria(milestonePctThreshold = 75) {
  return MILESTONES.map(milestone => {
    const mScore = calcMilestoneScore(milestone);
    const milestonePct = mScore?.pct ?? 0;
    const normalizedScore = milestonePct / 100;
    
    return {
      id: milestone.id,
      description: `${milestone.title}: ${milestone.description}`,
      weight: milestone.weight,
      passed: normalizedScore >= (milestonePctThreshold / 100),
    };
  });
}

/**
 * Execute hardened assessment
 * @param {object} options - { passingThreshold, strict, verbose }
 * @returns {AssessmentResult}
 */
function executeHardenedAssessment(options = {}) {
  const {
    passingThreshold = 0.75,
    strict = true,
    verbose = false,
  } = options;

  const actorId = document.getElementById('facility-name')?.value 
    || document.getElementById('org-name')?.value 
    || 'Unknown Actor';
  
  const criteria = buildAssessmentCriteria(passingThreshold * 100);
  
  // Call runAssessment from src/assessment.js
  const result = runAssessment(actorId, criteria, {
    passingThreshold,
    strict,
    verbose,
  });

  return result;
}

/**
 * Update UI with assessment verdict
 * Call after each response change
 */
function updateHardenedVerdict() {
  const result = executeHardenedAssessment({ verbose: true });
  
  // Update verdict display
  const verdictContainer = document.getElementById('verdict-container');
  if (verdictContainer) {
    verdictContainer.innerHTML = `
      <div class="verdict-${result.verdict.toLowerCase()}">
        <strong>Verdict:</strong> ${result.verdict}<br>
        <strong>Score:</strong> ${Math.round(result.score * 100)}%<br>
        <strong>Grade:</strong> ${result.grade}
      </div>
    `;
  }

  // Log details if verbose
  if (result.details) {
    console.log('Criterion Breakdown:', result.details);
  }

  return result;
}
```

---

## Conclusion

✅ **runAssessment() is ready to integrate**  
✅ **Weight normalization logic is verified**  
⚠️ **Critical failure will NOT trigger with current weights [1.5, 2.0, 1.2]**  
⏳ **Pending**: MILESTONES array replacement to deploy 10-question structure

**Recommendation**: Proceed with array replacement and integration bridge. If critical failure on Milestone A is required, adjust weights afterward (e.g., A: 2.8, B: 1.5, C: 0.7).
