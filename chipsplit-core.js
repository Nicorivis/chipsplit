/*
 * ChipSplit — núcleo do cálculo (sem dependências).
 * Funciona no navegador (window.ChipSplit) e no Node (require('./chipsplit-core.js')).
 *
 * Todos os valores de dinheiro trabalham em CENTAVOS (inteiros) para não ter erro de ponto flutuante.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ChipSplit = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Valores "redondos" que uma ficha pode ter (em centavos).
  var NICE = [1, 2, 5, 10, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000,
    20000, 25000, 50000, 100000, 200000, 250000, 500000, 1000000];

  // Quanto cada ficha vale em relação à anterior (testa todos e fica com o melhor).
  var FACTORS = [4, 5, 2, 10, 2.5];

  var DEFAULT_TARGET_CHIPS = 30; // fichas por jogador que o algoritmo procura
  var NODE_LIMIT = 25000;        // limite de busca por variação (mantém o app rápido)

  /** Mensagem do cálculo: um código + dados. O texto vem do i18n.js, no idioma escolhido. */
  function msg(code, params) { return { code: code, params: params || {} }; }

  function niceAtLeast(x) {
    for (var i = 0; i < NICE.length; i++) if (NICE[i] >= x) return NICE[i];
    return NICE[NICE.length - 1];
  }

  /** Converte "50", "0,25", "1.000,50", 12.5 → centavos. Vazio ou inválido → 0. */
  function toCents(v) {
    if (v === null || v === undefined || v === '') return 0;
    if (typeof v === 'number') return isFinite(v) ? Math.round(v * 100) : 0;
    var s = String(v).trim().replace(/\s/g, '');
    if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
    var n = parseFloat(s);
    return isFinite(n) ? Math.round(n * 100) : 0;
  }

  /** Dá para pagar `amount` exato com essas fichas (quantidade ilimitada)? */
  function canPay(amount, values) {
    if (amount <= 0) return true;
    var ok = new Array(amount + 1).fill(false);
    ok[0] = true;
    for (var a = 1; a <= amount; a++) {
      for (var i = 0; i < values.length; i++) {
        if (values[i] <= a && ok[a - values[i]]) { ok[a] = true; break; }
      }
    }
    return ok[amount];
  }

  /**
   * Gera os valores das fichas automáticas.
   * As fichas com valor digitado (fixed) ficam como estão; as automáticas preenchem
   * uma "escada" começando em `unit` (small blind, ou big se o small estiver desligado).
   */
  function ladderValues(unit, factor, count, fixedSet, max) {
    var out = [];
    var v = unit;
    var guard = 0;
    while (out.length < count && guard++ < 200) {
      if (!fixedSet[v]) out.push(v);
      var next = niceAtLeast(v * factor);
      if (next <= v) next = niceAtLeast(v + 1);
      if (next === v) break; // chegou no topo da tabela
      v = next;
      if (v > max) break;
    }
    return out;
  }

  /**
   * Calcula a distribuição.
   * input = {
   *   players: 6,                 // jogadores
   *   buyIn: 5000,                // entrada por jogador (centavos) = stack inicial
   *   bigBlind: 50,               // centavos, 0 = automático (sem blinds)
   *   useSmallBlind: true,        // small = metade do big; false = só big
   *   rebuys: 0,                  // rebuys estimados (entram no pote e no estoque)
   *   targetChips: 30,            // opcional
   *   chips: [{ id, name, color, qty, value }]  // value em centavos; >0 = digitado (fixo)
   * }
   */
  function computeDistribution(input) {
    var players = Math.floor(Number(input.players) || 0);
    var buyIn = Math.floor(Number(input.buyIn) || 0);
    var bigBlind = Math.floor(Number(input.bigBlind) || 0);
    var useSmall = input.useSmallBlind !== false;
    var rebuys = Math.max(0, Math.floor(Number(input.rebuys) || 0));
    var target = input.targetChips || DEFAULT_TARGET_CHIPS;
    var chips = (input.chips || []).map(function (c, i) {
      return {
        id: c.id !== undefined ? c.id : i,
        name: c.name || 'Ficha ' + (i + 1),
        color: c.color || '#cccccc',
        qty: Math.max(0, Math.floor(Number(c.qty) || 0)),
        value: Math.max(0, Math.floor(Number(c.value) || 0)),
        order: i
      };
    });

    var errors = [];
    var warnings = [];
    if (players < 2) errors.push(msg('err_players'));
    if (buyIn <= 0) errors.push(msg('err_buyin'));
    if (!chips.length) errors.push(msg('err_chips'));

    var smallBlind = 0;
    if (bigBlind > 0 && useSmall) {
      smallBlind = Math.round(bigBlind / 2);
      if (bigBlind % 2 !== 0) warnings.push(msg('warn_bb_odd', { cents: smallBlind }));
    }
    if (bigBlind > 0 && buyIn > 0 && bigBlind > buyIn) errors.push(msg('err_bb_gt_buyin'));

    var stackSize = players + rebuys; // quantas pilhas o kit precisa montar
    var pot = (players + rebuys) * buyIn;

    var base = {
      ok: false, errors: errors, warnings: warnings,
      players: players, buyIn: buyIn, rebuys: rebuys,
      pot: pot, potBase: players * buyIn,
      bigBlind: bigBlind, smallBlind: smallBlind,
      stackInBigBlinds: bigBlind > 0 ? Math.round((buyIn / bigBlind) * 10) / 10 : null,
      rows: [], chipsPerPlayer: 0, remainder: buyIn, exact: false
    };
    if (errors.length) return base;

    // Fichas que dá para dar pelo menos 1 para cada pilha.
    var usable = chips.filter(function (c) { return Math.floor(c.qty / stackSize) >= 1; });
    chips.forEach(function (c) {
      if (Math.floor(c.qty / stackSize) < 1) {
        warnings.push(msg('warn_low_stock', { name: c.name, qty: c.qty, n: stackSize }));
      }
    });
    if (!usable.length) {
      errors.push(msg('err_no_stock', { n: stackSize }));
      return base;
    }

    var fixed = usable.filter(function (c) { return c.value > 0; });
    var auto = usable.filter(function (c) { return c.value <= 0; });
    var fixedSet = {};
    var dupFixed = false;
    fixed.forEach(function (c) { if (fixedSet[c.value]) dupFixed = true; fixedSet[c.value] = true; });
    if (dupFixed) warnings.push(msg('warn_dup_fixed'));

    // Unidades iniciais da escada.
    var units;
    var unitFromBlind = bigBlind > 0 ? (useSmall ? smallBlind : bigBlind) : 0;
    if (unitFromBlind > 0) units = [unitFromBlind];
    else {
      units = NICE.filter(function (v) { return v >= buyIn / 400 && v <= buyIn / 8; });
      if (!units.length) units = [niceAtLeast(buyIn / 50)];
    }

    var best = null;
    units.forEach(function (unit, ui) {
      FACTORS.forEach(function (factor, fi) {
        var ladder = ladderValues(unit, factor, auto.length, fixedSet, buyIn);
        if (ladder.length < auto.length) return; // não coube
        var vals = {};
        fixed.forEach(function (c) { vals[c.id] = c.value; });
        auto.forEach(function (c, i) { vals[c.id] = ladder[i]; }); // ordem da lista = menor → maior
        var cand = searchCounts(usable, vals, buyIn, stackSize, target, unitFromBlind);
        if (!cand) return;
        cand.score += fi * 0.01 + ui * 0.001; // desempate estável
        if (!best || cand.score < best.score) best = cand;
      });
    });

    if (!best) {
      errors.push(msg('err_no_solution'));
      return base;
    }

    var rows = chips.map(function (c) {
      var inUse = best.vals[c.id] !== undefined;
      var count = inUse ? (best.counts[c.id] || 0) : 0;
      var value = inUse ? best.vals[c.id] : c.value;
      return {
        id: c.id, name: c.name, color: c.color, qty: c.qty,
        value: value, count: count, subtotal: value * count,
        fixed: c.value > 0, used: inUse && count > 0,
        totalNeeded: count * stackSize,
        reserve: count * rebuys
      };
    }).sort(function (a, b) { return (a.value || 0) - (b.value || 0); });

    var usedValues = rows.filter(function (r) { return r.used; }).map(function (r) { return r.value; });
    if (smallBlind > 0 && !canPay(smallBlind, usedValues)) warnings.push(msg('warn_no_sb'));
    if (bigBlind > 0 && !canPay(bigBlind, usedValues)) warnings.push(msg('warn_no_bb'));
    if (best.rem > 0) warnings.push(msg('warn_not_exact', { cents: best.rem }));
    if (base.stackInBigBlinds !== null) {
      if (base.stackInBigBlinds < 20) warnings.push(msg('warn_stack_short', { n: base.stackInBigBlinds }));
      if (base.stackInBigBlinds > 500) warnings.push(msg('warn_stack_deep', { n: base.stackInBigBlinds }));
    }
    rows.forEach(function (r) {
      if (r.fixed && r.count === 0 && r.qty >= stackSize) warnings.push(msg('warn_fixed_unused', { name: r.name }));
    });

    base.ok = true;
    base.rows = rows;
    base.chipsPerPlayer = best.total;
    base.remainder = best.rem;
    base.exact = best.rem === 0;
    base.reserveChips = best.total * rebuys;
    return base;
  }

  /** Busca a quantidade de cada ficha por jogador (DFS com limite). */
  function searchCounts(chips, vals, buyIn, stackSize, target, unit) {
    var list = chips.slice().sort(function (a, b) { return vals[b.id] - vals[a.id]; }); // maior → menor
    var n = list.length;
    var vs = list.map(function (c) { return vals[c.id]; });
    var mx = list.map(function (c) { return Math.floor(c.qty / stackSize); });
    var counts = new Array(n).fill(0);
    var nodes = 0;
    var best = null;

    function leaf(rem) {
      var t = 0, zerosAuto = 0, zerosFixed = 0;
      for (var j = 0; j < n; j++) {
        t += counts[j];
        if (counts[j] === 0) { if (list[j].value > 0) zerosFixed++; else zerosAuto++; }
      }
      if (t === 0) return;
      var smallest = counts[n - 1];
      var score = (rem > 0 ? 1e6 + rem : 0)
        + Math.abs(t - target)
        + zerosAuto * 12 + zerosFixed * 20
        + (smallest < t * 0.25 ? 8 : 0)
        + (unit > 0 && smallest < 4 ? 10 : 0)
        + (t > 60 ? (t - 60) * 2 : 0);
      if (!best || score < best.score) {
        var byId = {};
        for (var k = 0; k < n; k++) byId[list[k].id] = counts[k];
        best = { score: score, rem: rem, total: t, counts: byId, vals: vals };
      }
    }

    function dfs(i, rem) {
      if (++nodes > NODE_LIMIT) return;
      if (i === n - 1) {
        var k = Math.min(mx[i], Math.floor(rem / vs[i]));
        counts[i] = k; leaf(rem - k * vs[i]); counts[i] = 0;
        return;
      }
      var hi = Math.min(mx[i], Math.floor(rem / vs[i]));
      for (var k2 = hi; k2 >= 0; k2--) { counts[i] = k2; dfs(i + 1, rem - k2 * vs[i]); }
      counts[i] = 0;
    }

    dfs(0, buyIn);
    return best;
  }

  /**
   * Monta um valor qualquer (rebuy, jogador novo) com valores de fichas JÁ definidos
   * e o que sobrou no banco.
   * chips = [{ id, value, available }]  → { counts: {id: n}, total, rem, exact }
   */
  function fillAmount(amount, chips, target) {
    var list = (chips || []).filter(function (c) { return c.value > 0 && c.available > 0; });
    var empty = {};
    (chips || []).forEach(function (c) { empty[c.id] = 0; });
    if (!list.length || amount <= 0) return { counts: empty, total: 0, rem: Math.max(0, amount), exact: amount === 0 };
    var vals = {};
    list.forEach(function (c) { vals[c.id] = c.value; });
    var fake = list.map(function (c) { return { id: c.id, qty: c.available, value: c.value }; });
    var best = searchCounts(fake, vals, amount, 1, Math.max(1, target || DEFAULT_TARGET_CHIPS), 0);
    if (!best) return { counts: empty, total: 0, rem: amount, exact: false };
    var counts = Object.assign({}, empty, best.counts);
    return { counts: counts, total: best.total, rem: best.rem, exact: best.rem === 0 };
  }

  /** Formata centavos na moeda escolhida (BRL, USD, EUR, GBP…). */
  function formatMoney(cents, currency, locale) {
    var cur = currency || 'BRL';
    var i18n = (typeof I18N !== 'undefined') ? I18N : (typeof require === 'function' ? require('./i18n.js') : null);
    var loc = locale || (i18n ? i18n.locale() : 'pt-BR');
    try {
      return new Intl.NumberFormat(loc, {
        style: 'currency', currency: cur,
        minimumFractionDigits: cents % 100 === 0 ? 0 : 2, maximumFractionDigits: 2
      }).format(cents / 100);
    } catch (e) {
      return cur + ' ' + (cents / 100).toFixed(2);
    }
  }

  return {
    computeDistribution: computeDistribution,
    fillAmount: fillAmount,
    toCents: toCents,
    formatMoney: formatMoney,
    canPay: canPay,
    niceAtLeast: niceAtLeast,
    NICE: NICE
  };
});
