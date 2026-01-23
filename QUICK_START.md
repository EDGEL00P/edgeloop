# EdgeLoop - Quick Start Guide

Get your NFL prediction API deployed and accessible remotely in 5 minutes.

## 🚀 Fastest Setup (2 clicks)

### Deploy to Vercel
1. Visit: https://vercel.com/new/clone?repository-url=https://github.com/EDGEL00P/edgeloop
2. Click "Deploy"
3. Done! API live at: `https://edgeloop.vercel.app`

### Deploy to Railway
1. Visit: https://railway.app/template/edgeloop
2. Click "Deploy Now"
3. Generate domain → Done!

## 🖥️ Terminal Access

### Install CLIs
```bash
# Vercel
npm i -g vercel

# Railway
npm i -g @railway/cli
```

### Access Deployments
```bash
# Vercel: View logs
vercel login
vercel logs --follow

# Railway: Interactive shell
railway login
railway shell
> ls -la
> node --version
> exit
```

## 📡 Test API

```bash
# Vercel
curl https://edgeloop.vercel.app/healthz
curl https://edgeloop.vercel.app/api/predictions

# Railway
curl https://edgeloop-production.up.railway.app/healthz
```

## 📚 Full Documentation

- **Remote Access:** [REMOTE_ACCESS.md](REMOTE_ACCESS.md) - Complete setup guide
- **Terminal Access:** [TERMINAL_ACCESS.md](TERMINAL_ACCESS.md) - CLI commands
- **Deployment:** [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment guide
- **API Docs:** [README.md](README.md) - API documentation

## 🎯 What's Included

✅ **5 Production API Endpoints**
- `/healthz` - Health check
- `/readyz` - Readiness probe
- `/api/predictions` - NFL predictions
- `/api/model-status` - Model metrics
- `/api/alerts` - Alert notifications

✅ **Dual Deployment**
- Vercel (serverless)
- Railway (Node.js)

✅ **Automatic CI/CD**
- Push to main → Auto-deploy
- PR opened → Preview deploy

✅ **Terminal Access**
- Real-time logs
- Remote command execution
- Interactive shell (Railway)

✅ **Monitoring**
- GitHub Actions
- Platform dashboards
- Real-time logging

---

**Need help?** Check the detailed guides above or visit:
- GitHub: https://github.com/EDGEL00P/edgeloop
- Issues: https://github.com/EDGEL00P/edgeloop/issues
