const form = document.querySelector('#search-form');
const queryInput = document.querySelector('#query');
const searchButton = document.querySelector('#search-button');
const status = document.querySelector('#status');
const results = document.querySelector('#results');
let current;
const names = { keyword: 'Keyword', semantic: 'Semantic', hybrid: 'Hybrid' };
function element(tag, text, className) {
  const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node;
}
function render() {
  if (!current) return;
  const mode = document.querySelector('input[name="mode"]:checked').value;
  const selected = current.methods[mode]; results.replaceChildren();
  status.textContent = `${names[mode]} · ${selected.results.length} passages shown of ${selected.count} ranked · local query encoding ${current.timing.queryEncodingMs.toFixed(1)} ms`;
  for (const row of selected.results) {
    const item = element('li');
    item.append(element('div', `${names[mode]} score ${row.score.toFixed(4)}`, 'result-meta'));
    const heading = element('h2'); const link = element('a', row.title); link.href = row.url; link.target = '_blank'; link.rel = 'noreferrer'; heading.append(link); item.append(heading);
    if (row.heading) item.append(element('p', row.heading, 'heading'));
    if (row.text.length > 750) {
      item.append(element('div', row.text.slice(0, 750) + '…', 'passage'));
      const details = element('details', undefined, 'full-passage'); details.append(element('summary', 'Read the complete passage'), element('div', row.text, 'passage')); item.append(details);
    } else item.append(element('div', row.text, 'passage'));
    results.append(item);
  }
  if (!selected.results.length) results.append(element('li', 'No keyword matches. Try describing the idea in a different way, or compare semantic search.'));
}
form.addEventListener('submit', async event => {
  event.preventDefault(); const query = queryInput.value.trim(); if (!query) return;
  if (current?.query === query) { render(); return; }
  searchButton.disabled = true; status.textContent = 'Finding passages locally…';
  try {
    const response = await fetch('/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error);
    current = data; render();
  } catch (error) { current = undefined; results.replaceChildren(); status.textContent = error.message || 'Search failed. Please try again.'; }
  finally { searchButton.disabled = false; }
});
document.querySelector('#modes').addEventListener('change', render);
try {
  const response = await fetch('/catalog'); if (!response.ok) throw new Error('Index unavailable'); const catalog = await response.json();
  document.querySelector('#catalog').textContent = `${catalog.articles} articles · ${catalog.passages} passages · local inference`;
  for (const query of catalog.samples) {
    const item = element('li'); const button = element('button', query); button.type = 'button'; button.addEventListener('click', () => { queryInput.value = query; form.requestSubmit(); }); item.append(button); document.querySelector('#examples').append(item);
  }
  form.requestSubmit();
} catch { status.textContent = 'The local index is unavailable. Restart the experiment server and reload.'; }
