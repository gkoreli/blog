# Compact navigation and the publication’s design language

November 11, 2026. Working design study, following the owner’s selection of Tool library and request for smaller cards, further iteration and external inspiration. The direction is selected; the new density and pattern family remain proposals.

The [accepted implementation](#accepted-implementation--november-11) now supersedes the pending selection and decorative-arrow recommendation in this historical study.

## Diagnosis

The first library treated each tool as a small feature story: a 140px artwork area, metadata above the heading, description and a separate action line. Each surface had one destination, so the repeated action did not provide another capability. The image area and bottom action consumed more space than choosing among four tools needed.

The useful part is the illustrated library itself. Preserve the publication’s Lora, warm paper, green links and inspectable technical drawings. Give the tool name and purpose priority, then state the local/allowance boundary. A large hit area does not require a large visual card.

## References and what transfers

These are a heuristic review and a local layout comparison, not a usability study with readers. Sources were read on November 11; the Raycast extension collection was also inspected in the browser. No extension was installed and no external scan was submitted.

| Reference | Relevant observation | Application here |
| --- | --- | --- |
| [Carbon clickable tiles](https://www.carbondesignsystem.com/building-blocks/core/components/tile/guidelines) | A navigational tile is one action over its whole surface; media is optional and separate internal actions are inappropriate. Tiles stay on the page plane. | One native destination, one arrow, no duplicate button or shadow. Keep enabled, hover, active and keyboard focus states distinct. |
| [Raycast Store](https://www.raycast.com/store) | The extension collection places a compact identity image with the name and purpose; it does not give every ordinary item a large image stage. | Put a thumbnail beside the name. Retain the publication’s own typography and colors. Omit marketplace features such as installs, popularity, filtering and search for this four-tool set. |
| [Scottish Government card navigation](https://designsystem.gov.scot/patterns/navigational-pages/card-navigation), [list navigation](https://designsystem.gov.scot/patterns/navigational-pages/list-navigation) | Cards support browsing; image cards cost space. Lists offer more room for longer labels and summaries at lower density cost. | Compare a compact two-column library with a single-column illustrated list. Use horizontal rules to fit this publication rather than importing the reference’s left borders. |
| [GOV.UK spacing](https://design-system.service.gov.uk/styles/spacing/) | Separates small fixed spacing from larger responsive spacing. | Use a small repeatable scale and adapt layout at narrow widths. Do not shrink every dimension uniformly. The actual pixel values below use this publication’s scale. |
| [W3C target size enhanced](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html) | The AAA target criterion uses 44×44 CSS px, with stated exceptions. | Keep the entire choice operable and well separated. This is a design target, not a claim of a complete WCAG audit. |

Carbon’s minimum proportions, Raycast’s metadata and the references’ typography are not adopted as requirements. Their constraints describe their products. This publication needs compact navigation within an editorial shell.

## Two refinements

**Compact tiles** keeps the visual library. A short heading shares a row with a thumbnail drawn specifically for that size. One sentence describes the output. A final line states the allowance boundary and shows the navigation arrow. Equal columns keep the four tools easy to compare; phone layouts use a single column. No tool is styled as selected merely because it appears first.

**Illustrated rows** uses the same language and drawings in an open list. The image precedes the heading, summary and allowance. This offers a quieter, more editorial treatment, particularly useful for supporting or longer collections. It is taller than the two-column tiles on desktop but shorter as a collection on the measured phones.

Neither version truncates text, forces an aspect ratio or fixes content height. Different labels and wrapping can grow naturally. Descriptions use 14px type with 1.7 line height; metadata increases from the old 11px to 12px. The old phone description was 13px; the new one is 14px. The compactness comes from composition and shorter copy.

## Reusable family

The [working pattern sheet](refinements.mjs) renders at `/_design/tools/navigation-patterns/` after the explicit study build. All three examples share `navigation-choices.css`.

| Pattern | Job | Anatomy |
| --- | --- | --- |
| Compact choice | Browse a small set of peer destinations | Linked name, small drawing, one purpose sentence, optional useful metadata, one arrow |
| Illustrated row | Scan a longer or supporting collection | Drawing, linked name, purpose, metadata, terminal arrow; quiet horizontal division |
| Illustrated invitation | Bring one relevant destination into editorial context | Small drawing, linked heading, one sentence, arrow; a restrained tint may give it emphasis |

The invitation example explores the same family as the accepted homepage component. It does not replace that component or reopen its accepted release.

Proposed shared values and behavior:

- Use 4/8/12/16/24px spacing relationships. The current tile uses 16px padding and a 14px grid gutter; that gutter is an exploration value to review, not a global spacing token.
- Keep utility headings around 20px, descriptions at 14px and metadata at 12px. Maintain Lora for editorial hierarchy and monospace for operational labels. Do not introduce a third face.
- Use 10px corners for tiles, 0px for rows. Prefer a neutral border; reserve the soft green fill for hover or one deliberately featured invitation. Green does not imply that an unrun tool passed a check.
- Compose thumbnails at their intended 64–80px display width. Preserve non-scaling strokes, opaque paper faces, recognizable document/rule/difference/request silhouettes and one restrained accent. Do not miniaturize a detailed hero diagram or draw arbitrary fake scores.
- Link the heading natively and expand it over the surface. Keep its accessible name concise; describe purpose and allowance separately. Keep one tab stop, full-surface focus and native Enter activation. No nested controls under an overlay link.
- Keep essential information visible before hover. Hover changes the border/fill and underlines the heading; active adds a subtle fill. Honor reduced motion. Never move content or reveal a hidden primary action on hover.
- Use a separate form region when the user supplies input. A navigation choice should not silently turn into a form or expose controls underneath its full-surface link.

These form a candidate navigation layer, not a site-wide redesign. Promotion into shared production styles should follow the selected density and layout, then update Design Language with the same component rather than a second copy.

## Measured local comparison

Actual built publication shell; browser viewport height 900 CSS px. Widths below are CSS px. Desktop and 393px runs used light appearance; 320px used dark appearance. Measurements are DOM bounding rectangles with Lora loaded. The baseline is the frozen first-round Tool library, not current production `/tools`.

| Viewport | Version | First item height | Whole four-tool collection | Description type |
| --- | --- | ---: | ---: | ---: |
| 1280 | Previous library | 328.48 | 674.95 | 14 |
| 1280 | Compact tiles | 147.99 | 309.98 | 14 |
| 1280 | Illustrated rows | 117.99 | 471.97 | 14 |
| 393 | Previous library | 172.58 | 726.31 | 13 |
| 393 | Compact tiles | 135.66 | 572.63 | 14 |
| 393 | Illustrated rows | 137.79 | 503.56 | 14 |
| 320 | Previous library | 194.02 | 868.69 | 13 |
| 320 | Compact tiles | 159.45 | 620.22 | 14 |
| 320 | Illustrated rows | 136.48 | 545.94 | 14 |

At 1280px, the compact first tile is 55% shorter and the collection 54% shorter. At 393px, the first tile and collection are about 21% shorter; all four destinations fit within the inspected 900px-tall phone view. At 320px, individual items have differing natural heights, so the collection is the more useful comparison: compact tiles save 29%, rows save 37% against the previous library.

All nine page/width combinations returned no horizontal overflow. These are rendering measurements; they do not establish faster task completion or reader preference. Pointer/keyboard checks and in-chat validation are recorded in the [study README](README.md#compact-refinements--november-11).

## Next decision

Propose Compact tiles for the tools directory. Keep Illustrated rows as the quieter alternative and the supporting-list pattern. Review the owner’s preference before promoting the proposed dimensions and styling into the live shared system. Scoring, quota, tool execution and actual reader use remain separate from this design work.

## Accepted implementation — November 11

Compact tiles was selected for `/tools`, with the shared pattern family added to Design Language. The repeated direction markers were rejected. The implementation uses underlined headings and full-surface hover, active and focus states as its navigation cue; the illustrations carry task identity. This supersedes the arrow recommendations above while retaining their dated comparison context.

The production template and CSS implement compact choices and illustrated rows. Design Language uses the same template and catalogue rather than a copied mockup. The homepage invitation keeps its selected compact composition and full target while dropping its decorative arrow disc. Tools entry actions also rely on their labels.

Utility iconography is now a separate, consistent layer: 24-unit geometry, 1.5-unit round strokes, inherited single color, 16px beside text and 20px in controls. Menu, close and appearance controls use the shared helper. Technical thumbnails keep paper faces and restrained accents; brand logos and sparkle retain their identity treatment. This establishes a reusable icon vocabulary without adding a dependency or changing the meaning of diagnostic evidence marks.
