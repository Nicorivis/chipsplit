/*
 * ChipSplit — app instalável (PWA).
 * - Registra o service worker (só em http/https, não em arquivo local).
 * - Mostra o botão "Instalar app" quando o navegador permite.
 * - No iPhone (Safari), explica como adicionar à Tela de Início.
 */
(function () {
  'use strict';
  const T = (k) => I18N.t(k);
  const btn = document.getElementById('installBtn');
  const standalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  let deferred = null;

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => { /* sem service worker: o site funciona igual */ });
    });
  }

  function show(on) { if (btn) btn.hidden = !on || standalone(); }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    show(true);
  });

  window.addEventListener('appinstalled', () => {
    deferred = null;
    show(false);
    if (window.ChipUI) window.ChipUI.toast(T('pwa.installed'));
  });

  if (isIOS && !standalone()) show(true);

  if (btn) btn.addEventListener('click', async () => {
    if (deferred) {
      deferred.prompt();
      const choice = await deferred.userChoice.catch(() => null);
      deferred = null;
      if (choice && choice.outcome === 'accepted') show(false);
      return;
    }
    if (window.ChipUI) window.ChipUI.ask(T(isIOS ? 'pwa.ios_help' : 'pwa.other_help'), T('common.close'), false, true);
  });

  window.ChipPWA = { canInstall: () => !!deferred || (isIOS && !standalone()), isApp: standalone };
})();
