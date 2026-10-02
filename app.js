/* ChipSplit — tela Calcular */
(function () {
  'use strict';
  var CS = window.ChipSplit;
  var EX = window.ChipSplitExamples;
  var T = I18N.t;
  window.ChipSplitApp = { last: null };
  var STORE_KEY = 'chipsplit-state-v3';

  var COLORS = ['#F2F2EE', '#D6453D', '#2F6FD6', '#2E9E5B', '#1B1B1B', '#7A4CC2', '#E3B23C', '#E06AA0'];
  var nextId = 1;

  function defaultState() {
    var prof = window.ChipProfile && window.ChipProfile.get();
    return EX.defaultState((prof && prof.currency) || I18N.info().currency);
  }
  function withIds(state) {
    state.chips = state.chips.map(function (c) { return Object.assign({}, c, { id: 'c' + (nextId++) }); });
    return state;
  }
  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) return withIds(JSON.parse(raw));
    } catch (e) { /* sem storage: segue com o padrão */ }
    return withIds(defaultState());
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignora */ }
  }

  var state = load();
  var $ = function (id) { return document.getElementById(id); };
  var fmt = function (c) { return CS.formatMoney(c, state.currency); };

  /* ---------- moedas ---------- */
  function renderCurrencies() {
    var sel = $('currency');
    sel.innerHTML = '';
    var list = I18N.CURRENCIES.slice();
    if (list.indexOf(state.currency) < 0) list.push(state.currency);
    list.forEach(function (code) {
      var o = document.createElement('option');
      o.value = code;
      o.textContent = currencyLabel(code);
      sel.appendChild(o);
    });
    sel.value = state.currency;
  }
  function currencyLabel(code) {
    var symbol = code, name = code;
    try {
      var parts = new Intl.NumberFormat(I18N.locale(), { style: 'currency', currency: code }).formatToParts(1);
      symbol = (parts.filter(function (p) { return p.type === 'currency'; })[0] || {}).value || code;
      if (typeof Intl.DisplayNames === 'function') name = new Intl.DisplayNames([I18N.locale()], { type: 'currency' }).of(code);
    } catch (e) { /* navegador antigo */ }
    return symbol === code ? code + ' — ' + name : symbol + ' — ' + name;
  }

  /* ---------- formulário do jogo ---------- */
  function syncForm() {
    $('players').value = state.players;
    renderCurrencies();
    $('buyIn').value = state.buyIn;
    $('bigBlind').value = state.bigBlind;
    $('useSmall').checked = !!state.useSmall;
    $('rebuys').value = state.rebuys;
    renderChipList();
  }

  ['players', 'rebuys'].forEach(function (id) {
    $(id).addEventListener('input', function (e) { state[id] = parseInt(e.target.value, 10) || 0; update(); });
  });
  ['buyIn', 'bigBlind'].forEach(function (id) {
    $(id).addEventListener('input', function (e) { state[id] = e.target.value; update(); });
  });
  $('currency').addEventListener('change', function (e) { state.currency = e.target.value; update(); });
  $('useSmall').addEventListener('change', function (e) { state.useSmall = e.target.checked; update(); });
  document.querySelectorAll('[data-step]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.getAttribute('data-step');
      var min = key === 'players' ? 2 : 0;
      state[key] = Math.max(min, (parseInt(state[key], 10) || 0) + parseInt(btn.getAttribute('data-delta'), 10));
      $(key).value = state[key];
      update();
    });
  });

  /* ---------- lista de fichas ---------- */
  function renderChipList() {
    var ul = $('chipList');
    ul.innerHTML = '';
    state.chips.forEach(function (c, i) {
      var li = document.createElement('li');
      li.className = 'chip-row' + (c.value !== '' && CS.toCents(c.value) > 0 ? ' is-fixed' : '');
      li.innerHTML =
        '<input type="color" aria-label="' + esc(T('chip.color_of', { name: c.name })) + '" value="' + esc(c.color) + '" data-f="color">' +
        '<input type="text" aria-label="' + esc(T('chip.name')) + '" value="' + esc(c.name) + '" data-f="name">' +
        '<input type="number" min="0" aria-label="' + esc(T('chip.qty_of', { name: c.name })) + '" value="' + c.qty + '" data-f="qty">' +
        '<input type="text" inputmode="decimal" placeholder="' + esc(T('chip.auto')) + '" aria-label="' + esc(T('chip.value_of', { name: c.name })) + '" value="' + esc(c.value) + '" data-f="value">' +
        '<div class="row-actions">' +
        '<button type="button" class="icon" data-a="up" aria-label="' + esc(T('chip.up')) + '"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
        '<button type="button" class="icon" data-a="down" aria-label="' + esc(T('chip.down')) + '"' + (i === state.chips.length - 1 ? ' disabled' : '') + '>↓</button>' +
        '<button type="button" class="icon danger" data-a="del" aria-label="' + esc(T('chip.remove', { name: c.name })) + '">×</button>' +
        '</div>';
      li.querySelectorAll('[data-f]').forEach(function (inp) {
        inp.addEventListener('input', function () {
          var f = inp.getAttribute('data-f');
          c[f] = f === 'qty' ? (parseInt(inp.value, 10) || 0) : inp.value;
          li.classList.toggle('is-fixed', c.value !== '' && CS.toCents(c.value) > 0);
          update(true);
        });
      });
      li.querySelectorAll('[data-a]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var a = btn.getAttribute('data-a');
          if (a === 'del') state.chips.splice(i, 1);
          if (a === 'up' && i > 0) state.chips.splice(i - 1, 0, state.chips.splice(i, 1)[0]);
          if (a === 'down' && i < state.chips.length - 1) state.chips.splice(i + 1, 0, state.chips.splice(i, 1)[0]);
          renderChipList();
          update();
        });
      });
      ul.appendChild(li);
    });
  }

  $('addChip').addEventListener('click', function () {
    var used = state.chips.map(function (c) { return c.color.toUpperCase(); });
    var color = COLORS.filter(function (x) { return used.indexOf(x) < 0; })[0] || '#888888';
    state.chips.push({ id: 'c' + (nextId++), name: T('chip.new', { n: state.chips.length + 1 }), color: color, qty: EX.DEFAULT_QTY, value: '' });
    renderChipList();
    update();
  });

  /* ---------- cálculo ---------- */
  function toInput() {
    return {
      players: state.players,
      buyIn: CS.toCents(state.buyIn),
      bigBlind: CS.toCents(state.bigBlind),
      useSmallBlind: !!state.useSmall,
      rebuys: state.rebuys,
      chips: state.chips.map(function (c) {
        return { id: c.id, name: c.name, color: c.color, qty: c.qty, value: CS.toCents(c.value) };
      })
    };
  }

  var timer = null;
  function update(fromChipInput) {
    clearTimeout(timer);
    timer = setTimeout(function () { render(); save(); }, fromChipInput ? 150 : 30);
  }

  function render() {
    var input = toInput();
    var r = CS.computeDistribution(input);
    window.ChipSplitApp.last = { input: input, result: r, currency: state.currency };
    $('startGame').disabled = !(r.ok && r.exact);

    var bb = input.bigBlind;
    $('smallInfo').textContent = bb > 0
      ? (state.useSmall ? T('calc.small_is', { v: fmt(Math.round(bb / 2)) }) : T('calc.small_off'))
      : T('calc.small_need_bb');

    $('potValue').textContent = fmt(r.pot);
    $('potDetail').textContent = r.players + ' × ' + fmt(r.buyIn) +
      (r.rebuys ? ' + ' + T(r.rebuys === 1 ? 'rebuy.one' : 'rebuy.many', { n: r.rebuys }) : '');

    if (r.ok) {
      $('stackValue').textContent = fmt(r.buyIn - r.remainder);
      var parts = [T('calc.n_chips', { n: r.chipsPerPlayer })];
      if (r.bigBlind > 0) parts.push(T('calc.n_bb', { n: r.stackInBigBlinds }));
      if (r.bigBlind > 0) parts.push(T('calc.blinds', { v: (r.smallBlind ? fmt(r.smallBlind) + ' / ' : '') + fmt(r.bigBlind) }));
      if (r.rebuys) parts.push(T('calc.reserve', { n: r.reserveChips }));
      $('stackDetail').textContent = parts.join(' · ');
    } else {
      $('stackValue').textContent = '—';
      $('stackDetail').textContent = '';
    }

    var msgs = $('messages');
    msgs.innerHTML = '';
    r.errors.forEach(function (m) { msgs.appendChild(msg(I18N.message(m, fmt), 'err')); });
    r.warnings.forEach(function (m) { msgs.appendChild(msg(I18N.message(m, fmt), 'warn')); });
    if (r.ok && r.exact && !r.warnings.length) msgs.appendChild(msg(T('calc.all_good'), 'ok'));

    var tb = $('distBody');
    tb.innerHTML = '';
    r.rows.forEach(function (row) {
      var tr = document.createElement('tr');
      if (!row.used) tr.className = 'unused';
      tr.innerHTML =
        '<td><span class="dot" style="background:' + esc(row.color) + '"></span>' + esc(row.name) +
        (row.fixed ? ' <span class="badge">' + esc(T('calc.typed')) + '</span>' : '') + '</td>' +
        '<td class="num">' + (row.value ? fmt(row.value) : '—') + '</td>' +
        '<td class="num strong">' + (row.used ? '× ' + row.count : '—') + '</td>' +
        '<td class="num">' + (row.used ? fmt(row.subtotal) : '—') + '</td>' +
        '<td class="num">' + row.totalNeeded + ' / ' + row.qty + '</td>' +
        '<td></td>';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = row.fixed ? 'small ghost' : 'small';
      btn.textContent = row.fixed ? T('calc.release') : T('calc.fix');
      btn.disabled = !row.value;
      btn.addEventListener('click', function () {
        var chip = state.chips.filter(function (c) { return c.id === row.id; })[0];
        if (!chip) return;
        chip.value = row.fixed ? '' : centsToInput(row.value);
        renderChipList();
        update();
      });
      tr.lastChild.appendChild(btn);
      tb.appendChild(tr);
    });
  }

  function centsToInput(c) {
    var s = c % 100 === 0 ? String(c / 100) : (c / 100).toFixed(2);
    return I18N.usesComma() ? s.replace('.', ',') : s;
  }
  function msg(text, kind) {
    var li = document.createElement('li');
    li.className = 'msg ' + kind;
    li.textContent = text;
    return li;
  }
  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- exemplos e reset ---------- */
  function renderExamples() {
    var sel = $('example');
    sel.innerHTML = '';
    var first = document.createElement('option');
    first.value = '';
    first.textContent = T('calc.examples');
    sel.appendChild(first);
    EX.list.forEach(function (ex) {
      var o = document.createElement('option');
      o.value = ex.id;
      o.textContent = T(ex.labelKey);
      sel.appendChild(o);
    });
  }
  $('example').addEventListener('change', function (e) {
    var ex = EX.get(e.target.value);
    if (!ex) return;
    state = withIds(ex);
    syncForm();
    update();
  });
  $('reset').addEventListener('click', function () {
    state = withIds(defaultState());
    $('example').value = '';
    syncForm();
    update();
  });

  $('startGame').addEventListener('click', function () {
    var last = window.ChipSplitApp.last;
    if (!last || !last.result.ok) return;
    document.dispatchEvent(new CustomEvent('chipsplit:start', { detail: last }));
  });

  // Trocou o idioma: refaz textos gerados aqui e traduz os nomes padrão das fichas
  var CHIP_KEYS = ['chip.white', 'chip.red', 'chip.blue', 'chip.green', 'chip.black', 'chip.purple', 'chip.yellow', 'chip.pink'];
  function retranslate(name) {
    for (var i = 0; i < CHIP_KEYS.length; i++) {
      if (I18N.DICT[CHIP_KEYS[i]].indexOf(name) >= 0) return T(CHIP_KEYS[i]);
    }
    return name;
  }
  document.addEventListener('chipsplit:lang', function () {
    state.chips.forEach(function (c) { c.name = retranslate(c.name); });
    save();
    renderExamples();
    syncForm();
    render();
  });

  renderExamples();
  syncForm();
  render();
})();
