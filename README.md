# Ligatrix Security Toolkit

Small checks for publishing Ligatrix public artifacts.

The first tool scans files for common publish blockers:

- obvious secret tokens;
- private-key blocks;
- local machine paths;
- internal-only markers;
- accidentally pasted private conversation exports.

This is not a replacement for a professional security audit. It is a lightweight
pre-publication guardrail.

## Run

```bash
node scripts/scan-public-safety.mjs .
```

## Exit Codes

- `0` - no findings.
- `1` - one or more findings.
