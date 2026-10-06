/*
 * ChipSplit — conta, anúncios e "reabrir onde parou".
 *
 * Modos:
 *  - convidado: sem login, tudo salvo neste aparelho.
 *  - google: login com Google + nuvem (auth.js), quando config.firebase existir.
 *  - anúncios e Pro: só aparecem quando ligados em config.js (ou simulados com ?dev=1).
 */
(function () {
  'use strict';
  const KEY = 'chipsplit-account-v1';
  const INTERSTITIAL_EVERY_MS = 3 * 60 * 1000; // no máximo 1 anúncio grande a cada 3 min
  const SKIP_AFTER_S = 3;

  const $ = (id) => document.getElementById(id);
  const CFG = window.CHIPSPLIT_CONFIG || { showAds: false, showPro: false };

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(account)); } catch (e) { /* ignora */ }
  }

  let account = load(); // { mode: 'guest', pro: false, since, lastInterstitial }

  /* ---------- tela de boas-vindas ---------- */
  function showWelcome() {
    const dlg = $('dlgWelcome');
    dlg.showModal();
    $('welcomeGuest').focus();
  }
  $('welcomeGuest').addEventListener('click', () => {
    account = { mode: 'guest', pro: false, since: Date.now(), lastInterstitial: 0 };
    save();
    $('dlgWelcome').close();
    refresh();
  });
  // Esc não fecha a boas-vindas sem escolher
  $('dlgWelcome').addEventListener('cancel', (e) => e.preventDefault());

  /* ---------- chip da conta no topo ---------- */
  $('accountBtn').addEventListener('click', () => {
    if (!account) return showWelcome();
    if (window.ChipUI) return window.ChipUI.showView('profile');
    $('accMode').textContent = I18N.t(account.pro ? 'acc.mode_pro' : 'acc.mode_free');
    $('accSince').textContent = I18N.t('acc.since', { date: new Date(account.since).toLocaleDateString(I18N.locale()) });
    $('accPro').textContent = I18N.t(account.pro ? 'acc.go_free' : 'acc.go_pro');
    $('dlgAccount').showModal();
  });
  $('accPro').addEventListener('click', () => {
    account.pro = !account.pro;
    save();
    $('dlgAccount').close();
    refresh();
    toast(I18N.t(account.pro ? 'acc.pro_on' : 'acc.pro_off'));
  });

  function refresh() {
    const showAds = CFG.showAds && !!account && !account.pro;
    $('adBanner').hidden = !showAds;
    document.body.classList.toggle('has-banner', showAds);
    const prof = window.ChipProfile && window.ChipProfile.get();
    const user = window.ChipAuth && window.ChipAuth.user();
    $('accountLabel').textContent = !account ? I18N.t('acc.enter') : (prof && prof.name) ? prof.name : user ? (user.displayName || user.email) : I18N.t(account.pro ? 'acc.pro' : 'acc.guest');
    const note = $('welcomeNote');
    if (note) note.textContent = I18N.t(CFG.showAds ? 'welcome.note' : 'welcome.note_free');
    const av = $('accountAvatar');
    if (av) {
      av.hidden = !(prof && prof.photo);
      if (prof && prof.photo) av.src = prof.photo;
      $('accountIcon').hidden = !!(prof && prof.photo);
    }
  }

  /* ---------- anúncio intersticial ---------- */
  /** Mostra o anúncio grande (se for o caso) e resolve quando a pessoa fecha. */
  function maybeInterstitial() {
    return new Promise((resolve) => {
      if (!CFG.showAds || !account || account.pro) return resolve(false);
      const now = Date.now();
      if (now - (account.lastInterstitial || 0) < INTERSTITIAL_EVERY_MS) return resolve(false);
      account.lastInterstitial = now;
      save();
      const dlg = $('dlgAd');
      const skip = $('adSkip');
      let left = SKIP_AFTER_S;
      skip.disabled = true;
      skip.textContent = I18N.t('ad.skip_in', { n: left });
      dlg.showModal();
      const timer = setInterval(() => {
        left--;
        if (left <= 0) { clearInterval(timer); skip.disabled = false; skip.textContent = I18N.t('ad.skip'); skip.focus(); }
        else skip.textContent = I18N.t('ad.skip_in', { n: left });
      }, 1000);
      const done = () => { clearInterval(timer); dlg.close(); skip.onclick = null; $('adGoPro').onclick = null; resolve(true); };
      skip.onclick = done;
      $('adGoPro').onclick = () => { done(); $('accountBtn').click(); };
      dlg.oncancel = (e) => { if (left > 0) e.preventDefault(); else done(); };
    });
  }

  function toast(msg) {
    let el = $('toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg; el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 3000);
  }

  function togglePro() {
    if (!CFG.showPro) return;
    account.pro = !account.pro;
    save();
    refresh();
    toast(I18N.t(account.pro ? 'acc.pro_on' : 'acc.pro_off'));
    document.dispatchEvent(new CustomEvent('chipsplit:account'));
  }

  window.ChipAccount = {
    get: () => account,
    refresh,
    togglePro,
    maybeInterstitial,
    isGuest: () => !!account && account.mode === 'guest'
  };

  document.addEventListener('chipsplit:lang', refresh);
  document.addEventListener('chipsplit:profile', refresh);
  document.addEventListener('chipsplit:auth', refresh);
  window.ChipAccount.ensureGuest = () => {
    if (!account) { account = { mode: 'guest', pro: false, since: Date.now(), lastInterstitial: 0 }; save(); }
    if ($('dlgWelcome').open) $('dlgWelcome').close();
    refresh();
  };
  refresh();
  if (!account) showWelcome();
})();
