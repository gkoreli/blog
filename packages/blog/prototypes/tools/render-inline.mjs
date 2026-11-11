import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { concepts } from './concepts.mjs';
import { refinements } from './refinements.mjs';

const source = import.meta.dirname;
const destination = process.argv[2];
const compact = process.argv.includes('--compact');
if (!destination) throw new Error('Pass the inline preview destination.');
const [template, styles, script, logo] = await Promise.all([
  readFile(join(source,'inline-fragment.html'),'utf8'),
  readFile(join(source,'concepts.css'),'utf8'),
  readFile(join(source,'concepts.js'),'utf8'),
  readFile(resolve(source,'../../public/icons/logo.svg'),'utf8'),
]);
const publicLinks = content => content.replaceAll(/href="\/(?!\/)([^"\s]*)"/g,'href="https://gkoreli.com/$1" target="_blank" rel="noopener"');
const choices = compact ? refinements : ['library','workbench','guided'].map(id=> {
  const found = concepts.find(concept=>concept.id===id);
  if (!found) throw new Error(`Unknown concept: ${id}`);
  return found;
});
const studies = choices.map((concept,index)=> {
  const mark = logo.replaceAll('logo-g',`tools-logo-${index}`).replaceAll('id="m"',`id="tools-mask-${index}"`).replaceAll('url(#m)',`url(#tools-mask-${index})`).replace('<svg ','<svg aria-hidden="true" ');
  const brand = `<a class="study-brand" href="https://gkoreli.com/" target="_blank" rel="noopener">${mark}gkoreli.com</a>`;
  const mobileBrand = brand.replaceAll(`tools-logo-${index}`,`tools-mobile-logo-${index}`).replaceAll(`tools-mask-${index}`,`tools-mobile-mask-${index}`);
  const navigation = [['Home','/'],['Essays','/essays'],['Engineering','/engineering'],['OSS Radar','/oss-radar'],['Tools','/tools'],['About','/about'],['Stats','/stats']].map(([label,path])=>`<a href="https://gkoreli.com${path}" target="_blank" rel="noopener"${label==='Tools'?' aria-current="page"':''}>${label}</a>`).join('');
  return `<section data-variant="${concept.label}"${index?' hidden':''} aria-label="${concept.label} tools prototype"><div class="study-product"><aside class="study-sidebar">${brand}<p>Where excitement ends,<br>depth begins.</p><nav aria-label="Publication">${navigation}</nav></aside><div class="study-body"><div class="study-mobile-brand">${mobileBrand}</div>${publicLinks(concept.content)}</div></div></section>`;
}).join('\n');
const extraStyles = compact ? await readFile(join(source,'navigation-choices.css'),'utf8') : '';
let output = template.replace('<!-- STUDIES -->',()=>studies)
  .replace('/* PRODUCT_STYLES */',()=>(styles+'\n'+extraStyles).replaceAll('.tool-study','#gk-tools-studies .tool-study'))
  .replace('/* PRODUCT_SCRIPT */',()=>compact?'':script)
  .replace('/* DESIGN_DEFAULTS */',()=>compact?'radius: 10, padding: 16, drawings: true':'radius: 12')
  .replace('/* RADIUS_CONTROL */',()=>compact?'':"tweak.addSlider(appearance,'radius',{label:'Corner radius',min:0,max:20,unit:'px'});")
  .replace('/* DESIGN_RENDER */',()=>compact?"product.querySelectorAll('.nc-library').forEach(library=>{ library.style.setProperty('--nc-padding',`${appearance.padding}px`); library.classList.toggle('nc-hide-art',!appearance.drawings); });":'')
  .replace('/* DESIGN_CONTROLS */',()=>compact?"tweak.addSlider(appearance,'padding',{label:'Choice padding',min:12,max:24,unit:'px'}); tweak.addToggle(appearance,'drawings',{label:'Small illustrations'});":'');
if (compact) output = output
  .replaceAll('gk-tools-studies','gk-tools-compact-studies')
  .replace('min-height: 1240px','min-height: 1040px')
  .replace('min-height: 1440px','min-height: 1250px')
  .replace('min-height: 1320px','min-height: 1250px')
  .replaceAll('min-height: 1850px','min-height: 1450px');
await writeFile(destination,output);
console.log(`Inline preview: ${destination}`);
