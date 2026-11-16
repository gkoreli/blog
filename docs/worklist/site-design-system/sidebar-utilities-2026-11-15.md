# Sidebar utility correction

November 15, 2026. Status: published and freshly verified. This is a bounded follow-up to the completed publication design work, superseding the earlier right-rail search placement. Article content, search retrieval and analytics contracts are unchanged.

## Presentation

Search is a compact labeled link beside Contents on every desktop layout, including reports. The phone header keeps its existing search position beside the menu control. There is one visible launcher at each breakpoint. The right article rail contains reading navigation alone. Native `/search` navigation, the shortcut, query retention, Escape and focus return keep their existing behavior.

The footer uses one quiet icon-control treatment for the three social links and the appearance action: 44px targets, 20px glyphs, neutral ink, a flat hover surface and visible keyboard focus. A single appearance button names the mode it will switch to. The separate glass container, sliding thumb, small social frames and redundant native footer tooltips are removed. Saved appearance and initial system preference still work. Compact report sidebars retain enough room for all four controls on one line.

## Local verification

Workspace types, all 471 existing site tests, 35 Markdown validations, referral-policy checks and the isolated 46-article build pass. Browser review at 320, 393, 768, 769, 900, 1199 and 1440px checks the actual common shell and the narrower report sidebar. There is one visible search launcher, no document overflow, and all visible footer controls share a 44px target and 20px glyph. Phone menus are checked in both themes.

Pointer and keyboard activation switch appearance; a reload preserves the selection. Desktop click/Cmd+K and phone keyboard activation open search. A word query returns five articles, and Escape restores focus and releases scroll locking. Private screenshots and browser captures remain outside Git. Delivery and fresh public acceptance follow separately.

## Delivery and hosted acceptance

Implementation `6badf3c0` is published on main. Cloudflare build `fd8126bd-7322-4a8d-bed8-a563eaf7cf03` completed successfully; active version `5315d49e-5a6c-424e-984f-209f70fd5457` is Ready at 100% traffic. Fresh ordinary GETs at 03:33 UTC on November 16 verify the source/build marker and corrected common shell on Home, a technical article and Stats. Both served main assets exactly match the isolated build made with the actual Cloudflare build metadata. The [acceptance receipt](sidebar-utilities-acceptance-2026-11-15.json) records those checks separately from activation.

Fresh public browser review at 1280, 393 and 320px confirms a single visible search launcher, no document overflow, aligned 44px footer controls and 20px glyphs. The desktop launcher is labeled beside Contents; phones retain their header launcher. Pointer and Space switch appearance, and reload preserves the choice. Click/Cmd+K open search; the word query returns five articles; query retention and Escape focus return work. When search opens from an expanded phone menu, dismissal correctly restores that menu and its scroll lock; closing the menu releases the lock. Both themes are reviewed, and the original light appearance and default viewport are restored. Private screenshots remain outside Git; the owned preview server is stopped. No required work remains for this correction.
