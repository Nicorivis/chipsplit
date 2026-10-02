/* ChipSplit — páginas legais: mostra a versão no idioma escolhido no app (pt ou en). */
(function () {
  'use strict';
  var lang = 'pt';
  try { lang = localStorage.getItem('chipsplit-lang') || (navigator.language || 'pt').slice(0, 2); } catch (e) { /* sem storage */ }

  function show(code, original) {
    var doc = code === 'pt' ? 'pt' : 'en';
    document.querySelectorAll('[data-doc]').forEach(function (a) { a.hidden = a.getAttribute('data-doc') !== doc; });
    document.querySelectorAll('[data-doc-lang]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-doc-lang') === doc)); });
    document.querySelectorAll('[data-note-es]').forEach(function (n) { n.hidden = original !== 'es'; });
    document.querySelectorAll('[data-note-zh]').forEach(function (n) { n.hidden = original !== 'zh'; });
    document.documentElement.lang = doc === 'pt' ? 'pt-BR' : 'en';
    var h1 = document.querySelector('[data-doc="' + doc + '"] h1');
    if (h1) document.title = h1.textContent + ' — ChipSplit';
    var t = document.querySelector('[data-link-terms]');
    if (t) t.textContent = doc === 'pt' ? 'Termos de Uso' : 'Terms of Use';
    var p = document.querySelector('[data-link-privacy]');
    if (p) p.textContent = doc === 'pt' ? 'Política de Privacidade' : 'Privacy Policy';
  }

  document.querySelectorAll('[data-doc-lang]').forEach(function (b) {
    b.addEventListener('click', function () { show(b.getAttribute('data-doc-lang'), b.getAttribute('data-doc-lang')); });
  });
  show(lang, lang);
})();
