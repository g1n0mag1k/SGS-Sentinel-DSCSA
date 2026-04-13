'use strict';

/**
 * @file assessment.js
 * @module SGS-Sentinel-DSCSA/assessment
 * @description Core compliance-assessment engine for the SGS Sentinel DSCSA framework.
 *   Implements a hardened, weighted-compliance model that evaluates pharmaceutical
 *   supply-chain actors against the DSCSA 2026 interoperability mandates.
 */

/**
 * @typedef {Object} ComplianceCriterion
 * @property {string}  id          - Unique criterion identifier (e.g. `'EPCIS_2_0'`).
 * @property {string}  description - Human-readable description of the criterion.
 * @property {number}  weight      - Relative importance weight (0 < weight ≤ 1).
 *                                   All weights in a criteria set should sum to 1.
 * @property {boolean} passed      - Whether the actor satisfies this criterion.
 */

/**
 * @typedef {Object} AssessmentOptions
 * @property {number}  [passingThreshold=0.75] - Minimum weighted score (0–1) required
 *   to classify an actor as compliant.  Defaults to `0.75`.
 * @property {boolean} [strict=false]          - When `true`, any criterion with
 *   `weight >= 0.5` that is not passed causes an immediate failure regardless of the
 *   aggregate score.  Enables a "hardened" evaluation mode for critical mandates.
 * @property {boolean} [verbose=false]         - When `true`, the returned result
 *   includes a per-criterion breakdown in `result.details`.
 * @property {string}  [assessorId]            - Optional identifier of the entity or
 *   service running the assessment, recorded in the result for audit purposes.
 */

/**
 * @typedef {Object} CriterionDetail
 * @property {string}  id             - Criterion identifier.
 * @property {string}  description    - Human-readable description.
 * @property {number}  weight         - Weight assigned to this criterion.
 * @property {boolean} passed         - Whether the criterion was satisfied.
 * @property {number}  weightedScore  - Contribution to the aggregate score
 *                                      (`weight` when passed, `0` when failed).
 * @property {boolean} critical       - `true` when `weight >= 0.5` (strict-mode gate).
 */

/**
 * @typedef {Object} AssessmentResult
 * @property {string}   actorId          - Identifier of the supply-chain actor that
 *                                         was assessed.
 * @property {number}   score            - Aggregate weighted compliance score (0–1).
 * @property {boolean}  compliant        - `true` when `score >= passingThreshold` and
 *                                         no strict-mode critical criterion was failed.
 * @property {string}   grade            - Letter grade derived from `score`:
 *                                         `'A'` (≥ 0.90), `'B'` (≥ 0.75),
 *                                         `'C'` (≥ 0.60), `'D'` (≥ 0.50), `'F'` (< 0.50).
 * @property {string}   verdict          - Human-readable compliance verdict, one of:
 *                                         `'COMPLIANT'`, `'NON_COMPLIANT'`,
 *                                         or `'CRITICAL_FAILURE'`.
 * @property {string}   assessedAt       - ISO 8601 timestamp of when the assessment ran.
 * @property {string}   [assessorId]     - Identifier of the assessor, if provided via options.
 * @property {CriterionDetail[]} [details] - Per-criterion breakdown; only present when
 *                                           `options.verbose` is `true`.
 */

