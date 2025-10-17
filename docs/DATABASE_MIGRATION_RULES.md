# Database Migration Rules for NextAuth Apps

**CRITICAL:** This app uses **NextAuth** for authentication, NOT Supabase Auth!

---

## ⚠️ **NEVER DO THIS**

### **❌ DON'T: Use auth.uid() in RLS Policies**
```sql
-- ❌ WRONG - auth.uid() returns NULL with NextAuth
CREATE POLICY "Users can view their data"
  ON my_table FOR SELECT
  USING (user_id = auth.uid());
```

### **❌ DON'T: Use UUID for user_id**
```sql
-- ❌ WRONG - NextAuth uses TEXT IDs like "104135733357510565203"
user_id UUID REFERENCES auth.users(id)
```

### **❌ DON'T: Foreign Key to auth.users**
```sql
-- ❌ WRONG - NextAuth users aren't in auth.users table
FOREIGN KEY (user_id) REFERENCES auth.users(id)
```

---

## ✅ **ALWAYS DO THIS**

### **✅ DO: Use Permissive RLS Policies**
```sql
-- ✅ CORRECT - Service role bypasses RLS anyway
CREATE POLICY "Allow all operations"
  ON my_table
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comment explaining why
COMMENT ON POLICY "Allow all operations" ON my_table IS 
  'Permissive - service role bypasses RLS. Auth handled in API via NextAuth.';
```

### **✅ DO: Use TEXT for user_id**
```sql
-- ✅ CORRECT - NextAuth IDs are TEXT
user_id TEXT NOT NULL
```

### **✅ DO: Handle Auth in API Code**
```typescript
// ✅ CORRECT - Check auth in API, not database
import { requireUserServer } from '@/lib/auth/current-user'

export async function POST(request: Request) {
  const user = await requireUserServer() // Throws if not authenticated
  
  await supabase.from('my_table').insert({
    user_id: user.id,  // NextAuth user ID (TEXT)
    // ... rest of data
  })
}
```

---

## 📋 **NEW TABLE CHECKLIST**

When creating a new table with user data:

- [ ] **user_id column is TEXT** (not UUID)
- [ ] **NO foreign key to auth.users**
- [ ] **RLS policies use `true`** (not auth.uid())
- [ ] **Added policy comments** explaining NextAuth
- [ ] **API route uses requireUserServer()**
- [ ] **Filters by user.id in API code**

---

## 🔧 **MIGRATION TEMPLATE**

Use this template for all new tables:

```sql
-- ================================================
-- My New Table
-- ================================================
CREATE TABLE IF NOT EXISTS my_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,  -- ✅ TEXT for NextAuth
  
  -- Your columns here
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================
-- INDEXES
-- ================================================
CREATE INDEX idx_my_table_user_id ON my_table(user_id);

-- ================================================
-- ROW LEVEL SECURITY
-- ================================================
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- ✅ Permissive policy (service role bypasses anyway)
CREATE POLICY "Allow all operations on my_table"
  ON my_table
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ✅ Explain why
COMMENT ON POLICY "Allow all operations on my_table" ON my_table IS 
  'Permissive - service role bypasses RLS. Authorization handled in API via NextAuth.';

COMMENT ON TABLE my_table IS 'User data table - authorization via NextAuth in API layer';
COMMENT ON COLUMN my_table.user_id IS 'NextAuth user ID (TEXT format, not UUID)';
```

---

## 🎯 **WHY THIS MATTERS**

### **The Problem:**
1. **Supabase Auth** uses UUIDs and `auth.uid()`
2. **NextAuth** uses TEXT IDs and session management
3. **They don't talk to each other**

### **If You Forget:**
- ❌ `auth.uid()` returns NULL
- ❌ RLS blocks valid requests
- ❌ API returns 500 errors
- ❌ Features appear broken
- ❌ Debugging takes hours

### **If You Follow These Rules:**
- ✅ Everything works first time
- ✅ No UUID type errors
- ✅ No RLS blocking issues
- ✅ Clear authorization flow
- ✅ Easy to debug

---

## 📚 **RELATED DOCS**

- **Auth Pattern Guide:** `docs/AUTH_PATTERN.md`
- **Auth Audit:** `docs/AUTH_AUDIT.md`
- **Current User Helpers:** `lib/auth/current-user.ts`, `hooks/useCurrentUser.ts`

---

## 🚨 **REMEMBER**

Every time you create a table with user data:

1. **user_id is TEXT** (not UUID)
2. **No auth.uid() in policies**
3. **Use requireUserServer() in API**
4. **RLS is permissive** (true/true)
5. **Add explanatory comments**

**This is NON-NEGOTIABLE for NextAuth apps!**

---

**Last Updated:** October 17, 2025  
**Review:** Before every new migration
