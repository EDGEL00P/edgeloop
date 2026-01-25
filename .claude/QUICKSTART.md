# Quick Start: Free MCP Servers

This is a quick reference guide for the completely free MCP servers configured in this project.

## 🚀 Setup in 2 Minutes

### Step 1: Set Repository Path

The MCP configuration needs to know where your edgeloop repository is located:

```bash
# Find your repository path
pwd

# Set the environment variable (replace with your actual path)
export EDGELOOP_REPO_PATH="/Users/yourname/projects/edgeloop"
```

Or add to your shell profile (~/.bashrc, ~/.zshrc):
```bash
echo 'export EDGELOOP_REPO_PATH="/Users/yourname/projects/edgeloop"' >> ~/.bashrc
source ~/.bashrc
```

### Step 2: Get a Free GitHub Token (Optional but Recommended)

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name it: "MCP Server Access"
4. Select scopes: ✅ `repo`, ✅ `workflow`, ✅ `read:org`
5. Click "Generate token"
6. Copy the token

### Step 3: Set GitHub Token

```bash
export GITHUB_TOKEN="your_token_here"
```

Or add to your shell profile (~/.bashrc, ~/.zshrc):
```bash
echo 'export GITHUB_TOKEN="your_token_here"' >> ~/.bashrc
source ~/.bashrc
```

### Step 4: Done! 🎉

All other servers work automatically with zero configuration.

## 📦 What You Get (All FREE)

| Server | What It Does | Setup Required |
|--------|--------------|----------------|
| 🐙 **GitHub** | Manage issues, PRs, Actions | GitHub token (free) |
| 📁 **Filesystem** | Read/write files | None |
| 🌿 **Git** | Git operations | None |
| 🧠 **Memory** | Remember context | None |
| 🎭 **Playwright** | Browser automation | None |
| 🎪 **Puppeteer** | Browser testing | None |
| 💭 **Sequential Thinking** | Step-by-step reasoning | None |
| 🌐 **Fetch** | HTTP requests | None |
| ⏰ **Time** | Time utilities | None |
| 🗄️ **SQLite** | Local database | None |

**Total Cost: $0.00/month** 💰

## 🎯 Common Use Cases

### For Development
```
✅ Read/write code files (filesystem)
✅ Run git commands (git)
✅ Test web apps (playwright, puppeteer)
✅ Make API calls (fetch)
✅ Local data storage (sqlite)
```

### For GitHub Management
```
✅ Create/manage issues (github)
✅ Review pull requests (github)
✅ Check CI/CD status (github)
✅ Manage workflows (github)
```

### For Testing & Automation
```
✅ Automated browser tests (playwright)
✅ Screenshot generation (puppeteer)
✅ Web scraping (fetch + playwright)
✅ Integration testing (all servers)
```

## 🔧 Using with Claude Desktop

### macOS
```bash
mkdir -p ~/Library/Application\ Support/Claude/
cp .claude/claude_desktop_config.json ~/Library/Application\ Support/Claude/
```

### Linux
```bash
mkdir -p ~/.config/Claude/
cp .claude/claude_desktop_config.json ~/.config/Claude/
```

### Windows (PowerShell)
```powershell
Copy-Item .claude\claude_desktop_config.json $env:APPDATA\Claude\
```

Then restart Claude Desktop!

## ❓ FAQ

**Q: Do I need a credit card?**  
A: No! Everything is 100% free.

**Q: Are there usage limits?**  
A: GitHub has API rate limits (5000 requests/hour for authenticated users), but that's very generous. All other servers have no limits.

**Q: What if I don't set GITHUB_TOKEN?**  
A: All other servers still work! GitHub server just won't be available.

**Q: Can I use this in production?**  
A: Yes! These are production-ready servers with no paid tiers.

**Q: What about the database (PostgreSQL)?**  
A: SQLite is included for local dev (free). For PostgreSQL, you'd need a connection string. Neon has a free tier, but it's not included by default to keep this 100% setup-free.

## 🆘 Troubleshooting

**Servers not showing up?**
- Make sure you copied the config to the correct location
- Restart Claude Desktop
- Check Claude Desktop logs

**GitHub token not working?**
```bash
# Test your token
echo $GITHUB_TOKEN

# Verify it's set
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user
```

**Need more help?**  
See the full [README.md](.claude/README.md) for detailed documentation.

## 📚 Next Steps

- ✅ Test the servers in Claude Desktop
- ✅ Read the full [README.md](.claude/README.md)
- ✅ Explore server capabilities
- ✅ Build cool stuff! 🚀

---

**Total Setup Time: ~2 minutes**  
**Total Cost: $0.00**  
**Total Freedom: Unlimited** 🎉
