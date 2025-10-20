## Description
<!-- Describe your changes -->

---

## Database Changes

<!-- ⚠️ If this PR includes database migrations, complete this checklist: -->

- [ ] Ran `npm run db ai:preflight -- --table <table-name>` (or with migration file)
- [ ] Attached `change_plan.json` or preflight results below
- [ ] Applied auto-fixes if suggested: `npm run db schema:fix --table <table> --apply`
- [ ] Re-ran preflight after fixes (status: ✅ PASSED)
- [ ] Ran `npm run db types:generate -- --helpers` to update TypeScript types
- [ ] Validated types: `npm run db types:validate`

<details>
<summary>📄 Preflight Change Plan</summary>

```json
<!-- Paste change_plan.json or preflight-result.json contents here -->


```

</details>

---

## Wizard Flow Changes

<!-- ⚠️ If this PR includes wizard flow JSON changes, complete this checklist: -->

**Definition of Ready (per flow):**
- [ ] `flow.version` and `schemaVersion` match validator
- [ ] All steps have `navigation` + `privacy` (strict mode)
- [ ] At least one chapter with non-zero weight
- [ ] All fields: `bind` is present and resolvable
- [ ] No TODO strings (lint)
- [ ] Ran `npm run flows:validate "config/**/*.json"`

**Definition of Ready (per step):**
- [ ] `type` maps to a known template
- [ ] `title` OR `titleKey` present
- [ ] All fields have `bind`, `validation`, `privacy`
- [ ] `navigation` present (back/continue rules)
- [ ] `privacy.allowInAI` explicit for every field
- [ ] `shouldExistWhen` compiles (if present)

**Definition of Done (runtime):**
- [ ] Renderer snapshot tests pass
- [ ] A11y smoke check (axe) passes
- [ ] Analytics events verified in dev
- [ ] No blank screens on error cases

---

## Type of Change

- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] 🗄️ Database migration
- [ ] 🧙 Wizard flow changes

---

## Testing

<!-- Describe the tests you ran -->

- [ ] Tested locally
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] Database preflight checks pass

---

## Additional Notes

<!-- Any additional information, context, or screenshots -->
