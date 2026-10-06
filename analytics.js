/* ChipSplit — métricas simples e sem cookies (GoatCounter), só se configurado em config.js.
 * Conta: visitas, jogos criados e jogos encerrados. Nada de nomes, valores ou dados pessoais. */
(function () {
  'use strict';
  var code = window.CHIPSPLIT_CONFIG && window.CHIPSPLIT_CONFIG.goatcounter;
  if (!code || !/^[a-z0-9-]+$/i.test(code)) return;
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.setAttribute('data-goatcounter', 'https://' + code + '.goatcounter.com/count');
  document.head.appendChild(s);
  function count(name) {
    var send = function () {
      if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: 'evento/' + name, title: name, event: true });
    };
    if (window.goatcounter && window.goatcounter.count) send(); else s.addEventListener('load', send);
  }
  document.addEventListener('chipsplit:game-created', function (e) { count('jogo-criado-' + ((e.detail && e.detail.type) || 'cash')); });
  document.addEventListener('chipsplit:game-finished', function (e) { count('jogo-encerrado-' + ((e.detail && e.detail.type) || 'cash')); });
})();
