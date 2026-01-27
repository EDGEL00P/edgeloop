# Production Deployment Checklist

## Pre-Deployment (1 week before)

### Code Quality
- [ ] All tests passing (unit, integration, e2e)
- [ ] No console.error/console.warn in production builds
- [ ] TypeScript strict mode enabled, 0 errors
- [ ] ESLint clean build
- [ ] Code review completed

### Database
- [ ] Migrations tested on staging
- [ ] Backup created before migration
- [ ] Query performance benchmarked
- [ ] Indexes created and validated
- [ ] Schema changes documented

### Security
- [ ] Environment variables documented
- [ ] API keys rotated (if needed)
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] SQL injection prevention verified (parameterized queries)

### Performance
- [ ] Build size < 500KB (gzip)
- [ ] Core Web Vitals measured
- [ ] Database connection pooling configured
- [ ] Cache TTLs set appropriately
- [ ] CDN configured for static assets

## Deployment Day

### Morning (Pre-Launch)
- [ ] Team notified of deployment window
- [ ] Monitoring dashboards open
- [ ] On-call engineer available
- [ ] Database backup created

### Deployment Steps
1. [ ] Deploy to staging first
   ```bash
   git push origin main:staging
   # Verify at https://staging.edgeloop.app
   ```

2. [ ] Run smoke tests
   ```bash
   npm run test:e2e
   ```

3. [ ] Database migrations (if any)
   ```bash
   npm run migrate:prod
   ```

4. [ ] Deploy to production
   ```bash
   npm run deploy:prod
   ```

5. [ ] Verify all services running
   - [ ] Web app loads (https://edgeloop.app)
   - [ ] API responds (https://api.edgeloop.app)
   - [ ] WebSocket connected
   - [ ] Auth working
   - [ ] Database connected

### Post-Deployment (First Hour)
- [ ] Monitor error rates (target: < 0.1%)
- [ ] Check database query times
- [ ] Monitor memory usage
- [ ] Verify real-time updates working
- [ ] Test critical paths:
  - [ ] User signup
  - [ ] Sign in with email/Google
  - [ ] View games/odds
  - [ ] Create alert rule
  - [ ] Save predictions
  - [ ] Run backtesting

### Post-Deployment (First Day)
- [ ] Monitor 404 error trends
- [ ] Check API response times (p99 < 500ms)
- [ ] Verify email/Slack alerts sending
- [ ] Monitor database connections (< 50/100)
- [ ] Check Redis hit rate (> 90%)
- [ ] No spike in error rates

## Feature Flags

Enable features gradually using feature flags:

```typescript
// src/lib/features.ts
export const FEATURES = {
  ALERT_SYSTEM: process.env.FEATURE_ALERTS === 'true',
  ADVANCED_UX: process.env.FEATURE_ADVANCED_UX === 'true',
  BACKTESTING: process.env.FEATURE_BACKTESTING === 'true',
  WHAT_IF_TOOL: process.env.FEATURE_WHAT_IF === 'true',
}

// Usage in components
{FEATURES.ALERT_SYSTEM && <AlertRulesManager />}
```

### Rollout Schedule
- **10%**: Test with early adopters (Day 1)
- **25%**: Expand to beta users (Day 2)
- **50%**: Half of all users (Day 3)
- **100%**: Full rollout (Day 4+)

## Rollback Plan

### If Critical Issues Detected

```bash
# Immediate rollback
git revert <commit-sha>
npm run deploy:prod

# Or restore from previous deploy
vercel rollback

# Database rollback (if migrations failed)
npm run migrate:rollback
```

### Error Scenarios

| Error | Action | Time |
|-------|--------|------|
| Auth failing | Rollback code | 5min |
| High error rate (>1%) | Rollback code | 5min |
| Database migration error | Rollback migration | 15min |
| Performance degradation (p99 > 2s) | Investigate + rollback | 30min |
| Memory leak detected | Restart servers | 10min |

## Monitoring & Alerting

### Required Monitoring

```bash
# Deploy monitoring stack
docker-compose up -d prometheus grafana
```

### Key Dashboards

1. **Application Health**
   - Error rate (target: < 0.1%)
   - Request latency (p99 < 500ms)
   - CPU/Memory usage
   - Database connections

2. **Business Metrics**
   - Active users
   - Predictions created
   - Alert rule triggers
   - API calls per minute

3. **Database Health**
   - Query times
   - Connection count
   - Cache hit rate
   - Replication lag (if applicable)

### Alert Rules

```yaml
# Prometheus alerting rules
- alert: HighErrorRate
  condition: rate(errors[5m]) > 0.001
  duration: 5m
  action: PagerDuty + Slack

- alert: HighLatency
  condition: histogram_quantile(0.99, latency) > 1s
  duration: 10m
  action: Slack warning

- alert: DatabaseDown
  condition: up{job="postgres"} == 0
  duration: 1m
  action: PagerDuty + Slack urgent
```

## Post-Deployment Communication

### 1. Internal Notification
```
📢 Deployment Alert

Service: Edgeloop NFL Predictions
Deployed: 2026-01-15 14:00 UTC
Changes: 
- Authentication & RBAC
- Model Integration (EV/Kelly/Arbitrage)
- Alert System with Email/Slack delivery
- Advanced UX (Bet Slip, What-If, Backtesting)
- Database optimization

Status: ✅ All systems nominal
Monitoring: https://monitoring.edgeloop.app
On-call: @engineer-name
```

### 2. Customer Communication (if major changes)
```
We've deployed new features:
- Create custom alert rules for trading opportunities
- Advanced betting tools (Kelly calculator, what-if analysis)
- Historical backtesting with detailed statistics
- Full authentication with role-based access

All features are now live. Visit https://edgeloop.app
Questions? Email support@edgeloop.app
```

## Success Criteria

Deployment is considered successful when:

- [ ] Zero critical errors in first 24 hours
- [ ] Error rate < 0.1%
- [ ] p99 latency < 500ms
- [ ] No customer complaints/support tickets
- [ ] All features working as designed
- [ ] Database performing normally
- [ ] Monitoring dashboards green

## Cleanup (Post-Successful Deployment)

- [ ] Remove feature flags from code
- [ ] Update documentation
- [ ] Archive old code branches
- [ ] Close deployment tickets
- [ ] Schedule retrospective meeting

---

**Deployment Owner**: ___________________
**Deployment Date**: ___________________
**Status**: ___________________
**Notes**: ___________________
