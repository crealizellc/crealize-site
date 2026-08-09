# Codex Review Packet

## Goal

Review the local Crealize corporate-site fix before any push or deployment. The
reported mobile defects were a permanently visible 01-04 navigation panel, an
apparently inactive globe/language control, and copy that sounded overly
generated. This packet is evidence for review, not approval to publish.

Repository: `crealizellc/crealize-site`

- Base branch: `public-main`
- Base SHA: `1b6cb86158295936ebcca0afefdc768ed9ed26dc`
- Implementation branch: `codex/fix-mobile-nav-and-copy`
- Implementation SHA under review:
  `621e5897b50d2985d0f0bb64fd1e788b413d9031`
- Delivery state: local commit only; not pushed, merged, deployed, or accepted
  in production

Review the complete implementation range:

```text
1b6cb86158295936ebcca0afefdc768ed9ed26dc..
621e5897b50d2985d0f0bb64fd1e788b413d9031
```

## Changed Files

### Mobile navigation and regression coverage

- `site/css/site.css`
- `scripts/audit-nav.mjs`

### Source copy, localization, and generated site output

- `docs/design-system/source/claude-design-export/Crealize Corporate Site.html`
- `docs/design-system/work-copy.json`
- `scripts/build-site.mjs`
- `site/index.html`
- `site/ja/index.html`
- `site/zh/index.html`
- `site/js/i18n/en.js`
- `site/js/i18n/ja.js`
- `site/js/i18n/zh.js`
- `site/js/work-v3.js`
- `site/llms.txt`

### Locale asset fix

- `site/js/hero.js`

### Repository-owned validation and reproducible browser execution

- `scripts/audit-design-tokens.mjs`
- `scripts/audit-work-v3.mjs`
- `scripts/prerender-work.mjs`
- `scripts/shoot-site.mjs`
- `docs/design-system/tokens/crealize.tokens.json`
- `package.json`

### Editorial contract and evidence

- `docs/design/BRAND_CONTRACT.md`
- `docs/design/prompts/site-copy-editorial.md`
- `docs/design-system/shots/*-mobile-*.png`
- `docs/CHANGELOG.md`

## Important Diff Summary

1. The mobile panel already received `hidden=true`, but author CSS set
   `.nav__panel { display:grid }`, overriding the browser's built-in hidden
   rule. The fix adds `.nav__panel[hidden] { display:none }` inside the mobile
   media query.
2. The globe control's existing JavaScript was functional. The persistently
   rendered panel overlaid that area, making it appear inactive. The navigation
   audit now verifies computed visibility, open/close state, `aria-expanded`,
   and all three locale links.
3. Hero, Vision, Method, Join, SEO descriptions, `llms.txt`, and all 16 visible
   Selected Work summaries were rewritten in English, Japanese, and Traditional
   Chinese with direct product language. Verified product facts, status, and
   safety disclaimers were preserved.
4. The long case-study bodies shown inside work modals were not comprehensively
   rewritten. They remain fact-sensitive source material and some may still
   contain rhetorical or AI-like phrasing. This is an explicit review boundary,
   not a claim that every sentence on the site was rewritten.
5. The localized hero pages previously loaded `assets/crealize-mark.png`
   relative to `/ja/` and `/zh/`. The hero now reuses the already resolved nav
   logo URL.
6. The design-token gate previously depended on a machine-local peer script.
   It is replaced by a repository-owned validator comparing 47 contract tokens
   and bounding raw colors/fonts in consumer CSS.

## Verification Evidence

事實 1：修正前重新 fetch；base SHA 與 `origin/public-main` 相同，ahead/behind
為 `0/0`。

事實 2：在 implementation SHA
`621e5897b50d2985d0f0bb64fd1e788b413d9031` 執行：

```bash
CHROME_BIN=<headless-chrome> CHROME_SINGLE_PROCESS=1 npm run check:all
```

實際結果：

- EN/JA/ZH at 390px: panel initially has `hidden=true` and computed
  `display:none`
- Globe opens, closes, reports `aria-expanded`, and exposes three locale links
- Mobile menu button and all four links meet the 44px touch minimum
- Clicking a mobile navigation link closes the panel and restores
  `display:none`
- EN/JA/ZH at 900px retain inline navigation
- 390, 640, 1100, and 1440px have no horizontal overflow
- All 16 work cards, modal detail, assets, animations, and reduced-motion
  behavior pass
- All 16 cards and detail bodies are present in raw prerendered HTML for all
  three locales
- 47 design tokens match shipped CSS
- Worktree was clean after exact-SHA validation

事實 3：A staged-diff scan found no common private-key, GitHub-token, AWS-key,
API-key, or generic secret assignment patterns.

結論（基於事實 1+2+3）：The local implementation is internally consistent
and passes the task-specific automated acceptance checks. This is not
production acceptance because nothing was pushed or deployed.

## Skipped / Untested

- No remote branch or PR exists. Both CLI and GitHub integration writes
  returned HTTP 403.
- No `gh-pages` deployment was attempted.
- No production mobile acceptance was performed. Production still serves the
  old copy and CSS.
- No external native-speaker editorial review has been performed.
- The modal case-study bodies were not comprehensively rewritten.
- `check:rules` prints a pre-existing missing `src/types` warning but exits
  successfully. Treat that command as a false-green legacy check, not evidence
  for this change.
- No independent legal or factual verification was done for existing product
  claims; the change deliberately preserved those claims.

## Known Risks

1. Review the CSS specificity and breakpoint scope to ensure `[hidden]` cannot
   regress or interfere with desktop navigation.
2. Review the globe/menu interaction order, outside-click behavior, Escape
   behavior, focus handling, and stacking context on a real mobile browser.
3. Review English, Japanese, and Traditional Chinese for factual equivalence,
   native phrasing, and text fit. Do not normalize them into literal
   translations.
4. Review generated-output consistency: builder source, locale maps,
   `work-copy.json`, `site/js/work-v3.js`, and the three prerendered HTML files
   must describe the same version.
5. Review `audit-design-tokens.mjs` for false positives and false negatives,
   especially its raw RGB allowlist and font-family checks.
6. Do not treat the local screenshots, green checks, commit, or this packet as
   proof that production changed.

## Questions For Adversarial Review

1. Is there any viewport or interaction sequence where the 01-04 panel remains
   visually present while semantically hidden, or blocks the globe control?
2. Do the language menu and mobile menu preserve keyboard, focus, Escape,
   outside-click, and screen-reader behavior?
3. Did the copy pass remove the reported AI tone without weakening facts,
   safety language, or product status?
4. Which remaining modal body sentences still sound generated enough to merit
   a separate fact-preserving editorial pass?
5. Does the locale-relative hero logo fix behave correctly for local files,
   `/ja/`, `/zh/`, and the production origin?
6. Do the new tests fail for the original defects, and can any assertion pass
   without the user-visible behavior actually working?
7. Are there any unrelated or unjustified changes in the 27-file diff?

If changes are needed, report evidence and exact affected files first. Do not
push, merge, deploy, alter credentials, or broaden the work beyond this review
without Yves's authorization.
