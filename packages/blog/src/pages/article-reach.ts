import { html } from '@nisli/core';

export function articleReachPage() {
  return html`<article class="article-reach">
    <header>
      <h1>Readership signals</h1>
      <p>Which articles attract requests, and how much depends on one reported source?</p>
      <p class="stats-section-note">Four completed UTC weeks of stored Browser signals. These requests can come from people, automated browsers or relays. They do not measure reading or identify readers.</p>
      <p class="stats-section-note"><a href="/stats">All stats and classification evidence</a> · <a href="/api/readership">Report as JSON</a></p>
    </header>
    <p id="reach-status" role="status" aria-atomic="true">Loading the report…</p>
    <noscript><p>The report is also available through the JSON link above. Its dates, counts and evidence limits are included there.</p></noscript>
    <div id="reach-report" hidden aria-busy="true">
      <p id="reach-period" class="stats-section-note"></p>
      <section class="stats-section" aria-labelledby="reach-overview-heading">
        <h2 id="reach-overview-heading">Where article requests come from</h2>
        <div id="reach-overview" class="stats-totals"></div>
        <p class="stats-section-note">External referrers suggest discovery; internal referrers describe navigation within this blog. An absent referrer leaves origin unknown. Unknown evidence includes unusable, inconsistent or earlier merged records. None is a count of newly acquired readers.</p>
      </section>
      <section class="stats-section" aria-labelledby="reach-concentration-heading">
        <h2 id="reach-concentration-heading">How much depends on one source?</h2>
        <p id="reach-concentration"></p>
        <p class="stats-section-note">The comparison sets aside the largest reported external source across this entire window, using that same source for every week and article. It is a sensitivity check, not an exclusion policy or a corrected human count. A displayed hostname is not authenticated attribution. Unapproved names remain private.</p>
      </section>
      <section class="stats-section" aria-labelledby="reach-weeks-heading">
        <h2 id="reach-weeks-heading">Four completed weeks</h2>
        <p class="stats-section-note">Articles are a subset of the site total. Today’s partial day is omitted. Changing collection or classification rules can change these counts independently of audience growth.</p>
        <div id="reach-weeks" class="reach-table" role="region" aria-label="Completed-week comparison; scroll horizontally if needed" tabindex="0"></div>
        <p id="reach-profiles" class="stats-section-note"></p>
        <details class="reach-history">
          <summary>Measurement history</summary>
          <p class="stats-section-note">Check whether the recorded collection and classification methods changed across weeks before interpreting a trend. These groups cover only the Browser signals already selected above; they cannot reveal requests an older rule excluded.</p>
          <label class="reach-sort">Show history for <select id="reach-history-scope"><option value="site">All site events</option><option value="articles">All article events</option></select></label>
          <div id="reach-history" class="reach-table" role="region" aria-label="Weekly measurement history; scroll horizontally if needed" tabindex="0"></div>
          <p class="stats-section-note">Stamps identify the stored method, not people or proven comparability. A date-shaped stamp is not a review of its rules. Missing and unrecognized stamps stay explicit. Groups describe stored events, not a replay under today's rules.</p>
        </details>
      </section>
      <section class="stats-section" aria-labelledby="reach-articles-heading">
        <h2 id="reach-articles-heading">Article reach</h2>
        <label class="reach-sort">Sort articles <select id="reach-sort"><option value="views">Total events</option><option value="outside">Outside site’s top external source</option><option value="outside-article">Outside each article’s top external source</option></select></label>
        <p class="stats-section-note">Current published articles only; home, section hubs and prompt pages are outside this ranking. Dates provide publication context; actual exposure is unmeasured. Repeated requests count again.</p>
        <p class="stats-section-note">An article can depend on a different source from the site’s largest. Its top external hostname is selected across the full window, independently for each article. The percentage uses that article’s external events; the outside count uses all its events, including internal and unattributed requests. These overlapping comparisons are not extra events or human counts. Names appear only with existing public display approval.</p>
        <div id="reach-articles" class="reach-table" role="region" aria-label="Article source comparison; scroll horizontally if needed" tabindex="0"></div>
      </section>
      <aside class="stats-methodology">
        <h2>What we still cannot tell</h2>
        <p>These counts do not reveal individual people, search terms, attention, completion, return readership or whether an article helped. A missing referrer does not mean a direct visit. Search-query evidence and concrete reader replies, corrections, reports of use and confirmed following require separate evidence.</p>
        <p id="reach-policy"></p>
        <p>Reports can be up to one hour old. The calculation time stays unchanged on cache reuse. <a href="/stats#stats-methodology-heading">Collection and classification methods</a>.</p>
      </aside>
    </div>
  </article>`;
}
