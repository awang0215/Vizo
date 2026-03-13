# Release Guide

This project publishes Windows installers through GitHub Releases.

## How it works

- Push a tag like `v0.1.13`
- GitHub Actions builds the app on Windows
- The workflow creates a GitHub Release
- The installer is uploaded automatically

## Before you release

1. Update the version in `package.json`
2. Add release notes in `docs/releases/vX.Y.Z.md`
3. Commit your changes
4. Create and push the matching tag

The tag must match `package.json`.

Example:

`package.json` version:

```json
{
  "version": "0.1.13"
}
```

Tag:

```bash
git tag v0.1.13
```

Release notes file:

`docs/releases/v0.1.13.md`

## Release notes template

```md
## Vizo v0.1.13

### New
- Add file library panel

### Improved
- Improve project management flow

### Fixed
- Fix image import edge cases
```

If `docs/releases/vX.Y.Z.md` does not exist, GitHub will generate release notes automatically.

## Recommended release commands

```bash
git add .
git commit -m "release: v0.1.13"
git tag v0.1.13
git push origin main --follow-tags
```

## Output files

The workflow uploads:

- `release/Vizo-X.Y.Z-Setup.exe`
- `release/Vizo-X.Y.Z-Setup.exe.blockmap`

Users can download them from:

- `https://github.com/<owner>/<repo>/releases`
- `https://github.com/<owner>/<repo>/releases/latest`
