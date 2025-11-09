# Repository Guidelines

## Project Structure & Module Organization
Source now lives inside the Yarn workspaces under `apps/`. The Electron main process and Nest backend reside in `apps/backend/src` (including `main.ts`, `env.ts`, and everything under `src/nest`). UI code is grouped in `apps/frontend/src/react`, while shared helpers/types are published from `apps/common/src`. Compiled assets are emitted to `dist/`; keep it clean with `yarn clean`. Examples and documentation drafts remain under `examples/` and `docs/`.

## Build, Test, and Development Commands
Use `yarn dev` for a quick build followed by the packaged Electron start; fall back to `yarn dev:watch` if you want live reload with `turbo watch + nodemon`. Run `yarn build` to produce distributable bundles (`tsc`, `tsc-alias`, `webpack`). Package artifacts are created with `yarn package:win` or `yarn package:linux`. When native modules drift, rebuild them with `yarn rebuild:electron` (or `yarn rebuild:local`).

## Coding Style & Naming Conventions
All TypeScript and TSX follow ESLint + Prettier defaults (2-space indents, single quotes, semicolons). Run `yarn lint` or `yarn format` before committing. Keep React components and Nest providers in PascalCase (e.g., `TranslationDashboard`), functions in camelCase, and constants in UPPER_SNAKE. Favor named exports within each workspace so imports stay path-alias friendly (`@/` for workspace-internal modules, `@apps/common/dist/*` for cross-workspace access). Renderer styling tokens continue to live in `apps/frontend/src/react/theme.ts`.

## Commit & Pull Request Guidelines
Git history favors compact, present-tense subjects (often Korean verbs such as `문제 번호 수정`). Keep to one change per commit and document noteworthy migrations in `change-log.txt` when relevant. 모든 커밋 메시지, PR 설명, 리뷰 코멘트, 이슈 본문/댓글 등 사용자가 확인할 수 있는 출력은 반드시 한국어로 작성한다. Pull requests should include a concise summary, linked issue or task reference, screenshots/GIFs for UI tweaks, and a clear test plan (commands run, manual checks). Ensure the branch builds (`yarn build`) and passes Jest locally before requesting review.

## Environment & Configuration Tips
Runtime variables are loaded via `apps/backend/src/env.ts`; mirror production secrets in a local `.env` and never commit sensitive keys. Native rebuild steps rely on Node 22.14.0—match the engine to avoid electron-rebuild churn. Persisted translation data lives in `translation-cache.db` under the repo root; back it up or reset it explicitly when debugging data flows. Prisma (`prisma/schema.prisma`) owns the DB schema now, so sync changes with `yarn exec prisma db pull`, regenerate types with `yarn exec prisma generate`, and launch Studio via `yarn prisma:studio`.
