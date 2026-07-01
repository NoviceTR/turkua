// Lightweight hero atmosphere. It is isolated from tracker data and pauses off-screen.
(function initializeHeroEffects() {
  const hero = document.getElementById('tracker');
  const backdrop = hero?.querySelector('.hero-backdrop');
  if (!hero || !backdrop) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'hero-particles';
  canvas.setAttribute('aria-hidden', 'true');
  backdrop.prepend(canvas);

  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = window.matchMedia('(pointer: coarse)');
  const particleColors = [
    'rgba(107, 199, 255, 0.38)',
    'rgba(232, 199, 122, 0.32)',
    'rgba(53, 212, 152, 0.26)'
  ];

  let width = 0;
  let height = 0;
  let density = 1;
  let particles = [];
  let animationFrame = 0;
  let previousTime = 0;
  let isVisible = true;
  let pointerFrame = 0;
  let pointerPosition = null;
  let resizeFrame = 0;

  function createParticle(index) {
    const angle = (index * 2.399963) % (Math.PI * 2);
    const spread = (index * 0.618033) % 1;
    return {
      x: width * ((spread + index * 0.071) % 1),
      y: height * ((spread * 1.7 + index * 0.113) % 1),
      radius: 0.55 + (index % 4) * 0.22,
      speedX: Math.cos(angle) * (0.7 + (index % 3) * 0.18),
      speedY: -0.8 - (index % 5) * 0.16,
      color: particleColors[index % particleColors.length],
      phase: angle
    };
  }

  function resetParticles() {
    const baseCount = Math.round(width / (coarsePointer.matches ? 48 : 38));
    const count = reducedMotion.matches ? 14 : Math.min(coarsePointer.matches ? 22 : 58, Math.max(16, baseCount));
    particles = Array.from({ length: count }, (_, index) => createParticle(index));
  }

  function resizeCanvas() {
    const bounds = backdrop.getBoundingClientRect();
    width = Math.max(1, Math.round(bounds.width));
    height = Math.max(1, Math.round(bounds.height));
    density = Math.min(coarsePointer.matches ? 1 : 1.5, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * density);
    canvas.height = Math.round(height * density);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(density, 0, 0, density, 0, 0);
    resetParticles();
    drawParticles(0);
  }

  function scheduleResize() {
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      resizeCanvas();
    });
  }

  function drawParticles(elapsed) {
    context.clearRect(0, 0, width, height);
    const now = performance.now();
    particles.forEach(particle => {
      if (!reducedMotion.matches && elapsed > 0) {
        particle.x += particle.speedX * elapsed;
        particle.y += particle.speedY * elapsed;
        if (particle.x < -4) particle.x = width + 4;
        if (particle.x > width + 4) particle.x = -4;
        if (particle.y < -4) particle.y = height + 4;
      }

      const alpha = 0.45 + Math.sin(now * 0.0008 + particle.phase) * 0.25;
      context.globalAlpha = reducedMotion.matches ? 0.45 : alpha;
      context.fillStyle = particle.color;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fill();
    });
    context.globalAlpha = 1;
  }

  function animate(time) {
    if (!isVisible || reducedMotion.matches) {
      animationFrame = 0;
      return;
    }
    const elapsed = previousTime ? Math.min(2, (time - previousTime) / 16.67) : 1;
    previousTime = time;
    drawParticles(elapsed);
    animationFrame = requestAnimationFrame(animate);
  }

  function startAnimation() {
    if (animationFrame || reducedMotion.matches || !isVisible) return;
    previousTime = 0;
    animationFrame = requestAnimationFrame(animate);
  }

  function stopAnimation() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  }

  function updatePointer() {
    pointerFrame = 0;
    if (!pointerPosition) return;
    const bounds = hero.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (pointerPosition.x - bounds.left) / bounds.width));
    const y = Math.min(1, Math.max(0, (pointerPosition.y - bounds.top) / bounds.height));
    hero.style.setProperty('--hero-pointer-x', `${(x * 100).toFixed(2)}%`);
    hero.style.setProperty('--hero-pointer-y', `${(y * 100).toFixed(2)}%`);
    hero.style.setProperty('--hero-depth-x', `${((x - 0.5) * 18).toFixed(2)}px`);
    hero.style.setProperty('--hero-depth-y', `${((y - 0.5) * 12).toFixed(2)}px`);
    hero.style.setProperty('--hero-depth-x-neg', `${((0.5 - x) * 18).toFixed(2)}px`);
    hero.style.setProperty('--hero-depth-y-neg', `${((0.5 - y) * 8).toFixed(2)}px`);
    hero.style.setProperty('--hero-grid-x', `${((0.5 - x) * 7).toFixed(2)}px`);
    hero.style.setProperty('--hero-grid-y', `${((0.5 - y) * 5).toFixed(2)}px`);
    hero.style.setProperty('--hero-copy-x', `${((x - 0.5) * 3).toFixed(2)}px`);
    hero.style.setProperty('--hero-copy-y', `${((y - 0.5) * 2).toFixed(2)}px`);
  }

  hero.addEventListener('pointermove', event => {
    if (coarsePointer.matches || reducedMotion.matches) return;
    pointerPosition = { x: event.clientX, y: event.clientY };
    if (!pointerFrame) pointerFrame = requestAnimationFrame(updatePointer);
  }, { passive: true });

  hero.addEventListener('pointerleave', () => {
    pointerPosition = null;
    hero.style.removeProperty('--hero-pointer-x');
    hero.style.removeProperty('--hero-pointer-y');
    hero.style.removeProperty('--hero-depth-x');
    hero.style.removeProperty('--hero-depth-y');
    hero.style.removeProperty('--hero-depth-x-neg');
    hero.style.removeProperty('--hero-depth-y-neg');
    hero.style.removeProperty('--hero-grid-x');
    hero.style.removeProperty('--hero-grid-y');
    hero.style.removeProperty('--hero-copy-x');
    hero.style.removeProperty('--hero-copy-y');
  }, { passive: true });

  const resizeObserver = new ResizeObserver(scheduleResize);
  resizeObserver.observe(backdrop);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    if (isVisible) startAnimation();
    else stopAnimation();
  }, { rootMargin: '160px 0px' });
  intersectionObserver.observe(hero);

  reducedMotion.addEventListener('change', () => {
    stopAnimation();
    resetParticles();
    drawParticles(0);
    startAnimation();
  });
  coarsePointer.addEventListener('change', scheduleResize);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAnimation();
    else startAnimation();
  });
  window.addEventListener('pagehide', event => {
    stopAnimation();
    if (pointerFrame) cancelAnimationFrame(pointerFrame);
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    if (!event.persisted) {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    }
  });
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    scheduleResize();
    startAnimation();
  });

  resizeCanvas();
  startAnimation();
})();
