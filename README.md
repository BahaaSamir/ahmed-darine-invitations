# Ahmed & Darine — wedding invitations

Two mobile-first static invitations sharing one lightweight animation engine.

- [Family preview](https://bahaasamir.github.io/ahmed-darine-invitations/Family_Invite/)
- [Friends preview](https://bahaasamir.github.io/ahmed-darine-invitations/Friends_Invite/)

## Run locally

Serve this folder with any static server, for example `python3 -m http.server 4173`, then open `/Family_Invite/` or `/Friends_Invite/`.

There is no build step, framework, CDN dependency, or runtime font conversion. Fonts and images are local. The original design exports remain local references and are excluded from the published repository.

## Interaction

- On first load, a short fade introduces the visible artwork and staggered content.
- SVG names draw letter by letter once they enter view, using an independent clock. Scrolling during the drawing never skips, accelerates, or reverses the pen.
- “See you there :)” uses the same independent SVG handwriting animation, including the smile.
- Scrolling immediately takes control. Remaining watercolours reveal from top to bottom with a continuous feathered edge.
- Scroll reveals finish before the bottom of the page and track the visual viewport, including mobile browser bars expanding or collapsing without another swipe.
- The final illustration waits until a visible portion enters the viewport, then paints itself over 1.2 seconds. It finishes without another swipe, including after a fast jump to the bottom.
- The large rosette opens from its centre using a soft organic radial mask.
- Every reveal advances only once per visit. Scrolling back or resizing never hides revealed content or replays a completed animation; a partially revealed element resumes from its furthest point.
- Reduced motion, printing, and disabled JavaScript show complete content. The directions link has a 44px minimum touch target.

`shared/invitation.js` contains timing and scroll ranges; `shared/invitation.css` contains the common design and the friends variant spacing. Each HTML file contains real SVG glyph outlines and pen masks. `Family_Invite/tools/build_name_svg.py` documents the font-to-path process and hand-traced pen trajectories; fonttools is required only when rebuilding these outlines.

Both invitations use the supplied `Preview_Link_Image.png`, copied unchanged to `shared/assets/images/preview-link.png`, for Open Graph and Twitter previews. Preview pages request no search indexing.

## Hosting

GitHub Pages serves the `main` branch from the repository root. `.nojekyll` keeps this a plain static site. Preserve the folder structure when uploading to another host; update the absolute canonical and social-image URLs if the domain changes.

Font licenses are included in `shared/assets/fonts/`.
