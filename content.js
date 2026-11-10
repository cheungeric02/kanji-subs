(function () {
  'use strict';
  if (window.__ksLoaded) return;
  window.__ksLoaded = true;

  var F = window.KSFurigana;
  var DEFAULTS = { enabled: true, furigana: true, pauseOnHover: true, autoResume: false, scale: 1 };
  var S = Object.assign({}, DEFAULTS);

  var tokenizer = null, loading = false, loadFailed = false;
  var overlay = null, lastText = null, lastSig = '';
  var pausedByUs = false, resumeTimer = null, raf = 0;

  function loadSettings() {
    try {
      chrome.storage.sync.get(DEFAULTS, function (v) { S = Object.assign({}, DEFAULTS, v); schedule(true); });
      chrome.storage.onChanged.addListener(function (ch) {
        for (var k in ch) S[k] = ch[k].newValue;
        schedule(true);
      });
    } catch (e) { /* storage unavailable: use defaults */ }
  }

  function loadTokenizer() {
    if (tokenizer || loading || loadFailed) return;
    loading = true;
    window.kuromoji.builder({ dicPath: chrome.runtime.getURL('dict/') }).build(function (err, t) {
      loading = false;
      if (err) { loadFailed = true; console.warn('[Kanji Subs] dictionary failed to load', err); return; }
      tokenizer = t;
      schedule(true);
    });
  }

  function player() { return document.getElementById('movie_player') || document.querySelector('.html5-video-player'); }
  function video() { return document.querySelector('#movie_player video, video.html5-main-video'); }

  function readCaption() {
    var c = document.querySelector('.ytp-caption-window-container');
    if (!c) return '';
    var lines = Array.prototype.map.call(c.querySelectorAll('.caption-visual-line'), function (l) {
      return Array.prototype.map.call(l.querySelectorAll('.ytp-caption-segment'), function (s) { return s.textContent; }).join('');
    });
    if (!lines.length) {
      lines = Array.prototype.map.call(c.querySelectorAll('.ytp-caption-segment'), function (s) { return s.textContent; });
    }
    return lines.map(function (l) { return l.trim(); }).filter(Boolean).join('\n');
  }

  function ensureOverlay() {
    var p = player();
    if (!p) return null;
    if (overlay && overlay.parentNode === p) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'ks-overlay';
    overlay.style.display = 'none';
    ['click', 'dblclick', 'mousedown', 'mouseup', 'touchstart', 'touchend'].forEach(function (ev) {
      overlay.addEventListener(ev, function (e) { e.stopPropagation(); });
    });
    overlay.addEventListener('mouseenter', onEnter);
    overlay.addEventListener('mouseleave', onLeave);
    p.appendChild(overlay);
    return overlay;
  }

  function onEnter() {
    clearTimeout(resumeTimer);
    var v = video();
    if (S.pauseOnHover && v && !v.paused) { v.pause(); pausedByUs = true; }
  }
  function onLeave() {
    var v = video();
    if (S.autoResume && pausedByUs && v) {
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(function () {
        if (pausedByUs && v.paused) v.play();
        pausedByUs = false;
      }, 500);
    }
  }

  function hide() {
    var p = player();
    if (p) p.classList.remove('ks-active');
    if (overlay) overlay.style.display = 'none';
    lastText = null;
  }

  function render(force) {
    var o = ensureOverlay();
    var p = player();
    if (!o || !p) return;
    if (!S.enabled) { hide(); return; }

    var v = video();
    var frozen = o.matches(':hover') && v && v.paused && lastText;
    if (frozen && !force) return;

    var text = readCaption();
    if (!text || !F.JP.test(text)) { if (!frozen) hide(); return; }

    if (!tokenizer) { loadTokenizer(); return; }   // original captions stay visible meanwhile

    var sig = text + '|' + S.furigana + '|' + S.scale;
    if (sig === lastSig && o.style.display !== 'none') return;
    lastSig = sig;
    lastText = text;

    o.innerHTML = text.split('\n').map(function (line) {
      return '<div class="ks-line">' + F.toHtml(tokenizer.tokenize(line), S.furigana) + '</div>';
    }).join('');
    var h = p.clientHeight || 480;
    o.style.fontSize = Math.max(14, Math.round(h * 0.052 * S.scale)) + 'px';
    o.style.display = 'block';
    p.classList.add('ks-active');
  }

  function schedule(force) {
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = 0; try { render(force); } catch (e) { console.warn('[Kanji Subs]', e); } });
  }

  // Keep paused flag honest if the user presses play themselves.
  document.addEventListener('play', function () { pausedByUs = false; }, true);

  new MutationObserver(function () { schedule(false); })
    .observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  window.addEventListener('resize', function () { schedule(true); });
  document.addEventListener('yt-navigate-finish', function () { lastSig = ''; hide(); schedule(true); });

  loadSettings();
  schedule(true);
})();
