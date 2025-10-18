# Authentication Rate Limits

**Last Updated:** October 18, 2025

## Current Rate Limits

### Email Magic Links
- **Limit:** 10 attempts per hour
- **Window:** 60 minutes (rolling)
- **Rationale:** 
  - Email delivery is cheap (~$0.001 per email)
  - Users may make typos
  - Need flexibility for legitimate retries
  - Still protects against spam/abuse

### Phone Magic Links (SMS)
- **Limit:** 5 attempts per hour  
- **Window:** 60 minutes (rolling)
- **Rationale:**
  - SMS costs ~$0.05 per message
  - Need to balance cost vs UX
  - Protects against SMS pumping fraud
  - Enough for legitimate use cases

## How Rate Limiting Works

### Database Implementation
Rate limits are enforced via Supabase RPC function `check_magic_link_rate_limit()`:

```sql
SELECT check_magic_link_rate_limit(
  'user@example.com',  -- identifier (email or phone)
  'email',             -- method
  10,                  -- max attempts
  60                   -- window in minutes
);
```

### Storage
Rate limit data stored in `auth_magic_link_rate_limits` table:
- `identifier` - Email or phone number
- `method` - 'email' or 'phone'
- `attempt_count` - Current attempts in window
- `window_start` - When current window started
- `last_attempt` - Most recent attempt timestamp

### Reset Behavior
- Automatic reset after window expires
- Counter resets to 1 on first attempt in new window
- Each attempt increments counter

## Adjusting Limits

### Code Changes
**Email limit:** `lib/auth/adapters/email-magic.ts`
```typescript
const rateLimitOk = await checkRateLimit(
  normalizedEmail, 
  'email',
  10,  // ← Change this number
  60   // ← Change window (minutes)
)
```

**SMS limit:** `lib/auth/adapters/phone-magic.ts`
```typescript
const rateLimitOk = await checkRateLimit(
  formattedPhone, 
  'phone',
  5,   // ← Change this number
  60   // ← Change window (minutes)
)
```

### Testing: Clear Rate Limits
```sql
-- Clear specific user
DELETE FROM auth_magic_link_rate_limits 
WHERE identifier = 'user@example.com';

-- Clear all (for testing)
TRUNCATE TABLE auth_magic_link_rate_limits;
```

## Production Recommendations

### Standard SaaS App
- Email: 10-15 per hour
- SMS: 3-5 per hour

### High-Security App (Banking)
- Email: 3-5 per hour
- SMS: 2-3 per hour

### Consumer App (Social)
- Email: 15-20 per hour
- SMS: 5-10 per hour

## Monitoring

Track rate limit hits:
```sql
-- Users hitting rate limits
SELECT 
  identifier,
  method,
  attempt_count,
  window_start
FROM auth_magic_link_rate_limits
WHERE attempt_count >= 5
ORDER BY last_attempt DESC;

-- Rate limit violations
SELECT 
  COUNT(*) as violations,
  method
FROM auth_magic_link_rate_limits
WHERE attempt_count >= 10
GROUP BY method;
```

## Cost Considerations

### Email (Resend)
- Cost: ~$0.001 per email
- 10 attempts/hour = $0.01/hour per user max
- Monthly: ~$7.20 per active user (worst case)

### SMS (Twilio Verify)
- Cost: $0.05 per verification
- 5 attempts/hour = $0.25/hour per user max
- Monthly: ~$180 per active user (worst case)

**Reality:** Most users send 1-2 attempts, so actual costs are 90% lower.

## Security Notes

### SMS Pumping Protection
Twilio Verify includes Fraud Guard which protects against:
- Fake number generation
- International premium rate fraud
- Bot-driven attacks

Our rate limits are an additional layer.

### IP-Based Limits (Future)
Consider adding IP-based limits:
- 50 requests/hour per IP (across all users)
- Prevents distributed attacks
- Requires middleware implementation

## Error Messages

**Rate limit exceeded:**
```json
{
  "success": false,
  "error": "Too many requests. Please try again later.",
  "rateLimitInfo": {
    "remaining": 0,
    "resetsAt": "2025-10-18T17:00:00.000Z"
  }
}
```

Users see friendly message with reset time.
