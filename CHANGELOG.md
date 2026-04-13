# Changelog

All notable changes to SGS Sentinel DSCSA will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] – 2026-04-13

### Summary

Version 1.1 introduces the **hardened, weighted-compliance model** at the heart of the
SGS Sentinel DSCSA assessment engine.  The core `runAssessment` function now scores
supply-chain actors against the full set of DSCSA 2026 interoperability mandates using a
configurable weight-normalised algorithm, adds a strict-mode critical-failure gate for
high-severity criteria, and emits a structured `AssessmentResult` object suitable for
downstream audit pipelines and regulatory reporting.

---

### Added

- **`src/assessment.js` – Core assessment module**
  - `runAssessment(actorId, criteria, options)` — primary public API.
    Accepts an actor identifier, an ordered array of `ComplianceCriterion` objects
    (each carrying an `id`, `description`, `weight`, and boolean `passed` flag), and an
    optional `AssessmentOptions` configuration bag.
  - **Weight-normalised scoring** — raw criterion weights are normalised to sum to 1
    before multiplication, so callers may supply absolute importance values without
    pre-normalisation.  Aggregate scores are bounded to [0, 1].
  - **Configurable passing threshold** — `options.passingThreshold` (default `0.75`)
    sets the minimum weighted score required for a `COMPLIANT` verdict, mirroring the
    FDA's interoperability readiness bar.
  - **Strict / hardened mode** (`options.strict`) — any criterion whose normalised
    weight is ≥ 0.5 is classified as *critical*.  In strict mode a single failed
    critical criterion yields a `CRITICAL_FAILURE` verdict regardless of the aggregate
    score, enabling zero-tolerance enforcement of the most consequential DSCSA mandates
    (e.g. EPCIS 2.0 repository, saleable-returns verification).
  - **Verbose output** (`options.verbose`) — when enabled, `AssessmentResult.details`
    carries a full per-criterion breakdown including individual weighted scores and
    the critical flag, supporting drill-down audits.
  - **Letter grade** — results include a `grade` field (`A`/`B`/`C`/`D`/`F`) derived
    from the aggregate score to facilitate at-a-glance compliance dashboards.
  - **Audit metadata** — every result records an ISO 8601 `assessedAt` timestamp and
    an optional `assessorId` for chain-of-custody traceability.
  - Comprehensive JSDoc type definitions: `ComplianceCriterion`, `AssessmentOptions`,
    `CriterionDetail`, and `AssessmentResult`.
  - Input validation with descriptive `TypeError` / `RangeError` messages.

### Changed

- `README.md` — updated project description to reference the compliance-assessment
  framework and the DSCSA 2026 interoperability mandate scope.

### Security

- Input validation in `runAssessment` guards against prototype-pollution vectors by
  rejecting non-string actor identifiers and non-array criteria payloads before any
  property access.

---

## [1.0.0] – 2026-04-10

### Added

- Initial project scaffold: `README.md`, `LICENSE`.

[1.1.0]: https://github.com/g1n0mag1k/SGS-Sentinel-DSCSA/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/g1n0mag1k/SGS-Sentinel-DSCSA/releases/tag/v1.0.0
