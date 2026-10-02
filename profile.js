/* ChipSplit — perfil: foto, nome, @, estatísticas, jogadores frequentes, amigos, preferências e dados */
(function () {
  'use strict';
  const CS = window.ChipSplit;
  const S = window.ChipSession;
  const T = I18N.t;
  const KEY = 'chipsplit-profile-v1';
  const VERSION = '0.6';
  const HANDLE_RE = /^[a-z0-9._]{3,20}$/;

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  let profile = load();
  function load() {
    try {
      const p = JSON.parse(localStorage.getItem(KEY));
      if (p && typeof p === 'object') return Object.assign(blank(), p);
    } catch (e) { /* sem storage */ }
    return blank();
  }
  function blank() { return { name: '', handle: '', photo: '', currency: '', meFirst: true, createdAt: Date.now() }; }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(profile)); }
    catch (e) { window.ChipUI && window.ChipUI.toast(T('live.save_fail')); }
    document.dispatchEvent(new CustomEvent('chipsplit:profile'));
  }

  window.ChipProfile = { get: () => profile };

  /* ---------- tela ---------- */
  const root = $('profileRoot');

  function initials(name) {
    return String(name || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  }

  function render() {
    const acc = (window.ChipAccount && window.ChipAccount.get()) || { pro: false, since: Date.now() };
    const games = window.ChipUI ? window.ChipUI.games() : [];
    const st = S.playerStats(games, profile.name);
    const freq = S.frequentPlayers(games, profile.name, window.ChipUI && window.ChipUI.isDefaultName);
    const money = (c, cur) => CS.formatMoney(c, cur);

    const statsBody = !profile.name
      ? `<p class="hint">${esc(T('prof.stats_need_name'))}</p>`
      : !st.games
        ? `<p class="hint">${esc(T('prof.stats_empty', { name: profile.name }))}</p>`
        : `<div class="stats">
            <div class="stat"><span>${esc(T('prof.st_games'))}</span><b>${st.games}</b><small>${esc(S.elapsed(st.minutes * 60000))}</small></div>
            <div class="stat"><span>${esc(T('prof.st_wins'))}</span><b>${st.wins}</b><small>${esc(T('prof.st_winrate', { p: Math.round(st.wins / st.games * 100) }))}</small></div>
            <div class="stat"><span>${esc(T('prof.st_balance'))}</span>${Object.keys(st.net).map((cur) => `<b class="${st.net[cur] > 0 ? 'pos-text' : st.net[cur] < 0 ? 'neg-text' : ''}">${st.net[cur] > 0 ? '+' : st.net[cur] < 0 ? '−' : ''}${money(Math.abs(st.net[cur]), cur)}</b>`).join('')}</div>
            <div class="stat"><span>${esc(T('prof.st_best'))}</span><b>${st.best ? '+' + money(st.best.cents, st.best.currency) : '—'}</b><small>${st.best ? esc(st.best.title) : ''}</small></div>
          </div>`;

    root.innerHTML = `
    <section class="panel profile-head">
      <div class="prof-main">
        <div class="prof-photo">
          ${profile.photo
            ? `<img src="${esc(profile.photo)}" alt="" class="prof-img">`
            : `<span class="prof-initials" aria-hidden="true">${esc(initials(profile.name))}</span>`}
        </div>
        <div class="prof-photo-actions">
          <label class="ghost file-btn small-file">${esc(T(profile.photo ? 'prof.photo_change' : 'prof.photo_add'))}<input id="profPhoto" type="file" accept="image/*"></label>
          ${profile.photo ? `<button type="button" class="link" data-p="photo-remove">${esc(T('prof.photo_remove'))}</button>` : ''}
        </div>
      </div>
      <form id="profForm" class="prof-form" novalidate>
        <div class="field">
          <label for="profName">${esc(T('prof.name'))}</label>
          <input id="profName" type="text" maxlength="40" autocomplete="name" value="${esc(profile.name)}">
          <small class="hint">${esc(T('prof.name_hint'))}</small>
        </div>
        <div class="field">
          <label for="profHandle">${esc(T('prof.handle'))}</label>
          <div class="handle-input"><span aria-hidden="true">@</span><input id="profHandle" type="text" maxlength="20" autocomplete="off" autocapitalize="none" spellcheck="false" value="${esc(profile.handle)}"></div>
          <small class="hint" id="profHandleHint">${esc(T('prof.handle_hint'))}</small>
        </div>
        <button type="submit" class="gold-btn">${esc(T('prof.save'))}</button>
      </form>
    </section>

    <section class="profile-grid">
      <div class="panel">
        <h2>${esc(T('prof.stats'))}</h2>
        ${statsBody}
      </div>

      <div class="panel">
        <h2>${esc(T('prof.account'))}</h2>
        <div class="acc-card">
          <b>${esc(T(acc.pro ? 'acc.mode_pro' : 'acc.mode_free'))}</b>
          <small>${esc(T('acc.since', { date: new Date(acc.since || Date.now()).toLocaleDateString(I18N.locale()) }))}</small>
        </div>
        <button type="button" class="gold-btn" data-p="pro">${esc(T(acc.pro ? 'acc.go_free' : 'acc.go_pro'))}</button>
        <button type="button" class="google-btn" disabled><span>${esc(T('welcome.google'))}</span> <span class="soon">${esc(T('welcome.soon'))}</span></button>
      </div>

      <div class="panel">
        <h2>${esc(T('prof.frequent'))}</h2>
        ${freq.length
          ? `<ul class="people">${freq.map((f, i) => `<li><span class="avatar sm" style="background:${['#D6453D', '#2F6FD6', '#2E9E5B', '#7A4CC2', '#E3B23C', '#E06AA0'][i % 6]}">${esc(initials(f.name))}</span><span>${esc(f.name)}</span><small>${esc(T(f.games === 1 ? 'prof.n_game' : 'prof.n_games', { n: f.games }))}</small></li>`).join('')}</ul>`
          : `<p class="hint">${esc(T('prof.frequent_empty'))}</p>`}
      </div>

      <div class="panel locked">
        <h2>${esc(T('prof.friends'))} <span class="soon">${esc(T('welcome.soon'))}</span></h2>
        <p class="hint">${esc(T('prof.friends_locked'))}</p>
        <div class="friend-add">
          <label class="sr" for="friendHandle">${esc(T('prof.friend_handle'))}</label>
          <div class="handle-input"><span aria-hidden="true">@</span><input id="friendHandle" type="text" placeholder="maria.silva" disabled></div>
          <button type="button" class="ghost" disabled>${esc(T('prof.add_friend'))}</button>
        </div>
      </div>

      <div class="panel">
        <h2>${esc(T('prof.settings'))}</h2>
        <div class="field">
          <label for="profLang">${esc(T('lang.label'))}</label>
          <select id="profLang">${I18N.LANGS.map((l) => `<option value="${l.code}" ${l.code === I18N.getLang() ? 'selected' : ''}>${esc(l.name)}</option>`).join('')}</select>
        </div>
        <div class="field">
          <label for="profCurrency">${esc(T('prof.default_currency'))}</label>
          <select id="profCurrency">${I18N.CURRENCIES.map((c) => `<option value="${c}" ${c === (profile.currency || I18N.info().currency) ? 'selected' : ''}>${esc(currencyLabel(c))}</option>`).join('')}</select>
        </div>
        <label class="check">
          <input id="profMeFirst" type="checkbox" ${profile.meFirst !== false ? 'checked' : ''}>
          <span>${esc(T('prof.me_first'))}<br><small class="hint">${esc(T('prof.me_first_hint'))}</small></span>
        </label>
      </div>

      <div class="panel">
        <h2>${esc(T('prof.data'))}</h2>
        <p class="hint">${esc(T('prof.data_help'))}</p>
        <button type="button" class="ghost" data-p="export">${esc(T('hist.export'))}</button>
        <button type="button" class="danger-outline" data-p="delete">${esc(T('prof.delete_all'))}</button>
        <p class="legal-links"><a href="privacidade.html">${esc(T('legal.privacy'))}</a> · <a href="termos.html">${esc(T('legal.terms'))}</a></p>
        <small class="hint">ChipSplit · ${esc(T('prof.version', { v: VERSION }))}</small>
      </div>
    </section>`;
  }

  function currencyLabel(code) {
    try {
      const sym = new Intl.NumberFormat(I18N.locale(), { style: 'currency', currency: code }).formatToParts(1).filter((p) => p.type === 'currency')[0].value;
      const name = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames([I18N.locale()], { type: 'currency' }).of(code) : code;
      return (sym === code ? code : sym) + ' — ' + name;
    } catch (e) { return code; }
  }

  /* ---------- foto: corta quadrado e reduz para 256 px ---------- */
  function readPhoto(file) {
    return new Promise((resolve, reject) => {
      if (!file || !/^image\//.test(file.type)) return reject(new Error('type'));
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('read'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('decode'));
        img.onload = () => {
          const size = 256;
          const side = Math.min(img.naturalWidth, img.naturalHeight);
          const c = document.createElement('canvas');
          c.width = size; c.height = size;
          c.getContext('2d').drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
          resolve(c.toDataURL('image/jpeg', 0.85));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* ---------- ações ---------- */
  root.addEventListener('submit', (e) => {
    if (e.target.id !== 'profForm') return;
    e.preventDefault();
    const handle = $('profHandle').value.trim().replace(/^@/, '').toLowerCase();
    if (handle && !HANDLE_RE.test(handle)) {
      const hint = $('profHandleHint');
      hint.textContent = T('prof.handle_invalid');
      hint.className = 'hint warn-text';
      $('profHandle').focus();
      return;
    }
    profile.name = $('profName').value.trim();
    profile.handle = handle;
    save();
    render();
    window.ChipUI.toast(T('prof.saved'));
  });

  root.addEventListener('change', async (e) => {
    const t = e.target;
    if (t.id === 'profPhoto' && t.files[0]) {
      try {
        profile.photo = await readPhoto(t.files[0]);
        save();
        render();
      } catch (err) {
        window.ChipUI.toast(T('prof.photo_error'));
      }
    }
    if (t.id === 'profLang') window.ChipLang.setLang(t.value);
    if (t.id === 'profCurrency') { profile.currency = t.value; save(); }
    if (t.id === 'profMeFirst') { profile.meFirst = t.checked; save(); }
  });

  root.addEventListener('input', (e) => {
    if (e.target.id === 'profHandle') {
      const v = e.target.value.toLowerCase().replace(/[^a-z0-9._@]/g, '');
      if (v !== e.target.value) e.target.value = v;
    }
  });

  root.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-p]');
    if (!b) return;
    const act = b.dataset.p;
    if (act === 'photo-remove') { profile.photo = ''; save(); render(); }
    if (act === 'pro') { window.ChipAccount.togglePro(); render(); }
    if (act === 'export') window.ChipUI.exportAll();
    if (act === 'delete') {
      if (!(await window.ChipUI.ask(T('prof.delete_ask'), T('prof.delete_btn'), true))) return;
      try {
        Object.keys(localStorage).filter((k) => k.indexOf('chipsplit') === 0).forEach((k) => localStorage.removeItem(k));
      } catch (err) { /* ignora */ }
      location.reload();
    }
  });

  document.addEventListener('chipsplit:view', (e) => { if (e.detail.view === 'profile') render(); });
  document.addEventListener('chipsplit:lang', () => { if (!$('view-profile').hidden) render(); });

  document.dispatchEvent(new CustomEvent('chipsplit:profile'));
  if (!$('view-profile').hidden) render();
})();
