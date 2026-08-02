# SPEC: Upgrade `sharp` Dependency

## Goal
Upgrade the `sharp` dependency from `^0.33.5` to the latest version (`0.35.3`) to address security vulnerabilities and improve compatibility.

## Confidence Score: 100%
- Already analyzed current usage in `scripts/tasks/images.js` and `scripts/tasks/screenshotCompare.js`.
- Usage is limited to standard methods (`rotate`, `jpeg`, `png`, `webp`, `resize`, `toFile`, `toBuffer`) which are stable in `0.35.x`.
- Node.js version in `package.json` (`>=20.13.1`) meets the requirement for `sharp` 0.35.0+ (`>=20.9.0`).

## Proposed Changes
1.  Update `devDependencies` in `package.json` to use the latest version of `sharp`.
2.  Update `package-lock.json` by running `npm install`.

## Risks & Mitigations
- **Risk:** Breaking changes in `sharp` API.
- **Mitigation:** My analysis shows WP Rig uses standard methods that haven't changed. Verification steps will confirm this.
- **Risk:** Installation issues on specific platforms.
- **Mitigation:** `sharp` 0.35.x has improved prebuilt binary support.

## Verification Plan
1.  Check `package.json` for the new version.
2.  Run `npm run images` to verify image optimization (uses `sharp`).
3.  Run `npm run ai:check` to ensure no regressions in linting or tests.
