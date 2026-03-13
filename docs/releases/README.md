# Release Notes Folder

Add one Markdown file per version release.

Naming rule:

- `v0.1.13.md`
- `v0.2.0.md`

The filename must match the Git tag exactly.

Example path:

- `docs/releases/v0.1.13.md`

If the matching file exists, GitHub Release will use it as the release description.
If not, the workflow falls back to GitHub generated release notes.
