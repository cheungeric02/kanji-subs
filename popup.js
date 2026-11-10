var DEFAULTS = { enabled: true, furigana: true, pauseOnHover: true, autoResume: false, scale: 1 };
chrome.storage.sync.get(DEFAULTS, function (v) {
  Object.keys(DEFAULTS).forEach(function (k) {
    var el = document.getElementById(k);
    if (typeof DEFAULTS[k] === 'boolean') el.checked = v[k]; else el.value = v[k];
    el.addEventListener('input', function () {
      var o = {};
      o[k] = typeof DEFAULTS[k] === 'boolean' ? el.checked : parseFloat(el.value);
      chrome.storage.sync.set(o);
    });
  });
});
