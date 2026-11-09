export const CAESAR_SHIFT = 23;

/** Apply a Caesar shift to every byte, wrapping at 256. */
export function shiftBytes(input, shift) {
  const normalizedShift = ((shift % 256) + 256) % 256;
  const output = Buffer.allocUnsafe(input.length);

  for (let index = 0; index < input.length; index += 1) {
    output[index] = (input[index] + normalizedShift) % 256;
  }

  return output;
}
