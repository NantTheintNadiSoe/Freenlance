---
name: burmese-i18n
description: Design or review multilingual web UIs that support Burmese (Myanmar) typography, language-aware layout, and selective translation of technical or familiar UI terms.
---

# Burmese i18n

Use this skill when implementing, reviewing, or localizing a UI that includes Burmese alongside English or other languages. Treat the selected language as a presentation concern as well as a translation concern: Burmese text often needs more vertical room and must not inherit English-only typography assumptions.

## Core rules

- Keep typography language-aware. Do not apply one fixed text style to every locale when Burmese and English have different readability needs.
- Never force Burmese text into a fixed `line-height` chosen for Latin text. Prefer the selected font's natural metrics (`line-height: normal`) or use a deliberately larger Burmese-specific line height when the font and component need an explicit value.
- Do not apply custom letter-spacing to Burmese text. Leave tracking at the font/browser default or inherit the surrounding value; never use negative tracking to make Burmese fit.
- Scope Burmese adjustments to the language, not to arbitrary components. Use a language attribute such as `<html lang="my">` or a component wrapper such as `[lang="my"]`, and make locale-specific CSS override shared defaults.
- Allow for Burmese's greater line box height in buttons, inputs, cards, tables, navigation, dialogs, and vertically centered layouts. Check wrapping, clipping, overlap, and baseline alignment at realistic strings and narrow widths.
- Use a Burmese-capable font with a sensible fallback stack. Verify the actual rendered font and shaping; do not assume that a font with Myanmar glyphs has good metrics or legibility.
- Preserve user-selected language through routing, persistence, server rendering, and client hydration. The language state must drive both copy selection and typography styling.
- Keep text flexible: avoid fixed heights, line clamping, absolute positioning, and vertically rigid layouts for content that may become taller in Burmese. Use padding and min-heights that tolerate wrapping.
- Keep user-generated text and interpolated translations escaped and safely rendered. Do not concatenate markup into translations unless the existing i18n system explicitly supports safe rich text.

## Translation policy

Translate meaning, not every token. Burmese is the primary language for ordinary product copy, instructions, labels, and messages, but technical terms, brand names, product names, code identifiers, file formats, and widely recognized UI terms may remain in English when that is clearer for users.

Make the choice consistently in the locale catalog rather than mixing ad hoc English into components. Preserve terms such as common navigation or software vocabulary when their Burmese translation would be unfamiliar, ambiguous, or longer without improving comprehension. When a term is left in English, ensure the surrounding Burmese grammar and punctuation still read naturally.

Do not use English word length as a layout proxy. Test Burmese and English translations independently because either locale can be the one that wraps or expands a control.

## Implementation pattern

Use a shared baseline plus Burmese overrides. Adapt the syntax to the project's styling system; this is illustrative:

```css
body {
  line-height: 1.5;
}

[lang="my"] {
  line-height: normal;
}

[lang="my"] :where(p, label, button, input, textarea, th, td) {
  /* Set only when the chosen Burmese font needs a stable, tested value. */
  line-height: 1.7;
}
```

Prefer `line-height: normal` when it produces correct font metrics; otherwise choose and test a larger Burmese value per text role rather than blindly scaling every element. Do not put a fixed Burmese line height on the root if headings, controls, or a specific font require different metrics.

When reviewing or changing a UI, inspect at least:

- the language switch itself and persistence after reload;
- body, heading, label, helper/error, and button text;
- long Burmese strings, mixed Burmese/English strings, numerals, punctuation, and technical terms;
- mobile/narrow widths, focus and validation states, dialogs, menus, and dense rows;
- visual regression at the project's supported fonts and browsers.

Report any untranslated content, awkward mixed-language copy, clipping, overlap, excessive whitespace, or controls whose hit area becomes too small after wrapping. Fix the responsible locale, typography token, or layout rule at its source instead of adding one-off per-screen offsets.

