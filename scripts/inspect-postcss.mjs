import fs from 'fs/promises'
import path from 'path'

const projectRoot = path.resolve(process.cwd())
const webDir = path.join(projectRoot, 'apps', 'web')
const candidates = [
  'postcss.config.js',
  'postcss.config.cjs',
  'postcss.config.mjs',
  path.join('..', 'postcss.config.js'),
  path.join('..', 'postcss.config.cjs'),
  path.join('..', 'postcss.config.mjs'),
]

async function fileExists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

console.log('Project root:', projectRoot)
console.log('\nChecking PostCSS config candidates in apps/web and repo root:')

for (const c of candidates) {
  const full = path.join(webDir, c)
  if (await fileExists(full)) {
    console.log('\nFOUND:', full)
    const txt = await fs.readFile(full, 'utf8')
    console.log('--- start file ---')
    console.log(txt.slice(0, 1000))
    console.log('--- end file ---')
  }
}

async function readPkgJson(pkgPath) {
  try {
    const txt = await fs.readFile(pkgPath, 'utf8')
    return JSON.parse(txt)
  } catch {
    return null
  }
}

console.log('\nChecking installed packages: tailwindcss, @tailwindcss/postcss, postcss')
const checkModules = ['tailwindcss', '@tailwindcss/postcss', 'postcss']
for (const m of checkModules) {
  try {
    const modPkg = path.join(projectRoot, 'node_modules', m, 'package.json')
    const pkg = await readPkgJson(modPkg)
    if (pkg) console.log(m, 'version', pkg.version, 'main', pkg.main)
    else console.log(m, 'not installed in node_modules')
  } catch (err) {
    console.log('error checking', m, err.message)
  }
}

console.log('\nFiles that import tailwindcss via @import or @tailwind (searching)')
async function searchFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) await searchFiles(p)
    else if (e.isFile() && p.endsWith('.css')) {
      const txt = await fs.readFile(p, 'utf8')
      if (txt.includes('@import "tailwindcss"') || txt.includes('@tailwind')) {
        console.log('->', p)
        console.log(txt.split('\n').slice(0,10).join('\n'))
      }
    }
  }
}

try {
  await searchFiles(projectRoot)
} catch (e) {
  console.log('searchFiles error', e.message)
}

console.log('\nAttempting dynamic import of @tailwindcss/postcss and tailwindcss (if present)')
try {
  const postcssPluginPath = path.join(projectRoot, 'node_modules', '@tailwindcss', 'postcss')
  const pkgPath = path.join(postcssPluginPath, 'package.json')
  const pkg = await readPkgJson(pkgPath)
  if (pkg) console.log('@tailwindcss/postcss', pkg.version)
} catch (e) {
  console.log('Error reading @tailwindcss/postcss:', e.message)
}

try {
  const twPkg = await readPkgJson(path.join(projectRoot, 'node_modules', 'tailwindcss', 'package.json'))
  if (twPkg) console.log('tailwindcss', twPkg.version)
} catch (e) {
  console.log('Error reading tailwindcss pkg:', e.message)
}

console.log('\nDone')
