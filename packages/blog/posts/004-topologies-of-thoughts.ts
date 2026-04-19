import { staticHtml as html } from '@nisli/core/static';
import type { PostMeta } from '../src/lib/frontmatter.js';
import { TopoHero, SectionNum, Insight, ScrollReveal, TopoDiagram, PullQuote, SectionBreak, Footnotes } from '../src/templates/components.js';

export const meta: PostMeta = {
  title: 'Topologies of Thoughts',
  date: '2026-03-31',
  description: "On Kat Zhang's obsidian note network, the GitHub ecosystem around it, and what graph neuroscience says about the shape of minds",
  section: 'engineering' as const,
  tags: ['research', 'knowledge-graphs', 'neuroscience', 'obsidian', 'embeddings'],
  layout: 'immersive',
  slug: 'topologies-of-thoughts',
};

export function preamble() {
  return TopoHero({ kicker: 'Research Essay · Computational Cognition · Personal Knowledge Systems', title: html`<h1>Topologies of <em>Thoughts</em></h1>`, byline: html`<p class="topo-byline">On Kat Zhang's obsidian note network, the GitHub ecosystem around it,<br>and what graph neuroscience says about the shape of minds</p>` });
}

export function article() {
  return html`
<article class="post-content">
  <!-- § 0 — THE ACTUAL PROJECT -->
  ${ScrollReveal({ content: html`
    ${SectionNum({ label: '§ 0 — The Source Work' })}
    <h2>What Kat Zhang actually built</h2>
    <p>
      Before any theorizing, it's worth being precise about the project. <strong>the.poet.engineer</strong> — Kat Zhang, a Brooklyn-based media artist, engineer, and researcher at Gray Area — extracted embeddings from her personal <strong>Obsidian vault</strong>, then rendered those embeddings as an interactive 3D network inside TouchDesigner, across three distinct topologies. Her X post describes the three modes exactly:
    </p>

    <div class="code-block">
<span class="cm">// The actual three topologies, verbatim from @poetengineer__ :</span><br><br>
<span class="kw">centralized</span>:  one core idea connecting all<br>
<span class="kw">decentralized</span>: notes cluster into themed hubs<br>
<span class="kw">distributed</span>:   edges labeled by LLM describing how ideas connect
    </div>

    <p>
      Kat then followed up with a technical thread that is more revealing than the demo itself. The full quote deserves reading carefully:
    </p>

    ${PullQuote({ content: html`"what's not obvious from the hand tracking demo: it's actually a hybrid approach of both using the embeddings of the notes and asking llms to try to make sense of the calculations. for example, the medoid note i got from embeddings and what llm deemed as the central note are actually different, and yet both are about the evolution of interfaces; used clustering to categorize the notes and had llm name the categories articulated what these notes are about; i think the last one is the most interesting, aka using k-nn to build edges among notes and then have llms to make sense of how exactly the notes are connected."`, cite: '— @poetengineer__, 2/18/26, ~600K impressions' })}

    <p>
      This thread reveals three things the demo obscures: (1) the pipeline is a deliberate <em>hybrid</em> — embeddings and LLMs doing different jobs, not one replacing the other; (2) the centrality question has two answers that disagree (the geometric medoid vs. the LLM's semantic judgment), and that disagreement is itself data; (3) Kat considers the k-NN + LLM edge labeling the most interesting part — a ranking that shapes how we should read the whole project.
    </p>
    <p>
      The Jupyter notebook code is available to her subscribers, meaning the pipeline is <em>reproducible Python</em> running on standard ML libraries — not a TouchDesigner magic trick. TouchDesigner is purely the renderer.
    </p>
    <p>
      Kat describes her broader practice at Gray Area as investigating "how computation can reveal the unconscious and poetic aspects of the human and machine psyche." This project sits squarely in that lineage. It's not a productivity tool. It's a computational self-portrait — one that can disagree with itself about who you are.
    </p>
  ` })}

  ${SectionBreak()}

  <!-- § 1 — THE PIPELINE -->
  ${ScrollReveal({ content: html`
    ${SectionNum({ label: '§ 1 — The Technical Pipeline' })}
    <h2>From markdown to <em>geometry</em></h2>
    <p>
      The project follows a pipeline that's now emerging as a small standard in the personal knowledge management (PKM) ecosystem. Understanding each step reveals where the interesting design decisions live.
    </p>

    <h3>Step 1: Text → Vector (Embedding)</h3>
    <p>
      Each note in the Obsidian vault is fed to an embedding model — likely OpenAI's <code>text-embedding-3-small</code> or similar — which maps it to a point in a high-dimensional space (typically 1,536 dimensions). Notes that discuss related concepts land near each other; unrelated notes are geometrically distant.
    </p>

    <div class="code-block">
<span class="cm">// Pseudocode: embedding pipeline for a vault</span><br><br>
<span class="kw">for</span> note <span class="kw">in</span> vault.all_notes():<br>
&nbsp;&nbsp;text = note.content<br>
&nbsp;&nbsp;vec = <span class="fn">openai.embed</span>(text)  <span class="cm">// → ℝ¹⁵³⁶</span><br>
&nbsp;&nbsp;store[note.id] = vec<br><br>
<span class="cm">// Similarity between notes i and j:</span><br>
sim(i, j) = <span class="fn">dot</span>(store[i], store[j]) / (<span class="fn">norm</span>(store[i]) · <span class="fn">norm</span>(store[j]))
    </div>

    <h3>Step 2: 1,536D → 3D (Dimensionality Reduction)</h3>
    <p>
      To render in TouchDesigner, the embeddings need to collapse to 3 coordinates. UMAP (Uniform Manifold Approximation and Projection) is the standard choice here — it preserves local neighborhood structure better than PCA and is far faster than t-SNE at scale. The key parameters: <code>n_neighbors</code> controls how local vs. global the projection is; <code>min_dist</code> controls cluster tightness.
    </p>

    ${Insight({ label: 'Critical insight', content: html`<p>The UMAP projection is not a "view" of the original space — it is a <em>lossy interpretation</em> of it. Two choices of <code>n_neighbors</code> on the same vault will produce structurally different visualizations, both equally "valid." The topology you see is partly your mind, partly your algorithm choices. This interpretive gap is where art enters engineering.</p>` })}

    ${Insight({ label: 'The two-space problem', content: html`<p>UMAP is run twice with different configurations: once to 3D for TouchDesigner rendering, and again to a higher dimension for clustering. These two projections are <em>stochastic and inconsistent with each other</em> — a note's visual position in 3D does not reliably reflect its cluster membership determined in the other space. The visualization lies in a specific way: a note that appears isolated on screen may have strong semantic edges, because UMAP distorted the distances to make the picture prettier. The edges tell the truth; the positions are an approximation. Nobody has solved the problem of a single projection that is simultaneously optimal for visualization and for clustering.</p>` })}

    <h3>Step 3: The Medoid — and why it disagrees with the LLM</h3>
    <p>
      Before building edges, there's a prior question: what is the <em>center</em> of your thought? The embedding approach gives a precise answer: the <strong>medoid</strong> — the note whose embedding vector minimizes total distance to all other notes. Crucially, unlike a computed average (which would produce a phantom vector corresponding to no real note), the medoid is always an <em>actual note you wrote</em>. You can read it.
    </p>
    <p>
      The distinction matters. The "average" of your notes would be a meaningless blur of all your topics at once — a document nobody wrote. The medoid is the note that, on average, is closest to every other note in your vault. It is the note with the most <em>reach</em> — the one that could most plausibly talk to everything else you've written. It is your intellectual center of gravity, revealed by geometry rather than chosen by intention.
    </p>
    <p>
      This is the uncanny part: you never decide what your medoid is. Kat never chose "the evolution of interfaces" as her central theme. The mathematics found it. The medoid is a mirror that shows you something about your own thinking that you didn't put there deliberately — the unconscious thesis of a body of work.
    </p>
    <p>
      Kat then discovered that the medoid and the LLM's judgment of "central note" were <em>different notes</em> — and yet both were about the evolution of interfaces. This is not a failure. It is the interesting result. The geometric center and the semantic center of a mind can diverge. The medoid captures where most of your thinking <em>lives</em>; the LLM captures what most of your thinking <em>refers back to</em>. A person could have a medoid in "productivity systems" — because they wrote about it constantly — but an LLM center in "self-worth" — because that concept threads invisibly through everything else.
    </p>

    ${Insight({ label: 'Key finding', content: html`<p>When two methods for finding the "center" of a corpus produce different answers, the gap between them is where the research is. A mind can have a different center of gravity depending on how you measure gravity. The medoid is statistical; the LLM center is interpretive. Both are real. Their disagreement is data.</p>` })}

    <h3>Step 4: k-NN edge construction + LLM labeling</h3>
    <p>
      For the distributed topology, edges are built using <strong>k-nearest neighbors</strong> in the original high-dimensional embedding space. Each note connects to its k most similar notes by cosine distance. Then an LLM articulates <em>how</em> those neighbors relate — generating a relationship sentence that exists in neither note. Kat explicitly called this the most interesting part of the whole project.
    </p>

    <h3>Step 5: Clustering + LLM naming (decentralized topology)</h3>
    <p>
      The vault is partitioned into clusters (likely k-means or HDBSCAN on UMAP coordinates), and an LLM names each cluster based on its member notes. The hand-tracking interface in TouchDesigner lets you navigate this physically — pointing at clusters to reveal their LLM-generated names. TouchDesigner is purely the renderer; the pipeline is Python, available as a Jupyter notebook to subscribers.
    </p>
  ` })}

  <!-- TOPOLOGY DIAGRAMS -->
  ${ScrollReveal({ content: html`
    <div class="topo-row">
      <div class="topo-cell">
        ${TopoDiagram({ mode: 'centralized' })}
        <div class="topo-label"><strong>Centralized</strong>one hub → all nodes<br>star topology</div>
      </div>
      <div class="topo-cell">
        ${TopoDiagram({ mode: 'decentralized' })}
        <div class="topo-label"><strong>Decentralized</strong>themed clusters<br>with local hubs</div>
      </div>
      <div class="topo-cell">
        ${TopoDiagram({ mode: 'distributed' })}
        <div class="topo-label"><strong>Distributed</strong>edges labeled by LLM<br>no hierarchy</div>
      </div>
    </div>

    <p>
      Each topology makes a different <em>claim about what thought is</em>. Centralized says thinking is convergent — all roads lead to a thesis. Decentralized says thinking is modular — islands of expertise with bridges. Distributed says thinking is relational — the connections themselves are the content, and an LLM needs to name them because you haven't consciously articulated them yet.
    </p>
  ` })}

  ${SectionBreak()}

  <!-- § 2 — LLM EDGE LABELING -->
  ${ScrollReveal({ content: html`
    ${SectionNum({ label: '§ 2 — The LLM Edge' })}
    <h2>The most interesting part nobody is <em>talking about</em></h2>
    <p>
      The distributed topology has a feature that deserves its own section: <strong>edges are labeled by an LLM describing how ideas connect</strong>. This is not a visualization trick. It is a fundamentally different epistemological move.
    </p>
    <p>
      In a standard knowledge graph, edges are either explicit (you made a wikilink) or implicit (cosine similarity exceeded a threshold). Both approaches treat connection as a binary: related or not. The LLM edge label introduces a <em>third kind of connection</em>: the <strong>articulated relationship</strong>.
    </p>

    ${PullQuote({ content: html`The connection between two notes is not just a similarity score. It is a sentence. And that sentence can surprise you with what it says.`, cite: '— synthesis of distributed topology logic' })}

    <p>
      Concretely: if note A is about "creative block" and note B is about "ADHD hyperfocus", a cosine similarity edge just says "0.74 related." An LLM edge label might say <em>"Both explore the relationship between attention dysregulation and creative output — but from opposite poles of productivity."</em> That sentence is itself a new idea, not present in either note.
    </p>

    ${Insight({ label: 'Research direction', content: html`<p>The LLM edge label is a form of <strong>abductive inference over a personal corpus</strong>. It is asking: given two observations (notes), what is the most plausible theory of their connection? This is structurally identical to what scientists do when linking experimental results to hypotheses — and it could be formalized as such.</p>` })}
  ` })}

  ${SectionBreak()}

  <!-- § 3 — GITHUB ECOSYSTEM -->
  ${ScrollReveal({ content: html`
    ${SectionNum({ label: '§ 3 — The GitHub Ecosystem' })}
    <h2>What the open-source community built <em>around this problem</em></h2>
    <p>
      Kat's project sits in a rapidly growing ecosystem of tools solving adjacent parts of the same problem. Understanding the landscape reveals what is solved, what is unsolved, and where the research frontier actually is.
    </p>

    <div class="ecosystem">

      <div class="eco-row">
        <div class="eco-name">
          <a href="https://github.com/suniyao/obsidian-graphene" target="_blank">obsidian-graphene</a><br>
          <span class="eco-tag">plugin</span><span class="eco-tag">semantic</span>
        </div>
        <div class="eco-desc">
          Adds dotted-line edges between notes based on embedding similarity, overlaid on Obsidian's standard wikilink graph. Hybrid visualization — explicit links (solid) + semantic similarity (dotted). Uses Ollama locally or OpenAI. Lets you tune similarity thresholds in real-time. <em>Gap: 2D only, no topology switching, no edge labeling.</em>
        </div>
      </div>

      <div class="eco-row">
        <div class="eco-name">
          <a href="https://github.com/Crispigt/Plot-Obsidian-by-Topics" target="_blank">Plot-Obsidian-by-Topics</a><br>
          <span class="eco-tag">UMAP</span><span class="eco-tag">BERTopic</span><span class="eco-tag">LLM-labels</span>
        </div>
        <div class="eco-desc">
          The closest open-source equivalent to Kat's pipeline: runs Qwen3 embeddings → UMAP → BERTopic clustering → LLM-generated topic titles → interactive 2D HTML map. Click any point to open it in Obsidian. Nodes sized by note length. <em>Gap: 2D, no topology comparison, no edge labels between individual notes.</em>
        </div>
      </div>

      <div class="eco-row">
        <div class="eco-name">
          <a href="https://github.com/AlexW00/obsidian-3d-graph" target="_blank">obsidian-3d-graph</a><br>
          <span class="eco-tag">3D</span><span class="eco-tag">force-directed</span>
        </div>
        <div class="eco-desc">
          Renders Obsidian's link graph in 3D using three-forcegraph. Gets the 3D right but uses only explicit wikilinks — no semantic embeddings, no LLM layer. The visual aesthetic closest to Kat's project, but missing the embedding-derived spatial positioning that makes it meaningful.
        </div>
      </div>

      <div class="eco-row">
        <div class="eco-name">
          <a href="https://github.com/Jinstronda/obsidianGraphRAG" target="_blank">obsidianGraphRAG</a><br>
          <span class="eco-tag">graph-RAG</span><span class="eco-tag">Gemini</span><span class="eco-tag">local</span>
        </div>
        <div class="eco-desc">
          Combines vector search with graph traversal for question-answering over a vault. Five query modes: hybrid, local, global, naive, mix. Uses local GPU embeddings (Gemma 308M) + local reranker (BGE v2-m3) + Gemini API for answers. Tracks file hashes for incremental updates. <em>Treats the graph as retrieval infrastructure, not a visualization object.</em>
        </div>
      </div>

      <div class="eco-row">
        <div class="eco-name">
          <a href="https://infranodus.com" target="_blank">InfraNodus</a><br>
          <span class="eco-tag">betweenness</span><span class="eco-tag">gap-detection</span><span class="eco-tag">commercial</span>
        </div>
        <div class="eco-desc">
          The most analytically sophisticated tool in the space. Computes betweenness centrality across notes, surfaces structural gaps (clusters that should be connected but aren't), and uses AI to generate research questions that bridge those gaps. Conceptually adjacent to what Kat's LLM edge labeling does — but as a diagnostic rather than an aesthetic object.
        </div>
      </div>

    </div>

    ${Insight({ label: 'The gap no one has closed', content: html`<p>Every GitHub project above solves one layer: embedding OR 3D visualization OR LLM labeling OR graph analytics. Kat's project is the only one combining all four <em>and</em> making topology-switching itself the primary variable. The open-source space has the ingredients but not the composition.</p>` })}
  ` })}

  ${SectionBreak()}

  <!-- § 4 — BRAIN NETWORKS -->
  ${ScrollReveal({ content: html`
    ${SectionNum({ label: '§ 4 — Neuroscience Grounding' })}
    <h2>What brain network science says about<br>the <em>right topology</em></h2>
    <p>
      The choice to render thoughts as three topologies isn't just aesthetic. There is a 30-year literature in cognitive neuroscience doing exactly this — mapping brain regions as nodes, functional connections as edges, and analyzing the resulting topology for what it predicts about cognition. That literature has something specific to say about each of Kat's three modes.
    </p>

    <h3>The centralized topology is neurologically naive</h3>
    <p>
      Kat's centralized view — one core idea connecting all — creates a star graph. In brain network terms, this is the worst possible topology for cognition. It forces every signal through a single hub, creating long path lengths everywhere except through the center. Real brains don't work this way. They exhibit <strong>small-world topology</strong>: dense local clusters connected by a handful of long-range hub nodes. This structure minimizes average path length while maintaining local specialization — and shorter path length correlates with higher performance on working memory tasks. The centralized topology is useful as a diagnostic (what is the center?) but as a model of how thought actually works, the neuroscience says it's wrong.
    </p>

    <h3>The distributed topology is closest to how brains are wired</h3>
    <p>
      Kat's distributed view — k-NN edges with LLM labels, no hierarchy — most closely approximates the small-world structure that real cognitive networks exhibit. But it's missing something the neuroscience considers essential: <strong>betweenness centrality</strong>. In brain networks, nodes with high betweenness sit on the shortest path between many other node pairs — they are structural bridges. Remove them and the network fragments. These hub nodes correspond to the default mode network and prefrontal cortex — regions associated with creativity, working memory, and insight. Applied to a personal note graph: the notes with highest betweenness are not your most-written-about topics. They are the concepts that <em>connect your intellectual domains</em>. A 400-word note on "systems thinking" might be the most structurally important note in a vault because it bridges engineering and philosophy. Kat's pipeline computes the medoid but not betweenness centrality — and the two would likely disagree, producing a third kind of "center" that neither the medoid nor the LLM captures.
    </p>

    <h3>The decentralized topology predicts where new ideas live</h3>
    <p>
      Kat's decentralized view — clustered hubs — maps directly onto what neuroscience calls <strong>modular organization</strong>. Brain networks are modular: densely connected communities with sparse bridges between them. The <strong>participation coefficient</strong> of a node measures how many of its connections cross community boundaries. Nodes with high participation are integrators — and in the neuroscience literature, these cross-boundary nodes are where the most generative cognitive work happens. In a personal vault, these are the notes that connect your clusters to each other. The decentralized topology makes them visible. But it also reveals the inverse: notes with zero participation — the orphans that belong to no cluster. The neuroscience treats these as noise. Section 5 argues they might be the most interesting notes in the vault.
    </p>

    ${PullQuote({ content: html`Better intellectual performance was associated with shorter characteristic path length and higher nodal centrality of hub regions in the salience network.`, cite: '— Farahani et al., Frontiers in Neuroscience (2019), reviewing van den Heuvel et al.' })}
  ` })}

  ${SectionBreak()}

  <!-- § 5 — ADJACENT PROBLEM SPACE -->
  ${ScrollReveal({ content: html`
    ${SectionNum({ label: '§ 5 — Adjacent Problem Space' })}
    <h2>The problems <em>this project opens</em></h2>

    <h3>1. The temporal connectome</h3>
    <p>
      Kat's project treats the vault as a static snapshot. But thought evolves. If you embed notes with timestamps and visualize the trajectory of cluster centroids over time, you get a <strong>temporal connectome of the self</strong> — a record of how your obsessions form, peak, drift, and dissolve. The note on "grief" that was a cluster center in 2021 may have merged into a broader "impermanence" cluster by 2024. This is autobiography as graph dynamics.
    </p>

    <h3>2. Prompted image generation isn't creating in the medium of AI</h3>
    <p>
      Kat said this explicitly on Threads: <em>"prompted image generation, which represents most of the AI art we see, isn't really creating in the medium of AI."</em> Her note visualization project is the enacted counterargument. She is using AI (the embedding model, the LLM edge labeler) not as an image generator, but as a <strong>cognitive prosthetic that reveals structure you couldn't see</strong>. The AI is doing something it is uniquely positioned to do — collapsing high-dimensional semantic space — not just producing pretty images.
    </p>

    ${Insight({ label: 'Thesis', content: html`<p>Using AI to visualize the topology of a mind is categorically different from using AI to generate images. One externalizes computation onto aesthetics. The other uses computation to make cognition visible to itself.</p>` })}

    <h3>3. The notation connection — Ian Arawjo's reply</h3>
    <p>
      In the same thread, Ian Arawjo — HCI researcher at Université de Montréal and Mila, author of <em>"How Notations Evolve: A Historical Analysis with Implications for the Incremental Formalization of User-Defined Abstractions"</em> (arXiv 2602.01525, submitted to CHI 2026) — responded: <em>"I see 'evolution of notation in the arts and sciences'! Check out our paper (maybe something to add to the cool Obsidian graph!)"</em>
    </p>
    <p>
      The connection is non-trivial. Arawjo's paper finds that notation evolution proceeds from informal ideas that borrow from prior culture, especially the remixing of prior notations and the application of conceptual metaphors of linking and grounding — and that a notation is revised and extended as it comes into contact with diverse situations and people. The relevance to Kat's project: <em>the note graph itself is a notation</em>. The act of choosing topology — centralized, decentralized, distributed — is a notational choice that encodes values and makes certain thoughts easier to have than others.
    </p>
    <p>
      The distributed topology with LLM edge labels is arguably a new kind of notation: one where the connections between concepts are <em>auto-generated text</em> rather than lines, arrows, or formal symbols. Arawjo's historical analysis of how notations become institutionalized maps directly onto the question of whether the LLM edge label is a notation that could stabilize and circulate — or whether it is too personal, too generative, too context-dependent to ever formalize.
    </p>

    ${Insight({ label: 'Cross-domain synthesis', content: html`<p>The note graph is a personal notation system. Topology choice is a notational design decision. LLM edge labels are a novel notational element — informal, auto-generated, and potentially more expressive than any formal symbol. The history of notation says these informal elements either formalize and propagate, or stay private and dissolve. Which will the LLM edge label be?</p>` })}

    <h3>4. The orphan inversion</h3>
    <p>
      Clustering algorithms like HDBSCAN mark low-density notes as outliers — notes that don't belong to any cluster. The standard treatment is to filter them as noise. But in a personal knowledge base, an orphan note may be something entirely different: an idea that has no predecessors yet, a thought that hasn't found its cluster because the cluster doesn't exist yet. The orphan note is not a failure of organization — it may be the most genuinely novel thing in the vault. Inverting the assumption about outliers — treating them as signals rather than noise, candidates for future cluster seeds rather than discards — is a research direction nobody has taken seriously.
    </p>

  ${SectionBreak()}

  <!-- § 6 — REPLICATION GUIDE -->
  <nisli-scroll-reveal>
    ${SectionNum({ label: '§ 6 — Toward Replication' })}
    <h2>How to build this yourself <em>(without TouchDesigner)</em></h2>
    <p>
      The entire pipeline is reproducible in Python + three.js. Use Ollama with <code>nomic-embed-text</code> for local embeddings (your notes never leave your machine), UMAP for 3D projection, and a local Llama 3 for edge labeling. Export as JSON, render in three.js with a force-directed graph. The resulting JSON can be fed into a labeled 3D graph in an afternoon.
    </p>
  ` })}

  ${SectionBreak()}

  <!-- § 7 — SYNTHESIS -->
  ${ScrollReveal({ content: html`
    ${SectionNum({ label: '§ 7 — Synthesis' })}
    <h2>What this project is <em>really about</em></h2>
    <p>
      The most clarifying thing Kat said is also the most technical: the medoid and the LLM's central note are different — and both are about the evolution of interfaces. This small fact contains the whole project.
    </p>
    <p>
      What it means is that the "center" of a mind is not a single thing. There is the statistical center (the note geometrically closest to all others in embedding space), and there is the semantic center (the note an LLM identifies as the connective hub of meaning). These methods agree on the <em>topic domain</em> — both landed on "evolution of interfaces" — but disagree on the <em>specific note</em>. That disagreement is not noise. It is a finding: the mathematical structure and the linguistic structure of a mind are related but not identical.
    </p>

    <h3>The three things this project proves</h3>

    <p>
      <strong>First: topology is not neutral.</strong> The centralized view, the decentralized view, and the distributed view are not three visualizations of the same data. They are three different claims about the structure of thought. Each one makes different notes visible and different connections prominent. Choosing a topology is an epistemological act — like choosing a map projection, but for a mind.
    </p>
    <p>
      <strong>Second: the medoid-LLM gap is the most interesting measurement.</strong> When geometry and semantics disagree about the center of a corpus, the disagreement is information. It says: "your statistical center of gravity is not the same as your conceptual center of gravity." That gap is a portrait of the distance between how your ideas are distributed and how your ideas are organized. This is a measurement nobody was making before.
    </p>
    <p>
      <strong>Third: the LLM edge is generating new knowledge, not retrieving existing knowledge.</strong> Every edge label is a proposition the author hasn't written. The pipeline takes N notes and produces not just a map of those notes but N×k/2 new sentences connecting them. The output of the system is strictly larger than the input. This is the definition of a generative cognitive tool — and it is categorically different from RAG, summarization, or semantic search.
    </p>

    ${PullQuote({ content: html`The visualization is not a map of what you think. The edges are sentences you haven't written yet — and the topology is a theory of how thinking works that you haven't consciously chosen.`, cite: '— synthesis' })}
  ` })}

  <!-- FOOTNOTES -->
  ${Footnotes({ items: [html`① Kat Zhang (@poetengineer__) — <a href="https://x.com/poetengineer__/status/2024167043726029042">X post on topologies of thoughts</a> — February 18, 2026`, html`② Gray Area profile — <a href="https://grayarea.org/community-entry/the-poet-engineer/">grayarea.org/community-entry/the-poet-engineer</a>`, html`③ Poetic Engineering Substack — <a href="https://poeticengineering.substack.com">poeticengineering.substack.com</a>`, html`④ Patreon (TouchDesigner project files) — <a href="https://www.patreon.com/posts/touchdesigner-152759868">patreon.com/posts/touchdesigner006-152759868</a>`, html`⑤ Frontiers in Neuroscience: <a href="https://www.frontiersin.org/journals/neuroscience/articles/10.3389/fnins.2019.00585/full">"Application of Graph Theory for Identifying Connectivity Patterns in Human Brain Networks"</a> (2019)`, html`⑥ Cognitive Network Neuroscience — PMC/NIH — <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC4854276/">pmc.ncbi.nlm.nih.gov/articles/PMC4854276</a>`, html`⑦ Heritage Connector: UMAP visualization of museum knowledge graph — <a href="https://thesciencemuseum.github.io/heritageconnector/post/2021/09/10/demos-announcement/">Science Museum Group blog</a>`, html`⑧ InfraNodus: betweenness centrality for PKM — <a href="https://infranodus.com">infranodus.com</a>`, html`⑨ Ian Arawjo, "How Notations Evolve: A Historical Analysis with Implications for the Incremental Formalization of User-Defined Abstractions" — CHI 2026 (submitted) — <a href="https://arxiv.org/abs/2602.01525">arxiv.org/abs/2602.01525</a>`, html`⑩ Arawjo, "To Write Code: The Cultural Fabrication of Programming Notation and Practice" — <a href="https://dl.acm.org/doi/abs/10.1145/3313831.3376731">CHI 2020</a>`] })}
</article>

`;
}
