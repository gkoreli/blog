const form = document.querySelector('form');
const query = document.querySelector('#query');
const mode = document.querySelector('#mode');
const status = document.querySelector('#status');
const resultNote = document.querySelector('#result-note');
const results = document.querySelector('#results');
const worker = new Worker('./worker.mjs', { type: 'module' });
let request = 0;
function submit() {
  const text = query.value.trim();
  if (!text) { results.replaceChildren(); resultNote.textContent = 'Enter a few words to search.'; return; }
  worker.postMessage({ id: ++request, query: text, mode: mode.value });
}
form.addEventListener('submit', event => { event.preventDefault(); submit(); });
mode.addEventListener('change', submit);
for (const button of document.querySelectorAll('[data-query]')) button.addEventListener('click', () => { query.value = button.dataset.query; submit(); });
worker.onmessage = event => {
  const message = event.data;
  if (message.type === 'error') { status.textContent = message.message; return; }
  if (message.type === 'ready') {
    status.textContent = `Ready · ${message.posts} post titles and tags · ${message.vocabulary.toLocaleString()} learned words · ${(message.modelBytes / 1e6).toFixed(2)} MB model data before compression`;
    for (const control of document.querySelectorAll('fieldset')) control.disabled = false;
    query.focus(); submit(); return;
  }
  if (message.id !== request) return;
  results.replaceChildren();
  const elapsed = message.elapsedMs < .1 ? '<0.1' : message.elapsedMs.toFixed(1);
  resultNote.textContent = `${message.rows.length} results · ${elapsed} ms for query encoding and ranking in this worker · recognized: ${message.recognized.join(', ') || 'none'}`;
  if (!message.rows.length) { const item = document.createElement('li'); item.textContent = 'No results in this mode.'; results.append(item); }
  for (const row of message.rows) {
    const item = document.createElement('li');
    const heading = document.createElement('h2'); const link = document.createElement('a');
    link.href = row.url; link.textContent = row.title; link.target = '_blank'; link.rel = 'noopener'; heading.append(link);
    const description = document.createElement('p'); description.textContent = row.description;
    const evidence = document.createElement('p'); evidence.className = 'detail'; evidence.textContent = `Vector alignment ${row.alignment.toFixed(3)} · keyword matches: ${row.matchedTerms.join(', ') || 'none'}`;
    item.append(heading, description, evidence); results.append(item);
  }
};
