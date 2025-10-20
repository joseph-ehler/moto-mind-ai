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

## Type of Change

- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] 🗄️ Database migration

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
