# MCP Server Configuration (Free Tier Only)

This directory contains the configuration for Model Context Protocol (MCP) servers that enhance AI assistant capabilities when working with this project. **All servers included are completely free to use** with no paid API requirements.

## Overview

MCP servers are tools that allow AI assistants (like Claude) to interact with various systems and services. This configuration includes only free-tier servers:

- **Repository Management**: GitHub integration (free with personal access token)
- **File Operations**: Filesystem access for reading/writing files (free)
- **Development Tools**: Git operations and memory persistence (free)
- **Browser Automation**: Playwright and Puppeteer for testing (free)
- **Utilities**: Time, fetch, and sequential thinking (free)
- **Local Database**: SQLite for development/testing (free)

## Configuration Files

- `claude_desktop_config.json` - Main MCP server configuration (free tier only)
- `settings.local.json` - Local permissions and settings

## Available Free-Tier MCP Servers

### Core Development Servers (100% Free)

#### 1. GitHub (`github`) ⭐
**Purpose**: Interact with GitHub repositories, issues, pull requests, and Actions.

**Features**:
- Create and manage issues
- Review and merge pull requests
- Check workflow runs and CI status
- Manage repository settings

**Setup**:
```bash
export GITHUB_TOKEN="your_github_personal_access_token"
```

Get a token at: https://github.com/settings/tokens (completely free)

Required scopes: `repo`, `workflow`, `read:org`

**Cost**: FREE with GitHub account

---

#### 2. Filesystem (`filesystem`) ⭐
**Purpose**: Read and write files in the repository.

**Features**:
- Read file contents
- Write and create files
- List directories
- Search files

**Setup**: No additional configuration needed (automatically uses repository path)

**Cost**: FREE

---

#### 3. Git (`git`) ⭐
**Purpose**: Advanced git operations beyond basic commands.

**Features**:
- Git log and history
- Branch management
- Diff and blame operations
- Commit operations

**Setup**: No additional configuration needed (automatically uses repository path)

**Cost**: FREE

---

#### 4. Memory (`memory`) ⭐
**Purpose**: Persist context and information across sessions.

**Features**:
- Store important context
- Retrieve historical information
- Maintain conversation continuity

**Setup**: No additional configuration needed

**Cost**: FREE

---

### Browser Automation Servers (100% Free)

#### 5. Playwright (`playwright`) ⭐
**Purpose**: Browser automation and testing with Playwright.

**Features**:
- Run automated browser tests
- Scrape web content
- Test web applications
- Take screenshots

**Setup**: No additional configuration needed (Playwright is already a dev dependency)

**Cost**: FREE

---

#### 6. Puppeteer (`puppeteer`) ⭐
**Purpose**: Alternative browser automation with Puppeteer.

**Features**:
- Browser automation
- Screenshot generation
- PDF creation
- Web scraping

**Setup**: No additional configuration needed

**Cost**: FREE

---

### Utility Servers (100% Free)

#### 7. Sequential Thinking (`sequential-thinking`) ⭐
**Purpose**: Enhanced reasoning and step-by-step problem solving.

**Features**:
- Break down complex problems
- Step-by-step reasoning
- Systematic approach
- Improved decision making

**Setup**: No additional configuration needed

**Cost**: FREE

---

#### 8. Fetch (`fetch`) ⭐
**Purpose**: HTTP requests to APIs and web services.

**Features**:
- Make HTTP requests (GET, POST, etc.)
- Interact with REST APIs
- Download content
- Test API endpoints

**Setup**: No additional configuration needed

**Cost**: FREE

---

#### 9. Time (`time`) ⭐
**Purpose**: Time and timezone operations.

**Features**:
- Get current time
- Timezone conversions
- Date calculations
- Scheduling helpers

**Setup**: No additional configuration needed

**Cost**: FREE

---

### Database Server (100% Free)

#### 10. SQLite (`sqlite`) ⭐
**Purpose**: Local SQLite database for development/testing.

**Features**:
- Local data storage
- Quick prototyping
- Test data management
- No server required

**Setup**: Automatically creates database at `./data/local.db`

**Cost**: FREE

---

## Quick Start

### Minimal Setup (Core Servers Only)

Two environment variables needed:

```bash
# REQUIRED: Set repository path for filesystem, git, and sqlite servers
export EDGELOOP_REPO_PATH="/path/to/your/edgeloop/repository"

# OPTIONAL: GitHub integration (free personal access token)
export GITHUB_TOKEN="your_github_token"
```

All other servers work without any additional configuration!

### Installation

1. **Set Repository Path** (required):
   ```bash
   # Find your repository path
   pwd
   
   # Set the environment variable
   export EDGELOOP_REPO_PATH="/your/actual/path/to/edgeloop"
   ```

