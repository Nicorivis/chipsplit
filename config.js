/*
 * ChipSplit — configuração do que está ligado no site.
 *
 *  ads      anúncios reais (AdSense/AdMob). Desligado até existir conta aprovada.
 *  pro      assinatura Pro com pagamento real. Desligado até ter pagamento.
 *  firebase dados do projeto Firebase (login Google + nuvem). null = só modo convidado.
 *
 * Modo teste: abrir o site com ?dev=1 liga anúncios e Pro SIMULADOS neste aparelho.
 * ?dev=0 desliga de novo.
 */
window.CHIPSPLIT_CONFIG = {
  version: '0.9',
  ads: false,
  pro: false,
  firebase: null
  // firebase: { apiKey: '...', authDomain: '...', projectId: '...', appId: '...' }
};

(function () {
  try {
    if (/[?&]dev=1\b/.test(location.search)) localStorage.setItem('chipsplit-dev', '1');
    if (/[?&]dev=0\b/.test(location.search)) localStorage.removeItem('chipsplit-dev');
    window.CHIPSPLIT_CONFIG.dev = localStorage.getItem('chipsplit-dev') === '1';
  } catch (e) {
    window.CHIPSPLIT_CONFIG.dev = false;
  }
  // No modo teste, anúncios e Pro aparecem simulados.
  window.CHIPSPLIT_CONFIG.showAds = window.CHIPSPLIT_CONFIG.ads || window.CHIPSPLIT_CONFIG.dev;
  window.CHIPSPLIT_CONFIG.showPro = window.CHIPSPLIT_CONFIG.pro || window.CHIPSPLIT_CONFIG.dev;
})();
