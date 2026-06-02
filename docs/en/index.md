# Formatted Docs AI Translator Developer Docs

This section documents the architecture, development workflow, and contributor guidance for Formatted Docs AI Translator.

## Getting Started

- **[Release Process](./how-to-release.md)**: How to prepare and ship a new release.
- **[Packaging Optimization Guide](./PACKAGING.md)**: Notes on reducing Electron packaging time.
- **[Codex Configuration Guide](./codex.md)**: How this repository uses `AGENTS.md`, `.codex`, and repo-specific skills.

## Architecture

- **[Frontend Architecture](./frontend-architecture.md)**: React renderer structure and core design principles.
- **[Job Management System](./job-management-system.md)**: Frontend job orchestration for concurrent translation.
- **[Unified Domain Models](./unified-domain-models.md)**: Core domain objects used by the translation pipeline.
- **[IPC to REST Migration Roadmap](./rest-migration-plan.md)**: Notes from the IPC-to-REST transition.

## Adding Features

- **[Adding a New Parser](./adding-parser.md)**: How to add a parser and applier for a new file format.
- **[Frontend Integration Guide](./adding-frontend.md)**: How to connect a new translation type to the frontend.
- **[Image Translation Extension Guide](./adding-image-translation.md)**: How image translation works and how to extend it.

## Other References

- **[Language Metadata Guide](./languages.md)**: How language metadata is organized.
- **[Local vLLM Server Guide](./vllm-local-server.md)**: How to run and connect to an OpenAI-compatible local server.
