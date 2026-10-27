/* A brief opening sequence hands over to scroll distance. No animation library. */
(() => {
  'use strict';
  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const invitation = document.querySelector('.invitation');
  const clamp = value => Math.min(1, Math.max(0, value));
  const smooth = value => value * value * (3 - 2 * value);
  let items = [];
  let frame = 0;
  let needsMeasure = true;
  let viewport = 0;
  let maxScroll = 0;
  let intro = null;
  let firstRun = true;

  const reveals = [...document.querySelectorAll('[data-reveal]')].map(element => ({
    kind: 'reveal', element, previous: -1,
    stagger: Number(element.dataset.stagger || 0)
  }));
  const inks = [...document.querySelectorAll('[data-ink]')].map(element => ({
    kind: element.hasAttribute('data-radial') ? 'radial' : 'ink', element, previous: -1,
    front: element.querySelector('[data-ink-front]'),
    image: element.querySelector('.ink-image'),
    height: element.viewBox.baseVal.height,
    mask: element.querySelector('mask').id
  }));
  const handwritings = [...document.querySelectorAll('[data-handwriting]')].map(element => {
    const letters = [...element.querySelectorAll('[data-letter]')].map(glyph => ({
      fill: glyph.querySelector('.letter-fill'),
      mask: glyph.querySelector('mask').id,
      strokes: [...glyph.querySelectorAll('[data-pen]')].map(path => ({path, length: path.getTotalLength()}))
    }));
    return {kind: 'handwriting', element, letters, previous: -1, startedAt: null,
      progress: 0, duration: Math.min(3200, 1000 + letters.length * 58)};
  });
  const allLetters = handwritings.flatMap(item => item.letters);
  const track = {kind: 'track', element: document.querySelector('.timeline ol'), previous: -1};
  const trackLine = document.querySelector('.timeline-track');

  function measure() {
    // Measure untransformed layout once, then use cached positions on scroll.
    viewport = document.documentElement.clientHeight;
    maxScroll = Math.max(0, document.documentElement.scrollHeight - viewport);
    const scroll = window.scrollY;
    for (const item of items) {
      const rect = item.element.getBoundingClientRect();
      const translateY = item.kind === 'reveal' ? parseFloat(item.element.style.getPropertyValue('--reveal-y')) || 0 : 0;
      const top = rect.top + scroll - translateY;
      const height = rect.height;
      item.top = top;
      item.boxHeight = height;
      if (item.kind === 'handwriting') continue;
      if (item.kind === 'ink') {
        item.start = top - viewport * .92;
        item.end = top + height - viewport * .2;
      } else if (item.kind === 'radial') {
        item.start = top - viewport * .9;
        item.end = top + height - viewport * .55;
      } else if (item.kind === 'track') {
        item.start = top - viewport * .78;
        item.end = top + height - viewport * .58;
      } else {
        item.start = top - viewport * .91 + item.stagger * Math.min(22, viewport * .025);
        item.end = item.start + Math.min(125, viewport * .19);
      }
      // The last artwork and elements must finish before the page runs out.
      item.end = Math.min(item.end, maxScroll);
      item.start = Math.min(item.start, item.end - 1);
      item.previous = -1;
    }
    needsMeasure = false;
  }

  function drawLetters(item) {
    const position = item.progress * item.letters.length;
    item.letters.forEach((letter, index) => {
      const local = clamp(position - index);
      if (letter.previous === local) return;
      letter.previous = local;
      letter.fill.setAttribute('mask', local >= 1 ? '' : `url(#${letter.mask})`);
      const total = letter.strokes.reduce((sum, stroke) => sum + stroke.length, 0);
      let distance = local * total;
      for (const stroke of letter.strokes) {
        stroke.path.style.strokeDashoffset = String(stroke.length - Math.min(stroke.length, Math.max(0, distance)));
        // Hide round end caps until the pen reaches this stroke.
        stroke.path.style.visibility = distance > 0 ? 'visible' : 'hidden';
        distance -= stroke.length;
      }
    });
  }

  function render(now = performance.now()) {
    frame = 0;
    if (reducedMotion.matches) return;
    if (needsMeasure) measure();
    const scroll = Math.max(0, Math.min(maxScroll, window.scrollY));
    let drawing = false;
    for (const item of items) {
      if (item.kind === 'handwriting') {
        // Visibility starts the pen once. Only elapsed time moves it afterwards.
        if (item.startedAt === null && scroll + viewport * .88 > item.top) {
          item.startedAt = now + (intro ? item.openingDelay : 100);
        }
        if (item.startedAt !== null) {
          item.progress = Math.max(item.progress, clamp((now - item.startedAt) / item.duration));
          drawing = drawing || item.progress < 1;
        }
        drawLetters(item);
        continue;
      }
      let progress = Math.max(item.openingFloor || 0, clamp((scroll - item.start) / (item.end - item.start)));
      if (intro) {
        const elapsed = now - intro.start;
        const openingProgress = clamp((elapsed - item.openingDelay) / item.openingDuration);
        progress *= smooth(openingProgress);
      }
      if (progress === item.previous) continue;
      item.previous = progress;
      if (item.kind === 'reveal') {
        const eased = smooth(progress);
        item.element.style.setProperty('--reveal', eased.toFixed(4));
        item.element.style.setProperty('--reveal-y', `${((1 - eased) * 12).toFixed(2)}px`);
      } else if (item.kind === 'ink') {
        item.image.setAttribute('mask', progress >= 1 ? '' : `url(#${item.mask})`);
        item.front.setAttribute('transform', `translate(0 ${(-125 + (item.height + 150) * progress).toFixed(2)})`);
      } else if (item.kind === 'radial') {
        item.image.setAttribute('mask', progress >= 1 ? '' : `url(#${item.mask})`);
        item.front.setAttribute('transform', `translate(160 160) scale(${(progress * 2.6).toFixed(4)})`);
      } else {
        trackLine.style.setProperty('--line-progress', progress.toFixed(4));
      }
    }
    root.classList.add('motion-ready');
    root.classList.remove('motion-pending');
    clearTimeout(window.invitationStartup);
    if (intro && now - intro.start >= intro.duration) intro = null;
    if (intro || drawing) schedule();
  }

  function schedule() {
    if (!frame && !reducedMotion.matches) frame = requestAnimationFrame(render);
  }

  function refresh() {
    needsMeasure = true;
    schedule();
  }

  function configure() {
    if (reducedMotion.matches) {
      cancelAnimationFrame(frame);
      frame = 0;
      intro = null;
      handwritings.forEach(item => { item.progress = 1; });
      root.classList.remove('motion-ready');
      root.classList.remove('motion-pending');
      inks.forEach(item => item.image.removeAttribute('mask'));
      allLetters.forEach(letter => letter.fill.removeAttribute('mask'));
      return;
    }
    items = [...reveals, ...inks, ...handwritings, track];
    allLetters.forEach(letter => {
      letter.previous = -1;
      letter.strokes.forEach(({path, length}) => { path.style.strokeDasharray = `${length} ${length}`; });
    });
    needsMeasure = true;
    if (firstRun && window.scrollY < 2) {
      measure();
      intro = {start: performance.now(), duration: 0};
      for (const item of items) {
        const position = clamp(item.top / viewport);
        const inOpening = item.top + item.boxHeight * .5 < viewport * .9;
        // Opening copy stays readable. Handwriting has its own independent clock.
        item.openingFloor = inOpening && ['reveal', 'radial'].includes(item.kind) ? 1 : 0;
        item.openingDelay = item.kind === 'ink' ? position * 350 : item.kind === 'radial' ? 1000 + position * 400 : item.kind === 'handwriting' ? 600 + position * 350 : 150 + position * 600 + (item.stagger || 0) * 55;
        item.openingDuration = item.kind === 'radial' ? 1100 : item.kind === 'ink' ? 1800 : 750;
        if (item.kind !== 'handwriting') intro.duration = Math.max(intro.duration, item.openingDelay + item.openingDuration);
      }
    }
    firstRun = false;
    // Initialize before the first paint; content stays visible if JS cannot run.
    render();
  }

  window.addEventListener('scroll', () => {
    // Native scrolling takes over immediately, including restored scroll positions.
    if (intro && window.scrollY > 2) intro = null;
    schedule();
  }, {passive: true});
  window.addEventListener('resize', refresh, {passive: true});
  window.addEventListener('pageshow', refresh);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  reducedMotion.addEventListener('change', configure);
  if ('ResizeObserver' in window) new ResizeObserver(refresh).observe(invitation);
  if (document.fonts) document.fonts.ready.then(refresh);
  configure();
})();
