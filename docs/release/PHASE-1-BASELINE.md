# Phase 1 baseline

Date: 2026-08-28  
Branch: `main`  
Reference commit: `6a4e6a3`

## Validation results

| Gate | Command | Result |
| --- | --- | --- |
| Runtime contract tests | `npm test` | Passed: 157/157 after the current hardening changes |
| ESLint | `npm run lint` | Passed after excluding generated and auxiliary worktree output |
| TypeScript | `npx tsc --noEmit` | Passed |
| Production build | `npm run build` | Passed with Next.js 16.3.0 and 10 generated static pages |

The initial lint run traversed generated `.next` files inside `.worktrees/` and
reported 9,668 non-product findings. `eslint.config.mjs` now excludes generated,
tool-runtime, and worktree directories so lint reflects the active source tree.

## Baseline completion command

Run the same runtime used by CI and require every command to pass:

```powershell
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Database-mutating payment tests are deliberately excluded from the baseline.
They require an isolated test database and the explicit `PAYMENT_TEST_MODE`
contract described in `.env.example`.

## Local runtime probe

The built application was started on `localhost:3101` and queried without
printing configuration values:

| Endpoint | Result | Interpretation |
| --- | --- | --- |
| `/api/health` | 200 `ok` | Application process and the configured Neon database both responded successfully |
| `/api/platform-content` | 200 | Returned the public `content`, `plans`, and `templates` collections with no write side effect |

An earlier network-isolated probe returned the intended safe 503 response with a
generic request ID, demonstrating the failure path does not expose SQL or
provider details. The successful probe confirms the configured database path;
Preview still requires its own post-deployment evidence before Phase 1 closes.
