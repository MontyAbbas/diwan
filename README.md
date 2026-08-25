# The Diwan of Montasir Abbas

Personal poetry & songs website — Arabic originals with English translations.

- `index.html` — the entire site (self-contained: styles, scripts, and images embedded).
- Hosted via GitHub Pages.
- To publish a new poem: edit the `POEMS` array at the top of the script in `index.html`.

## Poem order

The sidebar is **grouped by theme**, not by array position:

- A poem tagged `أغنية` goes under **Songs** (الأغاني), always the first group.
- Otherwise the poem's **first tag** is its group (غزل، شوق، رثاء…).
- Group order is set by the `GROUP_ORDER` constant just below the `POEMS`
  array in `index.html`; a tag not listed there falls to the end of the list.
- Within each group, poems follow their order in the `POEMS` array —
  so **add new poems at the TOP of the array** and every group stays
  newest-first. No need to hunt for an insertion spot.
- The daily featured poem is picked by sorted poem `id`, so reordering
  or adding poems doesn't reshuffle which poem a given day features.
