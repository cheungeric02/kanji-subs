(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.KSFurigana = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var KANJI = /[一-鿿㐀-䶿々〆ヶ]/;
  var JP = /[぀-ヿ㐀-䶿一-鿿]/;

  function kata2hira(s) {
    return s.replace(/[ァ-ヶ]/g, function (c) {
      return String.fromCharCode(c.charCodeAt(0) - 0x60);
    });
  }
  function esc(s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function reEsc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  // Split a surface form into [{t, k}] runs; k = true for kanji runs.
  function runs(surface) {
    var out = [], cur = '', curK = null;
    for (var i = 0; i < surface.length; i++) {
      var ch = surface[i], k = KANJI.test(ch);
      if (curK === null || k === curK) { cur += ch; curK = k; }
      else { out.push({ t: cur, k: curK }); cur = ch; curK = k; }
    }
    if (cur) out.push({ t: cur, k: curK });
    return out;
  }

  // Align a token's hiragana reading with its surface. Returns
  // [{t, r}] where r is the furigana for that piece (or '' for kana pieces).
  function align(surface, readingKata) {
    if (!readingKata || !KANJI.test(surface)) return [{ t: surface, r: '' }];
    var reading = kata2hira(readingKata);
    var parts = runs(surface);
    var pattern = '^' + parts.map(function (p) {
      return p.k ? '(.+?)' : '(?:' + reEsc(kata2hira(p.t)) + ')';
    }).join('') + '$';
    var m;
    try { m = new RegExp(pattern).exec(reading); } catch (e) { m = null; }
    if (!m) return [{ t: surface, r: reading }];
    var gi = 1;
    return parts.map(function (p) {
      return p.k ? { t: p.t, r: m[gi++] } : { t: p.t, r: '' };
    });
  }

  // Tokens come from kuromoji's tokenizer.tokenize().
  function toHtml(tokens, furi) {
    var html = '';
    tokens.forEach(function (tk) {
      var surface = tk.surface_form;
      var pieces = furi ? align(surface, tk.reading) : [{ t: surface, r: '' }];
      var inner = pieces.map(function (p) {
        return p.r ? '<ruby>' + esc(p.t) + '<rt>' + esc(p.r) + '</rt></ruby>' : esc(p.t);
      }).join('');
      html += '<span class="ks-w">' + inner + '</span>';
    });
    return html;
  }

  return { KANJI: KANJI, JP: JP, kata2hira: kata2hira, align: align, toHtml: toHtml, esc: esc };
});
