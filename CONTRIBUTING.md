# Contributing

Thanks for improving NetPlan Studio. Until the repository owner selects a project license, contributions should only be submitted with the owner's explicit agreement.

## Development expectations

- Keep all runtime behavior browser-only and local; do not add telemetry, hosted assets, API calls, or secrets.
- Put deterministic calculations in `src/lib/` with focused Vitest coverage.
- Treat import files as untrusted and update the documented schema and migration path when stored data changes.
- Preserve keyboard access, visible focus, labels, error messages, dark/light contrast, and mobile layouts.
- Update bundled reference data only from authoritative IANA registries and record the review date.
- Do not commit `dist/`, coverage output, editor files, or environment files.

Before opening a pull request:

```bash
npm run lint
npm test
npm run build
```

Describe manual checks for affected routes, import/export behavior, responsive layout, keyboard access, and offline behavior.

