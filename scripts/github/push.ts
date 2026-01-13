/**
 * GitHub Push Script - Uploads code to Beermoney repository
 * Uses Replit's GitHub integration
 */
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
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
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

async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

const REPO_NAME = 'Beermoney';
const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.cache',
  '.pythonlibs',
  'dist',
  '.replit',
  '.upm',
  '.config',
  'replit.nix',
  '__pycache__',
  '*.pyc',
  '.env',
  'package-lock.json',
  'attached_assets',
  '*.zip',
  '*.tar',
  '*.gz',
  '*.pth',
  '*.pkl',
  '*.joblib',
  '*.parquet'
];

function shouldIgnore(filePath: string): boolean {
  return IGNORE_PATTERNS.some(pattern => {
    if (pattern.includes('*')) {
      const ext = pattern.replace('*', '');
      return filePath.endsWith(ext);
    }
    return filePath.includes(pattern);
  });
}

function getAllFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    
    if (shouldIgnore(relativePath)) continue;
    
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir));
    } else {
      files.push(relativePath);
    }
  }
  
  return files;
}

async function main() {
  console.log('Connecting to GitHub...');
  const octokit = await getUncachableGitHubClient();
  
  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`Authenticated as: ${user.login}`);
  
  let repo;
  try {
    const { data } = await octokit.repos.get({
      owner: user.login,
      repo: REPO_NAME
    });
    repo = data;
    console.log(`Found existing repo: ${repo.full_name}`);
  } catch (error: any) {
    if (error.status === 404) {
      console.log(`Creating new repo: ${REPO_NAME}`);
      const { data } = await octokit.repos.createForAuthenticatedUser({
        name: REPO_NAME,
        description: 'Singularity NFL Intelligence - Advanced NFL betting analytics platform',
        private: false,
        auto_init: true
      });
      repo = data;
      console.log(`Created repo: ${repo.full_name}`);
    } else {
      throw error;
    }
  }
  
  console.log('Getting all project files...');
  const projectDir = process.cwd();
  const files = getAllFiles(projectDir);
  console.log(`Found ${files.length} files to upload`);
  
  let mainBranchRef;
  try {
    const { data } = await octokit.git.getRef({
      owner: user.login,
      repo: REPO_NAME,
      ref: 'heads/main'
    });
    mainBranchRef = data;
  } catch {
    try {
      const { data } = await octokit.git.getRef({
        owner: user.login,
        repo: REPO_NAME,
        ref: 'heads/master'
      });
      mainBranchRef = data;
    } catch {
      console.log('No existing branch found, creating initial commit...');
    }
  }
  
  console.log('Creating file blobs...');
  const blobs: { path: string; sha: string; mode: string; type: string }[] = [];
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(projectDir, file));
      const base64Content = content.toString('base64');
      
      const { data: blob } = await octokit.git.createBlob({
        owner: user.login,
        repo: REPO_NAME,
        content: base64Content,
        encoding: 'base64'
      });
      
      blobs.push({
        path: file,
        sha: blob.sha,
        mode: '100644',
        type: 'blob'
      });
      
      process.stdout.write(`\rUploaded: ${blobs.length}/${files.length}`);
    } catch (error) {
      console.error(`\nFailed to upload ${file}:`, error);
    }
  }
  console.log('\n');
  
  console.log('Creating tree...');
  const { data: tree } = await octokit.git.createTree({
    owner: user.login,
    repo: REPO_NAME,
    tree: blobs as any,
    base_tree: mainBranchRef?.object?.sha
  });
  
  console.log('Creating commit...');
  const { data: commit } = await octokit.git.createCommit({
    owner: user.login,
    repo: REPO_NAME,
    message: 'Singularity NFL Intelligence - Full platform upload',
    tree: tree.sha,
    parents: mainBranchRef ? [mainBranchRef.object.sha] : []
  });
  
  console.log('Updating branch reference...');
  const branchName = mainBranchRef ? 'main' : 'main';
  try {
    await octokit.git.updateRef({
      owner: user.login,
      repo: REPO_NAME,
      ref: `heads/${branchName}`,
      sha: commit.sha
    });
  } catch {
    await octokit.git.createRef({
      owner: user.login,
      repo: REPO_NAME,
      ref: `refs/heads/${branchName}`,
      sha: commit.sha
    });
  }
  
  console.log('');
  console.log('✓ Successfully uploaded to GitHub!');
  console.log(`Repository: https://github.com/${user.login}/${REPO_NAME}`);
}

main().catch(console.error);
