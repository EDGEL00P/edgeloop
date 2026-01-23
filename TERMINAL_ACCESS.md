# Terminal Access to Remote Deployments

Complete guide for accessing Vercel and Railway deployments via terminal/CLI.

## 🖥️ Vercel CLI Terminal Access

### Installation
```bash
npm install -g vercel@latest
```

### Login
```bash
vercel login
# Opens browser for authentication
# Or use: vercel login --token YOUR_TOKEN
```

### Link Project
```bash
cd /path/to/edgeloop
vercel link
# Select: EDGEL00P
# Select project: edgeloop
```

### View Live Logs (Real-time)
```bash
# Stream production logs
vercel logs --follow

# Stream specific deployment
vercel logs [deployment-url] --follow

# View last 100 lines
vercel logs --lines 100

# Filter by timestamp
vercel logs --since 1h
vercel logs --until 30m
```

### List Deployments
```bash
# List all deployments
vercel ls

# List with details
vercel ls --verbose

# Filter by environment
vercel ls --environment production
```

### Inspect Deployment
```bash
# Get deployment details
vercel inspect [deployment-url]

# Get build logs
vercel logs [deployment-url] --output build

# Get function logs
vercel logs [deployment-url] --output function
```

### Execute Commands (Limited)
```bash
# Note: Vercel serverless doesn't support SSH
# But you can test functions locally:

# Run local development server
vercel dev

# Test specific function
curl http://localhost:3000/api/predictions
```

### Environment Variables
```bash
# List environment variables
vercel env ls

# Add environment variable
vercel env add PORT production

# Remove environment variable
vercel env rm PORT production

# Pull environment variables locally
vercel env pull .env.local
```

### Deployment Commands
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Redeploy latest production
vercel --prod --force

# Deploy with specific build command
vercel --build-env NODE_ENV=production
```

## 🚂 Railway CLI Terminal Access

### Installation
```bash
npm install -g @railway/cli
```

### Login
```bash
railway login
# Opens browser for authentication
```

### Link Project
```bash
cd /path/to/edgeloop
railway link
# Select your project from list
```

### View Live Logs (Real-time)
```bash
# Stream production logs
railway logs

# Follow logs (auto-scroll)
railway logs --follow

# Filter by deployment
railway logs --deployment [deployment-id]
```

### SSH-Like Shell Access
```bash
# Open interactive shell in deployment container
railway shell

# Execute single command
railway run node --version
railway run ls -la
railway run cat package.json

# Run scripts from package.json
railway run npm run build
railway run pnpm test
```

### Execute Remote Commands
```bash
# Check disk usage
railway run df -h

# View process list
railway run ps aux

# Check environment variables
railway run env

# Test API endpoint locally
railway run curl localhost:$PORT/healthz

# View file contents
railway run cat logs/app.log
```

### Connect to Database (if applicable)
```bash
# Connect to PostgreSQL
railway connect postgres

# Connect to Redis
railway connect redis

# Get database connection URL
railway variables
```

### Environment Variables
```bash
# List all variables
railway variables

# Add variable
railway variables set PORT=3000

# Remove variable
railway variables delete PORT

# View variable value
railway variables get PORT
```

### Deployment Commands
```bash
# Deploy current directory
railway up

# Deploy specific service
railway up --service edgeloop

# Check deployment status
railway status

# View deployment history
railway logs --deployments
```

### Project Management
```bash
# List all projects
railway list

# Switch project
railway link [project-id]

# Get project info
railway status

# Open project in browser
railway open
```

## 🔧 Advanced Terminal Operations

### Vercel: Local Development with Production Environment

```bash
# Pull production environment
vercel env pull .env.production

# Run local server with production env
vercel dev --env .env.production

# Test API endpoints locally
curl http://localhost:3000/healthz
curl http://localhost:3000/api/predictions

# Debug function locally
vercel dev --debug
```

### Railway: Remote Command Execution

```bash
# Interactive shell session
railway shell
> ls -la
> cat package.json
> node -e "console.log(process.env.PORT)"
> exit

# Run health check
railway run curl localhost:$PORT/healthz

# View application logs
railway run tail -f /var/log/app.log

# Check Node.js version
railway run node --version

# Install dependency remotely (not recommended)
railway run pnpm install winston

# Restart service
railway restart
```

### SSH Port Forwarding (Railway)

```bash
# Forward Railway service to local port
railway port-forward

# Access at: http://localhost:8080
# This tunnels Railway deployment to your local machine
```

## 📊 Monitoring Commands

### Vercel

```bash
# View deployment analytics
vercel inspect [deployment-url] --json

# Check function performance
vercel logs [deployment-url] | grep "duration"

# Monitor error rate
vercel logs --follow | grep "ERROR"