2. **Get GitHub Token** (optional, but recommended):
   - Go to https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select scopes: `repo`, `workflow`, `read:org`
   - Copy the token

3. **Set Environment Variables**:
   ```bash
   export EDGELOOP_REPO_PATH="/your/path/to/edgeloop"
   export GITHUB_TOKEN="your_token_here"
   ```

4. **Done!** All servers are now configured.

## Usage with Claude Desktop

1. Copy `claude_desktop_config.json` to Claude Desktop's config directory:
   
   **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   
   **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   
   **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. Set up required environment variables:
   ```bash
   export EDGELOOP_REPO_PATH="/your/path/to/edgeloop"
   export GITHUB_TOKEN="your_token_here"  # optional
   ```

3. Restart Claude Desktop

4. MCP servers will be available in the tools menu

## What's Included vs. What's Not

### ✅ Included (All Free)
- **GitHub** - Free with personal access token
- **Filesystem** - Completely free, local file operations
- **Git** - Completely free, git operations
- **Memory** - Completely free, context persistence
- **Playwright** - Free browser automation
- **Puppeteer** - Free browser automation
- **Sequential Thinking** - Free reasoning tool
- **Fetch** - Free HTTP client
- **Time** - Free time utilities
- **SQLite** - Free local database

### ❌ Not Included (Require Paid APIs or Complex Setup)
- **PostgreSQL** - Requires database connection (Neon has free tier, but needs setup)
- **Brave Search** - Requires API key (limited free tier, then paid)
- **Slack** - Requires workspace and app setup
- **Sentry** - Requires account (has free tier but needs setup)
- **Google Maps** - Requires API key with billing account
- **AWS Services** - Requires AWS account and services
- **Docker** - Requires Docker installed (optional, not included by default)

## Optional: Adding Paid/Setup-Required Servers

If you want to add servers that require paid APIs or setup, create a separate config file:

`.claude/claude_desktop_config.extended.json`:

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "${DATABASE_URL}"]
    }
  }
}
```

## Security Best Practices

1. **Never commit secrets**: Keep API keys and tokens in environment variables
2. **Use .gitignore**: Ensure `.env` files are not tracked
3. **Rotate tokens**: Regularly rotate GitHub tokens
4. **Minimal permissions**: Grant only necessary permissions to tokens
5. **Free tier limits**: Be aware of rate limits on free services

## Troubleshooting

### Server not starting

- Check that npx is available: `npx --version`
- Verify Node.js is installed: `node --version`
- Check Claude Desktop logs for errors

### GitHub token errors

- Verify token is set: `echo $GITHUB_TOKEN`
- Check token permissions at https://github.com/settings/tokens
- Ensure token hasn't expired

### Permission denied errors

- Check filesystem permissions for file operations
- Ensure repository path is correct: `/home/runner/work/edgeloop/edgeloop`

## Benefits of Free-Tier Only

✅ **No Credit Card Required**: All servers work without payment  
✅ **No Usage Limits**: Most servers have no rate limits  
✅ **Zero Operational Cost**: No monthly fees or charges  
✅ **Easy Setup**: Minimal configuration needed  
✅ **Privacy**: No data sent to third-party APIs (except GitHub)  
✅ **Offline Capable**: Most servers work without internet

## What Each Server Costs

| Server | Cost | Setup Time | Requirements |
|--------|------|------------|--------------|
| GitHub | FREE | 2 min | GitHub account (free) |
| Filesystem | FREE | 0 min | None |
| Git | FREE | 0 min | None |
| Memory | FREE | 0 min | None |
| Playwright | FREE | 0 min | Node.js |
| Puppeteer | FREE | 0 min | Node.js |
| Sequential Thinking | FREE | 0 min | None |
| Fetch | FREE | 0 min | None |
| Time | FREE | 0 min | None |
| SQLite | FREE | 0 min | None |

**Total Setup Cost: $0.00**  
**Total Monthly Cost: $0.00**

## Additional Resources

- [MCP Documentation](https://modelcontextprotocol.io)
- [Claude Desktop](https://claude.ai/desktop)
- [GitHub Personal Access Tokens](https://github.com/settings/tokens) - FREE
- [Playwright Documentation](https://playwright.dev) - FREE

## Contributing

When adding new MCP servers:

1. Ensure they are **completely free** with no paid tiers required
2. Add the server configuration to `claude_desktop_config.json`
3. Document it in this README
4. Include setup instructions
5. Mark clearly if any dependencies or accounts needed

---

**Note**: This configuration is designed to be 100% free with zero ongoing costs. All servers work with free accounts or no account at all.
