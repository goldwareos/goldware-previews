// PSNW mockup interactions: sticky-header shadow, phone menu, reveal-on-scroll, gentle hero parallax.
// Everything is off under prefers-reduced-motion; add ?static to the URL to show every section at once (screenshots).
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (/[?&]static\b/.test(location.search)) { root.classList.add('static'); reduce = true; [].forEach.call(document.querySelectorAll('img[loading="lazy"], iframe[loading="lazy"]'), function (i) { i.loading = 'eager'; if (i.tagName === 'IFRAME') { var s = i.src; i.src = s; } }); }

  var header = document.querySelector('.site-header');
  function onScroll() { if (header) header.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  var toggle = document.querySelector('.menu-toggle');
  var panel = document.getElementById('mobile-nav');
  if (toggle && panel) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      panel.classList.toggle('open', !open);
      toggle.querySelector('.label').textContent = open ? 'Menu' : 'Close';
    });
  }

  [].forEach.call(document.querySelectorAll('.map-facade'), function (f) {
    f.querySelector('.mf-btn').addEventListener('click', function () {
      var i = document.createElement('iframe'); i.src = f.getAttribute('data-src'); i.title = f.getAttribute('data-title');
      i.loading = 'lazy'; i.referrerPolicy = 'no-referrer-when-downgrade'; f.appendChild(i);
    });
  });

  var els = [].slice.call(document.querySelectorAll('.reveal'));
  if (reduce || !('IntersectionObserver' in window)) {
    els.forEach(function (e) { e.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (e) { io.observe(e); });
    setTimeout(function () { els.forEach(function (e) { if (e.getBoundingClientRect().top < innerHeight) e.classList.add('in'); }); }, 60);
  }

  var media = document.querySelector('.hero-media');
  if (media && !reduce) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var y = Math.min(window.scrollY, 900);
        media.style.transform = 'translate3d(0,' + (y * 0.18).toFixed(1) + 'px,0) scale(1.04)';
        ticking = false;
      });
    }, { passive: true });
    media.style.transform = 'scale(1.04)';
  }

  // SimpleChime chat (Dr. Smith's existing bot, same client_id as the live site). Loaded only after the page is
  // ready: on the first scroll, tap or key press, or 3.5 s after load, so it never competes with the first paint.
  var CHAT = 'https://widget.simplechime.com/static/js/nscript.js?client_id=TAfE07Z7eVOrMdG2SURS';
  var chatStarted = false;
  function loadChat() {
    if (chatStarted || document.getElementById('c_widget') || /[?&](static|nochat)\b/.test(location.search)) return;
    chatStarted = true;
    var jq = document.createElement('script');
    jq.src = 'https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js';
    jq.onload = function () {
      // nscript.js waits for window 'load', which has already fired: run those listeners now, then restore.
      var add = window.addEventListener;
      window.addEventListener = function (type, fn, opts) {
        if (type === 'load') { setTimeout(function () { typeof fn === 'function' ? fn.call(window, new Event('load')) : fn.handleEvent(new Event('load')); }); return; }
        return add.call(this, type, fn, opts);
      };
      var w = document.createElement('script'); w.id = 'c_widget'; w.src = CHAT;
      w.onload = w.onerror = function () { window.addEventListener = add; document.documentElement.classList.add('chat-ready'); };
      document.body.appendChild(w);
    };
    document.body.appendChild(jq);
  }
  ['scroll', 'pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, loadChat, { once: true, passive: true }); });
  window.addEventListener('load', function () { setTimeout(loadChat, 3500); });
})();
