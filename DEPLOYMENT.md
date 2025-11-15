# Scopebound Deployment Guide

## Overview
This document outlines deployment requirements, known limitations, and recommended hosting configurations for Scopebound.

## Known Limitations (MVP Phase)

### AI Form Generation Timeouts

**Issue:**
- Claude AI form generation can take 30-60 seconds for complex forms
- The API route makes synchronous calls to Claude during the HTTP request
- Production hosting platforms often impose strict timeout limits

**Current Status:**
- ✅ **Works on Replit** - Supports long-running requests (>5 minutes)
- ⚠️ **May timeout on other platforms** - Vercel Free (60s), Netlify (26s default), etc.

**Workarounds for Production:**

1. **Recommended: Implement Background Processing** (Future Enhancement)
   - Use job queue (BullMQ + Redis)
   - Return job ID immediately to client
   - Poll for completion status
   - Handle timeouts gracefully with retry logic

2. **Use Platform with Extended Timeouts:**
   - **Vercel Pro**: 300 seconds timeout
   - **Railway**: Configurable timeouts
   - **Self-hosted**: No timeout limits
   - **Render**: 5 minute timeout on paid plans

3. **Optimize API Configuration:**
   - Ensure frontend timeout > backend timeout
   - Configure all layers (CDN, proxy, app server)

## Hosting Requirements

### Minimum Requirements

| Component | Requirement |
|-----------|-------------|
| **Request Timeout** | >60 seconds (ideally 300s+) |
| **Node.js** | 18.x or higher |
| **PostgreSQL** | 14.x or higher (Neon Serverless supported) |
| **Environment Variables** | See `.env.local.example` |

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# Authentication
SESSION_SECRET=<random-32-char-string>

# AI Integration
ANTHROPIC_API_KEY=sk-ant-...

# Optional: Organization Settings
DEFAULT_HOURLY_RATE=100
```

### Rate Limiting Considerations

**Current Implementation:**
- In-memory rate limiter (single-instance only)
- Suitable for MVP/testing on Replit
- **Not suitable for multi-instance deployments**

**Production Recommendations:**
- Implement Redis-based rate limiting
- Use edge/CDN rate limiting
- Leverage Anthropic's built-in API key quotas

## Deployment Platforms

### Replit (Current)
✅ **Recommended for MVP/Testing**
- Supports long request timeouts (>5 minutes)
- Built-in PostgreSQL (Neon)
- Simple deployment workflow
- Automatic HTTPS

**Limitations:**
- Single instance (rate limiter not distributed)
- May have usage/resource limits on free tier

### Vercel
⚠️ **Requires Paid Plan for AI Features**

**Free Tier:**
- ❌ 60 second timeout (insufficient for form generation)

**Pro Tier:**
- ✅ 300 second timeout (sufficient)
- ✅ Serverless functions
- ✅ Edge network

**Configuration:**
```javascript
// next.config.js
module.exports = {
  experimental: {
    serverComponentsExternalPackages: ['@anthropic-ai/sdk']
  }
}
```

### Railway
✅ **Good Alternative**
- Configurable timeouts
- PostgreSQL support
- Straightforward deployment
- Affordable pricing

### Self-Hosted (AWS, GCP, Azure, DigitalOcean)
✅ **Full Control**
- No timeout limits
- Complete infrastructure control
- Scalable architecture
- Requires DevOps expertise

## Pre-Production Checklist

Before deploying to production, address these items:

- [ ] **Implement background job processing** for AI form generation
- [ ] **Add Redis** for distributed rate limiting
- [ ] **Configure monitoring** (error tracking, performance metrics)
- [ ] **Set up database backups** and disaster recovery
- [ ] **Implement proper logging** (structured logs, log aggregation)
- [ ] **Security audit** (OWASP Top 10, dependency scanning)
- [ ] **Load testing** (concurrent form generation, database queries)
- [ ] **Document incident response** procedures
- [ ] **Configure CI/CD pipeline** with automated testing
- [ ] **Set up staging environment** for pre-production validation

## Scaling Considerations

### Horizontal Scaling Blockers (MVP)

1. **In-Memory Rate Limiter**
   - Currently stores state in application memory
   - Won't work across multiple instances
   - **Solution:** Redis-based rate limiting

2. **Synchronous AI Processing**
   - Ties up server resources during generation
   - Limits concurrent request handling
   - **Solution:** Background job queue

### Recommended Architecture (Production)

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Next.js API    │
│  (Returns Job)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│  Redis Queue    │◄────►│ Worker Nodes │
│  (BullMQ)       │      │ (Claude API) │
└─────────────────┘      └──────────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │
│  (Neon/AWS RDS) │
└─────────────────┘
```

## Monitoring Recommendations

### Key Metrics to Track

- **AI Generation**
  - Response time (p50, p95, p99)
  - Success/failure rate
  - Claude API quota usage
  - Token consumption

- **API Performance**
  - Request latency
  - Error rates (4xx, 5xx)
  - Concurrent connections

- **Database**
  - Query performance
  - Connection pool utilization
  - Storage usage

### Suggested Tools

- **Error Tracking:** Sentry, Rollbar
- **Performance:** New Relic, Datadog
- **Logging:** LogRocket, Logtail
- **Uptime:** UptimeRobot, Pingdom

## Support & Contact

For deployment assistance or questions:
- Review documentation in `replit.md`
- Check API integration tests in `CLAUDE_AI_INTEGRATION_TEST.md`
- Examine sample output in `SAMPLE_GENERATED_FORM.md`

---

**Last Updated:** 2025-11-15  
**Version:** 1.0.0 (MVP)