# View bandwidth usage
vercel inspect [deployment-url] | grep "bandwidth"
```

### Railway

```bash
# View resource usage
railway metrics

# Check service health
railway status

# Monitor deployment
railway logs --follow | grep "ERROR"

# View deployment info
railway info
```

## 🐛 Debugging in Terminal

### Vercel

```bash
# Enable debug mode
vercel --debug

# View build logs
vercel logs [deployment-url] --output build

# Test function locally with debugging
DEBUG=* vercel dev

# Check function configuration
vercel inspect [deployment-url] --json | jq '.functions'
```

### Railway

```bash
# Enter debug shell
railway shell

# View all environment variables
railway run env | sort

# Check running processes
railway run ps aux | grep node

# View system logs
railway logs | tail -100

# Test endpoints internally
railway run curl localhost:$PORT/healthz -v
```

## 💻 Multi-Platform Terminal Workflow

### Daily Monitoring
```bash
#!/bin/bash
# monitor.sh - Monitor both platforms

echo "=== Vercel Status ==="
vercel ls | head -5

echo -e "\n=== Railway Status ==="
railway status

echo -e "\n=== Recent Errors ==="
echo "Vercel:"
vercel logs --since 1h | grep ERROR | tail -10

echo "Railway:"
railway logs | grep ERROR | tail -10
```

### Deployment Script
```bash
#!/bin/bash
# deploy.sh - Deploy to both platforms

echo "Building..."
pnpm run build

echo "Deploying to Vercel..."
vercel --prod

echo "Deploying to Railway..."
railway up

echo "Done! Check status:"
echo "Vercel: https://edgeloop.vercel.app/healthz"
echo "Railway: $(railway domain)/healthz"
```

### Health Check Script
```bash
#!/bin/bash
# healthcheck.sh - Check both deployments

VERCEL_URL="https://edgeloop.vercel.app"
RAILWAY_URL=$(railway domain)

echo "Checking Vercel..."
curl -s $VERCEL_URL/healthz | jq .

echo -e "\nChecking Railway..."
curl -s $RAILWAY_URL/healthz | jq .

echo -e "\nChecking predictions endpoint..."
curl -s $VERCEL_URL/api/predictions | jq '.predictions | length'
```

## 🔑 Authentication Setup

### Vercel Token for CI/CD
```bash
# Generate token
# Visit: https://vercel.com/account/tokens

# Use token in terminal
export VERCEL_TOKEN="your_token_here"
vercel --token $VERCEL_TOKEN ls

# Or login with token
vercel login --token $VERCEL_TOKEN
```

### Railway Token for CI/CD
```bash
# Generate token
# Visit: https://railway.app/account/tokens

# Use token in terminal
export RAILWAY_TOKEN="your_token_here"
railway status

# Token is automatically picked up from environment
```

## 📝 Quick Reference

### Vercel Common Commands
```bash
vercel                    # Deploy to preview
vercel --prod            # Deploy to production
vercel ls                # List deployments
vercel logs --follow     # Stream logs
vercel dev               # Local development
vercel env ls            # List environment variables
vercel inspect [url]     # Get deployment details
```

### Railway Common Commands
```bash
railway up               # Deploy
railway logs             # View logs
railway shell            # Interactive shell
railway run [cmd]        # Execute command
railway status           # Check status
railway variables        # View env vars
railway domain           # Get deployment URL
railway restart          # Restart service
```

## 🆘 Troubleshooting

### Vercel CLI Issues

**Not logged in:**
```bash
vercel whoami
# If error, run: vercel login
```

**Project not linked:**
```bash
vercel link --yes
```

**Token issues:**
```bash
vercel logout
vercel login
```

### Railway CLI Issues

**Authentication error:**
```bash
railway logout
railway login
```

**Project not linked:**
```bash
railway link
# Select project from list
```

**Shell command fails:**
```bash
# Check if deployment is running
railway status

# Try with explicit service
railway shell --service edgeloop
```

## 🎯 Best Practices

1. **Always test locally first:**
   ```bash
   vercel dev  # Test before deploying
   ```

2. **Monitor logs during deployment:**
   ```bash
   vercel logs --follow &
   vercel --prod
   ```

3. **Use environment-specific commands:**
   ```bash
   vercel --prod  # Production
   vercel         # Preview/staging
   ```

4. **Keep tokens secure:**
   ```bash
   # Never commit tokens
   echo $VERCEL_TOKEN > .env.local
   echo $RAILWAY_TOKEN >> .env.local
   ```

5. **Automate health checks:**
   ```bash
   # Add to crontab
   */5 * * * * /path/to/healthcheck.sh
   ```

---

**You now have complete terminal access to both platforms! 🚀**

Use these commands to monitor, debug, and manage your deployments from the terminal.
