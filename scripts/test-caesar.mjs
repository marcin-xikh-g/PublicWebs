import assert from 'node:assert/strict';
import { CAESAR_SHIFT, shiftBytes } from './caesar.mjs';

const original = Buffer.from([0, 1, 22, 23, 127, 232, 255]);
const encrypted = shiftBytes(original, CAESAR_SHIFT);

assert.notDeepEqual(encrypted, original);
assert.deepEqual(shiftBytes(encrypted, -CAESAR_SHIFT), original);
assert.equal(shiftBytes(Buffer.from('A'), CAESAR_SHIFT)[0], 88);
console.log('Caesar-23 encryption/decryption test passed.');
