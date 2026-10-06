/* ChipSplit — "Novo jogo" guiado em 4 passos + faixa "Retomar jogo" */
(function () {
  'use strict';
  var CS = window.ChipSplit;
  var T = I18N.t;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  var KITS = {
    k300: [['chip.white', '#F2F2EE', 100], ['chip.red', '#D6453D', 100], ['chip.blue', '#2F6FD6', 50], ['chip.black', '#1B1B1B', 50]],
    k500: [['chip.white', '#F2F2EE', 150], ['chip.red', '#D6453D', 150], ['chip.blue', '#2F6FD6', 100], ['chip.green', '#2E9E5B', 50], ['chip.black', '#1B1B1B', 50]]
  };
  var BUYINS = [10, 20, 50, 100];

  var dlg = $('dlgWizard');
  var w = null;     // estado do assistente
  var original = null; // configuração da tela Calcular antes de abrir (para "Meu kit")

  function kitChips(kit) {
    if (kit === 'mine') {
      return original.chips.map(function (c) { return { name: c.name, color: c.color, qty: c.qty, value: '' }; });
    }
    return KITS[kit].map(function (k) { return { name: T(k[0]), color: k[1], qty: k[2], value: '' }; });
  }
  function toInputStr(n) {
    var s = Math.round(n * 100) % 100 === 0 ? String(Math.round(n)) : n.toFixed(2);
    return I18N.usesComma() ? s.replace('.', ',') : s;
  }
  /** Big blind ≈ 1% do buy-in, sempre par (o small = metade fecha em ficha inteira). */
  var EVEN_BB = [2, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000];
  function bigBlindFor(buyInCents) {
    var bb = 2;
    EVEN_BB.forEach(function (v) { if (v <= buyInCents / 100) bb = v; });
    return bb;
  }
  function parseBuyIn(v) { return CS.toCents(String(v || '').trim()) / 100; }

  /** Aplica o que foi escolhido até agora e devolve o cálculo. */
  function compute() {
    var buyIn = parseBuyIn(w.buyIn);
    var bb = buyIn > 0 ? bigBlindFor(Math.round(buyIn * 100)) / 100 : 0;
    return window.ChipSplitApp.apply({
      players: w.players, type: w.type, buyIn: toInputStr(buyIn), bigBlind: bb > 0 ? toInputStr(bb) : '',
      useSmall: true, rebuys: 0, chips: kitChips(w.kit)
    });
  }

  function open() {
    original = window.ChipSplitApp.state();
    w = {
      step: 1,
      players: Math.min(12, Math.max(2, Number(original.players) || 6)),
      type: original.type || 'cash',
      kit: 'k500',
      buyIn: original.buyIn || '20'
    };
    render();
    dlg.showModal();
  }

  function card(group, value, title, desc, on) {
    return '<button type="button" class="wiz-card" data-' + group + '="' + value + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
      '<b>' + esc(title) + '</b>' + (desc ? '<small>' + esc(desc) + '</small>' : '') + '</button>';
  }

  function render() {
    $('wizStep').textContent = T('wiz.step', { n: w.step });
    dlg.querySelectorAll('.wiz-dots span').forEach(function (d, i) { d.classList.toggle('on', i < w.step); });
    var body = $('wizBody');
    var title = '';
    var html = '';
    if (w.step === 1) {
      title = T('wiz.q_players');
      html = '<div class="wiz-stepper">' +
        '<button type="button" class="wiz-round" data-plus="-1" aria-label="−">−</button>' +
        '<output id="wizPlayers">' + w.players + '</output>' +
        '<button type="button" class="wiz-round" data-plus="1" aria-label="+">+</button></div>' +
        '<div class="wiz-quick">' + [4, 6, 8, 10].map(function (n) {
          return '<button type="button" class="wiz-pick" data-players="' + n + '" aria-pressed="' + (w.players === n) + '">' + n + '</button>';
        }).join('') + '</div>';
    } else if (w.step === 2) {
      title = T('wiz.q_type');
      html = '<div class="wiz-cards">' +
        card('type', 'cash', T('type.cash'), T('type.cash_desc'), w.type === 'cash') +
        card('type', 'tournament', T('type.tournament'), T('type.tournament_desc'), w.type === 'tournament') + '</div>';
    } else if (w.step === 3) {
      title = T('wiz.q_kit');
      html = '<div class="wiz-cards">' +
        card('kit', 'k300', T('wiz.kit300'), T('wiz.kit300_desc'), w.kit === 'k300') +
        card('kit', 'k500', T('wiz.kit500'), T('wiz.kit500_desc'), w.kit === 'k500') +
        card('kit', 'mine', T('wiz.kitmine'), T('wiz.kitmine_desc', { n: original.chips.length }), w.kit === 'mine') + '</div>';
    } else {
      title = T('wiz.q_buyin');
      var cur = (window.ChipSplitApp.state().currency) || 'BRL';
      html = '<div class="wiz-quick">' + BUYINS.map(function (n) {
        return '<button type="button" class="wiz-pick" data-buyin="' + n + '" aria-pressed="' + (parseBuyIn(w.buyIn) === n) + '">' +
          esc(CS.formatMoney(n * 100, cur)) + '</button>';
      }).join('') + '</div>' +
        '<label class="wiz-amount"><span>' + esc(T('wiz.q_buyin')) + '</span>' +
        '<input id="wizBuyIn" inputmode="decimal" autocomplete="off" value="' + esc(w.buyIn) + '"></label>';
    }
    $('wizTitle').textContent = title;
    body.innerHTML = html;
    $('wizBack').hidden = w.step === 1;
    $('wizNext').textContent = w.step === 4 ? T('wiz.deal') : T('wiz.next');
    preview();
    var inp = $('wizBuyIn');
    if (inp) inp.addEventListener('input', function () { w.buyIn = inp.value; syncBuyInPicks(); preview(); });
  }

  function syncBuyInPicks() {
    dlg.querySelectorAll('[data-buyin]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(parseBuyIn(w.buyIn) === Number(b.dataset.buyin)));
    });
  }

  function preview() {
    var p = $('wizPreview');
    var next = $('wizNext');
    p.className = 'status';
    next.disabled = false;
    if (w.step < 3) { p.textContent = ''; return; }
    if (w.step === 3 && parseBuyIn(w.buyIn) <= 0) w.buyIn = '20';
    var last = compute();
    var r = last && last.result;
    if (r && r.ok && r.exact) {
      p.textContent = T('wiz.preview', {
        n: r.chipsPerPlayer,
        pot: CS.formatMoney(r.pot, last.currency),
        blinds: (r.smallBlind ? CS.formatMoney(r.smallBlind, last.currency) + ' / ' : '') + CS.formatMoney(r.bigBlind, last.currency)
      });
      p.classList.add('ok');
    } else {
      p.textContent = T('wiz.not_possible');
      p.classList.add('warn');
      if (w.step === 4) next.disabled = true;
    }
  }

  dlg.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || !dlg.contains(b)) return;
    if (b.dataset.plus) {
      w.players = Math.min(12, Math.max(2, w.players + Number(b.dataset.plus)));
      $('wizPlayers').textContent = w.players;
      dlg.querySelectorAll('[data-players]').forEach(function (x) { x.setAttribute('aria-pressed', String(Number(x.dataset.players) === w.players)); });
      if (window.ChipFX) window.ChipFX.flash($('wizPlayers'));
    } else if (b.dataset.players) {
      w.players = Number(b.dataset.players);
      render();
    } else if (b.dataset.type) {
      w.type = b.dataset.type; render();
    } else if (b.dataset.kit) {
      w.kit = b.dataset.kit; render();
    } else if (b.dataset.buyin) {
      w.buyIn = toInputStr(Number(b.dataset.buyin)); render();
    }
  });

  $('wizBack').addEventListener('click', function () {
    if (w.step > 1) { w.step--; render(); }
  });
  $('wizNext').addEventListener('click', function () {
    if (w.step < 4) {
      if (w.step === 2) window.ChipSplitApp.apply({ type: w.type, players: w.players });
      w.step++;
      render();
      return;
    }
    var last = compute();
    if (!last || !last.result.ok || !last.result.exact) return;
    w.started = true;
    dlg.close();
    window.ChipSplitApp.start();
  });

  // Fechou sem distribuir: devolve a tela Calcular como estava.
  dlg.addEventListener('close', function () {
    if (w && !w.started && original) window.ChipSplitApp.apply(original);
  });

  $('wizardBtn').addEventListener('click', open);

  /* ---------------- faixa "Retomar jogo" ---------------- */
  function renderResume() {
    var el = $('resumeBanner');
    if (!el) return;
    var g = window.ChipUI && window.ChipUI.running();
    if (!g) { el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false;
    el.innerHTML = '<span class="resume-dot" aria-hidden="true"></span>' +
      '<span class="resume-text"><small>' + esc(T('resume.title')) + '</small><b>' + esc(g.title) + '</b></span>' +
      '<button type="button" class="gold-btn small" id="resumeBtn">' + esc(T('resume.btn')) + '</button>';
    $('resumeBtn').addEventListener('click', function () { window.ChipUI.resume(); });
  }
  ['chipsplit:games-saved', 'chipsplit:view', 'chipsplit:lang', 'chipsplit:game-deleted'].forEach(function (ev) {
    document.addEventListener(ev, function () { setTimeout(renderResume, 0); });
  });
  renderResume();
})();
