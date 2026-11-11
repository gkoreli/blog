const design = document.getElementById('design');
const viewport = document.getElementById('viewport');
const appearance = document.getElementById('appearance');
const frame = document.getElementById('preview');
const stage = document.querySelector('.lab-stage');
const frameBox = document.querySelector('.lab-viewport');
const link = document.getElementById('open-page');
let observer;
function fit() {
  const width = Number(viewport.value);
  const scale = Math.min(1, stage.clientWidth / width);
  const content = frame.contentDocument?.querySelector('.content');
  const header = frame.contentDocument?.querySelector('.sidebar');
  const height = content ? Math.ceil(content.getBoundingClientRect().height + (width <= 768 ? header?.getBoundingClientRect().height || 0 : 0)) : 1100;
  frame.style.width = `${width}px`;
  frame.style.height = `${height}px`;
  frame.style.transform = `scale(${scale})`;
  frameBox.style.width = `${width * scale}px`;
  frameBox.style.height = `${height * scale}px`;
}
function navigate() {
  const path = `/_design/tools/${design.value}/?theme=${appearance.value}`;
  frame.src = path;
  link.href = path;
}
design.addEventListener('change',navigate);
appearance.addEventListener('change',navigate);
viewport.addEventListener('change',fit);
frame.addEventListener('load',()=> {
  observer?.disconnect();
  observer = new ResizeObserver(fit);
  observer.observe(frame.contentDocument.body);
  fit();
});
new ResizeObserver(fit).observe(stage);
