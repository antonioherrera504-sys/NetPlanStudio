# NetPlan Studio

NetPlan Studio is an offline-first, browser-only network engineering utility dashboard. It performs deterministic calculations, planning, reference lookup, and diagramming locally. It does **not** ping, scan, trace routes, query DNS, discover devices, or inspect a live network.

> Always verify generated network plans before applying them to production infrastructure.

## Features

- **Subnet Calculator** — IPv4 CIDR/mask synchronization, network and broadcast boundaries, `/31` and `/32` explanations, host capacity, classification, wildcard mask, and binary output.
- **VLAN Planner** — named local plans, validated VLAN IDs, subnet overlap detection, gateway and DHCP-scope checks, search/sort/filter, autosave, sample plan, JSON and CSV exchange.
- **DHCP Pool Calculator** — ranges or requested size, merged exclusions, deduplicated reservations, capacity/utilization, lease-turnover estimate, and VLAN handoff.
- **Bandwidth Calculator** — transfer time, required bandwidth, transferable data, link utilization, and packets/second with decimal and IEC units.
- **IP Address Converter** — explicit IPv4 representations plus exact BigInt-backed IPv6 expansion, compression, mapped-address handling, and classification.
- **Port & Protocol Reference** — bundled common TCP/UDP services, IP protocol numbers, EtherTypes, and ICMP/ICMPv6 types with local favorites.
- **Network Diagram Scratchpad** — local SVG topology editor with device and link metadata, multi-select, drag, connect, pan, zoom, grid/snap, undo/redo, preview, examples, and JSON/SVG/PNG export.
- Versioned IndexedDB storage, full backup/restore, light/dark/system themes, responsive navigation, copy confirmations, validation states, and an installable PWA.

## Screenshots

Add current screenshots after deployment:

1. Capture the dashboard at 1440×900.
2. Capture the VLAN Planner with the intentionally loaded sample plan.
3. Capture the Diagram Scratchpad at desktop and mobile widths.
4. Store optimized images under `docs/screenshots/` and link them here.

The bundled social preview is `public/og.png`.

## Local development

Requirements: Node.js 22 (the Netlify build is pinned through `.nvmrc` and `netlify.toml`) and npm.

```bash
npm install
npm run dev
```

Quality commands:

```bash
npm run lint
npm test
npm run build
npm run preview
```

The production output is written to `dist/` and is intentionally ignored by Git.

## Netlify deployment

The repository includes `netlify.toml` with the production command, `dist` publish directory, Node pin, SPA redirect, immutable asset caching, and security headers.

1. Push the repository to GitHub.
2. In Netlify, choose **Add new site → Import an existing project**.
3. Authorize GitHub and select this repository.
4. Netlify should detect `npm run build` and `dist` from `netlify.toml`; do not add environment variables.
5. Deploy, then open every route directly and install the PWA once to verify offline use.

The CSP permits inline styles because diagram colors and several responsive visual states are produced as safe React style properties. Scripts remain restricted to same-origin files; `eval`, inline scripts, remote fonts, and CDN assets are not used.

## Offline storage and privacy

Application records are stored in the browser's IndexedDB database named `netplan-studio`. The current backup/schema version is `1`. Writes are debounced and the header shows `Saving…`, `Saved locally`, or `Save error`.

There is no backend, account, authentication, analytics, telemetry, API key, or normal-use network request. Clearing site data, using private-browsing storage, browser eviction, or removing the installed PWA may delete saved projects.

### Backup and restore

Open **Data & Settings**:

- **Export all data** downloads a versioned JSON backup.
- **Import backup** validates an untrusted file (including a 5 MB size limit) before asking to replace current data.
- VLAN plans and diagrams can also be exchanged individually.
- **Clear all local data** requires explicit confirmation.

Imported strings are rendered as React text, never injected HTML. Cross-references use stable IDs. Deleting a VLAN does not delete diagram nodes or links; an old optional VLAN reference simply becomes unlinked.

## Reference data

`src/data/reference.ts` contains the version-controlled curated snapshot. Sources are the IANA Service Names and Ports, Protocol Numbers, IEEE 802 Numbers, and ICMP Parameters registries. IANA and IETF state that protocol-registry data may be freely used and dedicate applicable rights under CC0 1.0; see [IANA licensing terms](https://www.iana.org/help/licensing-terms).

To update the data:

1. Compare entries with the current IANA registries listed in the app's **Data sources** view.
2. Update curated facts and original concise descriptions in `src/data/reference.ts`.
3. Change `REFERENCE_VERSION` to the review date.
4. Run the reference tests, complete test suite, linter, and production build.

The bundled subset is a convenience reference, not a complete replacement for the authoritative registries.

## Project structure

```text
src/
  components/       reusable shell, fields, results, error boundary
  data/             bundled version-controlled reference data
  lib/              pure IP, subnet, VLAN, DHCP, bandwidth, schema, file, storage logic
  pages/            route-level tools (diagram page is lazy-loaded)
  state/            scoped application data provider and autosave
  test/             browser-test setup
public/             local PWA icons and social image
netlify.toml         build, SPA routing, caching, and security headers
vite.config.ts       Vite, Vitest, manifest, and service-worker configuration
```

## Import schemas

- Full backup: `{ schemaVersion: 1, plans, diagrams, preferences }`
- VLAN plan: `{ id, name, vlans, createdAt, updatedAt }`
- Diagram: `{ id, name, nodes, links, grid, snap, createdAt, updatedAt }`

Zod schemas in `src/lib/schemas.ts` are the executable specification. Future versions should add a migration in `src/lib/storage.ts`, retain previous-version fixtures, and increment `schemaVersion` only when stored data changes incompatibly.

## Known browser limitations

- IndexedDB availability and eviction behavior depend on the browser and browsing mode.
- Clipboard access may fall back to the browser's legacy local copy operation.
- PNG diagram export depends on SVG-to-canvas support; SVG and JSON exports remain available if a browser restricts canvas export.
- The service worker activates only on HTTPS (or localhost), so offline/PWA testing should use the production preview or deployed Netlify site.
- Diagram editing is intentionally a planning scratchpad, not a Visio replacement; groups do not automatically re-parent contained nodes.

## Manual release checklist

- [ ] Run `npm ci`, `npm run lint`, `npm test`, and `npm run build` from a clean checkout.
- [ ] Start `npm run preview` and open `/`, `/subnet`, `/vlans`, `/dhcp`, `/bandwidth`, `/converter`, `/reference`, `/diagram`, and `/settings` directly.
- [ ] Check desktop, tablet, and 320 px mobile layouts.
- [ ] Navigate the shell and forms by keyboard; test focus visibility and diagram shortcuts without typing-field deletion.
- [ ] Exercise subnet→VLAN, VLAN→subnet, VLAN→DHCP, and DHCP→VLAN handoffs.
- [ ] Export/import a VLAN plan, diagram, and full backup; verify invalid and oversized JSON is rejected before state changes.
- [ ] Verify light, dark, and system themes.
- [ ] In browser developer tools, switch offline and reload every tool after the initial production load.
- [ ] Confirm the update prompt appears after deploying a changed hashed build.
- [ ] Review the Netlify CSP console for violations and confirm no third-party requests occur.
- [ ] Re-read the production-verification disclaimer and reference snapshot date.

## License

No project license has been selected yet. The repository owner must choose and add an OSI-approved license before accepting outside contributions or representing the application as open source. IANA-derived protocol-registry facts are covered separately by the IANA/IETF CC0 statement described above.

