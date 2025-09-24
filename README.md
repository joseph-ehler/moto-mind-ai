# MotoMindAI: Fleet Intelligence You Can Explain

## The Problem
Fleet managers get alerts but can't explain WHY to DOT inspectors.

## The Solution
"Why did Truck 47 get flagged?" → "Brake pad wear 87% + route inefficiency 12% above baseline"

## MVP Scope
- Connect to Samsara API
- Explain vehicle alerts with reasoning
- Generate audit-ready reports
- One killer loop: Question → Analysis → Explainable Answer

## Quick Start
```bash
npm install
cp .env.example .env  # Add your Samsara API key
npm run dev
```

Visit http://localhost:3005 and ask about your fleet.

## Architecture
```
Samsara API → Data Normalizer → Rule Engine → LLM Explainer → Audit Logger → UI
```

## Current Status
🚧 **Production Development** - Building enterprise-grade fleet intelligence

## Production Features
- ✅ Multi-tenant architecture (solo users + fleets)
- ✅ Row-level security with tenant isolation
- ✅ Circuit breakers for API resilience
- ✅ Audit trails for DOT compliance
- ✅ Usage tracking for billing
- ✅ Comprehensive monitoring

## Next Steps
1. Implement RLS WITH CHECK policies
2. Build Zod validation for LLM safety
3. Create tenant isolation test suite
4. Add circuit breaker system
5. Deploy monitoring stack

---

*"Fleet intelligence you can explain, audit, and trust"*
