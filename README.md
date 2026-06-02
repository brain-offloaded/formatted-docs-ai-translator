# Formatted Docs AI Translator

An AI-powered translation tool for formatted documents.

Korean documentation is available under [docs/ko](./docs/ko/index.md).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

### A Note from the Author

#### 1. A Small Wish
If you find this tool useful, crediting the author or sharing a link would be greatly appreciated! This is **absolutely not mandatory**, just a personal wish. I am grateful enough that you are using this tool even without any credit.

#### 2. Complete Freedom
Technically, this project is under the MIT License for minimal legal protection. However, honestly speaking, **I do not intend to enforce the license terms strictly.**
You are free to use this code however you like. I won't mind even if you remove my name or claim you made this tool yourself.
**The only thing I ask is:** Please do not claim ownership and then accuse *me* (the original author) of copyright infringement. As long as you don't do that, feel free to do whatever you want!

## Key Features

- Support for multiple file formats: text, JSON, CSV, SRT subtitles, images, and more
- Batch translation for multiple files
- User-controlled translation settings and workflows

## Development

Developer documentation:
- **[English](./docs/en/index.md)**
- **[Korean](./docs/ko/index.md)**

### Codex Maintainer Workflow

This repository uses Codex as part of its OSS maintainer workflow, not just as a generic code generator.

- Repository rules live in `AGENTS.md`.
- Project-local Codex defaults live in `.codex/config.toml`.
- Repeatable maintainer workflows live in `.agents/skills/oss-maintainer-codex`.

Typical uses include:

- Drafting PR summaries and verification steps
- Keeping developer docs and Codex operating rules in sync
- Running `yarn lint` / `yarn test` / `yarn build` before releases or merges
- Narrowing risky changes around Electron, Prisma, and translation cache behavior

### Local Development

- `yarn dev`: Builds the full workspace and launches the Electron app.
- `yarn dev:watch`: Watches for changes during development.

### Database (Prisma)

- Prisma schema: `prisma/schema.prisma`
- Pull schema changes: `yarn exec prisma db pull`
- Regenerate Prisma Client: `yarn exec prisma generate`
- Open Prisma Studio: `yarn prisma:studio`
