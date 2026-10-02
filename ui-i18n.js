/*
 * ChipSplit — escolha de idioma na tela.
 * Lê o idioma salvo (ou o do navegador), traduz os textos fixos do HTML
 * (data-i18n, data-i18n-aria, data-i18n-ph) e avisa as outras partes com o evento 'chipsplit:lang'.
 */
(function () {
  'use strict';
  var KEY = 'chipsplit-lang';

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* sem storage */ }
  I18N.setLang(saved || I18N.detect());

  function apply() {
    var lang = I18N.info();
    document.documentElement.lang = lang.locale;
    document.title = I18N.t('app.title');
    document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = I18N.t(el.getAttribute('data-i18n')); });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) { el.setAttribute('aria-label', I18N.t(el.getAttribute('data-i18n-aria'))); });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) { el.setAttribute('placeholder', I18N.t(el.getAttribute('data-i18n-ph'))); });
    document.querySelectorAll('select[data-lang-select]').forEach(function (sel) { sel.value = lang.code; });
  }

  function fillSelects() {
    document.querySelectorAll('select[data-lang-select]').forEach(function (sel) {
      sel.innerHTML = '';
      I18N.LANGS.forEach(function (l) {
        var o = document.createElement('option');
        o.value = l.code;
        o.textContent = l.name;
        sel.appendChild(o);
      });
      sel.value = I18N.getLang();
      sel.addEventListener('change', function () { setLang(sel.value); });
    });
  }

  function setLang(code) {
    I18N.setLang(code);
    try { localStorage.setItem(KEY, code); } catch (e) { /* ignora */ }
    apply();
    document.dispatchEvent(new CustomEvent('chipsplit:lang', { detail: { lang: code } }));
  }

  window.ChipLang = { apply: apply, setLang: setLang };
  fillSelects();
  apply();
})();
