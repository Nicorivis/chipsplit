/*
 * ChipSplit — lógica da partida ao vivo.
 *
 * A partida é guardada como uma LISTA DE EVENTOS com hora exata
 * (entrada, rebuy, saque, fim…). Tudo o resto — quanto cada um colocou,
 * fichas no banco, pote na mesa, divisão final — é recalculado a partir
 * dessa lista. Assim o log é sempre a fonte da verdade e "desfazer" é só
 * remover o último evento. É também o formato que vai para o banco de
 * dados quando tiver login.
 *
 * Funciona no navegador (window.ChipSession) e no Node (require).
 * Dinheiro sempre em CENTAVOS.
 */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var core = isNode ? require('./chipsplit-core.js') : root.ChipSplit;
  var i18n = isNode ? require('./i18n.js') : root.I18N;
  var api = factory(core, i18n);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ChipSession = api;
})(typeof self !== 'undefined' ? self : this, function (CS, I18N) {
  'use strict';

  var VERSION = 1;

  function rid() { return Math.random().toString(36).slice(2, 8); }
  function now(t) { return typeof t === 'number' ? t : Date.now(); }
  function clean(chips) {
    var out = {};
    Object.keys(chips || {}).forEach(function (k) {
      var n = Math.max(0, Math.floor(Number(chips[k]) || 0));
      if (n > 0) out[k] = n;
    });
    return out;
  }

  /**
   * Cria a partida a partir do resultado da calculadora.
   * opts = {
   *   title, currency, buyIn, bigBlind, smallBlind, chipsPerPlayer,
   *   chips: [{ id, name, color, qty, value }],   // valores já definidos
   *   startChips: { chipId: n },                   // pilha inicial de cada jogador
   *   players: ['Jogador 1', ...], now
   * }
   */
  function createSession(opts) {
    var t = now(opts.now);
    var s = {
      id: 'g' + t.toString(36) + rid(),
      v: VERSION,
      title: opts.title || I18N.t('game.default_title', { date: new Date(t).toLocaleDateString(I18N.locale()) }),
      createdAt: t,
      config: {
        currency: opts.currency || 'BRL',
        buyIn: opts.buyIn,
        bigBlind: opts.bigBlind || 0,
        smallBlind: opts.smallBlind || 0,
        chipsPerPlayer: opts.chipsPerPlayer || 30,
        chips: (opts.chips || []).filter(function (c) { return c.value > 0; }).map(function (c) {
          return { id: String(c.id), name: c.name, color: c.color, qty: c.qty, value: c.value };
        }).sort(function (a, b) { return a.value - b.value; })
      },
      events: []
    };
    push(s, { type: 'start' }, t);
    (opts.players || []).forEach(function (name) {
      join(s, name, opts.buyIn, opts.startChips, t, true);
    });
    return s;
  }

  function push(s, ev, t) {
    ev.at = now(t);
    ev.seq = s.events.length + 1;
    s.events.push(ev);
    return ev;
  }

  function nextPlayerId(s) {
    var n = 0;
    s.events.forEach(function (e) { if (e.type === 'join') n++; });
    return 'p' + (n + 1);
  }

  /* ---------- ações ---------- */

  /** Jogador entra (no começo ou no meio do jogo). */
  function join(s, name, amount, chips, t, initial) {
    assertRunning(s);
    var id = nextPlayerId(s);
    push(s, {
      type: 'join', playerId: id, name: name || I18N.t('player.default', { n: id.slice(1) }),
      amount: amount, chips: clean(chips), initial: !!initial
    }, t);
    return id;
  }

  /** Rebuy (ou volta de quem tinha saído). */
  function rebuy(s, playerId, amount, chips, t) {
    assertRunning(s);
    assertPlayer(s, playerId);
    push(s, { type: 'rebuy', playerId: playerId, amount: amount, chips: clean(chips) }, t);
  }

  /**
   * Jogador sai e troca fichas por dinheiro.
   * how = { chips: {id: n} }  → valor calculado pelas fichas (e elas voltam para o banco)
   *     | { amount: centavos } → só o valor (as fichas não são contadas)
   */
  function cashOut(s, playerId, how, t, final) {
    if (!final) assertRunning(s);
    assertPlayer(s, playerId);
    var ev = { type: 'cashout', playerId: playerId, final: !!final };
    if (how && how.chips) {
      ev.chips = clean(how.chips);
      ev.amount = valueOf(s, ev.chips);
    } else {
      ev.chips = null;
      ev.amount = Math.max(0, Math.floor(Number(how && how.amount) || 0));
    }
    push(s, ev, t);
  }

  function rename(s, playerId, name, t) {
    assertPlayer(s, playerId);
    push(s, { type: 'rename', playerId: playerId, name: name }, t);
  }

  /** Encerra: finals = { playerId: { chips } | { amount } } para quem ainda está jogando. */
  function finish(s, finals, t) {
    assertRunning(s);
    var d = derive(s);
    d.players.forEach(function (p) {
      if (p.active) cashOut(s, p.id, (finals || {})[p.id] || { amount: 0 }, t, true);
    });
    push(s, { type: 'end' }, t);
  }

  /** Desfaz o último evento (não desfaz o início da partida). */
  function undo(s) {
    var last = s.events[s.events.length - 1];
    if (!last || last.type === 'start' || last.initial) return null;
    if (last.type === 'end') {
      // desfaz o fim inteiro: tira o 'end' e os saques finais
      s.events.pop();
      while (s.events.length && s.events[s.events.length - 1].final) s.events.pop();
      return last;
    }
    return s.events.pop();
  }

  function assertRunning(s) { if (isEnded(s)) throw new Error('A partida já foi encerrada.'); }
  function assertPlayer(s, id) {
    if (!s.events.some(function (e) { return e.type === 'join' && e.playerId === id; })) throw new Error('Jogador não existe: ' + id);
  }
  function isEnded(s) { return s.events.some(function (e) { return e.type === 'end'; }); }

  /* ---------- leitura ---------- */

  function valueOf(s, chips) {
    var total = 0;
    s.config.chips.forEach(function (c) { total += (chips[c.id] || 0) * c.value; });
    return total;
  }

  /** Reconstrói o estado atual a partir dos eventos. */
  function derive(s) {
    var bank = {};
    s.config.chips.forEach(function (c) { bank[c.id] = c.qty; });
    var players = [];
    var byId = {};
    var startedAt = null, endedAt = null;

    s.events.forEach(function (ev) {
      var p = byId[ev.playerId];
      switch (ev.type) {
        case 'start': startedAt = ev.at; break;
        case 'join':
          p = {
            id: ev.playerId, name: ev.name, joinedAt: ev.at, active: true,
            invested: 0, cashedOut: 0, entries: 0, rebuys: 0,
            chipsIn: {}, lastCashout: null
          };
          players.push(p); byId[p.id] = p;
          buy(p, ev); p.entries++;
          break;
        case 'rebuy':
          if (!p.active) p.entries++; else p.rebuys++;
          p.active = true; buy(p, ev);
          break;
        case 'cashout':
          p.cashedOut += ev.amount; p.active = false; p.lastCashout = ev;
          if (ev.chips) Object.keys(ev.chips).forEach(function (k) { bank[k] = (bank[k] || 0) + ev.chips[k]; });
          break;
        case 'rename': p.name = ev.name; break;
        case 'end': endedAt = ev.at; break;
      }
    });

    function buy(pl, ev) {
      pl.invested += ev.amount;
      Object.keys(ev.chips || {}).forEach(function (k) {
        bank[k] = (bank[k] || 0) - ev.chips[k];
        pl.chipsIn[k] = (pl.chipsIn[k] || 0) + ev.chips[k];
      });
    }

    var totalIn = 0, totalOut = 0;
    players.forEach(function (pl) {
      totalIn += pl.invested; totalOut += pl.cashedOut;
      pl.net = pl.cashedOut - pl.invested;
    });
    return {
      players: players, bank: bank,
      startedAt: startedAt, endedAt: endedAt, ended: endedAt !== null,
      active: players.filter(function (pl) { return pl.active; }).length,
      totalIn: totalIn, totalOut: totalOut,
      onTable: totalIn - totalOut,          // dinheiro ainda em fichas na mesa
      difference: endedAt !== null ? totalOut - totalIn : 0  // ≠ 0 = contagem errada
    };
  }

  /** Sugere as fichas para um valor (rebuy / jogador novo) com o que tem no banco. */
  function suggest(s, amount) {
    var d = derive(s);
    var target = Math.max(1, Math.round(s.config.chipsPerPlayer * amount / (s.config.buyIn || amount || 1)));
    return CS.fillAmount(amount, s.config.chips.map(function (c) {
      return { id: c.id, value: c.value, available: Math.max(0, d.bank[c.id] || 0) };
    }), target);
  }

  /**
   * Divisão final: quem paga quem (menor número de transferências, guloso).
   * Usa o resultado líquido de cada um (sacou − colocou).
   */
  function settle(s) {
    var d = derive(s);
    var creditors = [], debtors = [];
    d.players.forEach(function (p) {
      if (p.net > 0) creditors.push({ id: p.id, name: p.name, left: p.net });
      if (p.net < 0) debtors.push({ id: p.id, name: p.name, left: -p.net });
    });
    creditors.sort(function (a, b) { return b.left - a.left; });
    debtors.sort(function (a, b) { return b.left - a.left; });
    var transfers = [];
    var i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      var amt = Math.min(debtors[i].left, creditors[j].left);
      if (amt > 0) transfers.push({ from: debtors[i].id, fromName: debtors[i].name, to: creditors[j].id, toName: creditors[j].name, amount: amt });
      debtors[i].left -= amt; creditors[j].left -= amt;
      if (debtors[i].left === 0) i++;
      if (creditors[j].left === 0) j++;
    }
    return {
      transfers: transfers,
      difference: d.difference,
      unpaid: debtors.reduce(function (a, x) { return a + x.left; }, 0),     // sobra de quem deve
      unreceived: creditors.reduce(function (a, x) { return a + x.left; }, 0) // sobra de quem recebe
    };
  }

  /* ---------- texto ---------- */

  function fmt(s, c) { return CS.formatMoney(c, s.config.currency); }
  function chipsText(s, chips) {
    if (!chips) return '';
    return s.config.chips.filter(function (c) { return chips[c.id]; })
      .map(function (c) { return c.name + ' ×' + chips[c.id]; }).join(', ');
  }
  function clock(t) {
    var d = new Date(t);
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }
  function elapsed(ms) {
    var m = Math.floor(ms / 60000), h = Math.floor(m / 60);
    return h > 0 ? I18N.t('time.hm', { h: h, mm: (m % 60 < 10 ? '0' : '') + (m % 60) }) : I18N.t('time.min', { m: m });
  }

  /** Uma linha de log em português para cada evento. */
  function describe(s, ev) {
    var names = {};
    s.events.forEach(function (e) {
      if (e.type === 'join' || (e.type === 'rename' && e.seq <= ev.seq)) names[e.playerId] = e.name;
    });
    var who = names[ev.playerId] || ev.playerId;
    var T = I18N.t;
    var chips = function (c) { return c && Object.keys(c).length ? ' (' + chipsText(s, c) + ')' : ''; };
    switch (ev.type) {
      case 'start': return T('log.start');
      case 'join': return T(ev.initial ? 'log.join' : 'log.join_mid', { who: who, v: fmt(s, ev.amount) }) + chips(ev.chips);
      case 'rebuy': return T('log.rebuy', { who: who, v: fmt(s, ev.amount) }) + chips(ev.chips);
      case 'cashout': return T(ev.final ? 'log.final' : 'log.cashout', { who: who, v: fmt(s, ev.amount) }) + (ev.chips ? chips(ev.chips) : ' ' + T('log.by_value'));
      case 'rename': return T('log.rename', { name: ev.name });
      case 'end': return T('log.end');
      default: return ev.type;
    }
  }

  /** Resumo em texto (para copiar e mandar no grupo). */
  function summaryText(s) {
    var d = derive(s);
    var st = settle(s);
    var T = I18N.t;
    var lines = [];
    lines.push('♠ ' + s.title);
    lines.push(new Date(d.startedAt).toLocaleString(I18N.locale()) + (d.endedAt ? ' · ' + T('sum.duration', { d: elapsed(d.endedAt - d.startedAt) }) : ''));
    lines.push(T('sum.total_in', { v: fmt(s, d.totalIn) }));
    lines.push('');
    d.players.slice().sort(function (a, b) { return b.net - a.net; }).forEach(function (p) {
      lines.push(T('sum.line', { name: p.name, 'in': fmt(s, p.invested), out: fmt(s, p.cashedOut), net: (p.net >= 0 ? '+' : '−') + fmt(s, Math.abs(p.net)) }));
    });
    if (st.transfers.length) {
      lines.push('');
      lines.push(T('sum.payments'));
      st.transfers.forEach(function (tr) { lines.push(T('sum.pays', { from: tr.fromName, v: fmt(s, tr.amount), to: tr.toName })); });
    }
    if (d.ended && d.difference !== 0) {
      lines.push('');
      lines.push(T('sum.diff', { what: T(d.difference > 0 ? 'sum.over' : 'sum.under'), v: fmt(s, Math.abs(d.difference)) }));
    }
    return lines.join('\n');
  }

  /* ---------- perfil: estatísticas e jogadores frequentes ---------- */

  function norm(name) { return String(name || '').trim().toLowerCase(); }

  /**
   * Estatísticas de uma pessoa (pelo nome) nos jogos ENCERRADOS.
   * → { games, wins, net: { BRL: cents, ... }, best: { cents, currency, title } | null, minutes }
   */
  function playerStats(games, name) {
    var n = norm(name);
    var out = { games: 0, wins: 0, net: {}, best: null, minutes: 0 };
    if (!n) return out;
    (games || []).forEach(function (g) {
      var d = derive(g);
      if (!d.ended) return;
      var p = d.players.filter(function (x) { return norm(x.name) === n; })[0];
      if (!p) return;
      var cur = g.config.currency;
      out.games++;
      if (p.net > 0) out.wins++;
      out.net[cur] = (out.net[cur] || 0) + p.net;
      if (p.net > 0 && (!out.best || p.net > out.best.cents)) out.best = { cents: p.net, currency: cur, title: g.title };
      out.minutes += Math.round((d.endedAt - d.startedAt) / 60000);
    });
    return out;
  }

  /** Pessoas que mais jogaram com você (nomes repetidos entre jogos). Ignora nomes padrão "Jogador N". */
  function frequentPlayers(games, exclude, isDefaultName) {
    var ex = norm(exclude);
    var count = {};
    var label = {};
    (games || []).forEach(function (g) {
      var seen = {};
      derive(g).players.forEach(function (p) {
        var k = norm(p.name);
        if (!k || k === ex || seen[k] || (isDefaultName && isDefaultName(p.name))) return;
        seen[k] = true;
        count[k] = (count[k] || 0) + 1;
        label[k] = p.name.trim();
      });
    });
    return Object.keys(count)
      .map(function (k) { return { name: label[k], games: count[k] }; })
      .sort(function (a, b) { return b.games - a.games || a.name.localeCompare(b.name); })
      .slice(0, 12);
  }

  return {
    createSession: createSession, join: join, rebuy: rebuy, cashOut: cashOut,
    rename: rename, finish: finish, undo: undo, derive: derive, suggest: suggest,
    settle: settle, valueOf: valueOf, describe: describe, summaryText: summaryText,
    clock: clock, elapsed: elapsed, isEnded: isEnded, VERSION: VERSION,
    playerStats: playerStats, frequentPlayers: frequentPlayers
  };
});
