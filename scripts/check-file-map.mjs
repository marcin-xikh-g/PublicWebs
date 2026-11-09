import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CAESAR_SHIFT } from './caesar.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function sha256(contents) {
  return createHash('sha256').update(contents).digest('hex');
}

async function filesIn(directory, relativeDirectory = '') {
  try {
    const entries = await readdir(path.join(directory, relativeDirectory), { withFileTypes: true });
    const files = [];
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      const relativePath = path.join(relativeDirectory, entry.name);
      if (entry.isDirectory()) files.push(...await filesIn(directory, relativePath));
      if (entry.isFile()) files.push(relativePath);
    }
    return files;
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

function git(args) {
  return spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
}

function isTracked(projectRelativePath) {
  return git(['ls-files', '--error-unmatch', '--', projectRelativePath]).status === 0;
}

const inputDirectory = path.join(ROOT, 'in-files');
const mapPath = path.join(ROOT, 'file-map.json');
const errors = [];
let map;

if (!existsSync(mapPath)) {
  errors.push('Missing file-map.json. Run: npm run encrypt:files');
} else {
  map = JSON.parse(await readFile(mapPath, 'utf8'));
  if (map.version !== 1 || map.shift !== CAESAR_SHIFT || !Array.isArray(map.files)) {
    errors.push('file-map.json is not a valid Caesar-23 map.');
  }
}

if (map?.files) {
  const bySource = new Map(map.files.map((item) => [item.sourcePath, item]));
  for (const relativePath of await filesIn(inputDirectory)) {
    const sourcePath = `in-files/${relativePath.split(path.sep).join('/')}`;
    const item = bySource.get(sourcePath);
    if (!item) {
      errors.push(`No encrypted mapping for ${sourcePath}. Run: npm run encrypt:files`);
      continue;
    }

    const source = await readFile(path.join(inputDirectory, relativePath));
    if (item.sha256 !== sha256(source)) {
      errors.push(`Mapping is stale for ${sourcePath}. Run: npm run encrypt:files`);
    }
    if (!item.encryptedPath?.startsWith('out-files/') || !existsSync(path.join(ROOT, item.encryptedPath))) {
      errors.push(`Missing encrypted file for ${sourcePath}.`);
    } else if (!isTracked(item.encryptedPath)) {
      errors.push(`${item.encryptedPath} is not tracked by Git.`);
    }
  }

  if (!isTracked('file-map.json')) errors.push('file-map.json is not tracked by Git.');
}

const hasHead = git(['rev-parse', '--verify', 'HEAD']).status === 0;
const pending = git(hasHead
  ? ['diff', '--quiet', 'HEAD', '--', 'file-map.json', 'out-files']
  : ['diff', '--cached', '--quiet', '--', 'file-map.json', 'out-files']);
if (pending.status === 1) errors.push('Commit changes to file-map.json and out-files/ before pushing.');

if (errors.length > 0) {
  console.error('Push blocked: encrypted-file validation failed.');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Encrypted-file mapping is valid.');
