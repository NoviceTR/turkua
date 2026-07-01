// ── Nav aktif bölüm vurgulama ──────────────────────────────────
(function() {
  const sections = ['tracker', 'gundem', 'university', 'visa', 'trade', 'money', 'shop'];
  const navLinks = [...document.querySelectorAll('.nav-links a')];
  const bottomLinks = [...document.querySelectorAll('.bottom-nav a')];

  function setActive(id) {
    const href = `#${id}`;
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === href);
    });
    bottomLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === href);
    });
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) setActive(e.target.id);
    });
  }, { rootMargin: '-60px 0px -60% 0px', threshold: 0 });

  window.Turkua.onReady(() => {
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  });
})();
