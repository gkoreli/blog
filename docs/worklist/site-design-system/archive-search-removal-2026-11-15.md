# Archive search correction

November 15, 2026. Status: published and freshly verified.

Engineering, Essays and OSS Radar no longer duplicate the publication search form in their content. Search remains in the shared navigation and on its dedicated page. The topic browser keeps every native section-scoped destination, and the article chronology is unchanged. The unused form styles and resulting empty gap are removed. Current design guidance and the reading/discovery contract now make that ownership explicit.

Workspace types, the four existing publication-pattern tests, referral-policy checks and the isolated 46-article build pass. A rendered comparison retains the complete article-list markup for Engineering (26 articles), Essays (6) and OSS Radar (14), with all 356 topic links and their destinations unchanged. All three archives have zero inline search forms. Browser review covers Engineering at 1280px and 393px, Essays at 1280px and OSS Radar at 393px in dark mode. The expanded Engineering topic disclosure retains all 64 destinations without document overflow. The owned preview is stopped.

## Delivery and current acceptance

Implementation `ac2039b4` is published on main. Cloudflare build `bafdbe43-6b81-473e-9d27-2f575be312df` completed at 03:44:33 UTC on November 16; version `306e1a7f-9e69-4479-8b1c-9861a58c0597` is Ready at 100% traffic. Fresh public GETs confirm all three archives contain no inline search form or search input, retain the shared navigation launcher, and exactly preserve their prior article lists and topic links. The served main stylesheet matches the reviewed build and contains no obsolete archive-search selectors. The [acceptance receipt](archive-search-removal-acceptance-2026-11-15.json) separates those results from activation.

Fresh public browser review of Engineering at 1280/393px confirms the form is absent, one search launcher is visible, and the page has no horizontal overflow. Screenshots and operational captures remain private. The default viewport and original appearance are restored, the owned preview is stopped, and no required work remains for this correction.
