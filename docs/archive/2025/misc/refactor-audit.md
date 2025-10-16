# MotoMind Architecture Cleanup - Discovery Audit

## Phase 0 - Current State Analysis

### Terminology Issues Found

**"Fleet" Usage (21 files):**
- `pages/fleet.tsx` - Main vehicle list page (should be `/vehicles`)
- `pages/vehicles/index.tsx` - Conflicts with fleet page
- `components/layout/AppNavigation.tsx` - Navigation links
- Archive files - Legacy API code (can be ignored)

**"Label" vs "Nickname" Usage:**
- Database schema uses `label` field
- Some components expect `nickname`
- Inconsistent vehicle identification

**"Location" vs "Garage" Usage:**
- Mixed terminology in garage-related code
- Some APIs use "location" when meaning "garage"

### API Contract Audit

**Current Response Formats:**
- `/api/vehicles` → `{ vehicles: [], count: number }`
- `/api/garages` → `{ garages: [] }`
- `/api/notifications` → `{ notifications: [], count: number }`

**Inconsistencies:**
- Mixed envelope formats
- Some return `data`, others return named arrays
- Error handling varies by endpoint

### Routing Audit

**Current Routes:**
- `/fleet` → Vehicle list (should redirect to `/vehicles`)
- `/vehicles/onboard` → Vehicle onboarding
- `/vehicles/[id]` → Vehicle detail
- `/garages` → Garage list
- `/garages/[id]` → Garage detail

**Client-Side Links:**
- Navigation components use `/fleet`
- Some components hardcode routes
- Need to audit all `<Link href="">` usage

### Database Schema Current State

**Vehicles Table:**
```sql
- id UUID
- label TEXT (inconsistent with UI expectations)
- make TEXT
- model TEXT
- vin TEXT
- garage_id UUID
- hero_image_url TEXT
```

**Missing Fields:**
- `display_name` (user-customizable name)
- `year` (structured identity)
- Proper vehicle identification

### Risk Assessment

**High Risk:**
1. Route changes break bookmarks/external links
2. API envelope changes break frontend components
3. Database migrations without proper validation

**Medium Risk:**
1. Component imports after file moves
2. Type definition mismatches
3. Search functionality breaks with naming changes

**Low Risk:**
1. Unused code cleanup
2. Import statement cleanup
3. Comment/documentation updates

## Migration Strategy

Based on this audit, we need:

1. **Backward-compatible database migrations**
2. **Route aliases with server redirects**
3. **Dual API envelope support**
4. **Gradual component migration**
5. **Comprehensive testing at each stage**

## Next Steps

1. Implement additive database migrations
2. Add feature flags for gradual rollout
3. Create route aliases and redirects
4. Update API endpoints with dual format support
5. Migrate components incrementally
6. Clean up legacy code after validation period

---

*Generated: $(date)*
*Status: Discovery Complete - Ready for Phase 1*
