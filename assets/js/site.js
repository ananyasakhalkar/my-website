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

  /* ---------- Custom cursor: mouse only, never with reduced motion ---------- */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduceMotion) {
    var cur = document.createElement('div');
    cur.className = 'cursor';
    cur.setAttribute('aria-hidden', 'true');
    cur.innerHTML = '<span class="cursor__dot"></span><span class="cursor__ring"><span></span></span>';
    document.body.appendChild(cur);
    root.classList.add('has-cursor');
    var cDot = cur.firstChild, cRing = cur.lastChild;
    var mx = 0, my = 0, rx = 0, ry = 0, cRaf = 0, seen = false;
    var follow = function () {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      cRing.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      cRaf = Math.abs(mx - rx) + Math.abs(my - ry) > 0.3 ? requestAnimationFrame(follow) : 0;
    };
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      if (!seen) { rx = mx; ry = my; seen = true; }
      cDot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      cur.classList.add('is-on');
      cur.classList.toggle('is-hover', !!(e.target.closest && e.target.closest('a, button, summary, .card')));
      if (!cRaf) cRaf = requestAnimationFrame(follow);
    }, { passive: true });
    document.addEventListener('mouseout', function (e) { if (!e.relatedTarget) cur.classList.remove('is-on'); });
    document.addEventListener('pointerdown', function () { cur.classList.add('is-down'); });
    document.addEventListener('pointerup', function () { cur.classList.remove('is-down'); });
  }

  /* ---------- Floating quick-links satellite: click to open, drag to move ---------- */
  var orbit = document.getElementById('orbit');
  if (orbit) {
    var oBtn = orbit.querySelector('.orbit__btn');
    var oPanel = document.getElementById('orbit-panel');
    var SIZE = 58, EDGE = 20;
    orbit.hidden = false;

    var setOpen = function (open, refocus) {
      oPanel.hidden = !open;
      oBtn.setAttribute('aria-expanded', String(open));
      if (open) { var first = oPanel.querySelector('a, button'); if (first) first.focus(); }
      else if (refocus) oBtn.focus();
    };
    var place = function (x, y) {
      orbit.style.left = x + 'px';
      orbit.style.top = y + 'px';
      orbit.style.right = 'auto';
      orbit.style.bottom = 'auto';
      orbit.classList.toggle('orbit--left', x + SIZE / 2 < window.innerWidth / 2);
      orbit.classList.toggle('orbit--top', y < 340);
    };
    // Snap to the nearest side; remember the side and height as a fraction of the viewport.
    var spot = null;
    var snap = function () {
      if (!spot) return;
      var x = spot.side === 'left' ? EDGE : window.innerWidth - SIZE - EDGE;
      var y = Math.min(Math.max(spot.y * window.innerHeight, 76), window.innerHeight - SIZE - EDGE);
      place(x, y);
    };
    try { spot = JSON.parse(localStorage.getItem('orbit') || 'null'); } catch (e) { spot = null; }
    snap();
    window.addEventListener('resize', snap);

    var drag = null, dragged = false;
    oBtn.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      var r = orbit.getBoundingClientRect();
      drag = { sx: e.clientX, sy: e.clientY, ox: r.left, oy: r.top, moved: false };
      oBtn.setPointerCapture(e.pointerId);
    });
    oBtn.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (!drag.moved) {
        if (Math.abs(dx) + Math.abs(dy) < 6) return;
        drag.moved = true;
        orbit.classList.remove('is-snapping');
        orbit.classList.add('is-dragging');
        setOpen(false);
      }
      place(drag.ox + dx, drag.oy + dy);
    });
    var endDrag = function () {
      if (!drag) return;
      var moved = drag.moved;
      drag = null;
      if (!moved) return;
      dragged = true;
      orbit.classList.remove('is-dragging');
      var r = orbit.getBoundingClientRect();
      spot = { side: r.left + r.width / 2 < window.innerWidth / 2 ? 'left' : 'right', y: r.top / window.innerHeight };
      orbit.classList.add('is-snapping');
      snap();
      try { localStorage.setItem('orbit', JSON.stringify(spot)); } catch (e) { /* position is session-only */ }
    };
    oBtn.addEventListener('pointerup', endDrag);
    oBtn.addEventListener('pointercancel', endDrag);
    oBtn.addEventListener('click', function () {
      if (dragged) { dragged = false; return; }
      setOpen(oBtn.getAttribute('aria-expanded') !== 'true');
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !oPanel.hidden) setOpen(false, true);
    });
    document.addEventListener('pointerdown', function (e) {
      if (!oPanel.hidden && !orbit.contains(e.target)) setOpen(false);
    });
    oPanel.addEventListener('click', function (e) {
      var el = e.target.closest('a, button');
      if (!el) return;
      var act = el.getAttribute('data-orbit');
      if (act === 'copy') {
        var email = 'sakhalkarananya@gmail.com';
        if (navigator.clipboard) navigator.clipboard.writeText(email).then(function () { say('Email address copied'); }, function () { say(email); });
        else say(email);
      } else if (act === 'theme' && toggle) {
        toggle.click();
        return; // keep the panel open so the change is visible
      }
      setOpen(false);
    });
    if (!toggle) { var t = oPanel.querySelector('[data-orbit="theme"]'); if (t) t.parentNode.hidden = true; }
  }
})();
