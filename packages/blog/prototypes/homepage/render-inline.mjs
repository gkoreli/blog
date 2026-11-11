import { readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { concepts } from './concepts.mjs';

const source = import.meta.dirname;
const blog = resolve(source, '../..');
const destination = process.argv[2];
const refinements = process.argv.includes('--refinements');
const interaction = process.argv.includes('--interaction-study');
const focusedReview = refinements || interaction;
if (!destination) throw new Error('Pass the destination HTML fragment path.');
const [template, baseline, logo, homeStyles, conceptStyles, lensScript, invitationStyles, previousStyles, arrow, previousMarkup] = await Promise.all([
  readFile(join(source, 'inline-fragment.html'), 'utf8'),
  readFile(join(blog, 'dist/index.html'), 'utf8'),
  readFile(join(blog, 'public/icons/logo.svg'), 'utf8'),
  readFile(join(blog, 'src/styles/home.css'), 'utf8'),
  readFile(join(source, 'concepts.css'), 'utf8'),
  readFile(join(source, 'concepts.js'), 'utf8'),
  readFile(join(blog, 'src/styles/home-tools-invitation.css'), 'utf8'),
  readFile(join(source, 'previous-inline.css'), 'utf8'),
  readFile(join(blog, 'public/icons/arrow-right.svg'), 'utf8'),
  readFile(join(source, 'previous-inline.html'), 'utf8'),
]);
const cover = baseline.match(/<a\b[^>]*class="cover"[\s\S]*?<\/a>/)?.[0];
const stream = baseline.match(/<a\b[^>]*class="stream-item"[\s\S]*?<\/a>/)?.[0];
if (!cover || !stream) throw new Error('Build the publication homepage before exporting the studies.');

const invitation = baseline.match(/<section class="home-tools-invitation"[\s\S]*?<\/section>/)?.[0];
if (focusedReview && !invitation) throw new Error('Build the selected invitation before exporting refinements.');
const refinedContent = invitation?.replace(/<span class="home-tools-arrow"[^>]*><\/span>/, () => arrow.replace('<svg ', '<svg class="home-tools-arrow" aria-hidden="true" '));
const previousContent = previousMarkup.replace(/<span class="study-previous-tools-arrow"[^>]*><\/span>/, () => arrow.replace('<svg ', '<svg class="study-previous-tools-arrow" aria-hidden="true" '));
const choices = interaction ? [
  { label: 'Refined inline', content: refinedContent },
  { label: 'Previous target', content: previousContent },
] : refinements ? [
  { label: 'Compact invitation', content: previousContent.replace(' study-previous-tools-invitation-inline', '') },
  { label: 'Inline invitation', content: previousContent },
] : concepts.map((concept, index) => ({ label: ['Field kit', 'Tool shelf', 'Interactive lens'][index], content: concept.content }));
const linkToPublication = (markup) => markup.replaceAll(/href="\/(?!\/)([^"\s]*)"/g, 'href="https://gkoreli.com/$1" target="_blank" rel="noopener"');
const studies = choices.map((concept, index) => {
  const mark = logo.replace('<svg ', '<svg aria-hidden="true" ').replaceAll('logo-g', `logo-${index}`).replaceAll('id="m"', `id="logo-mask-${index}"`).replaceAll('url(#m)', `url(#logo-mask-${index})`);
  const latest = stream.replace(/<p class="stream-desc">[\s\S]*?<\/p>/, '');
  const content = focusedReview ? concept.content.replaceAll('home-tools-heading', `home-tools-review-${index}`).replaceAll('study-previous-tools-heading', `previous-tools-review-${index}`) : concept.content;
  return `<section class="study-stage" data-variant="${concept.label}" aria-label="${concept.label} homepage concept"${index ? ' hidden' : ''}>
      <div class="study-screen">
        <div class="study-masthead">${mark}<span>gkoreli.com</span></div>
        <div class="study-context">${linkToPublication(cover + content)}<div class="stream">${linkToPublication(latest)}</div></div>
      </div>
    </section>`;
}).join('\n    ');

// The actual homepage declares 18px on html. Keep the same scale inside the preview.
const localScale = (css) => css.replaceAll(/(-?(?:\d+\.?\d*|\.\d+))rem\b/g, (_, n) => `${Number((Number(n) * 18).toFixed(2))}px`);
const previewStyles = focusedReview ? invitationStyles + '\n' + previousStyles + '\n.home-tools-arrow, .study-previous-tools-arrow { background: none; }\n.home-tools-invitation, .study-previous-tools-invitation { --invitation-radius: var(--gk-study-radius, 12px); border-radius: var(--gk-study-radius, 12px); }\n@media (max-width: 480px) { .study-previous-tools-invitation { margin-top: 1.6rem; } }' : conceptStyles;
const targetStyles = interaction ? '#gk-home-studies.show-hit-targets .home-tools-action::after { background: color-mix(in srgb, var(--color-link) 17%, transparent); }\n#gk-home-studies.show-hit-targets .study-previous-tools-action { background: color-mix(in srgb, var(--color-link) 17%, transparent); }' : '';
const output = (focusedReview ? template.replace('min-block-size: 770px', 'min-block-size: 620px').replace('min-block-size: 850px', 'min-block-size: 720px').replace("theme: 'Match chat', radius: 14", "theme: 'Match chat', radius: 12, targets: false") : template)
  .replace('<!-- STUDIES -->', () => studies)
  .replace('/* HOME_STYLES */', () => localScale(homeStyles))
  .replace('/* CONCEPT_STYLES */', () => localScale(previewStyles)
    .replaceAll(/@media \(max-width: (\d+)px\)/g, '@container gk-prototype (max-width: $1px)')
    .replace('--study-radius: 14px;', '--study-radius: var(--gk-study-radius, 14px);'))
  .replace('/* TARGET_STYLES */', () => targetStyles)
  .replace('/* TARGET_RENDER */', () => interaction ? "product.classList.toggle('show-hit-targets', appearance.targets);" : '')
  .replace('/* TARGET_CONTROL */', () => interaction ? "tweak.addToggle(appearance, 'targets', { label: 'Show click target' });" : '')
  .replace('/* LENS_SCRIPT */', () => lensScript.split('// Preview controls')[0]);
await writeFile(destination, output);
