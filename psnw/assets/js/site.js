// PSNW mockup interactions: sticky-header shadow, phone menu, reveal-on-scroll, gentle hero parallax.
// Everything is off under prefers-reduced-motion; add ?static to the URL to show every section at once (screenshots).
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (/[?&]static\b/.test(location.search)) { root.classList.add('static'); reduce = true; [].forEach.call(document.querySelectorAll('img[loading="lazy"], iframe[loading="lazy"]'), function (i) { i.loading = 'eager'; if (i.tagName === 'IFRAME') { var s = i.src; i.src = s; } }); }

  var header = document.querySelector('.site-header');
  function onScroll() { if (header) { header.classList.toggle('scrolled', window.scrollY > 8); header.classList.toggle('condensed', window.scrollY > 80); root.classList.toggle('hdr-condensed', window.scrollY > 52); } }
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
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { toggle.click(); toggle.focus(); }
    });
  }

  [].forEach.call(document.querySelectorAll('.map-static'), function (f) {
    var btn = f.querySelector('.mf-btn');
    btn.addEventListener('click', function () {
      var i = document.createElement('iframe'); i.src = f.getAttribute('data-src'); i.title = f.getAttribute('data-title');
      i.referrerPolicy = 'no-referrer-when-downgrade'; f.appendChild(i); btn.remove();
    });
  });

  // Mockup form: say clearly that nothing is sent (at launch this posts to his HighLevel form)
  [].forEach.call(document.querySelectorAll('form[data-mock]'), function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var s = f.querySelector('.form-status');
      if (!f.checkValidity()) { var bad = f.querySelector(':invalid'); s.textContent = 'Please fill in ' + (bad && bad.labels && bad.labels[0] ? bad.labels[0].textContent.replace('*', '').trim().toLowerCase() : 'the required fields') + '.'; if (bad) bad.focus(); return; }
      s.textContent = 'Preview only: this form does not send yet. Please call 208-400-5131.';
    });
  });

  // Office preselect (?office=spokane) on the request form
  var sel = document.getElementById('of'), m = location.search.match(/[?&]office=([a-z]+)/);
  if (sel && m && sel.querySelector('option[value="' + m[1] + '"]')) sel.value = m[1];

  // Open a question when linked to directly (faq.html#brca)
  function openHash() { var t = location.hash && document.getElementById(location.hash.slice(1)); if (t && t.tagName === 'DETAILS') t.open = true; }
  openHash(); window.addEventListener('hashchange', openHash);

  // Phone: the sticky Call/Request bar waits until the hero's own buttons are out of view
  var heroBtns = document.querySelector('.hero-actions');
  if (heroBtns && heroBtns.getBoundingClientRect().top < innerHeight && 'IntersectionObserver' in window && !root.classList.contains('static')) {
    root.classList.add('bar-wait');
    new IntersectionObserver(function (en) { root.classList.toggle('bar-wait', en[0].isIntersecting || en[0].boundingClientRect.top > 0); }).observe(heroBtns);
  }

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
        media.style.transform = 'translate3d(0,' + (y * 0.045).toFixed(1) + 'px,0) scale(1.04)';  // at most ~40px over the hero
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
      w.onload = w.onerror = function () {
        window.addEventListener = add; document.documentElement.classList.add('chat-ready');
        // SimpleChime renders decorative images without alt text: mark them decorative as they appear
        var fix = function () { [].forEach.call(document.querySelectorAll('[class*="_sc"] img:not([alt])'), function (i) { i.alt = ''; }); };
        fix(); if ('MutationObserver' in window) new MutationObserver(fix).observe(document.body, { childList: true, subtree: true });
        // Loading state: SimpleChime opens an empty window for several seconds before the greeting arrives
        document.addEventListener('click', function (e) {
          if (!e.target.closest || !e.target.closest('.chaticon_sc')) return;
          setTimeout(function () {
            var w = document.querySelector('.widget_sc');
            if (!w || w.querySelector('.chat-loading') || w.querySelector('.menuChips, .botAvatar_sc')) return;
            var d = document.createElement('div'); d.className = 'chat-loading'; d.setAttribute('role', 'status');
            d.innerHTML = '<span class="spin" aria-hidden="true"></span><b>Starting chat…</b><span>Or call <a href="tel:+12084005131">208-400-5131</a>, Mon to Fri, 8 to 5.</span>';
            w.appendChild(d);
            var done = function () { if (w.querySelector('.menuChips, .botAvatar_sc')) { d.remove(); ob.disconnect(); } };
            var ob = new MutationObserver(done); ob.observe(w, { childList: true, subtree: true });
            setTimeout(function () { if (d.isConnected) d.querySelector('b').textContent = 'Chat is taking a while.'; }, 12000);
          }, 50);
        }, true);
      };
      document.body.appendChild(w);
    };
    document.body.appendChild(jq);
  }
  function armChat() {
    ['scroll', 'pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, loadChat, { once: true, passive: true }); });
    setTimeout(loadChat, 3500);
  }
  // A prerendered page (hover prefetch) must not start the chat until the visitor actually lands on it
  if (document.prerendering) document.addEventListener('prerenderingchange', armChat, { once: true });
  else if (document.readyState === 'complete') armChat(); else window.addEventListener('load', armChat);
})();
