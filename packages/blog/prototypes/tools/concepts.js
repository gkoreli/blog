// Forms validate locally. A design review never admits a hosted audit.
document.querySelectorAll('.tool-study').forEach(study => {
  study.querySelectorAll('[data-preview-form]').forEach(form => {
    const field = form.querySelector('input');
    const status = form.querySelector('[role="status"]');
    if (!field || !status) return;
    function previewSubmission(event) {
      event.preventDefault();
      let url;
      try {
        const value = field.value.trim();
        url = new URL(value.includes('://') ? value : `https://${value}`);
        if (url.protocol !== 'https:' || !url.hostname.includes('.') || url.username || url.password) throw new Error('invalid');
      } catch {
        status.hidden = false;
        status.setAttribute('role', 'alert');
        status.textContent = 'Enter a public domain or HTTPS URL.';
        field.setAttribute('aria-invalid', 'true');
        field.focus();
        return;
      }
      field.value = url.href;
      field.removeAttribute('aria-invalid');
      status.hidden = false;
      status.setAttribute('role', 'status');
      status.replaceChildren(document.createTextNode(`Preview only — no requests sent to ${url.hostname}. `));
      const link = document.createElement('a');
      link.href = 'https://gkoreli.com/ai-check';
      link.textContent = 'Open the live checker →';
      link.target = '_blank';
      link.rel = 'noopener';
      status.append(link);
    }
    form.addEventListener('submit', previewSubmission);
    // The in-chat sandbox blocks native form submission before submit dispatch.
    if (document.getElementById('gk-tools-studies')) {
      form.querySelector('button[type="submit"]')?.addEventListener('click', previewSubmission);
      field.addEventListener('keydown', event => {
        if (event.key === 'Enter') previewSubmission(event);
      });
    }
    field.addEventListener('input', () => {
      status.hidden = true;
      field.removeAttribute('aria-invalid');
    });
  });

  const choices = [...study.querySelectorAll('[data-task]')];
  const panels = [...study.querySelectorAll('[data-task-panel]')];
  if (!choices.length || !panels.length) return;
  function selectTask(task) {
    choices.forEach(choice => {
      const selected = choice.dataset.task === task;
      choice.classList.toggle('is-active', selected);
      if (selected) choice.setAttribute('aria-current', 'true');
      else choice.removeAttribute('aria-current');
    });
    panels.forEach(panel => { panel.hidden = panel.dataset.taskPanel !== task; });
  }
  study.classList.add('ts-enhanced');
  selectTask('page');
  choices.forEach(choice => choice.addEventListener('click', event => {
    event.preventDefault();
    selectTask(choice.dataset.task);
    if (window.openai?.setWidgetState) window.openai.setWidgetState({modelContent:{toolsPrototypeTask:choice.dataset.task}}).catch(()=>{});
  }));
  const restore = saved => {
    const task = saved?.modelContent?.toolsPrototypeTask;
    if (choices.some(choice => choice.dataset.task === task)) selectTask(task);
  };
  restore(window.openai?.widgetState);
  window.addEventListener('openai:set_globals', event => restore(event.detail?.globals?.widgetState));
});

// Preview themes do not overwrite the publication's saved preference.
if (!document.getElementById('gk-tools-studies')) {
  const theme = new URLSearchParams(location.search).get('theme');
  if (theme === 'dark' || theme === 'light') document.documentElement.dataset.theme = theme;
}
