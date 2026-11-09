const CAESAR_SHIFT = 23;
const ACCESS_KEY = 'fatagruzja';
const ENCRYPTED_DOCUMENT = 'out-files/boss-territorial-expansion.md.caesar';

const form = document.querySelector('#decode-form');
const keyInput = document.querySelector('#decode-key');
const status = document.querySelector('#status');
const content = document.querySelector('#document-content');
const lockedMessage = document.querySelector('#locked-message');
const submitButton = form.querySelector('button');

function decryptBytes(encryptedBytes) {
  return Uint8Array.from(encryptedBytes, (byte) => (byte - CAESAR_SHIFT + 256) % 256);
}

async function unlockDocument() {
  if (keyInput.value !== ACCESS_KEY) {
    status.textContent = 'Nieprawidłowy klucz. Spróbuj ponownie.';
    keyInput.focus();
    return;
  }

  submitButton.disabled = true;
  status.textContent = 'Odszyfrowywanie dokumentu…';

  try {
    const response = await fetch(ENCRYPTED_DOCUMENT, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const encryptedBytes = new Uint8Array(await response.arrayBuffer());
    const markdown = new TextDecoder('utf-8', { fatal: true }).decode(decryptBytes(encryptedBytes));

    content.innerHTML = window.marked.parse(markdown, { gfm: true, breaks: false });
    content.hidden = false;
    lockedMessage.hidden = true;
    status.textContent = 'Dokument został odszyfrowany.';
  } catch (error) {
    console.error(error);
    status.textContent = 'Nie udało się odczytać zaszyfrowanego dokumentu.';
  } finally {
    submitButton.disabled = false;
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  unlockDocument();
});
