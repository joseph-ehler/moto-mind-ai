# CAPTCHA Strategy for Auth System

**Status:** Foundation Phase  
**Last Updated:** October 18, 2025

## Philosophy: Progressive Challenge

Never show CAPTCHA unless necessary. Use risk scoring to determine challenge level.

## Risk Levels

### 🟢 Low Risk (No Challenge)
- First-time user from normal IP
- Low request rate
- No suspicious patterns
- **Action:** None - smooth experience

### 🟡 Medium Risk (Invisible Check)
- 3+ attempts in 10 minutes
- IP seen before with issues
- Unusual request patterns
- **Action:** Cloudflare Turnstile (invisible)

### 🔴 High Risk (Visual Challenge)
- 5+ failed attempts
- Known bad actor IP
- Bot-like behavior detected
- Rate limit nearly exceeded
- **Action:** Visual CAPTCHA (hCaptcha or reCAPTCHA)

## Technology Choices

### Option 1: Cloudflare Turnstile (Recommended) ⭐
**Pros:**
- Free forever
- Invisible (no user interaction 99% of time)
- Privacy-focused (no tracking)
- Better UX than reCAPTCHA
- Easy integration

**Cons:**
- Requires Cloudflare (but we should use anyway)

**Cost:** FREE

### Option 2: hCaptcha
**Pros:**
- Privacy-focused
- Pay users for solving (unique)
- Better accessibility than reCAPTCHA
- Good bot detection

**Cons:**
- Visible challenge more often
- Costs for high volume

**Cost:** FREE up to 1M/month

### Option 3: reCAPTCHA v3 (Not Recommended)
**Pros:**
- Invisible scoring
- Google infrastructure

**Cons:**
- Privacy concerns (Google tracking)
- Lower quality UX
- Accessibility issues

**Cost:** FREE

## Recommendation: Cloudflare Turnstile

---

## Implementation Plan

### Phase 1: Risk Scoring System

Track suspicious behavior:
```typescript
interface RiskScore {
  ip: string
  identifier: string  // email or phone
  failedAttempts: number
  lastAttemptTime: Date
  captchaSolved: boolean
  riskLevel: 'low' | 'medium' | 'high'
}
```

### Phase 2: Database Schema

```sql
CREATE TABLE auth_risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  identifier TEXT,
  failed_attempts INTEGER DEFAULT 0,
  captcha_required BOOLEAN DEFAULT FALSE,
  captcha_solved_at TIMESTAMPTZ,
  risk_level TEXT DEFAULT 'low',
  last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_risk_scores_ip ON auth_risk_scores(ip_address);
CREATE INDEX idx_risk_scores_identifier ON auth_risk_scores(identifier);
CREATE INDEX idx_risk_scores_risk_level ON auth_risk_scores(risk_level);
```

### Phase 3: Risk Calculation Function

```typescript
function calculateRiskScore(
  ip: string,
  identifier: string,
  history: RiskScore | null
): 'low' | 'medium' | 'high' {
  if (!history) return 'low'
  
  const recentAttempts = history.failedAttempts
  const timeSinceLastAttempt = Date.now() - history.lastAttemptTime.getTime()
  const minutesSince = timeSinceLastAttempt / 1000 / 60
  
  // High risk: 5+ attempts in 10 min
  if (recentAttempts >= 5 && minutesSince < 10) return 'high'
  
  // Medium risk: 3+ attempts in 10 min
  if (recentAttempts >= 3 && minutesSince < 10) return 'medium'
  
  return 'low'
}
```

### Phase 4: Middleware Integration

```typescript
// Check risk before allowing magic link send
async function checkAuthRisk(
  ip: string,
  identifier: string
): Promise<{
  allowed: boolean
  requiresCaptcha: boolean
  captchaType: 'none' | 'invisible' | 'visual'
}> {
  const risk = await getRiskScore(ip, identifier)
  
  switch (risk) {
    case 'low':
      return { allowed: true, requiresCaptcha: false, captchaType: 'none' }
    case 'medium':
      return { allowed: true, requiresCaptcha: true, captchaType: 'invisible' }
    case 'high':
      return { allowed: true, requiresCaptcha: true, captchaType: 'visual' }
    default:
      return { allowed: true, requiresCaptcha: false, captchaType: 'none' }
  }
}
```

### Phase 5: UI Integration

