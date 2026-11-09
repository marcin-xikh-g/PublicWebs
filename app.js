const CAESAR_SHIFT = 23;
const ACCESS_KEY = 'fatagruzja';
const FILE_MAP_URL = 'file-map.json';
const LAST_OPENED_DOCUMENT_KEY = 'publicwebs:last-opened-document';

const form = document.querySelector('#decode-form');
const keyInput = document.querySelector('#decode-key');
const status = document.querySelector('#status');
const content = document.querySelector('#document-content');
const lockedMessage = document.querySelector('#locked-message');
const submitButton = form.querySelector('button');
const fileMenu = document.querySelector('#file-menu');
const pageTitle = document.querySelector('#page-title');
const explorerTrigger = document.querySelector('#explorer-trigger');
const fileDialog = document.querySelector('#file-dialog');
let documents = [];
let selectedDocument = null;

function shiftFromKey(key) {
  if (key === ACCESS_KEY) return CAESAR_SHIFT;

  const keyBytes = new TextEncoder().encode(key);
  const derivedShift = keyBytes.reduce((total, byte) => (total + byte) % 256, 0);
  return derivedShift === CAESAR_SHIFT ? (derivedShift + 1) % 256 : derivedShift;
}

function decryptBytes(encryptedBytes, key) {
  const shift = shiftFromKey(key);
  return Uint8Array.from(encryptedBytes, (byte) => (byte - shift + 256) % 256);
}

function displayName(document) {
  return document.sourcePath.replace(/^in-files\//, '');
}

function selectDocument(document) {
  selectedDocument = document;
  pageTitle.textContent = displayName(document);
  explorerTrigger.textContent = `Plik: ${displayName(document)}`;

  for (const button of fileMenu.querySelectorAll('button')) {
    button.classList.toggle('is-selected', button.dataset.sourcePath === document.sourcePath);
  }
}

function renderFileMenu() {
  fileMenu.replaceChildren();

  for (const file of documents) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'file-menu-item';
    button.dataset.sourcePath = file.sourcePath;
    button.textContent = displayName(file);
    button.addEventListener('click', () => {
      selectDocument(file);
      fileDialog.close();
      if (!content.hidden && keyInput.value) unlockDocument();
    });
    fileMenu.append(button);
  }
}

async function loadDocumentList() {
  try {
    const response = await fetch(FILE_MAP_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const map = await response.json();
    if (!Array.isArray(map.files) || map.files.length === 0) throw new Error('No mapped documents');
    documents = map.files.filter((document) => document.sourcePath && document.encryptedPath);
    if (documents.length === 0) throw new Error('No valid mapped documents');

    renderFileMenu();
    const lastOpened = localStorage.getItem(LAST_OPENED_DOCUMENT_KEY);
    selectDocument(documents.find((document) => document.sourcePath === lastOpened) ?? documents[0]);
  } catch (error) {
    console.error(error);
    fileMenu.textContent = 'Nie udało się wczytać listy plików z repozytorium.';
    status.textContent = 'Lista dokumentów jest obecnie niedostępna.';
  }
}

async function unlockDocument() {
  if (!keyInput.value) {
    status.textContent = 'Wpisz klucz dekodowania.';
    keyInput.focus();
    return;
  }
  if (!selectedDocument) {
    status.textContent = 'Wybierz dokument z menu.';
    return;
  }

  submitButton.disabled = true;
  status.textContent = 'Odszyfrowywanie dokumentu…';

  try {
    const response = await fetch(selectedDocument.encryptedPath, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const encryptedBytes = new Uint8Array(await response.arrayBuffer());
    const markdown = new TextDecoder('utf-8').decode(decryptBytes(encryptedBytes, keyInput.value));

    content.innerHTML = window.marked.parse(markdown, { gfm: true, breaks: false });
    content.hidden = false;
    lockedMessage.hidden = true;
    localStorage.setItem(LAST_OPENED_DOCUMENT_KEY, selectedDocument.sourcePath);
    status.textContent = 'Dokument został odszyfrowany podanym kluczem.';
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

explorerTrigger.addEventListener('click', () => fileDialog.showModal());

loadDocumentList();
