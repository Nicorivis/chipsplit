/* ChipSplit — partida ao vivo, contagem final, resultado e histórico */
(function () {
  'use strict';
  const CS = window.ChipSplit;
  const S = window.ChipSession;
  const KEY = 'chipsplit-games-v1';
  const AVATAR = ['#D6453D', '#2F6FD6', '#2E9E5B', '#7A4CC2', '#E3B23C', '#E06AA0', '#1F8A8A', '#C76B2B', '#5B6B8C', '#8C5B6B'];

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const T = I18N.t;
  const fmt = (g, c) => CS.formatMoney(c, g.config.currency);
  const ads = () => (window.ChipAccount ? window.ChipAccount.maybeInterstitial() : Promise.resolve(false));

  /* ---------------- armazenamento ---------------- */
  let store = load();
  const ui = { view: 'calc', counting: false, finals: {} };

  function load() {
    try {
      const j = JSON.parse(localStorage.getItem(KEY));
      if (j && Array.isArray(j.games)) return j;
    } catch (e) { /* sem storage */ }
    return { games: [], activeId: null };
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(store)); }
    catch (e) { toast(T('live.save_fail')); }
    $('liveDot').hidden = !runningGame();
  }
  const activeGame = () => store.games.find((g) => g.id === store.activeId) || null;
  const runningGame = () => store.games.find((g) => !S.isEnded(g)) || null;

  /* ---------------- abas ---------------- */
  function showView(name) {
    ui.view = name;
    try { localStorage.setItem('chipsplit-ui-view', name); } catch (e) { /* ignora */ }
    ['calc', 'live', 'history', 'profile'].forEach((v) => { $('view-' + v).hidden = v !== name; });
    document.dispatchEvent(new CustomEvent('chipsplit:view', { detail: { view: name } }));
    document.querySelectorAll('.tab').forEach((t) => {
      if (t.dataset.view === name) t.setAttribute('aria-current', 'page');
      else t.removeAttribute('aria-current');
    });
    if (name === 'live') renderLive();
    if (name === 'history') renderHistory();
    window.scrollTo(0, 0);
  }
  document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => {
    if (t.dataset.view === 'live' && !activeGame() && runningGame()) store.activeId = runningGame().id;
    showView(t.dataset.view);
  }));

  /* ---------------- começar jogo (vem da calculadora) ---------------- */
  document.addEventListener('chipsplit:start', async (e) => {
    const { result: r, currency } = e.detail;
    const running = runningGame();
    if (running && !(await ask(T('live.running_ask', { title: running.title }), T('live.start_other')))) return;
    const startChips = {};
    r.rows.forEach((x) => { if (x.used) startChips[String(x.id)] = x.count; });
    const names = [];
    for (let i = 1; i <= r.players; i++) names.push(T('player.default', { n: i }));
    const me = window.ChipProfile && window.ChipProfile.get();
    if (me && me.name && me.meFirst !== false) names[0] = me.name;
    const g = S.createSession({
      currency, buyIn: r.buyIn, bigBlind: r.bigBlind, smallBlind: r.smallBlind,
      chipsPerPlayer: r.chipsPerPlayer,
      chips: r.rows.filter((x) => x.value > 0).map((x) => ({ id: String(x.id), name: x.name, color: x.color, qty: x.qty, value: x.value })),
      startChips, players: names
    });
    store.games.unshift(g);
    store.activeId = g.id;
    ui.counting = false;
    save();
    const fx = window.ChipFX ? window.ChipFX.deal(r.players, T('fx.dealing')) : Promise.resolve();
    fx.then(ads).then(() => {
      showView('live');
      toast(T('live.started_toast', { name: T('player.default', { n: 1 }) }));
    });
  });

  /* ---------------- render principal ---------------- */
  const root = $('liveRoot');

  /* nomes já usados (para sugerir ao digitar) */
  function fillKnownNames() {
    const dl = $('knownNames');
    if (!dl) return;
    const me = window.ChipProfile && window.ChipProfile.get();
    const names = S.frequentPlayers(store.games, '', isDefaultName).map((x) => x.name);
    if (me && me.name && names.indexOf(me.name) < 0) names.unshift(me.name);
    dl.innerHTML = names.map((n) => `<option value="${esc(n)}"></option>`).join('');
  }
  function isDefaultName(name) {
    return I18N.LANGS.some((l, i) => new RegExp('^' + I18N.DICT['player.default'][i].replace('{n}', '\\d+') + '$').test(String(name).trim()));
  }

  function renderLive() {
    fillKnownNames();
    const g = activeGame();
    if (!g) {
      root.innerHTML = `<div class="panel empty">
        <h2>${esc(T('live.empty_title'))}</h2>
        <p>${esc(T('live.empty_text'))}</p>
        <div class="actions"><button class="primary" data-act="goto-calc">${esc(T('live.goto_calc'))}</button></div>
      </div>`;
      return;
    }
    const d = S.derive(g);
    if (d.ended) renderResults(g, d);
    else if (ui.counting) renderCounting(g, d);
    else renderRunning(g, d);
  }

  function avatar(i, name) {
    const ini = String(name || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
    return `<span class="avatar" style="background:${AVATAR[i % AVATAR.length]}">${esc(ini)}</span>`;
  }
  function chipDots(g, chips) {
    const parts = g.config.chips.filter((c) => chips && chips[c.id])
      .map((c) => `<span class="cdot"><span class="dot sm" style="background:${esc(c.color)}"></span>×${chips[c.id]}</span>`);
    return parts.length ? parts.join('') : '<span class="hint">—</span>';
  }

  /* ----- jogo rodando ----- */
  function renderRunning(g, d) {
    const blinds = g.config.bigBlind ? (g.config.smallBlind ? fmt(g, g.config.smallBlind) + ' / ' : '') + fmt(g, g.config.bigBlind) : T('live.no_blinds');
    const last = g.events[g.events.length - 1];
    const canUndo = last && last.type !== 'start' && !last.initial;
    root.innerHTML = `
    <section class="panel game-head">
      <div class="title-row">
        <label class="sr" for="gameTitle">${esc(T('live.game_name'))}</label>
        <input id="gameTitle" class="title-input" value="${esc(g.title)}" data-field="title">
        <span class="badge live">${esc(T('live.badge_live'))}</span>
      </div>
      <div class="stats">
        <div class="stat"><span>${esc(T('live.duration'))}</span><b id="elapsed">${S.elapsed(Date.now() - d.startedAt)}</b><small>${esc(T('live.started_at', { t: S.clock(d.startedAt) }))}</small></div>
        <div class="stat"><span>${esc(T('live.total_in'))}</span><b>${fmt(g, d.totalIn)}</b><small>${esc(T('live.buyin_is', { v: fmt(g, g.config.buyIn) }))}</small></div>
        <div class="stat"><span>${esc(T('live.on_table'))}</span><b class="gold">${fmt(g, d.onTable)}</b><small>${esc(T('live.n_playing', { n: d.active }))}</small></div>
        <div class="stat"><span>${esc(T('live.blinds'))}</span><b>${blinds}</b><small>${esc(T('live.n_players_total', { n: d.players.length }))}</small></div>
      </div>
      <div class="actions">
        <button class="primary" data-act="join">${esc(T('live.join'))}</button>
        <button class="ghost" data-act="undo" ${canUndo ? '' : 'disabled'}>${esc(T('live.undo'))}</button>
        <button class="gold-btn" data-act="count" ${d.active ? '' : 'disabled'}>${esc(T('live.count'))}</button>
      </div>
    </section>

    <section class="players-grid">
      ${d.players.map((p, i) => `
      <article class="player ${p.active ? '' : 'out'}" data-card="${p.id}">
        <div class="p-top">
          ${avatar(i, p.name)}
          <label class="sr" for="pn-${p.id}">${esc(T('live.player_name'))}</label>
          <input id="pn-${p.id}" class="p-name" value="${esc(p.name)}" data-rename="${p.id}" list="knownNames" enterkeyhint="done" autocomplete="off">
          <button type="button" class="ok-btn" data-act="rename" data-pid="${p.id}" aria-label="${esc(T('live.rename_ok'))}" title="${esc(T('live.rename_ok'))}" hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"></path></svg>
          </button>
          <span class="badge ${p.active ? 'on' : ''}">${esc(T(p.active ? 'live.playing' : 'live.out'))}</span>
        </div>
        <div class="p-stats">
          <div><span>${esc(T('live.put_in'))}</span><b>${fmt(g, p.invested)}</b></div>
          <div><span>${esc(T('live.rebuys'))}</span><b>${p.rebuys}</b></div>
          ${p.cashedOut ? `<div><span>${esc(T('live.cashed'))}</span><b>${fmt(g, p.cashedOut)}</b></div>` : ''}
        </div>
        <div class="p-chips" title="${esc(T('live.chips_received'))}">${chipDots(g, p.chipsIn)}</div>
        <div class="p-actions">
          ${p.active
            ? `<button class="small" data-act="rebuy" data-pid="${p.id}">${esc(T('live.rebuy'))}</button>
               <button class="small ghost" data-act="cash" data-pid="${p.id}">${esc(T('live.cash'))}</button>`
            : `<button class="small" data-act="rebuy" data-pid="${p.id}">${esc(T('live.back'))}</button>`}
        </div>
      </article>`).join('')}
    </section>

    <section class="two-col">
      <div class="panel">
        <h2>${esc(T('live.bank'))}</h2>
        <ul class="bank">${bankRows(g, d)}</ul>
        <p class="hint">${esc(T('live.bank_help'))}</p>
      </div>
      <div class="panel">
        <h2>${esc(T('live.log'))}</h2>
        ${logHTML(g, d)}
      </div>
    </section>`;
  }

  function bankRows(g, d) {
    return g.config.chips.map((c) => {
      const n = d.bank[c.id] || 0;
      return `<li><span class="dot" style="background:${esc(c.color)}"></span><span>${esc(c.name)} <small>${fmt(g, c.value)}</small></span><b class="${n < 0 ? 'neg' : n < 10 ? 'low' : ''}">${n}</b><small>${esc(T('live.of_n', { n: c.qty }))}</small></li>`;
    }).join('');
  }

  function logHTML(g, d) {
    const items = g.events.slice().reverse().map((ev) => `
      <li class="ev ev-${ev.type}">
        <time datetime="${new Date(ev.at).toISOString()}">${S.clock(ev.at)}</time>
        <small>+${S.elapsed(ev.at - d.startedAt)}</small>
        <span>${esc(S.describe(g, ev))}</span>
      </li>`).join('');
    return `<ol class="log">${items}</ol>`;
  }

  /* ----- contagem final ----- */
  function renderCounting(g, d) {
    const playing = d.players.filter((p) => p.active);
    playing.forEach((p) => { if (!ui.finals[p.id]) ui.finals[p.id] = { mode: 'chips', chips: {}, value: '' }; });
    root.innerHTML = `
    <section class="panel game-head">
      <h2>${esc(T('count.title'))}</h2>
      <p class="hint">${esc(T('count.help'))}</p>
      <div class="stats">
        <div class="stat"><span>${esc(T('count.on_table'))}</span><b class="gold">${fmt(g, d.onTable)}</b><small>${esc(T('count.must_match'))}</small></div>
        <div class="stat"><span>${esc(T('count.counted'))}</span><b id="countedTotal">—</b><small id="countedDiff"></small></div>
      </div>
      <div class="actions">
        <button class="ghost" data-act="count-cancel">${esc(T('live.back'))}</button>
        <button class="gold-btn" data-act="finish">${esc(T('count.finish'))}</button>
      </div>
    </section>
    <section class="count-grid">
      ${playing.map((p) => {
        const i = d.players.indexOf(p);
        const f = ui.finals[p.id];
        return `
        <article class="player counting" data-pid="${p.id}">
          <div class="p-top">${avatar(i, p.name)}<b class="p-title">${esc(p.name)}</b><b class="p-value" id="fv-${p.id}">—</b></div>
          <div class="felt"><div class="stacks" id="fs-${p.id}"></div></div>
          <div class="seg" role="group" aria-label="${esc(T('count.by'))}">
            <button type="button" data-act="fmode" data-pid="${p.id}" data-mode="chips" aria-pressed="${f.mode === 'chips'}">${esc(T('count.by_chips'))}</button>
            <button type="button" data-act="fmode" data-pid="${p.id}" data-mode="value" aria-pressed="${f.mode === 'value'}">${esc(T('count.by_value'))}</button>
          </div>
          <div class="chip-pick" id="fp-${p.id}" ${f.mode === 'chips' ? '' : 'hidden'}></div>
          <div class="field" ${f.mode === 'value' ? '' : 'hidden'}>
            <label for="fval-${p.id}">${esc(T('count.final_value'))}</label>
            <input id="fval-${p.id}" class="money" inputmode="decimal" value="${esc(f.value)}" data-fval="${p.id}">
          </div>
        </article>`;
      }).join('')}
    </section>`;
    playing.forEach((p) => {
      mountPick($('fp-' + p.id), g, ui.finals[p.id].chips, { onChange: () => updateCounting(g, d) });
    });
    updateCounting(g, d);
  }

  function finalValue(g, f) {
    return f.mode === 'chips' ? S.valueOf(g, f.chips) : CS.toCents(f.value);
  }
  function updateCounting(g, d) {
    let sum = 0;
    d.players.filter((p) => p.active).forEach((p) => {
      const f = ui.finals[p.id];
      const v = finalValue(g, f);
      sum += v;
      const el = $('fv-' + p.id); if (el) el.textContent = fmt(g, v);
      const st = $('fs-' + p.id);
      if (st) st.innerHTML = f.mode === 'chips' ? stacksHTML(g, f.chips, false) : `<div class="value-only">${fmt(g, v)}</div>`;
    });
    const diff = sum - d.onTable;
    $('countedTotal').textContent = fmt(g, sum);
    const dd = $('countedDiff');
    dd.textContent = diff === 0 ? T('count.match') : T(diff > 0 ? 'count.over' : 'count.under', { v: fmt(g, Math.abs(diff)) });
    dd.className = diff === 0 ? 'ok-text' : 'warn-text';
  }

  /* ----- resultado ----- */
  function renderResults(g, d) {
    const st = S.settle(g);
    const ranked = d.players.slice().sort((a, b) => b.net - a.net);
    const delayOf = (rank) => Math.min(rank * 220, 1100);
    root.innerHTML = `
    <section class="panel game-head">
      <div class="title-row">
        <label class="sr" for="gameTitle">${esc(T('live.game_name'))}</label>
        <input id="gameTitle" class="title-input" value="${esc(g.title)}" data-field="title">
        <span class="badge">${esc(T('live.badge_ended'))}</span>
      </div>
      <div class="stats">
        <div class="stat"><span>${esc(T('res.date'))}</span><b>${new Date(d.startedAt).toLocaleDateString(I18N.locale())}</b><small>${S.clock(d.startedAt)} → ${S.clock(d.endedAt)}</small></div>
        <div class="stat"><span>${esc(T('live.duration'))}</span><b>${S.elapsed(d.endedAt - d.startedAt)}</b><small>${esc(T('res.n_players', { n: d.players.length }))}</small></div>
        <div class="stat"><span>${esc(T('res.in'))}</span><b>${fmt(g, d.totalIn)}</b><small>${esc(T('res.out', { v: fmt(g, d.totalOut) }))}</small></div>
      </div>
      ${d.difference !== 0 ? `<p class="msg warn">${esc(T('res.diff', { what: T(d.difference > 0 ? 'sum.over' : 'sum.under'), v: fmt(g, Math.abs(d.difference)) }))}</p>` : `<p class="msg ok">${esc(T('res.match'))}</p>`}
      <div class="actions">
        <button class="primary" data-act="copy">${esc(T('res.copy'))}</button>
        <button class="ghost" data-act="export-one">${esc(T('res.export'))}</button>
        <button class="ghost" data-act="reopen">${esc(T('res.reopen'))}</button>
        <button class="ghost" data-act="goto-calc">${esc(T('res.new'))}</button>
      </div>
    </section>

    <section class="results-grid">
      ${ranked.map((p, rank) => {
        const i = d.players.indexOf(p);
        const lc = p.lastCashout;
        const chips = lc && lc.chips;
        return `
        <article class="player result-card" style="--delay:${delayOf(rank)}ms">
          <div class="p-top">${avatar(i, p.name)}<b class="p-title">${esc(p.name)}</b>
            <span class="net ${p.net > 0 ? 'pos' : p.net < 0 ? 'neg' : ''}">${p.net > 0 ? '+' : p.net < 0 ? '−' : ''}${fmt(g, Math.abs(p.net))}</span></div>
          <div class="felt"><div class="stacks">${chips ? stacksHTML(g, chips, true, delayOf(rank)) : `<div class="value-only">${fmt(g, p.cashedOut)}<small>${lc ? esc(T('res.by_value')) : ''}</small></div>`}</div></div>
          <div class="p-stats">
            <div><span>${esc(T('live.put_in'))}</span><b>${fmt(g, p.invested)}</b></div>
            <div><span>${esc(T('res.left_with'))}</span><b data-countmoney="${p.cashedOut}" data-cur="${g.config.currency}" style="--delay:${delayOf(rank)}ms">${fmt(g, p.cashedOut)}</b></div>
            <div><span>${esc(T('res.entries'))}</span><b>${p.entries + p.rebuys}</b></div>
          </div>
        </article>`;
      }).join('')}
    </section>

    <section class="two-col">
      <div class="panel">
        <h2>${esc(T('res.who_pays'))}</h2>
        ${st.transfers.length ? `<ul class="transfers">${st.transfers.map((t) => `
          <li><b>${esc(t.fromName)}</b><span class="arrow">→</span><b>${esc(t.toName)}</b><span class="amt">${fmt(g, t.amount)}</span></li>`).join('')}</ul>`
          : `<p class="hint">${esc(T('res.nobody'))}</p>`}
        ${st.unpaid || st.unreceived ? `<p class="msg warn">${esc(st.unpaid ? T('res.unpaid', { v: fmt(g, st.unpaid) }) : T('res.unreceived', { v: fmt(g, st.unreceived) }))}</p>` : ''}
        <p class="hint">${esc(T('res.bank_help'))}</p>
        <ul class="bank">${d.players.map((p) => `<li><span>${esc(p.name)}</span><b>${fmt(g, p.cashedOut)}</b></li>`).join('')}</ul>
      </div>
      <div class="panel">
        <h2>${esc(T('res.full_log'))}</h2>
        ${logHTML(g, d)}
      </div>
    </section>`;
    animateCounts();
  }

  /* Pilhas de fichas ordenadas por valor (menor → maior), com animação */
  function stacksHTML(g, chips, animate, baseDelay) {
    const cols = g.config.chips.filter((c) => chips[c.id] > 0);
    if (!cols.length) return `<div class="value-only">${esc(T('res.no_chips'))}</div>`;
    return cols.map((c, ci) => {
      const n = chips[c.id];
      const shown = Math.min(n, 20);
      let discs = '';
      for (let i = 0; i < shown; i++) {
        const delay = (baseDelay || 0) + ci * 120 + i * 45;
        discs += `<span class="disc${animate ? ' drop' : ''}" style="--c:${esc(c.color)};bottom:${i * 5}px;animation-delay:${delay}ms"></span>`;
      }
      return `<div class="stack">
        <div class="stack-col" style="height:${shown * 5 + 18}px">${discs}</div>
        <div class="stack-n"${animate ? ` data-count="${n}" style="--delay:${(baseDelay || 0) + ci * 120}ms"` : ''}>${animate ? 0 : n}${n > 20 ? '' : ''}</div>
        <div class="stack-v">${fmt(g, c.value)}</div>
      </div>`;
    }).join('');
  }

  function animateCounts() {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.querySelectorAll('[data-count], [data-countmoney]').forEach((el) => {
      const isMoney = el.hasAttribute('data-countmoney');
      const target = Number(isMoney ? el.dataset.countmoney : el.dataset.count);
      const show = (v) => { el.textContent = isMoney ? CS.formatMoney(Math.round(v), el.dataset.cur) : String(Math.round(v)); };
      if (reduce) { show(target); return; }
      const delay = parseInt(getComputedStyle(el).getPropertyValue('--delay'), 10) || 0;
      show(0);
      setTimeout(() => {
        const t0 = performance.now(), dur = 900;
        const step = (t) => {
          const k = Math.min(1, (t - t0) / dur);
          show(target * (1 - Math.pow(1 - k, 3)));
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }, delay);
    });
  }

  /* ---------------- componente: escolher fichas ---------------- */
  function mountPick(el, g, counts, opts) {
    const max = opts.max || (() => 9999);
    el.innerHTML = g.config.chips.map((c) => `
      <div class="pick-row">
        <span class="dot" style="background:${esc(c.color)}"></span>
        <span class="pick-name">${esc(c.name)} <small>${fmt(g, c.value)}</small>${opts.max ? `<small class="pick-max" data-max="${c.id}"></small>` : ''}</span>
        <div class="mini-stepper">
          <button type="button" data-d="-1" data-c="${c.id}" aria-label="${esc(T('pick.less', { name: c.name }))}">−</button>
          <input type="number" min="0" inputmode="numeric" data-c="${c.id}" value="${counts[c.id] || 0}" aria-label="${esc(T('chip.qty_of', { name: c.name }))}">
          <button type="button" data-d="1" data-c="${c.id}" aria-label="${esc(T('pick.more', { name: c.name }))}">+</button>
        </div>
      </div>`).join('');
    const clamp = (id, n) => Math.max(0, Math.min(max(id), Math.floor(n) || 0));
    const refresh = () => {
      el.querySelectorAll('[data-max]').forEach((s) => { s.textContent = T('pick.bank', { n: max(s.dataset.max) }); });
      if (opts.onChange) opts.onChange();
    };
    el.onclick = (e) => {
      const b = e.target.closest('button[data-d]');
      if (!b) return;
      const id = b.dataset.c;
      counts[id] = clamp(id, (counts[id] || 0) + Number(b.dataset.d));
      el.querySelector(`input[data-c="${id}"]`).value = counts[id];
      refresh();
    };
    el.oninput = (e) => {
      const i = e.target.closest('input[data-c]');
      if (!i) return;
      counts[i.dataset.c] = clamp(i.dataset.c, parseInt(i.value, 10));
      refresh();
    };
    el.onchange = (e) => {
      const i = e.target.closest('input[data-c]');
      if (i) i.value = counts[i.dataset.c] || 0;
    };
    refresh();
  }

  /* ---------------- diálogo: entrada / rebuy ---------------- */
  const dlgBuy = $('dlgBuy');
  let buy = null; // { mode, pid, counts }

  function openBuy(mode, pid) {
    const g = activeGame();
    const d = S.derive(g);
    const p = d.players.find((x) => x.id === pid);
    buy = { mode, pid, counts: {} };
    $('dlgBuyTitle').textContent = mode === 'join' ? T('buy.join_title') : T(p.active ? 'buy.rebuy_title' : 'buy.back_title', { name: p.name });
    $('buyNameField').hidden = mode !== 'join';
    $('buyName').value = mode === 'join' ? T('player.default', { n: d.players.length + 1 }) : '';
    $('buyAmount').value = centsToInput(g, g.config.buyIn);
    resuggest();
    dlgBuy.showModal();
    (mode === 'join' ? $('buyName') : $('buyAmount')).select();
  }
  function resuggest() {
    const g = activeGame();
    const amount = CS.toCents($('buyAmount').value);
    const s = S.suggest(g, amount);
    buy.counts = Object.assign({}, s.counts);
    const bank = S.derive(g).bank;
    mountPick($('buyChips'), g, buy.counts, { max: (id) => Math.max(0, bank[id] || 0), onChange: buyStatus });
  }
  function buyStatus() {
    const g = activeGame();
    const amount = CS.toCents($('buyAmount').value);
    const total = S.valueOf(g, buy.counts);
    const n = Object.values(buy.counts).reduce((a, b) => a + b, 0);
    const diff = total - amount;
    const el = $('buyStatus');
    el.className = 'status ' + (diff === 0 && amount > 0 ? 'ok' : 'warn');
    el.textContent = T('buy.status', { n: n, v: fmt(g, total) }) + ' · ' +
      (amount <= 0 ? T('buy.enter_value') : diff === 0 ? T('buy.exact') : diff < 0 ? T('buy.missing', { v: fmt(g, -diff) }) : T('buy.over', { v: fmt(g, diff) }));
    $('buyConfirm').textContent = diff === 0 ? T('common.confirm') : T('buy.confirm_anyway');
  }
  let buyTimer = null;
  $('buyAmount').addEventListener('input', () => { clearTimeout(buyTimer); buyTimer = setTimeout(resuggest, 200); });
  $('buyResuggest').addEventListener('click', resuggest);
  $('buyConfirm').addEventListener('click', async () => {
    const g = activeGame();
    const amount = CS.toCents($('buyAmount').value);
    if (amount <= 0) { $('buyAmount').focus(); return; }
    const total = S.valueOf(g, buy.counts);
    if (total !== amount && !(await ask(T('buy.mismatch_ask', { total: fmt(g, total), amount: fmt(g, amount) }), T('buy.record')))) return;
    let pid = buy.pid;
    if (buy.mode === 'join') pid = S.join(g, $('buyName').value.trim() || undefined, amount, buy.counts);
    else S.rebuy(g, buy.pid, amount, buy.counts);
    save();
    dlgBuy.close();
    renderLive();
    flashCard(pid, true);
    toast(T(buy.mode === 'join' ? 'buy.joined_toast' : 'buy.rebuy_toast'));
  });

  /* ---------------- diálogo: saque ---------------- */
  const dlgCash = $('dlgCash');
  let cash = null; // { pid, mode, counts }

  function openCash(pid) {
    const g = activeGame();
    const p = S.derive(g).players.find((x) => x.id === pid);
    cash = { pid, mode: 'chips', counts: {} };
    $('dlgCashTitle').textContent = T('cash.title', { name: p.name });
    $('cashInfo').textContent = T('cash.info', { v: fmt(g, p.invested) });
    $('cashValue').value = '';
    setCashMode('chips');
    mountPick($('cashChips'), g, cash.counts, { onChange: cashStatus });
    dlgCash.showModal();
  }
  function setCashMode(mode) {
    cash.mode = mode;
    dlgCash.querySelectorAll('.seg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    $('cashChips').hidden = mode !== 'chips';
    $('cashValueField').hidden = mode !== 'value';
    cashStatus();
  }
  function cashValue() {
    const g = activeGame();
    return cash.mode === 'chips' ? S.valueOf(g, cash.counts) : CS.toCents($('cashValue').value);
  }
  function cashStatus() {
    const g = activeGame();
    const p = S.derive(g).players.find((x) => x.id === cash.pid);
    const v = cashValue();
    const net = v - p.invested;
    $('cashStatus').className = 'status ' + (net >= 0 ? 'ok' : 'warn');
    $('cashStatus').textContent = T('cash.status', { v: fmt(g, v), net: (net >= 0 ? '+' : '−') + fmt(g, Math.abs(net)) });
  }
  dlgCash.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => setCashMode(b.dataset.mode)));
  $('cashValue').addEventListener('input', cashStatus);
  $('cashConfirm').addEventListener('click', () => {
    const g = activeGame();
    S.cashOut(g, cash.pid, cash.mode === 'chips' ? { chips: cash.counts } : { amount: cashValue() });
    save();
    dlgCash.close();
    renderLive();
    flashCard(cash.pid);
    toast(T('cash.toast'));
  });

  document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => b.closest('dialog').close()));

  /* ---------------- ações (delegação) ---------------- */
  root.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    const g = activeGame();
    const act = b.dataset.act;
    if (act === 'goto-calc') return showView('calc');
    if (!g) return;
    if (act === 'rename') commitRename(b.dataset.pid);
    if (act === 'join') openBuy('join');
    if (act === 'rebuy') openBuy('rebuy', b.dataset.pid);
    if (act === 'cash') openCash(b.dataset.pid);
    if (act === 'undo') {
      const last = g.events[g.events.length - 1];
      if (await ask(T('undo.ask', { what: S.describe(g, last) }), T('undo.btn'))) { S.undo(g); save(); renderLive(); if (last.playerId) flashCard(last.playerId); }
    }
    if (act === 'count') { ui.counting = true; ui.finals = {}; renderLive(); window.scrollTo(0, 0); }
    if (act === 'count-cancel') { ui.counting = false; renderLive(); }
    if (act === 'fmode') {
      const f = ui.finals[b.dataset.pid];
      f.mode = b.dataset.mode;
      const card = b.closest('.player');
      card.querySelectorAll('.seg button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.mode === f.mode)));
      card.querySelector('.chip-pick').hidden = f.mode !== 'chips';
      card.querySelector('.field').hidden = f.mode !== 'value';
      updateCounting(g, S.derive(g));
    }
    if (act === 'finish') {
      const d = S.derive(g);
      let sum = 0;
      const finals = {};
      d.players.filter((p) => p.active).forEach((p) => {
        const f = ui.finals[p.id];
        finals[p.id] = f.mode === 'chips' ? { chips: f.chips } : { amount: CS.toCents(f.value) };
        sum += finalValue(g, f);
      });
      if (sum !== d.onTable && !(await ask(T('count.mismatch_ask', { sum: fmt(g, sum), table: fmt(g, d.onTable) }), T('count.end')))) return;
      S.finish(g, finals);
      ui.counting = false;
      save();
      ads().then(() => { renderLive(); window.scrollTo(0, 0); });
    }
    if (act === 'reopen') {
      if (!(await ask(T('res.reopen_ask'), T('res.reopen_btn')))) return;
      S.undo(g); save(); renderLive();
    }
    if (act === 'copy') { copyText(S.summaryText(g)); window.ChipFX && window.ChipFX.success(b); }
    if (act === 'export-one') download('chipsplit-' + slug(g.title) + '.json', { app: 'chipsplit', v: 1, exportedAt: new Date().toISOString(), games: [g] });
  });
  /* destaque no cartão do jogador depois de uma ação */
  function flashCard(pid, scroll) {
    const el = root.querySelector(`[data-card="${pid}"]`);
    if (!el || !window.ChipFX) return;
    if (scroll) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    window.ChipFX.flash(el);
  }

  /* trocar o nome do jogador: botão ✓, Enter ou sair do campo */
  function commitRename(pid) {
    const g = activeGame();
    const input = $('pn-' + pid);
    if (!g || !input) return;
    const p = S.derive(g).players.find((x) => x.id === pid);
    const name = input.value.trim();
    if (!name) { input.value = p.name; syncRenameBtn(input); return; }
    if (p && name !== p.name) {
      S.rename(g, p.id, name);
      save();
      renderLive();
      flashCard(pid);
      toast(T('live.renamed_toast'));
    } else syncRenameBtn(input);
  }
  function syncRenameBtn(input) {
    const btn = input.parentElement.querySelector('.ok-btn');
    const g = activeGame();
    const p = g && S.derive(g).players.find((x) => x.id === input.dataset.rename);
    if (btn && p) btn.hidden = input.value.trim() === p.name;
  }
  root.addEventListener('keydown', (e) => {
    const t = e.target;
    if (t.dataset && t.dataset.rename && e.key === 'Enter') { e.preventDefault(); commitRename(t.dataset.rename); }
    if (t.dataset && t.dataset.rename && e.key === 'Escape') {
      const g = activeGame();
      const p = g && S.derive(g).players.find((x) => x.id === t.dataset.rename);
      if (p) { t.value = p.name; syncRenameBtn(t); }
    }
  });

  root.addEventListener('input', (e) => {
    const g = activeGame();
    const t = e.target;
    if (t.dataset.rename) syncRenameBtn(t);
    if (t.dataset.fval && g) { ui.finals[t.dataset.fval].value = t.value; updateCounting(g, S.derive(g)); }
  });
  root.addEventListener('change', (e) => {
    const g = activeGame();
    const t = e.target;
    if (!g) return;
    if (t.dataset.field === 'title') { g.title = t.value.trim() || g.title; save(); }
    if (t.dataset.rename) commitRename(t.dataset.rename);
  });

  // relógio do jogo
  setInterval(() => {
    const el = $('elapsed');
    const g = activeGame();
    if (el && g && ui.view === 'live') el.textContent = S.elapsed(Date.now() - S.derive(g).startedAt);
  }, 15000);

  /* ---------------- histórico ---------------- */
  function renderHistory() {
    const ul = $('historyList');
    if (!store.games.length) { ul.innerHTML = `<li class="hint">${esc(T('hist.empty'))}</li>`; return; }
    ul.innerHTML = store.games.map((g) => {
      const d = S.derive(g);
      return `<li class="h-item">
        <div class="h-main">
          <b>${esc(g.title)}</b>
          <small>${esc(T('hist.meta', { date: new Date(d.startedAt).toLocaleString(I18N.locale()), n: d.players.length, v: fmt(g, d.totalIn) }))}${d.ended ? ' · ' + S.elapsed(d.endedAt - d.startedAt) : ''}</small>
        </div>
        <span class="badge ${d.ended ? '' : 'live'}">${esc(T(d.ended ? 'live.badge_ended' : 'live.badge_live'))}</span>
        <div class="h-actions">
          <button class="small" data-h="open" data-id="${g.id}">${esc(T('hist.open'))}</button>
          <button class="small ghost" data-h="del" data-id="${g.id}" aria-label="${esc(T('hist.delete_aria', { title: g.title }))}">${esc(T('hist.delete'))}</button>
        </div>
      </li>`;
    }).join('');
  }
  $('historyList').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-h]');
    if (!b) return;
    const g = store.games.find((x) => x.id === b.dataset.id);
    if (!g) return;
    if (b.dataset.h === 'open') { store.activeId = g.id; ui.counting = false; save(); showView('live'); }
    if (b.dataset.h === 'del' && (await ask(T('hist.delete_ask', { title: g.title }), T('hist.delete'), true))) {
      store.games = store.games.filter((x) => x.id !== g.id);
      if (store.activeId === g.id) store.activeId = null;
      save(); renderHistory();
    }
  });
  $('exportAll').addEventListener('click', () => {
    download('chipsplit-backup-' + new Date().toISOString().slice(0, 10) + '.json', { app: 'chipsplit', v: 1, exportedAt: new Date().toISOString(), games: store.games });
  });
  $('importFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    file.text().then((txt) => {
      const data = JSON.parse(txt);
      if (!data || data.app !== 'chipsplit' || !Array.isArray(data.games)) throw new Error(T('hist.invalid'));
      let added = 0;
      data.games.forEach((g) => {
        if (!g || !g.id || !Array.isArray(g.events) || !g.config) return;
        const i = store.games.findIndex((x) => x.id === g.id);
        if (i >= 0) store.games[i] = g; else { store.games.push(g); added++; }
      });
      store.games.sort((a, b) => b.createdAt - a.createdAt);
      save(); renderHistory();
      toast(T('hist.import_ok', { n: data.games.length, added: added }));
    }).catch((err) => toast(T('hist.import_fail', { err: err.message })))
      .finally(() => { e.target.value = ''; });
  });

  /* ---------------- utilidades ---------------- */
  function centsToInput(g, c) {
    const s = c % 100 === 0 ? String(c / 100) : (c / 100).toFixed(2);
    return I18N.usesComma() ? s.replace('.', ',') : s;
  }
  function slug(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'jogo'; }
  function download(name, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function copyText(text) {
    const done = () => toast(T('copy.ok'));
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text));
    else fallbackCopy(text);
  }
  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    if (ok) toast(T('copy.ok_short')); else ask(text, T('common.close'), false, true);
    ta.remove();
  }
  /** Confirmação dentro do app (as caixas nativas do navegador não funcionam em todo lugar). */
  function ask(message, okLabel, danger, infoOnly) {
    return new Promise((resolve) => {
      const d = $('dlgAsk');
      const ok = $('askOk');
      const cancel = $('askCancel');
      $('askText').textContent = message;
      ok.textContent = okLabel || T('common.confirm');
      cancel.textContent = T('common.cancel');
      ok.className = danger ? 'danger-btn' : 'gold-btn';
      cancel.hidden = !!infoOnly;
      const done = (v) => { ok.onclick = null; cancel.onclick = null; d.oncancel = null; d.close(); resolve(v); };
      ok.onclick = () => done(true);
      cancel.onclick = () => done(false);
      d.oncancel = (ev) => { ev.preventDefault(); done(false); };
      d.showModal();
      ok.focus();
    });
  }

  let toastTimer = null;
  function toast(msg) {
    let el = $('toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  }

  $('liveDot').hidden = !runningGame();
  if (runningGame() && !store.activeId) store.activeId = runningGame().id;

  // Peças usadas pela tela de perfil
  window.ChipUI = {
    ask, toast, download, showView, isDefaultName,
    games: () => store.games,
    exportAll: () => download('chipsplit-backup-' + new Date().toISOString().slice(0, 10) + '.json', { app: 'chipsplit', v: 1, exportedAt: new Date().toISOString(), games: store.games })
  };

  // Trocou o idioma: redesenha a aba aberta
  document.addEventListener('chipsplit:lang', () => {
    if (ui.view === 'live') renderLive();
    if (ui.view === 'history') renderHistory();
  });

  // Reabre onde parou: jogo em andamento → aba Jogo; senão a última aba usada.
  let lastView = 'calc';
  try { lastView = localStorage.getItem('chipsplit-ui-view') || 'calc'; } catch (e) { /* ignora */ }
  const ag = activeGame();
  if (ag && !S.isEnded(ag)) showView('live');
  else if (lastView !== 'calc') showView(lastView);
})();
