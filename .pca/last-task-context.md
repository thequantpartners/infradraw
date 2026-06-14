# PCA Task Context

## Task
Implementar capa de Google Cloud con generacion de Terraform y asistente DevOps integrado en la infraestructura con notificaciones via Telegram

## Mode
local-only — No vector retrieval. Context built from local memory files.

## Project Memory
# PCA Index

## Project
Name: InfraDraw
Type: developer-utility
Stage: mvp

## Active Objective
Establecer la documentación de arquitectura base usando el framework PCA y preparar la integración con el canvas.

## Critical Runtime Rule
Do not read the entire PCA folder by default.

Canonical markdown files are the source of truth.
Vector memory is the mandatory access layer.
The agent must retrieve only task-relevant context before acting.

## Required Entry Flow
1. Read this file only.
2. Classify the task.
3. Use PCA retrieval.
4. Work with retrieved context.
5. Update memory only after confirmed completion.

## Core Files
- `pca/core/project-brief.md`
- `pca/core/product-context.md`
- `pca/core/architecture.md`
- `pca/core/stack.md`
- `pca/state/active-task.md`
- `pca/state/roadmap.md`
- `pca/state/changelog.md`
- `pca/state/active-decisions.md`
- `pca/visual/visual-index.md`

## Retrieval Limits
- Simple task: 3 chunks
- Normal task: 5 chunks
- Architecture task: 8 chunks
- Audit task: 10 chunks
- Visual task: 3 text chunks + 3 visual references

## Closure Policy
Only after explicit user confirmation with `SI`:
1. update roadmap
2. update changelog
3. update active decisions if needed
4. update ADR/PRD if needed
5. sync changed files to vector memory

## Relevant Context Commits
- [general] docs: close task and update context logs (2026-06-14T22:02:49.439Z)
- [general] docs: close task and update context logs (2026-06-14T05:40:41.995Z)
- [general] docs: close task and update context logs (2026-06-14T05:01:48.055Z)

## Agent Instructions
Use the project memory above as your only context source.
Do not read the full pca/ folder.
Do not invent decisions not listed here.
Validate before marking task as done.
When done, ask: Is this task complete?
