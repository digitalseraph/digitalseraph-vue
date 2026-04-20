# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Terminal enhancements on `/resume`: command history (↑/↓), Tab completion, bash-style `command not found` errors, new `user<random>@digitalseraph:~$` prompt, and new commands — `ls`, `ls projects/`, `ls writing/`, `cat projects/<slug>.md`, `cat writing/<slug>.md`, `grep <term>`, `date`, `uname [-a]`, `echo`, `sudo`, `exit` / `logout`, `theme [light|dark]`.
- New output components backing the above: `DirectoryListing`, `ProjectPreview`, `PostPreview`, `GrepResults`.
- `useRandomUsername` and `useTerminalHistory` composables; `tabComplete.getCompletions` pure utility.
- `setMode(mode)` action on the theme store.

### Changed

- Résumé dispatcher rewritten around a pure `dispatchCommand(parsed, ctx)` signature with a handler table. New `OutputEntry` side-effect kinds (`navigate`, `theme`, `print`) replace the dispatcher's previous direct `window.print()` call — the orchestrator now owns all side effects.
- `HelpBlock` regrouped into three labeled sections (sections / filesystem / shell).
- Unknown-command output switched from `command not found: <cmd>. try 'help'.` to the canonical `bash: <cmd>: command not found`.
