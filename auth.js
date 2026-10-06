/*
 * ChipSplit — login com Google e jogos na nuvem (Firebase).
 *
 * Só liga quando config.js tem os dados do projeto (CHIPSPLIT_CONFIG.firebase).
 * Sem isso, o app funciona normal no modo convidado.
 *
 * Nuvem (Firestore):
 *   users/{uid}                 → perfil (nome, @, foto, moeda)
 *   users/{uid}/games/{gameId}  → cada jogo (a mesma lista de eventos do app)
 * Regras de segurança: firestore.rules (cada pessoa só lê e escreve os próprios dados).
 */
(function () {
  'use strict';
  const CFG = window.CHIPSPLIT_CONFIG || {};
  const T = (k, p) => I18N.t(k, p);
  const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
  let user = null;
  let db = null;
  let pushTimer = null;

  const enabled = () => !!(CFG.firebase && CFG.firebase.apiKey);
  const toast = (m) => window.ChipUI && window.ChipUI.toast(m);
  const emit = () => document.dispatchEvent(new CustomEvent('chipsplit:auth'));

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('não carregou ' + src));
      document.head.appendChild(s);
    });
  }

  async function init() {
    if (!enabled()) return;
    try {
      await loadScript(SDK + 'firebase-app-compat.js');
      await loadScript(SDK + 'firebase-auth-compat.js');
      await loadScript(SDK + 'firebase-firestore-compat.js');
    } catch (e) {
      return; // sem internet: segue no modo convidado
    }
    firebase.initializeApp(CFG.firebase);
    db = firebase.firestore();
    try { db.enablePersistence({ synchronizeTabs: true }).catch(() => {}); } catch (e) { /* ignora */ }

    const wb = document.getElementById('welcomeGoogle');
    if (wb) {
      wb.disabled = false;
      const soon = document.getElementById('welcomeSoon');
      if (soon) soon.hidden = true;
      wb.addEventListener('click', signIn);
    }

    firebase.auth().getRedirectResult().catch((e) => toast(T('auth.error', { err: e.message || e.code })));
    firebase.auth().onAuthStateChanged(async (u) => {
      user = u;
      if (u) {
        if (window.ChipAccount) window.ChipAccount.ensureGuest();
        try { await pull(); } catch (e) { /* tenta de novo no próximo salvamento */ }
      }
      emit();
    });

    document.addEventListener('chipsplit:games-saved', schedulePush);
    document.addEventListener('chipsplit:profile', schedulePush);
    document.addEventListener('chipsplit:game-deleted', (e) => {
      if (user && e.detail && e.detail.id) userDoc().collection('games').doc(e.detail.id).delete().catch(() => {});
    });
  }

  const userDoc = () => db.collection('users').doc(user.uid);

  async function signIn() {
    if (!enabled() || !window.firebase) return;
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      try {
        await firebase.auth().signInWithPopup(provider);
      } catch (e) {
        if (/popup-blocked|popup-closed-by-browser|operation-not-supported/.test(e.code || '')) {
          await firebase.auth().signInWithRedirect(provider);
          return;
        }
        throw e;
      }
      toast(T('auth.signin_ok'));
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') toast(T('auth.error', { err: e.message || e.code }));
    }
  }

  async function signOut() {
    if (!user) return;
    await push().catch(() => {});
    await firebase.auth().signOut();
    toast(T('auth.signout_ok'));
  }

  /** Traz os jogos e o perfil da nuvem e junta com os do aparelho. */
  async function pull() {
    const snap = await userDoc().collection('games').get();
    const remote = [];
    snap.forEach((d) => { try { remote.push(JSON.parse(d.data().json)); } catch (e) { /* ignora doc estragado */ } });
    if (window.ChipUI) window.ChipUI.mergeGames(remote);
    const me = await userDoc().get();
    const cloud = me.exists && me.data().profile;
    if (cloud && window.ChipProfile) {
      const local = window.ChipProfile.get();
      const patch = {};
      ['name', 'handle', 'photo', 'currency'].forEach((k) => { if (!local[k] && cloud[k]) patch[k] = cloud[k]; });
      if (!local.name && !cloud.name && user.displayName) patch.name = user.displayName;
      if (Object.keys(patch).length) window.ChipProfile.set(patch);
    } else if (window.ChipProfile && !window.ChipProfile.get().name && user.displayName) {
      window.ChipProfile.set({ name: user.displayName });
    }
    await push();
  }

  function schedulePush() {
    if (!user) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => push().catch(() => {}), 1200);
  }

  /** Envia jogos e perfil do aparelho para a nuvem. */
  async function push() {
    if (!user || !db || !window.ChipUI) return;
    const games = window.ChipUI.games();
    const now = Date.now();
    for (let i = 0; i < games.length; i += 400) {
      const batch = db.batch();
      games.slice(i, i + 400).forEach((g) => {
        batch.set(userDoc().collection('games').doc(g.id), { json: JSON.stringify(g), createdAt: g.createdAt || now, updatedAt: now });
      });
      await batch.commit();
    }
    const p = window.ChipProfile ? window.ChipProfile.get() : {};
    await userDoc().set({
      profile: { name: p.name || '', handle: p.handle || '', photo: p.photo || '', currency: p.currency || '' },
      updatedAt: now
    }, { merge: true });
  }

  /** Apaga a conta e tudo o que está na nuvem (os jogos do aparelho ficam). */
  async function deleteAccount() {
    if (!user) return;
    try {
      const snap = await userDoc().collection('games').get();
      for (let i = 0; i < snap.docs.length; i += 400) {
        const batch = db.batch();
        snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
      await userDoc().delete();
      await user.delete();
      user = null;
      toast(T('auth.deleted'));
      emit();
    } catch (e) {
      if (e.code === 'auth/requires-recent-login') toast(T('auth.relogin'));
      else toast(T('auth.error', { err: e.message || e.code }));
    }
  }

  window.ChipAuth = { enabled, user: () => user, signIn, signOut, deleteAccount };
  init();
})();