/**
 * Runs a hardened, weighted-compliance assessment for a DSCSA 2026 supply-chain actor.
 *
 * The function evaluates each supplied {@link ComplianceCriterion} by multiplying its
 * boolean outcome (`passed`) by its `weight`, then sums those products into an aggregate
 * score in the range [0, 1].  The actor is declared **compliant** when:
 *
 * 1. `score >= options.passingThreshold` (default `0.75`), **and**
 * 2. In strict mode (`options.strict === true`), no *critical* criterion
 *    (weight ≥ 0.5) is failed.
 *
 * If condition 2 is violated the verdict is set to `'CRITICAL_FAILURE'` rather than
 * the ordinary `'NON_COMPLIANT'`, enabling downstream systems to triage high-severity
 * deficiencies separately.
 *
 * @function runAssessment
 *
 * @param {string}               actorId  - Unique identifier of the supply-chain actor
 *   being assessed (e.g. a DUNS number, GLN, or internal trading-partner ID).
 *   Must be a non-empty string.
 *
 * @param {ComplianceCriterion[]} criteria - Ordered array of compliance criteria to
 *   evaluate.  Each criterion's `weight` must be a finite positive number; the function
 *   normalises weights so they sum to 1 before scoring, allowing callers to supply raw
 *   importance values without pre-normalisation.  The array must contain at least one
 *   element.
 *
 * @param {AssessmentOptions}    [options={}] - Optional configuration overrides.
 *   See {@link AssessmentOptions} for a full description of each field.
 *
 * @returns {AssessmentResult} A fully populated result object describing the actor's
 *   compliance status, weighted score, letter grade, and—when `options.verbose` is
 *   `true`—a per-criterion breakdown.
 *
 * @throws {TypeError}  If `actorId` is not a non-empty string.
 * @throws {TypeError}  If `criteria` is not a non-empty array.
 * @throws {RangeError} If any criterion's `weight` is not a finite positive number.
 *
 * @example
 * // Basic assessment with default options
 * const result = runAssessment('GLN-0012345600012', [
 *   { id: 'EPCIS_2_0',        description: 'EPCIS 2.0 event repository',      weight: 0.30, passed: true  },
 *   { id: 'SALEABLE_RETURNS', description: 'Saleable-returns verification',    weight: 0.25, passed: true  },
 *   { id: 'VRS_CONNECTIVITY', description: 'VRS network connectivity',         weight: 0.25, passed: false },
 *   { id: 'PRODUCT_ID',       description: 'FDA product-identifier compliance',weight: 0.20, passed: true  },
 * ]);
 * // result.score     → 0.75
 * // result.compliant → true
 * // result.grade     → 'B'
 * // result.verdict   → 'COMPLIANT'
 *
 * @example
 * // Strict (hardened) mode — critical criterion failure overrides aggregate score
 * const result = runAssessment('DUNS-123456789', criteria, { strict: true, verbose: true });
 * if (result.verdict === 'CRITICAL_FAILURE') {
 *   const failed = result.details.filter(d => d.critical && !d.passed);
 *   console.error('Critical DSCSA mandates not met:', failed.map(d => d.id));
 * }
 *
 * @since 1.1.0
 * @see {@link https://www.fda.gov/drugs/drug-supply-chain-security-act-dscsa | FDA DSCSA Overview}
 */
function runAssessment(actorId, criteria, options = {}) {
  if (typeof actorId !== 'string' || actorId.trim() === '') {
    throw new TypeError('actorId must be a non-empty string.');
  }
  if (!Array.isArray(criteria) || criteria.length === 0) {
    throw new TypeError('criteria must be a non-empty array.');
  }

  const {
    passingThreshold = 0.75,
    strict = false,
    verbose = false,
    assessorId,
  } = options;

  // Validate and normalise weights.
  const rawWeights = criteria.map((c, i) => {
    if (!Number.isFinite(c.weight) || c.weight <= 0) {
      throw new RangeError(
        `criteria[${i}].weight must be a finite positive number (got ${c.weight}).`
      );
    }
    return c.weight;
  });
  const totalWeight = rawWeights.reduce((sum, w) => sum + w, 0);

  let score = 0;
  let criticalFailure = false;
  const details = [];

  for (let i = 0; i < criteria.length; i++) {
    const criterion = criteria[i];
    const normalisedWeight = rawWeights[i] / totalWeight;
    const weightedScore = criterion.passed ? normalisedWeight : 0;
    const isCritical = normalisedWeight >= 0.5;

    score += weightedScore;

    if (strict && isCritical && !criterion.passed) {
      criticalFailure = true;
    }

    if (verbose) {
      details.push({
        id: criterion.id,
        description: criterion.description,
        weight: normalisedWeight,
        passed: criterion.passed,
        weightedScore,
        critical: isCritical,
      });
    }
  }

  const isCompliant = !criticalFailure && score >= passingThreshold;

  let verdict;
  if (criticalFailure) {
    verdict = 'CRITICAL_FAILURE';
  } else if (isCompliant) {
    verdict = 'COMPLIANT';
  } else {
    verdict = 'NON_COMPLIANT';
  }

  let grade;
  if (score >= 0.90) grade = 'A';
  else if (score >= 0.75) grade = 'B';
  else if (score >= 0.60) grade = 'C';
  else if (score >= 0.50) grade = 'D';
  else grade = 'F';

  const result = {
    actorId,
    score,
    compliant: isCompliant,
    grade,
    verdict,
    assessedAt: new Date().toISOString(),
  };

  if (assessorId !== undefined) {
    result.assessorId = assessorId;
  }

  if (verbose) {
    result.details = details;
  }

  return result;
}

module.exports = { runAssessment };
