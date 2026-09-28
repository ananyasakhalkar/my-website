/* site.js — progressive enhancement only. Everything works without it. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme toggle ---------- */
  var toggle = document.querySelector('.theme-toggle');
  var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  function currentTheme() {
    return root.getAttribute('data-theme') || (darkQuery.matches ? 'dark' : 'light');
  }
  function labelToggle() {
    if (toggle) toggle.setAttribute('aria-label', currentTheme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
  if (toggle) {
    labelToggle();
    darkQuery.addEventListener('change', labelToggle);
    toggle.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      if (!reduceMotion) {
        root.classList.add('theme-anim');
        setTimeout(function () { root.classList.remove('theme-anim'); }, 250);
      }
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable: session-only choice */ }
      labelToggle();
    });
  }

  /* ---------- Mobile menu ---------- */
  var nav = document.getElementById('nav');
  var menuBtn = document.querySelector('.nav__menu');
  var links = document.getElementById('nav-links');
  function setMenu(open, returnFocus) {
    menuBtn.setAttribute('aria-expanded', String(open));
    links.classList.toggle('is-open', open);
    if (!open && returnFocus) menuBtn.focus();
  }
  if (menuBtn && links) {
    menuBtn.hidden = false;
    menuBtn.addEventListener('click', function () {
      var open = menuBtn.getAttribute('aria-expanded') !== 'true';
      setMenu(open);
      if (open) { var first = links.querySelector('a'); if (first) first.focus(); }
    });
    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (menuBtn.getAttribute('aria-expanded') !== 'true') return;
      if (e.key === 'Escape') { setMenu(false, true); return; }
      if (e.key !== 'Tab') return;
      // Trap focus between the menu button and the last link while the sheet is open.
      var items = [menuBtn].concat(Array.prototype.slice.call(links.querySelectorAll('a')));
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    window.matchMedia('(min-width: 861px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });
  }

  /* ---------- Nav hides on scroll down, returns on scroll up ---------- */
  if (nav) {
    var lastY = window.scrollY, ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        var keep = y < 120 || nav.contains(document.activeElement) ||
          (menuBtn && menuBtn.getAttribute('aria-expanded') === 'true');
        if (keep || y < lastY - 4) nav.classList.remove('is-hidden');
        else if (y > lastY + 4) nav.classList.add('is-hidden');
        lastY = y;
        ticking = false;
      });
    }, { passive: true });
    nav.addEventListener('focusin', function () { nav.classList.remove('is-hidden'); });
  }

  /* ---------- Scroll-spy for the section index ---------- */
  var tocLinks = document.querySelectorAll('.toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    tocLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var visible = {};
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
      var active = null;
      document.querySelectorAll('.content > .section').forEach(function (s) {
        if (!active && visible[s.id]) active = s.id;
      });
      if (!active) return;
      tocLinks.forEach(function (a) { a.removeAttribute('aria-current'); });
      if (byId[active]) byId[active].setAttribute('aria-current', 'true');
    }, { rootMargin: '-35% 0px -55% 0px' });
    document.querySelectorAll('.content > .section').forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Reveal on first view (skipped for reduced motion) ---------- */
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var reveal = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        reveal.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.content > .section').forEach(function (section) {
      var kids = Array.prototype.slice.call(section.children, 0, 4);
      kids.forEach(function (el, i) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight) return; // already on screen: never hide it
        el.classList.add('reveal');
        el.style.setProperty('--d', (i * 0.04) + 's');
        reveal.observe(el);
      });
    });
  }

  /* ---------- Project "Approach" collapses on small screens ---------- */
  var small = window.matchMedia('(max-width: 720px)');
  function syncApproach() {
    document.querySelectorAll('.project__approach').forEach(function (d) { d.open = !small.matches; });
  }
  syncApproach();
  small.addEventListener('change', syncApproach);
  window.addEventListener('beforeprint', function () {
    document.querySelectorAll('.project__approach').forEach(function (d) { d.open = true; });
  });

  /* ---------- Copy BibTeX ---------- */
  var toast = document.getElementById('toast');
  var toastTimer;
  function say(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-on'); }, 1800);
  }
  if (navigator.clipboard) {
    document.querySelectorAll('[data-copy]').forEach(function (btn) {
      btn.hidden = false;
      btn.addEventListener('click', function () {
        var src = document.getElementById(btn.getAttribute('data-copy'));
        navigator.clipboard.writeText(src.textContent).then(
          function () { say('BibTeX copied'); },
          function () { say('Copy failed — select the text instead'); }
        );
      });
    });
  }
})();