```tsx
// Auth form with progressive CAPTCHA
function AuthForm() {
  const [captchaType, setCaptchaType] = useState<'none' | 'invisible' | 'visual'>('none')
  const [captchaToken, setCaptchaToken] = useState<string>()
  
  const handleSubmit = async (email: string) => {
    // Send with CAPTCHA token if required
    const response = await fetch('/api/auth/send-magic-link', {
      method: 'POST',
      body: JSON.stringify({ 
        email, 
        captchaToken 
      })
    })
    
    // If server requires CAPTCHA, show it
    if (response.status === 429 && response.data.requiresCaptcha) {
      setCaptchaType(response.data.captchaType)
      return
    }
  }
  
  return (
    <>
      <EmailInput onSubmit={handleSubmit} />
      
      {captchaType === 'invisible' && (
        <TurnstileInvisible onVerify={setCaptchaToken} />
      )}
      
      {captchaType === 'visual' && (
        <TurnstileVisual onVerify={setCaptchaToken} />
      )}
    </>
  )
}
```

---

## Security Benefits

### What CAPTCHA Prevents:
1. ✅ **Bot attacks** - Automated magic link requests
2. ✅ **SMS pumping** - Expensive SMS fraud
3. ✅ **Email bombing** - Overwhelming inboxes
4. ✅ **Enumeration** - Discovering valid emails/phones
5. ✅ **Brute force** - Rapid-fire attempts

### What CAPTCHA DOESN'T Prevent:
- ❌ Social engineering
- ❌ Phishing attacks
- ❌ Credential stuffing (no passwords here)
- ❌ Insider threats

---

## Cost Analysis

### Without CAPTCHA (Current):
- Attack: 1000 bots × 10 emails = 10,000 emails = $10
- Attack: 1000 bots × 5 SMS = 5,000 SMS = $250
- **Total damage:** $260

### With CAPTCHA:
- Attack blocked: 99% of bots can't solve CAPTCHA
- Remaining: 10 bots × requests = $2.60
- **Savings:** $257.40 per attack

### CAPTCHA Costs:
- Cloudflare Turnstile: FREE
- hCaptcha: FREE (up to 1M/month)
- **Net savings:** $257.40 per attack (100% ROI)

---

## UX Impact

### Good UX (Our Approach):
- First attempt: NO CAPTCHA
- Normal users: 99% never see it
- Only suspicious: Invisible check
- Only attackers: Visual challenge

### Bad UX (What to avoid):
- ❌ CAPTCHA on every request
- ❌ Difficult visual challenges
- ❌ Multiple CAPTCHA requests
- ❌ Accessibility issues

---

## Implementation Priority

### Now (Foundation):
1. ✅ Rate limiting (already done)
2. ✅ Twilio Fraud Guard (already done)
3. 🔄 Risk scoring table (add to migration)
4. 🔄 Risk calculation logic

### Next (Integration):
5. 🔄 Cloudflare Turnstile setup
6. 🔄 Middleware checks
7. 🔄 UI components

### Later (Polish):
8. 🔄 Admin dashboard (view risk scores)
9. 🔄 Automated bans (high-risk IPs)
10. 🔄 Analytics (attack patterns)

---

## Testing Strategy

### Test Cases:
1. **Normal user:** No CAPTCHA shown
2. **3 attempts in 5 min:** Invisible CAPTCHA
3. **5 attempts in 5 min:** Visual CAPTCHA
4. **After solving CAPTCHA:** Risk level decreases
5. **Known bad IP:** Immediate visual CAPTCHA

### Test Tools:
```bash
# Simulate bot attack
for i in {1..10}; do
  curl -X POST http://localhost:3005/api/auth/test-email \
    -H "Content-Type: application/json" \
    -d '{"email":"bot@test.com"}'
done

# Should trigger CAPTCHA requirement after attempt 3
```

---

## Monitoring

### Metrics to Track:
- CAPTCHA challenge rate (should be <5%)
- Bot block rate (should be >95%)
- False positive rate (should be <1%)
- User friction (time to complete auth)
- Attack patterns (by IP, time, method)

### Alerts:
- Spike in CAPTCHA challenges
- High false positive rate
- New attack patterns
- Unusual IP behavior

---

## Future Enhancements

### Advanced Bot Detection:
- Mouse movement patterns
- Keystroke timing
- Device fingerprinting
- Behavioral analysis
- ML-based risk scoring

### Automated Defenses:
- IP reputation services
- Honeypots
- Dynamic rate limits
- Automatic temp-bans
- Geographic restrictions

---

## Recommendation

**Start with foundation (Phase 1-2):**
1. Add risk scoring table to next migration
2. Implement risk calculation logic
3. Track failed attempts + IP addresses

**Then integrate Turnstile (Phase 3-5):**
4. Sign up for Cloudflare (free)
5. Add Turnstile widget
6. Test progressive challenges

**Total time:** ~6 hours  
**Total cost:** $0  
**Security improvement:** 95%+ attack blocking

---

## References

- Cloudflare Turnstile: https://www.cloudflare.com/products/turnstile/
- hCaptcha: https://www.hcaptcha.com/
- OWASP Bot Detection: https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks
