import { staticHtml as html } from '@nisli/core/static';

const PALETTE = [
  { name: 'Paper',        token: '--color-bg',           light: '#faf8f5', dark: '#1a1a1a',  role: 'Page background — warm, not white' },
  { name: 'Ink',          token: '--color-text',          light: '#2d2a24', dark: '#e0ddd5',  role: 'Primary text — warm near-black' },
  { name: 'Deep Green',   token: '--color-link',          light: '#1a6b4e', dark: '#6ec9a8',  role: 'Links, CTAs, brand primary' },
  { name: 'Warm Gold',    token: '--color-accent-warm',   light: '#a88a2a', dark: '#e8c87a',  role: 'Essays — attention, warmth' },
  { name: 'Rust',         token: '--color-accent-rust',   light: '#b04a24', dark: '#c05a2e',  role: 'OSS Radar — urgency, signal' },
  { name: 'Blueprint',    token: '--color-accent-blue',   light: '#4a7a94', dark: '#5b8fa8',  role: 'Engineering — clarity, depth' },
  { name: 'Muted',        token: '--color-text-muted',    light: '#7a7568', dark: '#9a9589',  role: 'Secondary text, metadata' },
];

const TYPE_SAMPLES = [
  { meta: 'Lora 700 · Display',                 cls: 'dl-type-2xl',      text: 'Goga Koreli' },
  { meta: 'Lora 500 · Section title',            cls: 'dl-type-xl',       text: 'The Toolchain Is the Moat' },
  { meta: 'Lora 500 · Article heading',          cls: 'dl-type-lg',       text: 'Topologies of Thoughts' },
  { meta: 'Lora 400 italic · Pull quote',        cls: 'dl-type-lg dl-italic', text: 'A note when there is signal.' },
  { meta: 'Lora 400 · Body',                     cls: 'dl-type-base',     text: "There's a lot of hype and ambiguity out there about agentic engineering. This publication exists because we need honest, grounded writing about what it actually means to build with agents — the real principles, not the marketing." },
  { meta: 'Mono · Metadata, labels, kickers',    cls: 'dl-type-mono',     text: 'OSS RADAR · ISSUE #02 · APRIL 12, 2026' },
];

const SECTION_IDS = [
  { name: 'Essays',       accent: 'var(--section-essays)',      canvas: 'None — quiet',         mood: 'Literary · spacious · warm gold',         tags: ['personal', 'philosophy', 'attention'],    desc: 'More text-led. Quieter. More spacious. The reader should feel they entered a library.' },
  { name: 'Engineering',  accent: 'var(--section-engineering)', canvas: 'Flow mode',            mood: 'Structured · flow wave · blueprint blue',  tags: ['agents', 'builds', 'logs'],               desc: 'More structured. Code-tolerant. The canvas sweeps left-to-right — systematic, linear.' },
  { name: 'OSS Radar',   accent: 'var(--section-oss-radar)',   canvas: 'Threshold mode',       mood: 'Serialized · cascades · rust signal',       tags: ['oss', 'radar', 'curated'],                desc: 'Publication-like. Issue numbers. The canvas fires dopamine cascades — signal, urgency.' },
];

const PRINCIPLES = [
  { num: 'I',   title: 'Stable shell. Expressive interior.',   body: 'The publication shell — sidebar, nav, metadata, footer — stays calm and legible at all times. The body of each post is allowed to break pattern. This is where the artistic freedom lives. <em>The museum building gives orientation. The rooms can vary.</em>' },
  { num: 'II',  title: 'DRY for navigation. Not for art.',     body: 'Reuse the navigation system. Reuse the token system. Reuse the component language. But never apply DRY dogma to creative expression. <em>Every post can be its own art object. Every section can have its own atmosphere.</em>' },
  { num: 'III', title: 'One gradient. Many appearances.',      body: 'The brand gradient (Deep Green → Mint → Sky) appears only for identity marks: logo, sparkle separator, #tags. It is the chromatic signature of the publication. <em>Use it sparingly so it lands with weight.</em>' },
  { num: 'IV',  title: 'Section color = section mood.',        body: 'Each section has one accent color. Essays: Warm Gold. Engineering: Blueprint Blue. OSS Radar: Rust. These are not arbitrary — <em>they are emotional tones for different rooms of the museum.</em>' },
  { num: 'V',   title: 'One canvas mode per context.',         body: 'The neural canvas is the publication\'s life force. Each context gets its own mode. Threshold for OSS Radar (alive, unpredictable). Flow for Engineering (linear, systematic). The homepage stays quiet — it opens straight into the writing. <em>Each post can invent its own.</em>' },
  { num: 'VI',  title: 'Lora for thought. Mono for administration.', body: 'Lora, Georgia serif carries all editorial voice: headings, body, pull quotes. Monospace carries all metadata: dates, labels, tags, kickers, issue numbers. <em>Two voices, never more. The contrast itself is expressive.</em>' },
];

function Chapter({ num, title }: { num: string; title: string }) {
  return html`<div class="dl-chapter">
  <div class="dl-chapter-num"><img src="/icons/sparkle.svg" width="10" height="10" alt="">${num}</div>
  <h2 class="dl-chapter-title">${title}</h2>
</div>`;
}

function GradSep() {
  return html`<div class="separator"><img src="/icons/sparkle.svg" class="separator-icon" width="14" height="14" alt=""></div>`;
}

export function designLanguagePage() {
  return html`<div class="dl-page">

  <div class="dl-header">
    <div class="dl-grad-rule"></div>
    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem">
      <img src="/icons/logo.svg" width="32" height="32" alt="">
      <div>
        <div class="dl-eyebrow">gkoreli.com</div>
        <h1 class="dl-title">Design Language</h1>
      </div>
    </div>
    <p class="dl-subtitle">The substrate of a personal publication. One author, many forms, one sensibility. A web museum collective wearing a publication's clothes.</p>
  </div>

  ${Chapter({ num: '01', title: 'Palette' })}
  <p class="dl-body-note">A warm cream base — not white, not gray. Semantic accent colors per section. All tokens have dark equivalents. The palette is restrained so the brand gradient carries weight when it appears.</p>
  <div class="dl-palette">
    ${PALETTE.map(sw => html`<div class="dl-swatch">
      <div class="dl-swatch-chip" style="background:${sw.light};border:${sw.name === 'Paper' ? '1px solid var(--color-border)' : 'none'}"></div>
      <div class="dl-swatch-name">${sw.name}</div>
      <div class="dl-swatch-token">${sw.token}</div>
      <div class="dl-swatch-hex">${sw.light} / ${sw.dark}</div>
      <div class="dl-swatch-role">${sw.role}</div>
    </div>`)}
  </div>

  ${GradSep()}

  ${Chapter({ num: '02', title: 'Typography' })}
  <p class="dl-body-note">Two typefaces only. <strong>Lora</strong> carries all editorial voice. <strong>Monospace</strong> carries all administrative metadata. The contrast between them is itself expressive.</p>
  <div class="dl-type-samples">
    ${TYPE_SAMPLES.map(s => html`<div class="dl-type-row">
      <div class="dl-type-meta">${s.meta}</div>
      <div class="${s.cls}">${s.text}</div>
    </div>`)}
    <div class="dl-type-row">
      <div class="dl-type-meta">Mono · Tags and tokens</div>
      <div class="dl-tag-sample">
        ${['agents', 'context', 'toolchain'].map(t => html`<span class="tag">${t}</span>`)}
      </div>
    </div>
  </div>

  ${GradSep()}

  ${Chapter({ num: '03', title: 'Surfaces' })}
  <div class="dl-surface-demo">
    <div class="dl-surface-cell">
      <div class="glass-panel dl-glass-example">
        <h3>Glass panel</h3>
        <p>Used for featured cards and elevated surfaces. Backdrop blur + sage wash gives it depth.</p>
      </div>
      <div class="dl-surface-label">Glass — <code>glass-panel</code></div>
    </div>
    <div class="dl-surface-cell">
      <div class="dl-flat-example">
        <h3>Flat surface</h3>
        <p>Used for section archive cards, code blocks, and supporting UI. No blur.</p>
      </div>
      <div class="dl-surface-label">Flat — <code>--color-surface</code></div>
    </div>
  </div>

  ${GradSep()}

  ${Chapter({ num: '04', title: 'Brand Gradient' })}
  <p class="dl-body-note">Reserved exclusively for identity marks. Logo, sparkle separator, #tag hashes. Use sparingly so it lands with weight.</p>
  <div class="dl-grad-strip"></div>
  <div class="dl-grad-stops">
    ${[['#1a6b4e', 'Deep Green'], ['#6ec9a8', 'Mint'], ['#93c5fd', 'Sky']].map(([hex, label]) => html`<div class="dl-grad-stop">
      <div class="dl-grad-stop-dot" style="background:${hex}"></div>
      <div class="dl-grad-stop-label">${label}<br>${hex}</div>
    </div>`)}
  </div>
  <div class="dl-grad-usage">
    ${[['Logo mark', 'The masked gk letterform'], ['Sparkle separator', 'Between content sections'], ['#tag hashes', 'Before every tag token'], ['Brand moments', 'Deliberate, never decorative']].map(([title, desc]) => html`<div class="dl-grad-use"><strong>${title}</strong>${desc}</div>`)}
  </div>

  ${GradSep()}

  ${Chapter({ num: '05', title: 'Canvas Moods' })}
  <p class="dl-body-note">The neural canvas is the publication's life force. Two modes, each assigned to a context — never repeated across the same page type.</p>
  <div class="dl-canvas-demos">
    <div class="dl-canvas-cell">
      <div class="dl-canvas-header">
        <span class="dl-canvas-label">Threshold</span>
        <span class="dl-canvas-page">OSS Radar</span>
      </div>
      <div class="dl-canvas-wrap">
        <nisli-neural-canvas mode="threshold"></nisli-neural-canvas>
      </div>
      <div class="dl-canvas-desc">Alive, unpredictable. Nodes charge up and fire dopamine cascades. Represents the chaotic emergence of ideas.</div>
    </div>
    <div class="dl-canvas-cell">
      <div class="dl-canvas-header">
        <span class="dl-canvas-label">Flow</span>
        <span class="dl-canvas-page">Engineering</span>
      </div>
      <div class="dl-canvas-wrap">
        <nisli-neural-canvas mode="flow"></nisli-neural-canvas>
      </div>
      <div class="dl-canvas-desc">Linear, systematic. A wave sweeps left-to-right, lighting nodes as it passes. Represents methodical construction.</div>
    </div>
  </div>

  ${GradSep()}

  ${Chapter({ num: '06', title: 'Motifs' })}
  <p class="dl-body-note">Recurring visual signatures that appear across every page. Use them consistently — their power comes from repetition.</p>
  <div class="dl-motifs">
    <div class="dl-motif-cell">
      <div class="dl-motif-display">
        <img src="/icons/sparkle.svg" width="28" height="28" alt="">
      </div>
      <div class="dl-motif-name">Sparkle</div>
      <p class="dl-motif-desc">Brand gradient sparkle. Lives inside every gradient separator and marks the center of section divisions.</p>
    </div>
    <div class="dl-motif-cell">
      <div class="dl-motif-display">
        <div class="separator" style="width:100%"><img src="/icons/sparkle.svg" class="separator-icon" width="14" height="14" alt=""></div>
      </div>
      <div class="dl-motif-name">Gradient separator</div>
      <p class="dl-motif-desc">Fading green lines converging on the sparkle. Marks section transitions throughout the publication.</p>
    </div>
    <div class="dl-motif-cell">
      <div class="dl-motif-display">
        <img src="/icons/logo.svg" width="32" height="32" alt="">
      </div>
      <div class="dl-motif-name">Logo mark</div>
      <p class="dl-motif-desc">Gradient gk letterform. Brand gradient masked through the letterform — the only other application of the gradient besides tags.</p>
    </div>
  </div>

  ${GradSep()}

  ${Chapter({ num: '07', title: 'Section Identities' })}

  <p class="dl-body-note">Three sections — three emotional tones. Each has one accent color. The color appears in kickers, section headers, page hero rules, and canvas banner borders.</p>
  <div class="dl-section-ids">
    ${SECTION_IDS.map(s => html`<div class="dl-sid">
      <div class="dl-sid-rule" style="background:${s.accent}"></div>
      <div class="dl-sid-label" style="color:${s.accent}">${s.name}</div>
      <div class="dl-sid-name">${s.mood}</div>
      <div class="dl-sid-canvas">Canvas: ${s.canvas}</div>
      <p class="dl-sid-desc">${s.desc}</p>
      <div class="dl-sid-tags">${s.tags.map(t => html`<span class="dl-sid-tag" style="border-color:${s.accent};color:${s.accent}">${t}</span>`)}</div>
    </div>`)}
  </div>

  ${GradSep()}

  ${Chapter({ num: '08', title: 'Philosophy' })}
  <p class="dl-body-note">Six principles that guide every design decision in this publication. The north star: <em>"The site should feel like a well-organized publication, even when each piece feels like a one-off artwork."</em></p>
  <div class="dl-principles">
    ${PRINCIPLES.map(p => html`<div class="dl-principle">
      <div class="dl-principle-num">${p.num}</div>
      <div class="dl-principle-title">${p.title}</div>
      <p class="dl-principle-body">${p.body}</p>
    </div>`)}
  </div>

</div>`;
}
