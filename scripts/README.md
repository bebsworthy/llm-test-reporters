# Scripts

Utility scripts for maintaining the LLM Test Reporters project.

## Available Scripts

### check-updates.sh

Checks all packages for available dependency updates without modifying anything.

```bash
./scripts/check-updates.sh
```

This script will:
- Scan all TypeScript packages
- Show which dependencies have newer versions available
- Display current version → latest version for each outdated dependency

### update-dependencies.sh

Updates all dependencies to their latest versions across all packages.

```bash
./scripts/update-dependencies.sh
```

This script will:
1. Check for updates in all packages
2. Update package.json files with latest versions
3. Clean install all dependencies (removes node_modules and package-lock.json)
4. Run builds to verify compatibility
5. Run validation tests

**Warning**: This script makes changes to your project. Always:
- Review changes with `git diff` before committing
- Test thoroughly after updates
- Be prepared to fix breaking changes

## Requirements

Both scripts require `npm-check-updates` (ncu) to be installed:

```bash
npm install -g npm-check-updates
```

The update script will attempt to install it if not found.

## Usage Tips

1. **Always check first**: Run `check-updates.sh` before `update-dependencies.sh`
2. **Update incrementally**: For production projects, consider updating packages one at a time
3. **Test thoroughly**: Some updates may introduce breaking changes
4. **Review changelogs**: Check package changelogs for major version updates

## Manual Updates

To update a specific package manually:

```bash
cd typescript/jest-reporter
ncu -u @jest/reporters  # Update specific package
ncu -u                   # Update all packages
npm install
npm run build
npm test
```