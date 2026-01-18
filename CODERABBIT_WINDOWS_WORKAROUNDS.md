# CodeRabbit Windows Workarounds

## Option 1: Use GitHub Integration Only (Recommended - No CLI Needed)

The `.coderabbit.yaml` file is already configured. CodeRabbit will automatically review PRs via GitHub integration without needing the CLI installed locally.

**What works:**
- ✅ Automatic PR reviews
- ✅ Code suggestions and feedback
- ✅ All review features via GitHub
- ✅ No local installation needed

**How to use:**
1. Create a PR on GitHub
2. CodeRabbit automatically reviews it
3. Review comments appear on the PR
4. Apply suggestions directly in GitHub

---

## Option 2: Use GitHub Actions (CI/CD Integration)

Create a GitHub Actions workflow to run CodeRabbit CLI in CI:

```yaml
# .github/workflows/coderabbit-review.yml
name: CodeRabbit Review
on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install CodeRabbit CLI
        run: curl -fsSL https://cli.coderabbit.ai/install.sh | sh
      - name: Run CodeRabbit Review
        run: |
          export PATH="$HOME/.local/bin:$PATH"
          coderabbit review --plain
        env:
          CODERABBIT_TOKEN: ${{ secrets.CODERABBIT_TOKEN }}
```

---

## Option 3: Use Docker (Windows)

Run CodeRabbit CLI in a Docker container:

```powershell
# Create a Dockerfile
docker run -it --rm -v ${PWD}:/workspace -w /workspace ubuntu:latest bash -c "
  apt-get update && apt-get install -y curl unzip git &&
  curl -fsSL https://cli.coderabbit.ai/install.sh | sh &&
  export PATH=\$HOME/.local/bin:\$PATH &&
  coderabbit review --plain
"
```

---

## Option 4: Manual Binary Download (If Available)

If CodeRabbit releases Windows binaries in the future:

```powershell
# Check for Windows release
$version = (Invoke-WebRequest -Uri "https://cli.coderabbit.ai/releases/latest/VERSION").Content.Trim()
$url = "https://cli.coderabbit.ai/releases/$version/coderabbit-windows-x64.zip"

# Download and extract
Invoke-WebRequest -Uri $url -OutFile "coderabbit.zip"
Expand-Archive -Path "coderabbit.zip" -DestinationPath "$env:LOCALAPPDATA\coderabbit"
$env:Path += ";$env:LOCALAPPDATA\coderabbit"
```

---

## Option 5: Use Git Bash (If Installed)

If you have Git for Windows with Git Bash:

```bash
# In Git Bash
curl -fsSL https://cli.coderabbit.ai/install.sh | sh
source ~/.bashrc
coderabbit --version
```

---

## Option 6: PowerShell Wrapper Script

Create a PowerShell script to run CodeRabbit via WSL (once WSL is set up):

```powershell
# coderabbit.ps1
param(
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$Args
)

$wslCommand = "export PATH=`$HOME/.local/bin:`$PATH && coderabbit $($Args -join ' ')"
wsl bash -c $wslCommand
```

Usage:
```powershell
.\coderabbit.ps1 review --plain
```

---

## Option 7: Use VS Code Remote - WSL Extension

1. Install "Remote - WSL" extension in VS Code
2. Install Ubuntu in WSL: `wsl --install -d Ubuntu`
3. Open project in WSL: `code --remote wsl+Ubuntu .`
4. Install CodeRabbit CLI in WSL terminal
5. Use it directly from VS Code integrated terminal

---

## Recommended Approach

**For most users:** Use Option 1 (GitHub Integration)
- Already configured with `.coderabbit.yaml`
- No installation needed
- Works automatically on PRs
- Full feature set via GitHub

**For CI/CD:** Use Option 2 (GitHub Actions)
- Automated reviews in pipeline
- No local setup needed
- Runs on every PR

**For local development:** Use Option 7 (VS Code + WSL)
- Best developer experience
- Native Linux environment
- Full CLI access

---

## Current Status

✅ **Already Working:**
- `.coderabbit.yaml` configured
- GitHub integration active
- PR reviews will work automatically

❌ **Not Available:**
- Native Windows CLI binary
- Direct PowerShell installation

🔧 **Workarounds Available:**
- All options above are viable
- Choose based on your workflow needs
