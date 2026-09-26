# Archer project TODO

This list reflects the current web/API checkout and the work completed on the
recent feature branches.

## Completed

- [x] Initialize independent Git repositories for `app/` and `api/`.
- [x] Add English and Burmese UI translations with persisted language selection.
- [x] Add locale-aware date and currency formatting.
- [x] Improve Burmese typography with Myanmar font fallbacks and script-specific
      spacing and line-height rules.
- [x] Add persisted light/dark theme support with system-preference fallback.
- [x] Add an accessible icon-only Sun/Moon theme toggle to public and workspace
      navigation.
- [x] Verify the app production build after the i18n, typography, and theme
      changes.

## Next

- [ ] Review and merge `feature/light-dark-mode` into `main` after UI review.
- [ ] Add automated coverage for language persistence, theme persistence, and
      keyboard/accessibility behavior of both controls.
- [ ] Perform visual QA across English/Burmese and light/dark combinations at
      mobile, tablet, and desktop breakpoints.
- [ ] Decide whether to bundle a Myanmar font for consistent rendering when
      `Noto Sans Myanmar`, `Myanmar Text`, or `Padauk` is unavailable locally.
- [ ] Add translated client-side mappings for API validation and error messages
      where server responses are currently English-only.
- [ ] Carry the shared language and theme behavior into the future mobile
      client when that client enters scope.
