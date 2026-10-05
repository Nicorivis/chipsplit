/*
 * Testes do ChipSplit — sem dependências.
 *   Node:      node tests/run-tests.js
 *   Navegador: abra tests.html
 */
(function () {
  'use strict';
  var isNode = typeof module === 'object' && module.exports;
  var I18N = isNode ? require('../i18n.js') : window.I18N;
  I18N.setLang('pt');
  var CS = isNode ? require('../chipsplit-core.js') : window.ChipSplit;
  var EXAMPLES = isNode ? require('../examples.js') : window.ChipSplitExamples;

  /* ---------- mini framework ---------- */
  var tests = [];
  function test(name, fn) { tests.push({ name: name, fn: fn }); }
  function eq(actual, expected, msg) {
    var a = JSON.stringify(actual), e = JSON.stringify(expected);
    if (a !== e) throw new Error((msg ? msg + '\n' : '') + '  esperado: ' + e + '\n  recebido: ' + a);
  }
  function ok(cond, msg) { if (!cond) throw new Error(msg || 'condição falsa'); }

  /* ---------- helpers ---------- */
  function inputFromExample(id) {
    var s = EXAMPLES.get(id);
    return {
      players: s.players,
      buyIn: CS.toCents(s.buyIn),
      bigBlind: CS.toCents(s.bigBlind),
      useSmallBlind: s.useSmall,
      rebuys: s.rebuys,
      chips: s.chips.map(function (c, i) { return { id: i, name: c.name, color: c.color, qty: c.qty, value: CS.toCents(c.value) }; })
    };
  }
  /** Resumo legível: "Nome valor×qtd" em ordem de valor. */
  function summary(r) {
    return r.rows.filter(function (x) { return x.used; }).map(function (x) { return x.name + ' ' + x.value + '×' + x.count; });
  }
  function checkInvariants(input, r) {
    var stacks = input.players + (input.rebuys || 0);
    var sum = r.rows.reduce(function (s, x) { return s + x.value * x.count; }, 0);
    eq(sum, input.buyIn - r.remainder, 'soma das fichas = entrada - sobra');
    eq(r.pot, stacks * input.buyIn, 'pote = (jogadores + rebuys) × entrada');
    r.rows.forEach(function (x) {
      ok(x.count * stacks <= x.qty, 'estoque estourado em ' + x.name + ': ' + (x.count * stacks) + ' > ' + x.qty);
    });
    input.chips.forEach(function (c) {
      if (c.value > 0) {
        var row = r.rows.filter(function (x) { return x.id === c.id; })[0];
        eq(row.value, c.value, 'valor digitado de ' + c.name + ' não pode mudar');
      }
    });
    var vals = r.rows.filter(function (x) { return x.used; }).map(function (x) { return x.value; });
    eq(vals.length, new Set(vals).size, 'valores das fichas usadas são únicos');
  }

  /* ---------- 1. Conversão de dinheiro ---------- */
  test('toCents: formatos BR e US', function () {
    eq(CS.toCents('50'), 5000);
    eq(CS.toCents('0,50'), 50);
    eq(CS.toCents('0.25'), 25);
    eq(CS.toCents('1.000,50'), 100050);
    eq(CS.toCents(12.5), 1250);
    eq(CS.toCents(''), 0);
    eq(CS.toCents('abc'), 0);
  });

  test('canPay: consegue pagar blinds com as fichas', function () {
    ok(CS.canPay(50, [25, 100]), '0,50 com fichas de 0,25');
    ok(!CS.canPay(25, [50, 100]), '0,25 sem ficha menor que 0,50');
    ok(CS.canPay(30, [10, 25]), '0,30 = 3 × 0,10');
  });

  /* ---------- 2. Exemplos com resultado esperado ---------- */
  var EXPECTED = {
    A: { pot: 30000, chips: 31, rows: ['Branca 25×16', 'Vermelha 100×11', 'Azul 500×3', 'Preta 2000×1'] },
    B: { pot: 30000, chips: 30, rows: ['Branca 50×16', 'Vermelha 100×4', 'Azul 200×4', 'Preta 500×6'] },
    C: { pot: 30000, chips: 30, rows: ['Branca 25×16', 'Azul 100×3', 'Vermelha 200×4', 'Preta 500×7'] },
    D: { pot: 30000, chips: 30, rows: ['Branca 25×12', 'Vermelha 100×12', 'Azul 500×5', 'Preta 1000×1'] },
    E: { pot: 16000, chips: 29, rows: ['Branca 10×10', 'Vermelha 25×12', 'Azul 100×1', 'Preta 250×6'] },
    F: { pot: 40000, chips: 29, rows: ['Branca 25×12', 'Vermelha 100×12', 'Azul 250×2', 'Preta 1000×3'] },
    G: { pot: 100000, chips: 29, rows: ['Branca 50×14', 'Vermelha 200×9', 'Verde 500×3', 'Preta 2000×3'] },
    H: { pot: 30000, chips: 30, rows: ['Branca 50×16', 'Vermelha 100×4', 'Azul 200×4', 'Preta 500×6'] }
  };
  Object.keys(EXPECTED).forEach(function (id) {
    test('Exemplo ' + id + ': distribuição esperada', function () {
      var input = inputFromExample(id);
      var r = CS.computeDistribution(input);
      ok(r.ok, 'deveria calcular: ' + r.errors.join('; '));
      ok(r.exact, 'deveria fechar exato');
      eq(r.pot, EXPECTED[id].pot, 'pote');
      eq(r.chipsPerPlayer, EXPECTED[id].chips, 'fichas por jogador');
      eq(summary(r), EXPECTED[id].rows, 'fichas (valor em centavos × quantidade)');
      checkInvariants(input, r);
    });
  });

  /* ---------- 3. Regras de blinds ---------- */
  test('Com small ligado, a menor ficha vale o small blind', function () {
    var r = CS.computeDistribution(inputFromExample('A'));
    eq(r.smallBlind, 25);
    eq(r.rows[0].value, 25);
    eq(r.stackInBigBlinds, 100);
  });
  test('Com small desligado, a menor ficha vale o big blind', function () {
    var r = CS.computeDistribution(inputFromExample('B'));
    eq(r.smallBlind, 0);
    eq(r.rows[0].value, 50);
  });
  test('Big blind maior que a entrada dá erro', function () {
    var input = inputFromExample('A');
    input.bigBlind = 10000;
    var r = CS.computeDistribution(input);
    ok(!r.ok);
    ok(r.errors.some(function (e) { return e.code === 'err_bb_gt_buyin'; }));
  });
  test('Stack curto gera aviso (menos de 20 big blinds)', function () {
    var input = inputFromExample('A');
    input.bigBlind = 500; // R$ 50 / R$ 5 = 10 BB
    var r = CS.computeDistribution(input);
    ok(r.warnings.some(function (w) { return w.code === 'warn_stack_short' && w.params.n === 10; }), JSON.stringify(r.warnings));
  });
  test('Ficha digitada acima do small avisa que não paga o small', function () {
    var input = inputFromExample('A');
    input.chips = [{ id: 1, name: 'Única', qty: 300, value: 100 }];
    var r = CS.computeDistribution(input);
    ok(r.warnings.some(function (w) { return w.code === 'warn_no_sb'; }), JSON.stringify(r.warnings));
  });

  /* ---------- 4. Prioridade dos valores digitados ---------- */
  test('Valor digitado nunca muda e o resto se ajusta', function () {
    var input = inputFromExample('C');
    var r = CS.computeDistribution(input);
    var red = r.rows.filter(function (x) { return x.name === 'Vermelha'; })[0];
    eq(red.value, 200);
    eq(red.fixed, true);
    ok(red.count > 0, 'a digitada deve ser usada');
    checkInvariants(input, r);
  });
  test('Mudar uma ficha digitada muda as automáticas', function () {
    var a = summary(CS.computeDistribution(inputFromExample('A')));
    var c = summary(CS.computeDistribution(inputFromExample('C')));
    ok(JSON.stringify(a) !== JSON.stringify(c), 'distribuição deveria mudar');
  });

  /* ---------- 5. Pote e rebuys ---------- */
  test('Pote = jogadores × entrada', function () {
    eq(CS.computeDistribution(inputFromExample('E')).pot, 8 * 2000);
  });
  test('Rebuys entram no pote e reservam fichas', function () {
    var input = inputFromExample('F');
    var r = CS.computeDistribution(input);
    eq(r.pot, (6 + 2) * 5000);
    eq(r.potBase, 6 * 5000);
    eq(r.reserveChips, r.chipsPerPlayer * 2);
    checkInvariants(input, r);
  });

  /* ---------- 6. Entradas inválidas ---------- */
  test('Entrada inválida retorna erros', function () {
    var r = CS.computeDistribution({ players: 1, buyIn: 0, chips: [] });
    ok(!r.ok);
    eq(r.errors.length, 3);
  });
  test('Estoque insuficiente para todos', function () {
    var r = CS.computeDistribution({ players: 6, buyIn: 5000, bigBlind: 50, chips: [{ id: 1, name: 'W', qty: 5 }] });
    ok(!r.ok);
    ok(r.errors.some(function (e) { return e.code === 'err_no_stock'; }));
  });
  test('Ficha com pouco estoque fica de fora com aviso', function () {
    var input = inputFromExample('A');
    input.chips.push({ id: 99, name: 'Roxa', qty: 3, value: 0 });
    var r = CS.computeDistribution(input);
    ok(r.ok);
    ok(r.warnings.some(function (w) { return w.code === 'warn_low_stock' && w.params.name === 'Roxa'; }));
    eq(r.rows.filter(function (x) { return x.name === 'Roxa'; })[0].used, false);
  });

  /* ---------- 7. Velocidade ---------- */
  test('Calcula em menos de 300 ms com 6 cores e 12 jogadores', function () {
    var t = Date.now();
    var chips = [];
    for (var i = 0; i < 6; i++) chips.push({ id: i, name: 'C' + i, qty: 300 });
    var r = CS.computeDistribution({ players: 12, buyIn: 20000, bigBlind: 200, chips: chips });
    ok(r.ok);
    var ms = Date.now() - t;
    ok(ms < 300, 'levou ' + ms + ' ms');
  });

  /* ---------- 8. Partida ao vivo ---------- */
  var SS = isNode ? require('../session-core.js') : window.ChipSession;
  var T0 = Date.UTC(2026, 9, 2, 22, 0, 0);
  var MIN = 60000;

  /** Partida de exemplo: 4 jogadores, R$ 50, big 0,50, kit 300/200/150/100. */
  function newGame() {
    var kit = [
      { id: 'w', name: 'Branca', color: '#F2F2EE', qty: 300 },
      { id: 'r', name: 'Vermelha', color: '#D6453D', qty: 200 },
      { id: 'b', name: 'Azul', color: '#2F6FD6', qty: 150 },
      { id: 'k', name: 'Preta', color: '#1B1B1B', qty: 100 }
    ];
    var r = CS.computeDistribution({ players: 4, buyIn: 5000, bigBlind: 50, useSmallBlind: true, chips: kit });
    var start = {};
    r.rows.forEach(function (x) { start[x.id] = x.count; });
    return SS.createSession({
      title: 'Teste', currency: 'BRL', buyIn: 5000, bigBlind: 50, smallBlind: 25, chipsPerPlayer: r.chipsPerPlayer,
      chips: r.rows.map(function (x) { return { id: x.id, name: x.name, color: x.color, qty: x.qty, value: x.value }; }),
      startChips: start, players: ['Ana', 'Beto', 'Caio', 'Duda'], now: T0
    });
  }
  /** Joga a partida inteira do README. */
  function playFullGame() {
    var g = newGame();
    SS.rebuy(g, 'p2', 5000, SS.suggest(g, 5000).counts, T0 + 30 * MIN);
    SS.join(g, 'Edu', 2000, SS.suggest(g, 2000).counts, T0 + 45 * MIN);
    SS.cashOut(g, 'p3', { chips: { k: 2, b: 6, r: 10 } }, T0 + 60 * MIN);
    SS.finish(g, {
      p1: { chips: { w: 20, r: 10, b: 4, k: 2 } },
      p2: { amount: 1000 },
      p4: { amount: 7500 },
      p5: { amount: 3000 }
    }, T0 + 120 * MIN);
    return g;
  }

  test('Partida: começa com pilha de cada um e tira do banco', function () {
    var d = SS.derive(newGame());
    eq(d.players.map(function (p) { return p.name; }), ['Ana', 'Beto', 'Caio', 'Duda']);
    eq(d.players[0].chipsIn, { w: 20, r: 5, b: 4, k: 1 });
    eq(d.bank, { w: 220, r: 180, b: 134, k: 96 });
    eq(d.totalIn, 20000);
    eq(d.onTable, 20000);
  });
  test('Partida: sugestão de rebuy fecha exato com o banco', function () {
    var g = newGame();
    var s = SS.suggest(g, 5000);
    ok(s.exact);
    eq(s.counts, { w: 20, r: 5, b: 4, k: 1 });
    var s2 = SS.suggest(g, 2000);
    ok(s2.exact);
    eq(SS.valueOf(g, s2.counts), 2000);
  });
  test('Partida: sugestão respeita o banco quando falta ficha', function () {
    var g = newGame();
    // Esvazia as brancas do banco com um jogador grande
    SS.join(g, 'Zé', 5500, { w: 220 }, T0 + MIN);
    var s = SS.suggest(g, 5000);
    eq(s.counts.w, 0, 'não tem mais branca no banco');
    ok(s.exact, 'fecha com as outras cores');
  });
  test('Partida: jogador entra no meio do jogo', function () {
    var g = newGame();
    var id = SS.join(g, 'Edu', 2000, { w: 4, r: 4, b: 3 }, T0 + 45 * MIN);
    eq(id, 'p5');
    var d = SS.derive(g);
    eq(d.players.length, 5);
    eq(d.totalIn, 22000);
    eq(d.bank.w, 216);
  });
  test('Partida: saque por fichas devolve fichas ao banco; por valor não', function () {
    var g = newGame();
    SS.cashOut(g, 'p3', { chips: { k: 2, b: 6, r: 10 } }, T0 + 60 * MIN);
    var d = SS.derive(g);
    eq(d.players[2].cashedOut, 8000);
    eq(d.players[2].active, false);
    eq(d.bank, { w: 220, r: 190, b: 140, k: 98 });
    SS.cashOut(g, 'p4', { amount: 3000 }, T0 + 61 * MIN);
    eq(SS.derive(g).bank, { w: 220, r: 190, b: 140, k: 98 });
  });
  test('Partida: quem saiu pode voltar (conta como nova entrada)', function () {
    var g = newGame();
    SS.cashOut(g, 'p3', { amount: 0 }, T0 + 10 * MIN);
    SS.rebuy(g, 'p3', 5000, {}, T0 + 20 * MIN);
    var p = SS.derive(g).players[2];
    eq(p.active, true);
    eq(p.entries, 2);
    eq(p.rebuys, 0);
    eq(p.invested, 10000);
  });
  test('Partida completa: resultado, banco e divisão', function () {
    var g = playFullGame();
    var d = SS.derive(g);
    ok(d.ended);
    eq(d.totalIn, 27000);
    eq(d.totalOut, 27000);
    eq(d.difference, 0);
    eq(d.players.map(function (p) { return p.name + ' ' + p.net; }), ['Ana 2500', 'Beto -9000', 'Caio 3000', 'Duda 2500', 'Edu 1000']);
    eq(d.bank, { w: 216, r: 191, b: 137, k: 99 });
    var st = SS.settle(g);
    eq(st.transfers.map(function (t) { return t.fromName + '>' + t.toName + ' ' + t.amount; }),
      ['Beto>Caio 3000', 'Beto>Ana 2500', 'Beto>Duda 2500', 'Beto>Edu 1000']);
    eq(st.unpaid, 0);
    eq(st.unreceived, 0);
  });
  test('Partida: soma dos resultados é zero quando a contagem bate', function () {
    var d = SS.derive(playFullGame());
    eq(d.players.reduce(function (a, p) { return a + p.net; }, 0), 0);
  });
  test('Partida: contagem errada aparece como diferença', function () {
    var g = newGame();
    SS.finish(g, { p1: { amount: 5000 }, p2: { amount: 5000 }, p3: { amount: 5000 }, p4: { amount: 3000 } }, T0 + 90 * MIN);
    eq(SS.derive(g).difference, -2000);
    ok(/faltou R\$\s?20/.test(SS.summaryText(g)), SS.summaryText(g));
  });
  test('Partida: desfazer último evento e reabrir contagem', function () {
    var g = newGame();
    SS.rebuy(g, 'p1', 5000, { w: 20 }, T0 + MIN);
    SS.undo(g);
    eq(SS.derive(g).totalIn, 20000);
    eq(SS.undo(g), null, 'não desfaz as entradas iniciais');
    var full = playFullGame();
    SS.undo(full); // reabre: tira o fim e os saques finais
    var d = SS.derive(full);
    ok(!d.ended);
    eq(d.active, 4);
    eq(d.onTable, 19000);
  });
  test('Partida: depois de encerrada não aceita rebuy', function () {
    var g = playFullGame();
    var threw = false;
    try { SS.rebuy(g, 'p1', 5000, {}, T0); } catch (e) { threw = true; }
    ok(threw);
  });
  test('Partida: renomear aparece no resultado e no log', function () {
    var g = newGame();
    SS.rename(g, 'p1', 'Nicolas', T0 + MIN);
    SS.rebuy(g, 'p1', 5000, { w: 20 }, T0 + 2 * MIN);
    eq(SS.derive(g).players[0].name, 'Nicolas');
    var last = g.events[g.events.length - 1];
    ok(/^Nicolas fez rebuy de R\$\s?50/.test(SS.describe(g, last)), SS.describe(g, last));
  });
  test('Partida: log tem hora exata e duração', function () {
    var g = playFullGame();
    eq(g.events[0].at, T0);
    eq(g.events[g.events.length - 1].at, T0 + 120 * MIN);
    eq(SS.elapsed(120 * MIN), '2h00');
    eq(SS.elapsed(45 * MIN), '45 min');
  });
  test('Partida: resumo para copiar tem pagamentos', function () {
    var txt = SS.summaryText(playFullGame());
    ok(/Beto paga R\$\s?30 para Caio/.test(txt), txt);
    ok(/Total que entrou: R\$\s?270/.test(txt), txt);
  });
  test('Partida: salva e recarrega (JSON) sem perder nada', function () {
    var g = playFullGame();
    var copy = JSON.parse(JSON.stringify(g));
    eq(SS.derive(copy), SS.derive(g));
  });

  /* ---------- 9. Kit padrão ---------- */
  test('Kit padrão: 30 fichas de cada cor e fecha exato', function () {
    var st = EXAMPLES.defaultState('BRL');
    eq(st.chips.map(function (c) { return c.qty; }), [30, 30, 30, 30]);
    eq(st.chips.map(function (c) { return c.name; }), ['Branca', 'Vermelha', 'Azul', 'Preta']);
    var r = CS.computeDistribution({
      players: st.players, buyIn: CS.toCents(st.buyIn), bigBlind: CS.toCents(st.bigBlind), useSmallBlind: st.useSmall,
      chips: st.chips.map(function (c, i) { return { id: i, name: c.name, qty: c.qty, value: 0 }; })
    });
    ok(r.ok && r.exact, 'deveria fechar exato');
    eq(summary(r), ['Branca 25×4', 'Vermelha 100×4', 'Azul 500×5', 'Preta 2000×1']);
  });

  /* ---------- 10. Idiomas ---------- */
  test('Idiomas: toda frase existe nos 4 idiomas', function () {
    var bad = [];
    Object.keys(I18N.DICT).forEach(function (k) {
      var row = I18N.DICT[k];
      if (row.length !== 4 || row.some(function (x) { return !x || !String(x).trim(); })) bad.push(k);
    });
    eq(bad, [], 'chaves incompletas');
  });
  test('Idiomas: os {campos} são os mesmos em todas as traduções', function () {
    var bad = [];
    var fields = function (str) { return (str.match(/\{\w+\}/g) || []).sort().join(','); };
    Object.keys(I18N.DICT).forEach(function (k) {
      var row = I18N.DICT[k];
      var base = fields(row[0]);
      row.forEach(function (x, i) { if (fields(x) !== base) bad.push(k + '[' + i + ']'); });
    });
    eq(bad, [], 'campos diferentes');
  });
  test('Idiomas: avisos do cálculo saem no idioma escolhido', function () {
    var input = inputFromExample('A');
    input.bigBlind = 500;
    var r = CS.computeDistribution(input);
    var w = r.warnings.filter(function (x) { return x.code === 'warn_stack_short'; })[0];
    var out = {};
    ['pt', 'en', 'es', 'zh'].forEach(function (l) { I18N.setLang(l); out[l] = I18N.message(w); });
    I18N.setLang('pt');
    eq(out.pt, 'Stack curto: só 10 big blinds por jogador.');
    eq(out.en, 'Short stack: only 10 big blinds per player.');
    eq(out.es, 'Stack corto: solo 10 ciegas grandes por jugador.');
    eq(out.zh, '筹码偏少：每人只有 10 个大盲。');
  });
  test('Idiomas: aviso com dinheiro usa a moeda', function () {
    var m = { code: 'warn_not_exact', params: { cents: 250 } };
    I18N.setLang('en');
    var txt = I18N.message(m, function (c) { return CS.formatMoney(c, 'USD'); });
    I18N.setLang('pt');
    eq(txt, 'Does not add up: $2.50 short per player.');
  });
  test('Idiomas: log e resumo da partida em inglês e chinês', function () {
    I18N.setLang('en');
    var g = playFullGame();
    var en = SS.describe(g, g.events[5]);
    var txt = SS.summaryText(g);
    I18N.setLang('zh');
    var zh = SS.describe(g, g.events[5]);
    var name = SS.createSession({ buyIn: 100, chips: [], players: [undefined], now: T0 }).events[1].name;
    I18N.setLang('pt');
    ok(/^Beto rebought for R\$50 \(Branca ×20/.test(en), en);
    ok(/Beto pays R\$30\.00 to Caio|Beto pays R\$30 to Caio/.test(txt), txt);
    ok(/^Beto 补码/.test(zh), zh);
    eq(name, '玩家 1');
  });
  test('Idiomas: idioma desconhecido mantém o atual', function () {
    I18N.setLang('pt');
    eq(I18N.setLang('xx'), 'pt');
    eq(I18N.t('tab.calc'), 'Calcular');
  });

  /* ---------- 11. Perfil ---------- */
  test('Perfil: estatísticas pelo nome (só jogos encerrados)', function () {
    var full = playFullGame();               // Ana +25, Beto −90, Caio +30...
    var running = newGame();                  // não conta: ainda ao vivo
    var st = SS.playerStats([full, running, playFullGame()], ' ana ');
    eq(st.games, 2);
    eq(st.wins, 2);
    eq(st.net, { BRL: 5000 });
    eq(st.best.cents, 2500);
    eq(st.minutes, 240);
    var beto = SS.playerStats([full], 'Beto');
    eq(beto.wins, 0);
    eq(beto.net, { BRL: -9000 });
    eq(beto.best, null);
    eq(SS.playerStats([full], '').games, 0);
  });
  test('Perfil: jogadores frequentes (sem você e sem nomes padrão)', function () {
    var g1 = playFullGame();
    var g2 = newGame();
    SS.join(g2, undefined, 5000, {}, T0 + MIN); // "Jogador 5" — nome padrão, não entra
    var isDefault = function (n) { return /^Jogador \d+$/.test(n); };
    var f = SS.frequentPlayers([g1, g2], 'Ana', isDefault);
    eq(f.map(function (x) { return x.name + ' ' + x.games; }), ['Beto 2', 'Caio 2', 'Duda 2', 'Edu 1']);
  });

  /* ---------- runner ---------- */
  var results = tests.map(function (t) {
    try { t.fn(); return { name: t.name, pass: true }; }
    catch (e) { return { name: t.name, pass: false, error: e.message }; }
  });
  var passed = results.filter(function (r) { return r.pass; }).length;

  if (isNode) {
    results.forEach(function (r) {
      console.log((r.pass ? '  ✓ ' : '  ✗ ') + r.name + (r.pass ? '' : '\n' + r.error));
    });
    console.log('\n' + passed + '/' + results.length + ' testes passaram');
    if (passed !== results.length) process.exitCode = 1;
  } else {
    var out = document.getElementById('out');
    var h = document.createElement('div');
    h.className = 'summary';
    h.textContent = passed + '/' + results.length + ' testes passaram';
    out.appendChild(h);
    results.forEach(function (r) {
      var d = document.createElement('div');
      d.className = 't ' + (r.pass ? 'pass' : 'fail');
      d.textContent = (r.pass ? '✓ ' : '✗ ') + r.name + (r.pass ? '' : '\n' + r.error);
      out.appendChild(d);
    });
  }
})();
