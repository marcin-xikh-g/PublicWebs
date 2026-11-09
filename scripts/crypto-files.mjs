import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CAESAR_SHIFT, shiftBytes } from './caesar.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INPUT_DIRECTORY = path.join(ROOT, 'in-files');
const OUTPUT_DIRECTORY = path.join(ROOT, 'out-files');
const DECRYPTED_DIRECTORY = path.join(ROOT, 'de-files');
const MAP_PATH = path.join(ROOT, 'file-map.json');

function sha256(contents) {
  return createHash('sha256').update(contents).digest('hex');
}

function projectPath(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
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

async function encrypt() {
  const files = await filesIn(INPUT_DIRECTORY);
  const mappedFiles = [];

  for (const relativePath of files) {
    const sourcePath = path.join(INPUT_DIRECTORY, relativePath);
    const encryptedRelativePath = `${relativePath}.caesar`;
    const encryptedPath = path.join(OUTPUT_DIRECTORY, encryptedRelativePath);
    const source = await readFile(sourcePath);
    const encrypted = shiftBytes(source, CAESAR_SHIFT);

    await mkdir(path.dirname(encryptedPath), { recursive: true });
    await writeFile(encryptedPath, encrypted);
    mappedFiles.push({
      sourcePath: projectPath(sourcePath),
      encryptedPath: projectPath(encryptedPath),
      sha256: sha256(source),
      encryptedSha256: sha256(encrypted)
    });
  }

  const map = {
    version: 1,
    algorithm: 'Caesar byte shift modulo 256',
    shift: CAESAR_SHIFT,
    files: mappedFiles
  };

  await writeFile(MAP_PATH, `${JSON.stringify(map, null, 2)}\n`);
  console.log(`Encrypted ${files.length} file(s) into out-files/.`);
}

async function decrypt() {
  const map = JSON.parse(await readFile(MAP_PATH, 'utf8'));
  if (map.version !== 1 || map.shift !== CAESAR_SHIFT || !Array.isArray(map.files)) {
    throw new Error('file-map.json is not a compatible Caesar-23 map.');
  }

  for (const item of map.files) {
    if (!item.sourcePath.startsWith('in-files/') || !item.encryptedPath.startsWith('out-files/')) {
      throw new Error(`Unsafe mapping in file-map.json: ${JSON.stringify(item)}`);
    }

    const encrypted = await readFile(path.join(ROOT, item.encryptedPath));
    if (sha256(encrypted) !== item.encryptedSha256) {
      throw new Error(`Encrypted checksum mismatch: ${item.encryptedPath}`);
    }

    const relativePath = item.sourcePath.slice('in-files/'.length);
    const decryptedPath = path.join(DECRYPTED_DIRECTORY, relativePath);
    await mkdir(path.dirname(decryptedPath), { recursive: true });
    await writeFile(decryptedPath, shiftBytes(encrypted, -CAESAR_SHIFT));
  }

  console.log(`Decrypted ${map.files.length} file(s) into de-files/.`);
}

const mode = process.argv[2];
if (mode === 'encrypt') await encrypt();
else if (mode === 'decrypt') await decrypt();
else throw new Error('Usage: node scripts/crypto-files.mjs <encrypt|decrypt>');
