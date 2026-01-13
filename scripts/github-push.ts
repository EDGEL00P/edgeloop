// GitHub push script using Octokit API (no git commands)
import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

// Get all files recursively, excluding certain directories
function getAllFiles(dir: string, baseDir: string = dir): { path: string; content: string }[] {
  const files: { path: string; content: string }[] = [];
  const excludeDirs = ['node_modules', '.git', 'dist', '.cache', '__pycache__', '.venv', 'attached_assets'];
  const excludeFiles = ['.env', '.env.local', 'package-lock.json'];
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relativePath = path.relative(baseDir, fullPath);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!excludeDirs.includes(item) && !item.startsWith('.')) {
        files.push(...getAllFiles(fullPath, baseDir));
      }
    } else {
      if (!excludeFiles.includes(item)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          files.push({ path: relativePath, content });
        } catch {
          // Skip binary files
        }
      }
    }
  }
  
  return files;
}

async function pushToGitHub() {
  console.log("Getting GitHub access token...");
  const token = await getAccessToken();
  const octokit = new Octokit({ auth: token });
  
  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`Authenticated as: ${user.login}`);
  
  const owner = user.login;
  const repo = "edge-loop-nfl";
  const branch = "main";
  
  // Ensure repo exists
  try {
    await octokit.repos.get({ owner, repo });
    console.log(`Using existing repo: ${owner}/${repo}`);
  } catch (e: any) {
    if (e.status === 404) {
      console.log("Creating repository...");
      await octokit.repos.createForAuthenticatedUser({
        name: repo,
        description: "Edge Loop - NFL Betting Intelligence Platform",
        private: true,
        auto_init: true
      });
      console.log("Repository created!");
      // Wait for initialization
      await new Promise(r => setTimeout(r, 2000));
    } else {
      throw e;
    }
  }
  
  // Get latest commit SHA
  let latestSha: string;
  try {
    const { data: ref } = await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` });
    latestSha = ref.object.sha;
    console.log(`Latest commit: ${latestSha.slice(0, 7)}`);
  } catch (e: any) {
    if (e.status === 409) {
      // Empty repo, initialize it
      console.log("Initializing empty repository...");
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: "README.md",
        message: "Initial commit",
        content: Buffer.from("# Edge Loop - NFL Betting Intelligence\n\nProfessional sports analytics platform.").toString('base64'),
        branch
      });
      await new Promise(r => setTimeout(r, 1000));
      const { data: ref } = await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` });
      latestSha = ref.object.sha;
    } else {
      throw e;
    }
  }
  
  console.log("Collecting files...");
  const files = getAllFiles(process.cwd());
  console.log(`Found ${files.length} files to push`);
  
  // Create blobs for each file
  console.log("Creating blobs...");
  const tree: { path: string; mode: '100644'; type: 'blob'; sha: string }[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (i % 50 === 0) {
      console.log(`  Processing ${i}/${files.length}...`);
    }
    
    try {
      const { data: blob } = await octokit.git.createBlob({
        owner,
        repo,
        content: Buffer.from(file.content).toString('base64'),
        encoding: 'base64'
      });
      
      tree.push({
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: blob.sha
      });
    } catch (e) {
      console.log(`  Skipping ${file.path} (too large or binary)`);
    }
  }
  
  console.log("Creating tree...");
  const { data: newTree } = await octokit.git.createTree({
    owner,
    repo,
    base_tree: latestSha,
    tree
  });
  
  console.log("Creating commit...");
  const { data: commit } = await octokit.git.createCommit({
    owner,
    repo,
    message: "Updated Edge Loop project files",
    tree: newTree.sha,
    parents: [latestSha]
  });
  
  console.log("Updating branch reference...");
  await octokit.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: commit.sha,
    force: true
  });
  
  console.log(`\n✅ Successfully pushed to GitHub!`);
  console.log(`View at: https://github.com/${owner}/${repo}`);
}

pushToGitHub().catch(err => {
  console.error("Failed to push:", err.message);
  process.exit(1);
});
