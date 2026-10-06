/*
 * ChipSplit — idiomas.
 * Cada chave tem 4 textos, nesta ordem: [português, inglês, espanhol, chinês].
 * Use I18N.t('chave', { nome: 'valor' }) — {nome} no texto é trocado pelo valor.
 * Funciona no navegador (window.I18N) e no Node (require).
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.I18N = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var LANGS = [
    { code: 'pt', name: 'Português', locale: 'pt-BR', currency: 'BRL', comma: true },
    { code: 'en', name: 'English', locale: 'en-US', currency: 'USD', comma: false },
    { code: 'es', name: 'Español', locale: 'es-ES', currency: 'EUR', comma: true },
    { code: 'zh', name: '中文', locale: 'zh-CN', currency: 'CNY', comma: false }
  ];
  var IDX = { pt: 0, en: 1, es: 2, zh: 3 };

  var CURRENCIES = ['BRL', 'USD', 'EUR', 'GBP', 'CNY', 'MXN', 'ARS', 'JPY'];

  var D = {
    /* ---------- geral ---------- */
    'app.title': ['ChipSplit — fichas e partida de poker', 'ChipSplit — poker chips and game tracker', 'ChipSplit — fichas y partida de póker', 'ChipSplit — 扑克筹码与牌局记录'],
    'app.badge': ['teste', 'test', 'prueba', '测试'],
    'lang.label': ['Idioma', 'Language', 'Idioma', '语言'],
    'tab.sections': ['Seções', 'Sections', 'Secciones', '页面'],
    'tab.calc': ['Calcular', 'Calculate', 'Calcular', '计算'],
    'tab.live': ['Jogo', 'Game', 'Partida', '牌局'],
    'tab.history': ['Histórico', 'History', 'Historial', '历史'],
    'common.cancel': ['Cancelar', 'Cancel', 'Cancelar', '取消'],
    'common.confirm': ['Confirmar', 'Confirm', 'Confirmar', '确认'],
    'common.close': ['Fechar', 'Close', 'Cerrar', '关闭'],
    'foot.tests': ['Rodar testes no navegador', 'Run tests in the browser', 'Ejecutar pruebas en el navegador', '在浏览器中运行测试'],
    'time.min': ['{m} min', '{m} min', '{m} min', '{m} 分钟'],
    'time.hm': ['{h}h{mm}', '{h}h{mm}', '{h}h{mm}', '{h}小时{mm}分'],
    'player.default': ['Jogador {n}', 'Player {n}', 'Jugador {n}', '玩家 {n}'],
    'game.default_title': ['Jogo de {date}', 'Game on {date}', 'Partida del {date}', '{date} 的牌局'],
    'rebuy.one': ['{n} rebuy', '{n} rebuy', '{n} recompra', '{n} 次补码'],
    'rebuy.many': ['{n} rebuys', '{n} rebuys', '{n} recompras', '{n} 次补码'],

    /* ---------- fichas padrão ---------- */
    'chip.white': ['Branca', 'White', 'Blanca', '白色'],
    'chip.red': ['Vermelha', 'Red', 'Roja', '红色'],
    'chip.blue': ['Azul', 'Blue', 'Azul', '蓝色'],
    'chip.green': ['Verde', 'Green', 'Verde', '绿色'],
    'chip.black': ['Preta', 'Black', 'Negra', '黑色'],
    'chip.purple': ['Roxa', 'Purple', 'Morada', '紫色'],
    'chip.yellow': ['Amarela', 'Yellow', 'Amarilla', '黄色'],
    'chip.pink': ['Rosa', 'Pink', 'Rosa', '粉色'],
    'chip.new': ['Ficha {n}', 'Chip {n}', 'Ficha {n}', '筹码 {n}'],

    /* ---------- calcular ---------- */
    'calc.config': ['Configuração', 'Setup', 'Configuración', '设置'],
    'calc.examples': ['Exemplos…', 'Examples…', 'Ejemplos…', '示例…'],
    'calc.load_example': ['Carregar exemplo', 'Load example', 'Cargar ejemplo', '加载示例'],
    'calc.clear': ['Limpar', 'Reset', 'Limpiar', '重置'],
    'calc.players': ['Jogadores', 'Players', 'Jugadores', '玩家人数'],
    'calc.fewer_players': ['Menos jogadores', 'Fewer players', 'Menos jugadores', '减少玩家'],
    'calc.more_players': ['Mais jogadores', 'More players', 'Más jugadores', '增加玩家'],
    'calc.currency': ['Moeda', 'Currency', 'Moneda', '货币'],
    'calc.buyin': ['Entrada por jogador (stack inicial)', 'Buy-in per player (starting stack)', 'Entrada por jugador (stack inicial)', '每人买入（起始筹码）'],
    'calc.bigblind': ['Big blind', 'Big blind', 'Ciega grande', '大盲注'],
    'calc.bigblind_hint': ['(vazio = sem blinds)', '(empty = no blinds)', '(vacío = sin ciegas)', '（留空 = 无盲注）'],
    'calc.rebuys': ['Rebuys estimados', 'Expected rebuys', 'Recompras estimadas', '预计补码次数'],
    'calc.fewer_rebuys': ['Menos rebuys', 'Fewer rebuys', 'Menos recompras', '减少补码'],
    'calc.more_rebuys': ['Mais rebuys', 'More rebuys', 'Más recompras', '增加补码'],
    'calc.use_small': ['Usar small blind', 'Use small blind', 'Usar ciega pequeña', '使用小盲注'],
    'calc.small_is': ['— small = {v}', '— small = {v}', '— pequeña = {v}', '— 小盲 = {v}'],
    'calc.small_off': ['— desligado (só big)', '— off (big only)', '— desactivada (solo grande)', '— 关闭（只有大盲）'],
    'calc.small_need_bb': ['— informe o big blind', '— enter the big blind', '— indica la ciega grande', '— 请输入大盲注'],
    'calc.chips_title': ['Fichas do kit', 'Your chip set', 'Fichas del set', '筹码套装'],
    'calc.chips_order': ['ordem da lista = da menor para a maior', 'list order = smallest to largest', 'orden de la lista = de menor a mayor', '列表顺序 = 从小到大'],
    'calc.col_color': ['Cor', 'Color', 'Color', '颜色'],
    'calc.col_name': ['Nome', 'Name', 'Nombre', '名称'],
    'calc.col_qty': ['Qtd', 'Qty', 'Cant.', '数量'],
    'calc.col_value': ['Valor', 'Value', 'Valor', '面值'],
    'calc.add_chip': ['+ Adicionar ficha', '+ Add chip', '+ Añadir ficha', '+ 添加筹码'],
    'calc.chips_help': ['Valor vazio = automático. Valor digitado = fixo: o app nunca muda e recalcula as outras em volta dele.', 'Empty value = automatic. Typed value = fixed: the app never changes it and recalculates the others around it.', 'Valor vacío = automático. Valor escrito = fijo: la app nunca lo cambia y recalcula las demás a su alrededor.', '面值留空 = 自动。手动输入 = 固定：应用不会改动它，并围绕它重新计算其他筹码。'],
    'calc.result': ['Resultado', 'Result', 'Resultado', '结果'],
    'calc.pot': ['Pote estimado', 'Estimated pot', 'Bote estimado', '预计底池'],
    'calc.each_gets': ['Cada jogador recebe', 'Each player gets', 'Cada jugador recibe', '每位玩家获得'],
    'calc.th_chip': ['Ficha', 'Chip', 'Ficha', '筹码'],
    'calc.th_value': ['Valor', 'Value', 'Valor', '面值'],
    'calc.th_per': ['Por jogador', 'Per player', 'Por jugador', '每人'],
    'calc.th_sub': ['Subtotal', 'Subtotal', 'Subtotal', '小计'],
    'calc.th_kit': ['Usa do kit', 'Used from set', 'Usa del set', '占用套装'],
    'calc.th_action': ['Ação', 'Action', 'Acción', '操作'],
    'calc.fix_help': ['“Fixar” trava o valor calculado (vira digitado). “Soltar” devolve para automático.', '“Lock” keeps the calculated value (it becomes typed). “Unlock” makes it automatic again.', '“Fijar” mantiene el valor calculado (pasa a escrito). “Soltar” lo vuelve automático.', '“锁定”保留计算出的面值（变为手动）。“解锁”恢复自动。'],
    'calc.start': ['Começar jogo com essa distribuição', 'Start game with this split', 'Empezar partida con este reparto', '用此分配开始牌局'],
    'calc.n_chips': ['{n} fichas', '{n} chips', '{n} fichas', '{n} 个筹码'],
    'calc.n_bb': ['{n} big blinds', '{n} big blinds', '{n} ciegas grandes', '{n} 个大盲'],
    'calc.blinds': ['blinds {v}', 'blinds {v}', 'ciegas {v}', '盲注 {v}'],
    'calc.reserve': ['reserva: {n} fichas', 'reserve: {n} chips', 'reserva: {n} fichas', '备用：{n} 个筹码'],
    'calc.all_good': ['Fecha exato. Tudo certo.', 'Adds up exactly. All set.', 'Cuadra exacto. Todo listo.', '金额完全吻合，一切就绪。'],
    'calc.typed': ['digitada', 'typed', 'escrita', '手动'],
    'calc.fix': ['Fixar', 'Lock', 'Fijar', '锁定'],
    'calc.release': ['Soltar', 'Unlock', 'Soltar', '解锁'],
    'chip.color_of': ['Cor da ficha {name}', 'Color of {name} chip', 'Color de la ficha {name}', '{name} 的颜色'],
    'chip.name': ['Nome', 'Name', 'Nombre', '名称'],
    'chip.qty_of': ['Quantidade de {name}', 'Quantity of {name}', 'Cantidad de {name}', '{name} 的数量'],
    'chip.value_of': ['Valor de {name} (vazio = automático)', 'Value of {name} (empty = automatic)', 'Valor de {name} (vacío = automático)', '{name} 的面值（留空 = 自动）'],
    'chip.auto': ['auto', 'auto', 'auto', '自动'],
    'chip.up': ['Subir', 'Move up', 'Subir', '上移'],
    'chip.down': ['Descer', 'Move down', 'Bajar', '下移'],
    'chip.remove': ['Remover {name}', 'Remove {name}', 'Quitar {name}', '删除 {name}'],

    /* ---------- mensagens do cálculo ---------- */
    'msg.err_players': ['São necessários pelo menos 2 jogadores.', 'You need at least 2 players.', 'Se necesitan al menos 2 jugadores.', '至少需要 2 名玩家。'],
    'msg.err_buyin': ['Informe a entrada (stack inicial) por jogador.', 'Enter the buy-in (starting stack) per player.', 'Indica la entrada (stack inicial) por jugador.', '请输入每人买入（起始筹码）。'],
    'msg.err_chips': ['Adicione pelo menos uma ficha.', 'Add at least one chip.', 'Añade al menos una ficha.', '请至少添加一种筹码。'],
    'msg.err_bb_gt_buyin': ['O big blind é maior que a entrada.', 'The big blind is larger than the buy-in.', 'La ciega grande es mayor que la entrada.', '大盲注大于买入金额。'],
    'msg.err_no_stock': ['Nenhuma ficha tem quantidade suficiente para {n} pilhas.', 'No chip has enough quantity for {n} stacks.', 'Ninguna ficha alcanza para {n} pilas.', '没有任何筹码足够分成 {n} 份。'],
    'msg.err_no_solution': ['Não foi possível montar uma pilha com essas fichas e valores.', 'Could not build a stack with these chips and values.', 'No se pudo armar una pila con estas fichas y valores.', '无法用这些筹码和面值组成一份。'],
    'msg.warn_bb_odd': ['Big blind ímpar em centavos: small arredondado para {v}.', 'Odd big blind in cents: small rounded to {v}.', 'Ciega grande impar en céntimos: pequeña redondeada a {v}.', '大盲注无法平分：小盲取整为 {v}。'],
    'msg.warn_low_stock': ['Ficha {name}: {qty} não dá nem 1 para cada uma das {n} pilhas — fica de fora.', '{name} chip: {qty} is not even 1 for each of the {n} stacks, so it is left out.', 'Ficha {name}: {qty} no alcanza ni 1 para cada una de las {n} pilas, queda fuera.', '{name}：{qty} 个不够 {n} 份每份 1 个，已排除。'],
    'msg.warn_dup_fixed': ['Duas fichas digitadas com o mesmo valor.', 'Two typed chips have the same value.', 'Dos fichas escritas tienen el mismo valor.', '两种手动筹码面值相同。'],
    'msg.warn_no_sb': ['Com esses valores não dá para pagar o small blind exato.', 'These values cannot pay the small blind exactly.', 'Con estos valores no se puede pagar la ciega pequeña exacta.', '这些面值无法刚好支付小盲注。'],
    'msg.warn_no_bb': ['Com esses valores não dá para pagar o big blind exato.', 'These values cannot pay the big blind exactly.', 'Con estos valores no se puede pagar la ciega grande exacta.', '这些面值无法刚好支付大盲注。'],
    'msg.warn_not_exact': ['Não fecha exato: faltam {v} por jogador.', 'Does not add up: {v} short per player.', 'No cuadra exacto: faltan {v} por jugador.', '金额不吻合：每人还差 {v}。'],
    'msg.warn_stack_short': ['Stack curto: só {n} big blinds por jogador.', 'Short stack: only {n} big blinds per player.', 'Stack corto: solo {n} ciegas grandes por jugador.', '筹码偏少：每人只有 {n} 个大盲。'],
    'msg.warn_stack_deep': ['Stack muito fundo: {n} big blinds por jogador.', 'Very deep stack: {n} big blinds per player.', 'Stack muy profundo: {n} ciegas grandes por jugador.', '筹码很深：每人 {n} 个大盲。'],
    'msg.warn_fixed_unused': ['Ficha {name} (valor digitado) acabou sem uso nessa entrada.', '{name} chip (typed value) ended up unused for this buy-in.', 'La ficha {name} (valor escrito) quedó sin uso en esta entrada.', '{name}（手动面值）在此买入中未被使用。'],

    /* ---------- registro da partida ---------- */
    'log.start': ['Partida começou', 'Game started', 'Empezó la partida', '牌局开始'],
    'log.join': ['{who} entrou com {v}', '{who} bought in for {v}', '{who} entró con {v}', '{who} 以 {v} 买入'],
    'log.join_mid': ['{who} entrou no meio do jogo com {v}', '{who} joined mid-game with {v}', '{who} entró a mitad de la partida con {v}', '{who} 中途加入，买入 {v}'],
    'log.rebuy': ['{who} fez rebuy de {v}', '{who} rebought for {v}', '{who} recompró {v}', '{who} 补码 {v}'],
    'log.cashout': ['{who} saiu e sacou {v}', '{who} left and cashed out {v}', '{who} se fue y cobró {v}', '{who} 离桌兑现 {v}'],
    'log.final': ['{who} terminou com {v}', '{who} finished with {v}', '{who} terminó con {v}', '{who} 结束时有 {v}'],
    'log.by_value': ['(por valor)', '(by value)', '(por valor)', '（按金额）'],
    'log.rename': ['Renomeado para {name}', 'Renamed to {name}', 'Renombrado a {name}', '改名为 {name}'],
    'log.end': ['Partida encerrada', 'Game ended', 'Partida terminada', '牌局结束'],

    /* ---------- resumo para copiar ---------- */
    'sum.duration': ['duração {d}', 'duration {d}', 'duración {d}', '时长 {d}'],
    'sum.total_in': ['Total que entrou: {v}', 'Total bought in: {v}', 'Total que entró: {v}', '总买入：{v}'],
    'sum.line': ['{name}: colocou {in}, saiu com {out} → {net}', '{name}: put in {in}, left with {out} → {net}', '{name}: puso {in}, salió con {out} → {net}', '{name}：投入 {in}，带走 {out} → {net}'],
    'sum.payments': ['Pagamentos:', 'Payments:', 'Pagos:', '付款：'],
    'sum.pays': ['• {from} paga {v} para {to}', '• {from} pays {v} to {to}', '• {from} paga {v} a {to}', '• {from} 付给 {to} {v}'],
    'sum.diff': ['⚠ Diferença na contagem: {what} {v}', '⚠ Count difference: {what} {v}', '⚠ Diferencia en el conteo: {what} {v}', '⚠ 清点差额：{what} {v}'],
    'sum.over': ['sobrou', 'over by', 'sobró', '多出'],
    'sum.under': ['faltou', 'short by', 'faltó', '短缺'],

    /* ---------- jogo ao vivo ---------- */
    'live.save_fail': ['Não deu para salvar neste navegador (modo anônimo?). Exporte o backup.', 'Could not save in this browser (private mode?). Export a backup.', 'No se pudo guardar en este navegador (¿modo incógnito?). Exporta una copia.', '无法在此浏览器保存（无痕模式？）。请导出备份。'],
    'live.running_ask': ['Já tem um jogo em andamento ("{title}"). Começar outro? O atual continua salvo no Histórico.', 'A game is already running ("{title}"). Start another? The current one stays saved in History.', 'Ya hay una partida en curso ("{title}"). ¿Empezar otra? La actual queda guardada en el Historial.', '已有进行中的牌局（“{title}”）。要开始新的吗？当前牌局会保存在历史中。'],
    'live.start_other': ['Começar outro', 'Start another', 'Empezar otra', '开始新牌局'],
    'live.started_toast': ['Jogo começou. Toque no nome para trocar "{name}" pelo nome real.', 'Game started. Tap a name to change "{name}" to a real name.', 'Empezó la partida. Toca el nombre para cambiar "{name}" por el nombre real.', '牌局已开始。点击名字可把“{name}”改成真实姓名。'],
    'live.empty_title': ['Nenhum jogo aberto', 'No game open', 'Ninguna partida abierta', '没有打开的牌局'],
    'live.empty_text': ['Monte a distribuição na aba Calcular e toque em Começar jogo, ou abra um jogo salvo no Histórico.', 'Set up the split in the Calculate tab and tap Start game, or open a saved game from History.', 'Arma el reparto en la pestaña Calcular y toca Empezar partida, o abre una partida guardada en el Historial.', '在“计算”页设置分配并点击开始牌局，或在“历史”中打开已保存的牌局。'],
    'live.goto_calc': ['Ir para Calcular', 'Go to Calculate', 'Ir a Calcular', '前往计算'],
    'live.no_blinds': ['sem blinds', 'no blinds', 'sin ciegas', '无盲注'],
    'live.game_name': ['Nome do jogo', 'Game name', 'Nombre de la partida', '牌局名称'],
    'live.badge_live': ['ao vivo', 'live', 'en vivo', '进行中'],
    'live.badge_ended': ['encerrado', 'ended', 'terminada', '已结束'],
    'live.duration': ['Duração', 'Duration', 'Duración', '时长'],
    'live.started_at': ['começou {t}', 'started {t}', 'empezó {t}', '{t} 开始'],
    'live.total_in': ['Entrou no total', 'Total bought in', 'Entró en total', '总买入'],
    'live.buyin_is': ['entrada {v}', 'buy-in {v}', 'entrada {v}', '买入 {v}'],
    'live.on_table': ['Na mesa agora', 'On the table now', 'En la mesa ahora', '桌上金额'],
    'live.n_playing': ['{n} jogando', '{n} playing', '{n} jugando', '{n} 人在玩'],
    'live.blinds': ['Blinds', 'Blinds', 'Ciegas', '盲注'],
    'live.n_players_total': ['{n} jogadores no total', '{n} players in total', '{n} jugadores en total', '共 {n} 名玩家'],
    'live.join': ['+ Jogador entra', '+ Player joins', '+ Entra un jugador', '+ 玩家加入'],
    'live.undo': ['Desfazer último', 'Undo last', 'Deshacer último', '撤销上一步'],
    'live.count': ['Encerrar e contar fichas', 'End and count chips', 'Terminar y contar fichas', '结束并清点筹码'],
    'live.player_name': ['Nome do jogador', 'Player name', 'Nombre del jugador', '玩家姓名'],
    'live.playing': ['jogando', 'playing', 'jugando', '在玩'],
    'live.out': ['saiu', 'left', 'salió', '已离桌'],
    'live.put_in': ['Colocou', 'Put in', 'Puso', '投入'],
    'live.rebuys': ['Rebuys', 'Rebuys', 'Recompras', '补码'],
    'live.cashed': ['Sacou', 'Cashed out', 'Cobró', '已兑现'],
    'live.chips_received': ['Fichas que recebeu', 'Chips received', 'Fichas recibidas', '收到的筹码'],
    'live.rebuy': ['Rebuy', 'Rebuy', 'Recompra', '补码'],
    'live.cash': ['Sair / sacar', 'Leave / cash out', 'Salir / cobrar', '离桌 / 兑现'],
    'live.back': ['Voltar ao jogo', 'Back in the game', 'Volver a la partida', '重新入局'],
    'live.bank': ['Fichas no banco', 'Chips in the bank', 'Fichas en la banca', '库存筹码'],
    'live.bank_help': ['É de onde saem as fichas dos rebuys e de quem entra. Quem saca devolve as fichas pra cá.', 'Rebuys and new players get chips from here. Chips handed in on cash-out come back here.', 'De aquí salen las fichas de recompras y de quien entra. Quien cobra devuelve las fichas aquí.', '补码和新玩家的筹码从这里发放，兑现时交回的筹码回到这里。'],
    'live.of_n': ['de {n}', 'of {n}', 'de {n}', '共 {n}'],
    'live.log': ['Registro', 'Log', 'Registro', '记录'],

    /* ---------- contagem final ---------- */
    'count.title': ['Contagem final', 'Final count', 'Conteo final', '最终清点'],
    'count.help': ['Conte as fichas de quem ainda está na mesa (ou digite o valor). As pilhas aparecem na frente de cada um.', 'Count the chips of everyone still at the table (or type the value). The stacks appear in front of each player.', 'Cuenta las fichas de quien sigue en la mesa (o escribe el valor). Las pilas aparecen frente a cada uno.', '清点仍在桌上玩家的筹码（或直接输入金额）。筹码堆会显示在每个人面前。'],
    'count.on_table': ['Na mesa', 'On the table', 'En la mesa', '桌上'],
    'count.must_match': ['tem que bater', 'should match', 'tiene que cuadrar', '应当吻合'],
    'count.counted': ['Contado', 'Counted', 'Contado', '已清点'],
    'count.finish': ['Ver resultado e divisão', 'See result and settle-up', 'Ver resultado y reparto', '查看结果与结算'],
    'count.by': ['Contar por', 'Count by', 'Contar por', '清点方式'],
    'count.by_chips': ['Por fichas', 'By chips', 'Por fichas', '按筹码'],
    'count.by_value': ['Por valor', 'By value', 'Por valor', '按金额'],
    'count.final_value': ['Valor final', 'Final value', 'Valor final', '最终金额'],
    'count.match': ['✓ bate certinho', '✓ matches exactly', '✓ cuadra exacto', '✓ 完全吻合'],
    'count.over': ['sobrando {v}', '{v} over', 'sobran {v}', '多出 {v}'],
    'count.under': ['faltando {v}', '{v} short', 'faltan {v}', '短缺 {v}'],
    'count.mismatch_ask': ['A contagem ({sum}) não bate com o que está na mesa ({table}). Encerrar mesmo assim?', 'The count ({sum}) does not match what is on the table ({table}). End anyway?', 'El conteo ({sum}) no cuadra con lo que hay en la mesa ({table}). ¿Terminar igualmente?', '清点金额（{sum}）与桌上金额（{table}）不符。仍要结束吗？'],
    'count.end': ['Encerrar', 'End game', 'Terminar', '结束'],

    /* ---------- resultado ---------- */
    'res.date': ['Data', 'Date', 'Fecha', '日期'],
    'res.n_players': ['{n} jogadores', '{n} players', '{n} jugadores', '{n} 名玩家'],
    'res.in': ['Entrou', 'In', 'Entró', '买入'],
    'res.out': ['saiu {v}', 'out {v}', 'salió {v}', '兑出 {v}'],
    'res.diff': ['Diferença na contagem: {what} {v}. Confira as fichas ou use “Reabrir contagem”.', 'Count difference: {what} {v}. Check the chips or use “Reopen count”.', 'Diferencia en el conteo: {what} {v}. Revisa las fichas o usa “Reabrir conteo”.', '清点差额：{what} {v}。请核对筹码或使用“重新清点”。'],
    'res.match': ['Contagem bate com o que entrou.', 'The count matches what was bought in.', 'El conteo cuadra con lo que entró.', '清点金额与买入金额吻合。'],
    'res.copy': ['Copiar resumo', 'Copy summary', 'Copiar resumen', '复制摘要'],
    'res.export': ['Baixar arquivo do jogo', 'Download game file', 'Descargar archivo de la partida', '下载牌局文件'],
    'res.reopen': ['Reabrir contagem', 'Reopen count', 'Reabrir conteo', '重新清点'],
    'res.new': ['Novo jogo', 'New game', 'Nueva partida', '新牌局'],
    'res.by_value': ['contado por valor', 'counted by value', 'contado por valor', '按金额清点'],
    'res.left_with': ['Saiu com', 'Left with', 'Salió con', '带走'],
    'res.entries': ['Entradas', 'Buy-ins', 'Entradas', '买入次数'],
    'res.who_pays': ['Quem paga quem', 'Who pays whom', 'Quién paga a quién', '谁付给谁'],
    'res.nobody': ['Ninguém deve nada.', 'Nobody owes anything.', 'Nadie debe nada.', '没有人欠款。'],
    'res.unpaid': ['Como a contagem não bateu, {v} de dívida ficou sem destino. Ajuste a contagem para fechar.', 'Because the count did not match, {v} of debt has no one to receive it. Fix the count to close it.', 'Como el conteo no cuadró, {v} de deuda quedó sin destino. Ajusta el conteo para cerrar.', '由于清点不符，有 {v} 的欠款无人收取。请调整清点。'],
    'res.unreceived': ['Como a contagem não bateu, {v} a receber ficou sem quem pague. Ajuste a contagem para fechar.', 'Because the count did not match, {v} owed has no one to pay it. Fix the count to close it.', 'Como el conteo no cuadró, {v} por cobrar quedó sin quien pague. Ajusta el conteo para cerrar.', '由于清点不符，有 {v} 的应收款无人支付。请调整清点。'],
    'res.bank_help': ['Se uma pessoa (banca) guardou todo o dinheiro das entradas, ela paga a cada um o valor “Saiu com”.', 'If one person (the bank) kept all the buy-in money, they pay each player their “Left with” amount.', 'Si una persona (la banca) guardó todo el dinero de las entradas, paga a cada uno su valor “Salió con”.', '如果由一人（庄家）保管全部买入款，就按“带走”金额付给每位玩家。'],
    'res.full_log': ['Registro completo', 'Full log', 'Registro completo', '完整记录'],
    'res.no_chips': ['sem fichas', 'no chips', 'sin fichas', '无筹码'],
    'res.reopen_ask': ['Reabrir a contagem final? Os valores finais serão apagados e o jogo volta para "ao vivo".', 'Reopen the final count? The final values will be cleared and the game goes back to live.', '¿Reabrir el conteo final? Se borrarán los valores finales y la partida vuelve a estar en vivo.', '重新清点？最终金额会被清除，牌局回到进行中。'],
    'res.reopen_btn': ['Reabrir', 'Reopen', 'Reabrir', '重新清点'],

    /* ---------- escolher fichas ---------- */
    'pick.less': ['Menos {name}', 'Fewer {name}', 'Menos {name}', '减少 {name}'],
    'pick.more': ['Mais {name}', 'More {name}', 'Más {name}', '增加 {name}'],
    'pick.bank': ['banco: {n}', 'bank: {n}', 'banca: {n}', '库存：{n}'],

    /* ---------- diálogo entrada / rebuy ---------- */
    'buy.join_title': ['Jogador entra', 'Player joins', 'Entra un jugador', '玩家加入'],
    'buy.rebuy_title': ['Rebuy — {name}', 'Rebuy — {name}', 'Recompra — {name}', '补码 — {name}'],
    'buy.back_title': ['Voltar ao jogo — {name}', 'Back in the game — {name}', 'Volver a la partida — {name}', '重新入局 — {name}'],
    'buy.name': ['Nome', 'Name', 'Nombre', '姓名'],
    'buy.amount': ['Valor que vai entrar', 'Amount going in', 'Monto que entra', '买入金额'],
    'buy.suggested': ['Fichas sugeridas (do banco). Ajuste se faltar alguma cor.', 'Suggested chips (from the bank). Adjust if a color runs out.', 'Fichas sugeridas (de la banca). Ajusta si falta algún color.', '建议筹码（来自库存）。某种颜色不够时可调整。'],
    'buy.resuggest': ['Sugerir de novo', 'Suggest again', 'Sugerir de nuevo', '重新建议'],
    'buy.status': ['{n} fichas = {v}', '{n} chips = {v}', '{n} fichas = {v}', '{n} 个筹码 = {v}'],
    'buy.enter_value': ['informe o valor', 'enter the amount', 'indica el monto', '请输入金额'],
    'buy.exact': ['✓ fecha exato', '✓ adds up exactly', '✓ cuadra exacto', '✓ 金额吻合'],
    'buy.missing': ['faltam {v}', '{v} short', 'faltan {v}', '还差 {v}'],
    'buy.over': ['passou {v}', '{v} over', 'sobran {v}', '多出 {v}'],
    'buy.confirm_anyway': ['Confirmar mesmo assim', 'Confirm anyway', 'Confirmar igualmente', '仍然确认'],
    'buy.mismatch_ask': ['As fichas somam {total} mas o valor é {amount}. Registrar assim mesmo?', 'The chips add up to {total} but the amount is {amount}. Record it anyway?', 'Las fichas suman {total} pero el monto es {amount}. ¿Registrar igualmente?', '筹码合计 {total}，但金额为 {amount}。仍要记录吗？'],
    'buy.record': ['Registrar', 'Record', 'Registrar', '记录'],
    'buy.joined_toast': ['Jogador entrou.', 'Player joined.', 'Entró el jugador.', '玩家已加入。'],
    'buy.rebuy_toast': ['Rebuy registrado.', 'Rebuy recorded.', 'Recompra registrada.', '补码已记录。'],

    /* ---------- diálogo saque ---------- */
    'cash.title': ['Sair / sacar — {name}', 'Leave / cash out — {name}', 'Salir / cobrar — {name}', '离桌 / 兑现 — {name}'],
    'cash.info': ['Colocou {v} no total. Conte as fichas que ele devolve (elas voltam para o banco) ou digite o valor.', 'Put in {v} in total. Count the chips handed in (they go back to the bank) or type the amount.', 'Puso {v} en total. Cuenta las fichas que devuelve (vuelven a la banca) o escribe el monto.', '共投入 {v}。清点交回的筹码（会回到库存）或直接输入金额。'],
    'cash.value': ['Valor que sai', 'Amount going out', 'Monto que sale', '兑现金额'],
    'cash.status': ['Sai com {v} · resultado {net}', 'Leaves with {v} · result {net}', 'Sale con {v} · resultado {net}', '带走 {v} · 盈亏 {net}'],
    'cash.confirm': ['Confirmar saque', 'Confirm cash-out', 'Confirmar cobro', '确认兑现'],
    'cash.toast': ['Saque registrado.', 'Cash-out recorded.', 'Cobro registrado.', '兑现已记录。'],

    /* ---------- desfazer ---------- */
    'undo.ask': ['Desfazer: "{what}"?', 'Undo: "{what}"?', '¿Deshacer: "{what}"?', '撤销：“{what}”？'],
    'undo.btn': ['Desfazer', 'Undo', 'Deshacer', '撤销'],

    /* ---------- histórico ---------- */
    'hist.title': ['Histórico de jogos', 'Game history', 'Historial de partidas', '牌局历史'],
    'hist.export': ['Exportar backup', 'Export backup', 'Exportar copia', '导出备份'],
    'hist.import': ['Importar backup', 'Import backup', 'Importar copia', '导入备份'],
    'hist.help': ['Tudo fica salvo neste aparelho/navegador. Use “Exportar backup” para guardar um arquivo ou passar para outro aparelho.', 'Everything is saved on this device/browser. Use “Export backup” to keep a file or move to another device.', 'Todo se guarda en este dispositivo/navegador. Usa “Exportar copia” para guardar un archivo o pasarlo a otro dispositivo.', '所有数据都保存在本设备/浏览器中。用“导出备份”保存文件或转移到其他设备。'],
    'hist.empty': ['Nenhum jogo salvo ainda.', 'No saved games yet.', 'Aún no hay partidas guardadas.', '还没有保存的牌局。'],
    'hist.meta': ['{date} · {n} jogadores · entrou {v}', '{date} · {n} players · bought in {v}', '{date} · {n} jugadores · entró {v}', '{date} · {n} 名玩家 · 买入 {v}'],
    'hist.open': ['Abrir', 'Open', 'Abrir', '打开'],
    'hist.delete': ['Excluir', 'Delete', 'Eliminar', '删除'],
    'hist.delete_aria': ['Excluir {title}', 'Delete {title}', 'Eliminar {title}', '删除 {title}'],
    'hist.delete_ask': ['Excluir "{title}" do histórico? Não dá para desfazer.', 'Delete "{title}" from history? This cannot be undone.', '¿Eliminar "{title}" del historial? No se puede deshacer.', '从历史中删除“{title}”？此操作无法撤销。'],
    'hist.import_ok': ['Backup importado: {n} jogo(s), {added} novo(s).', 'Backup imported: {n} game(s), {added} new.', 'Copia importada: {n} partida(s), {added} nueva(s).', '备份已导入：{n} 个牌局，其中 {added} 个新的。'],
    'hist.import_fail': ['Não deu para importar: {err}', 'Could not import: {err}', 'No se pudo importar: {err}', '无法导入：{err}'],
    'hist.invalid': ['arquivo inválido', 'invalid file', 'archivo no válido', '文件无效'],

    /* ---------- copiar ---------- */
    'copy.ok': ['Resumo copiado. É só colar no grupo.', 'Summary copied. Paste it in your group chat.', 'Resumen copiado. Pégalo en el grupo.', '摘要已复制，可直接粘贴到群聊。'],
    'copy.ok_short': ['Resumo copiado.', 'Summary copied.', 'Resumen copiado.', '摘要已复制。'],

    /* ---------- conta e anúncios ---------- */
    'acc.enter': ['Entrar', 'Sign in', 'Entrar', '登录'],
    'acc.guest': ['Convidado', 'Guest', 'Invitado', '访客'],
    'acc.pro': ['Pro', 'Pro', 'Pro', 'Pro'],
    'acc.aria': ['Conta', 'Account', 'Cuenta', '账户'],
    'welcome.title': ['Bem-vindo ao ChipSplit', 'Welcome to ChipSplit', 'Bienvenido a ChipSplit', '欢迎使用 ChipSplit'],
    'welcome.text': ['Divide as fichas, controla rebuys e fecha a conta no fim do jogo.', 'Splits the chips, tracks rebuys and settles up at the end of the game.', 'Reparte las fichas, controla las recompras y cierra las cuentas al final.', '分配筹码、记录补码，并在牌局结束时结算。'],
    'welcome.google': ['Entrar com Google', 'Sign in with Google', 'Entrar con Google', '使用 Google 登录'],
    'welcome.soon': ['em breve', 'soon', 'pronto', '即将推出'],
    'welcome.guest': ['Continuar sem conta', 'Continue without an account', 'Continuar sin cuenta', '不登录继续'],
    'welcome.note': ['Sem conta: tudo fica salvo neste aparelho e a versão grátis tem anúncios. Dá para fazer backup em arquivo no Histórico.', 'Without an account everything is saved on this device and the free version shows ads. You can back up to a file in History.', 'Sin cuenta: todo se guarda en este dispositivo y la versión gratis tiene anuncios. Puedes hacer una copia en archivo en el Historial.', '不登录时数据保存在本设备，免费版会显示广告。可在“历史”中备份到文件。'],
    'acc.title': ['Sua conta', 'Your account', 'Tu cuenta', '你的账户'],
    'acc.mode_pro': ['Convidado · Pro (sem anúncios)', 'Guest · Pro (no ads)', 'Invitado · Pro (sin anuncios)', '访客 · Pro（无广告）'],
    'acc.mode_free': ['Convidado · com anúncios', 'Guest · with ads', 'Invitado · con anuncios', '访客 · 有广告'],
    'acc.since': ['Usando desde {date}', 'Using since {date}', 'Usando desde {date}', '自 {date} 起使用'],
    'acc.saved_here': ['Jogos salvos neste aparelho. Use o backup no Histórico para não perder.', 'Games are saved on this device. Use the backup in History so you do not lose them.', 'Partidas guardadas en este dispositivo. Usa la copia en el Historial para no perderlas.', '牌局保存在本设备。请在“历史”中备份以免丢失。'],
    'acc.go_pro': ['Remover anúncios — Pro (simular)', 'Remove ads — Pro (simulated)', 'Quitar anuncios — Pro (simulado)', '去除广告 — Pro（模拟）'],
    'acc.go_free': ['Voltar para o grátis (simular)', 'Back to free (simulated)', 'Volver a la versión gratis (simulado)', '回到免费版（模拟）'],
    'acc.pro_on': ['Pro ativado (simulação): sem anúncios.', 'Pro on (simulated): no ads.', 'Pro activado (simulado): sin anuncios.', '已开启 Pro（模拟）：无广告。'],
    'acc.pro_off': ['De volta ao grátis: anúncios ligados.', 'Back to free: ads on.', 'De vuelta a la versión gratis: anuncios activados.', '已回到免费版：显示广告。'],
    'ad.banner': ['Espaço de anúncio 320×50', 'Ad space 320×50', 'Espacio de anuncio 320×50', '广告位 320×50'],
    'ad.aria': ['Anúncio', 'Ad', 'Anuncio', '广告'],
    'ad.skip_in': ['Pular em {n}s', 'Skip in {n}s', 'Saltar en {n}s', '{n} 秒后跳过'],
    'ad.skip': ['Pular ›', 'Skip ›', 'Saltar ›', '跳过 ›'],
    'ad.full': ['Anúncio intersticial rápido', 'Quick interstitial ad', 'Anuncio intersticial rápido', '快速插页广告'],
    'ad.remove': ['Remover anúncios com o Pro', 'Remove ads with Pro', 'Quitar anuncios con Pro', '升级 Pro 去除广告'],

    'welcome.note_free': ['Sem conta, tudo fica salvo neste aparelho. Dá para fazer backup em arquivo no Histórico.', 'Without an account everything is saved on this device. You can back up to a file in History.', 'Sin cuenta, todo se guarda en este dispositivo. Puedes hacer una copia en archivo en el Historial.', '不登录时数据保存在本设备，可在“历史”中备份到文件。'],
    'acc.mode_guest': ['Convidado · grátis', 'Guest · free', 'Invitado · gratis', '访客 · 免费'],
    'acc.mode_google': ['Conta Google · sincronizada', 'Google account · synced', 'Cuenta de Google · sincronizada', 'Google 账户 · 已同步'],
    'pro.soon': ['ChipSplit Pro — em breve', 'ChipSplit Pro — coming soon', 'ChipSplit Pro — próximamente', 'ChipSplit Pro — 即将推出'],
    'auth.signed_as': ['Conectado como {email}', 'Signed in as {email}', 'Conectado como {email}', '已登录：{email}'],
    'auth.signin_ok': ['Pronto! Seus jogos agora ficam salvos na sua conta.', 'Done! Your games are now saved to your account.', '¡Listo! Tus partidas ahora se guardan en tu cuenta.', '完成！你的牌局现在保存在账户中。'],
    'auth.signout': ['Sair da conta', 'Sign out', 'Cerrar sesión', '退出登录'],
    'auth.signout_ok': ['Você saiu. Os jogos continuam neste aparelho.', 'Signed out. Your games stay on this device.', 'Cerraste sesión. Las partidas siguen en este dispositivo.', '已退出。牌局仍保存在本设备。'],
    'auth.delete': ['Apagar minha conta', 'Delete my account', 'Eliminar mi cuenta', '删除我的账户'],
    'auth.delete_ask': ['Apagar sua conta e todos os jogos salvos na nuvem? Os jogos deste aparelho continuam aqui. Não dá para desfazer.', 'Delete your account and all games saved in the cloud? Games on this device stay here. This cannot be undone.', '¿Eliminar tu cuenta y todas las partidas guardadas en la nube? Las de este dispositivo se quedan aquí. No se puede deshacer.', '删除你的账户和云端保存的所有牌局？本设备上的牌局会保留。此操作无法撤销。'],
    'auth.deleted': ['Conta apagada.', 'Account deleted.', 'Cuenta eliminada.', '账户已删除。'],
    'auth.error': ['Não deu para entrar: {err}', 'Could not sign in: {err}', 'No se pudo entrar: {err}', '无法登录：{err}'],
    'auth.relogin': ['Por segurança, entre de novo e repita a ação.', 'For security, sign in again and repeat the action.', 'Por seguridad, vuelve a entrar y repite la acción.', '为了安全，请重新登录后再试。'],
    'pwa.install': ['Instalar app', 'Install app', 'Instalar app', '安装应用'],
    'pwa.installed': ['App instalado! Agora ele abre pela tela inicial.', 'App installed! Open it from your home screen.', '¡App instalada! Ábrela desde la pantalla de inicio.', '应用已安装！可从主屏幕打开。'],
    'pwa.ios_help': ['No iPhone: toque no botão Compartilhar (quadrado com seta) do Safari e escolha “Adicionar à Tela de Início”.', 'On iPhone: tap the Share button (square with arrow) in Safari and choose “Add to Home Screen”.', 'En iPhone: toca el botón Compartir (cuadrado con flecha) de Safari y elige “Añadir a pantalla de inicio”.', '在 iPhone 上：点按 Safari 的“分享”按钮（带箭头的方框），然后选择“添加到主屏幕”。'],
    'pwa.other_help': ['Abra o menu do navegador (⋮) e escolha “Instalar app” ou “Adicionar à tela inicial”.', 'Open the browser menu (⋮) and choose “Install app” or “Add to Home screen”.', 'Abre el menú del navegador (⋮) y elige “Instalar app” o “Añadir a pantalla de inicio”.', '打开浏览器菜单（⋮），选择“安装应用”或“添加到主屏幕”。'],
    'fx.dealing': ['Distribuindo as fichas…', 'Dealing the chips…', 'Repartiendo las fichas…', '正在分发筹码…'],

    /* ---------- trocar nome no jogo ---------- */
    'live.rename_ok': ['Confirmar nome', 'Confirm name', 'Confirmar nombre', '确认姓名'],
    'live.renamed_toast': ['Nome atualizado.', 'Name updated.', 'Nombre actualizado.', '姓名已更新。'],

    /* ---------- perfil ---------- */
    'prof.title': ['Perfil', 'Profile', 'Perfil', '个人资料'],
    'prof.photo_add': ['Adicionar foto', 'Add photo', 'Añadir foto', '添加头像'],
    'prof.photo_change': ['Trocar foto', 'Change photo', 'Cambiar foto', '更换头像'],
    'prof.photo_remove': ['Remover foto', 'Remove photo', 'Quitar foto', '删除头像'],
    'prof.photo_error': ['Não deu para usar essa imagem. Tente um JPG ou PNG.', 'Could not use that image. Try a JPG or PNG.', 'No se pudo usar esa imagen. Prueba con JPG o PNG.', '无法使用该图片，请尝试 JPG 或 PNG。'],
    'prof.name': ['Seu nome', 'Your name', 'Tu nombre', '你的名字'],
    'prof.name_hint': ['É o nome que aparece nos jogos e nas suas estatísticas.', 'This is the name shown in games and in your stats.', 'Es el nombre que aparece en las partidas y en tus estadísticas.', '这是牌局和统计中显示的名字。'],
    'prof.handle': ['Seu @', 'Your @', 'Tu @', '你的 @'],
    'prof.handle_hint': ['Para os amigos te acharem quando houver contas. Letras, números, ponto e _.', 'So friends can find you once accounts are available. Letters, numbers, dot and _.', 'Para que tus amigos te encuentren cuando haya cuentas. Letras, números, punto y _.', '开放账户后好友可通过它找到你。可用字母、数字、点和下划线。'],
    'prof.handle_invalid': ['O @ aceita só letras, números, ponto e _ (de 3 a 20).', 'The @ only accepts letters, numbers, dot and _ (3 to 20).', 'El @ solo acepta letras, números, punto y _ (de 3 a 20).', '@ 只能包含字母、数字、点和下划线（3 到 20 位）。'],
    'prof.save': ['Salvar perfil', 'Save profile', 'Guardar perfil', '保存资料'],
    'prof.saved': ['Perfil salvo.', 'Profile saved.', 'Perfil guardado.', '资料已保存。'],
    'prof.account': ['Conta', 'Account', 'Cuenta', '账户'],
    'prof.stats': ['Suas estatísticas', 'Your stats', 'Tus estadísticas', '你的统计'],
    'prof.stats_need_name': ['Coloque seu nome acima para ver suas estatísticas.', 'Add your name above to see your stats.', 'Pon tu nombre arriba para ver tus estadísticas.', '在上方填写名字即可查看统计。'],
    'prof.stats_empty': ['Use o nome “{name}” nos jogos encerrados para ver suas estatísticas aqui.', 'Use the name “{name}” in finished games to see your stats here.', 'Usa el nombre “{name}” en partidas terminadas para ver tus estadísticas aquí.', '在已结束的牌局中使用名字“{name}”，统计就会显示在这里。'],
    'prof.st_games': ['Jogos', 'Games', 'Partidas', '牌局'],
    'prof.st_wins': ['Vitórias', 'Wins', 'Victorias', '盈利局'],
    'prof.st_winrate': ['{p}% dos jogos', '{p}% of games', '{p}% de las partidas', '占 {p}%'],
    'prof.st_balance': ['Saldo', 'Balance', 'Saldo', '总盈亏'],
    'prof.st_best': ['Maior ganho', 'Biggest win', 'Mayor ganancia', '最大盈利'],
    'prof.st_time': ['Tempo jogado', 'Time played', 'Tiempo jugado', '游戏时长'],
    'prof.frequent': ['Jogadores frequentes', 'Regular players', 'Jugadores frecuentes', '常一起玩的人'],
    'prof.frequent_empty': ['Os nomes de quem joga com você aparecem aqui depois dos primeiros jogos.', 'The people you play with show up here after your first games.', 'Quienes juegan contigo aparecen aquí después de las primeras partidas.', '玩过几局后，常一起玩的人会显示在这里。'],
    'prof.n_game': ['{n} jogo', '{n} game', '{n} partida', '{n} 局'],
    'prof.n_games': ['{n} jogos', '{n} games', '{n} partidas', '{n} 局'],
    'prof.friends': ['Amigos', 'Friends', 'Amigos', '好友'],
    'prof.friends_locked': ['Para adicionar amigos, ver o perfil deles e jogar online, você vai precisar de uma conta. O login com Google está chegando.', 'To add friends, see their profiles and play online you will need an account. Google sign-in is coming soon.', 'Para añadir amigos, ver sus perfiles y jugar en línea necesitarás una cuenta. El acceso con Google llega pronto.', '添加好友、查看好友资料和在线游戏需要账户。Google 登录即将推出。'],
    'prof.friend_handle': ['@ do amigo', "Friend's @", '@ del amigo', '好友的 @'],
    'prof.add_friend': ['Adicionar', 'Add', 'Añadir', '添加'],
    'prof.settings': ['Preferências', 'Preferences', 'Preferencias', '偏好设置'],
    'prof.default_currency': ['Moeda padrão', 'Default currency', 'Moneda predeterminada', '默认货币'],
    'prof.me_first': ['Colocar meu nome como Jogador 1', 'Use my name as Player 1', 'Usar mi nombre como Jugador 1', '用我的名字作为玩家 1'],
    'prof.me_first_hint': ['Ao começar um jogo, o primeiro lugar já vem com o seu nome.', 'When a game starts, the first seat already has your name.', 'Al empezar una partida, el primer puesto ya lleva tu nombre.', '开始牌局时，第一个座位自动填上你的名字。'],
    'prof.data': ['Dados e privacidade', 'Data and privacy', 'Datos y privacidad', '数据与隐私'],
    'prof.data_help': ['Seu perfil e seus jogos ficam só neste aparelho. Nesta versão nada é enviado para servidores.', 'Your profile and games stay on this device only. In this version nothing is sent to servers.', 'Tu perfil y tus partidas se quedan solo en este dispositivo. En esta versión no se envía nada a servidores.', '你的资料和牌局只保存在本设备。此版本不会向服务器发送任何数据。'],
    'prof.delete_all': ['Apagar todos os meus dados', 'Delete all my data', 'Borrar todos mis datos', '删除我的全部数据'],
    'prof.delete_ask': ['Apagar perfil, foto, jogos, histórico e preferências deste aparelho? Não dá para desfazer. Se quiser guardar, exporte o backup antes.', 'Delete your profile, photo, games, history and preferences from this device? This cannot be undone. Export a backup first if you want to keep them.', '¿Borrar perfil, foto, partidas, historial y preferencias de este dispositivo? No se puede deshacer. Si quieres conservarlos, exporta una copia antes.', '要从本设备删除资料、头像、牌局、历史和偏好设置吗？此操作无法撤销。如需保留，请先导出备份。'],
    'prof.delete_btn': ['Apagar tudo', 'Delete everything', 'Borrar todo', '全部删除'],
    'prof.version': ['Versão {v}', 'Version {v}', 'Versión {v}', '版本 {v}'],
    'legal.privacy': ['Política de Privacidade', 'Privacy Policy', 'Política de Privacidad', '隐私政策'],
    'legal.terms': ['Termos de Uso', 'Terms of Use', 'Términos de Uso', '使用条款'],

    /* ---------- exemplos ---------- */
    'ex.A': ['A — 6 jogadores, 50, big 0,50 (com small)', 'A — 6 players, 50, big 0.50 (with small)', 'A — 6 jugadores, 50, grande 0,50 (con pequeña)', 'A — 6 人，买入 50，大盲 0.50（有小盲）'],
    'ex.B': ['B — igual ao A, small desligado', 'B — same as A, small off', 'B — igual que A, sin pequeña', 'B — 同 A，关闭小盲'],
    'ex.C': ['C — igual ao A, Vermelha digitada em 2,00', 'C — same as A, Red typed as 2.00', 'C — igual que A, Roja escrita en 2,00', 'C — 同 A，红色手动设为 2.00'],
    'ex.D': ['D — Vermelha 1,00 e Preta 10,00 digitadas', 'D — Red 1.00 and Black 10.00 typed', 'D — Roja 1,00 y Negra 10,00 escritas', 'D — 红色 1.00、黑色 10.00 手动'],
    'ex.E': ['E — 8 jogadores, 20, big 0,20', 'E — 8 players, 20, big 0.20', 'E — 8 jugadores, 20, grande 0,20', 'E — 8 人，买入 20，大盲 0.20'],
    'ex.F': ['F — igual ao A com 2 rebuys', 'F — same as A with 2 rebuys', 'F — igual que A con 2 recompras', 'F — 同 A，预计补码 2 次'],
    'ex.G': ['G — 10 jogadores, 100, big 1', 'G — 10 players, 100, big 1', 'G — 10 jugadores, 100, grande 1', 'G — 10 人，买入 100，大盲 1'],
    'ex.H': ['H — sem blinds (valores automáticos)', 'H — no blinds (automatic values)', 'H — sin ciegas (valores automáticos)', 'H — 无盲注（自动面值）'],
    'ex.K': ['Kit padrão — 30 de cada cor', 'Default set — 30 of each color', 'Set por defecto — 30 de cada color', '默认套装 — 每色 30 个']
  };

  var current = 'pt';

  function detect() {
    var nav = (typeof navigator !== 'undefined' && (navigator.language || '')) || '';
    nav = nav.toLowerCase();
    if (nav.indexOf('pt') === 0) return 'pt';
    if (nav.indexOf('es') === 0) return 'es';
    if (nav.indexOf('zh') === 0) return 'zh';
    return 'en';
  }

  function setLang(code) { if (IDX[code] !== undefined) current = code; return current; }
  function getLang() { return current; }
  function info(code) {
    var c = code || current;
    for (var i = 0; i < LANGS.length; i++) if (LANGS[i].code === c) return LANGS[i];
    return LANGS[0];
  }

  function t(key, params) {
    var row = D[key];
    var s = row ? (row[IDX[current]] || row[0]) : key;
    if (params) {
      s = s.replace(/\{(\w+)\}/g, function (m, k) { return params[k] !== undefined ? params[k] : m; });
    }
    return s;
  }

  /** Texto de uma mensagem do cálculo ({code, params}); money(cents) formata dinheiro. */
  function message(m, money) {
    var p = Object.assign({}, m.params || {});
    if (p.cents !== undefined) p.v = money ? money(p.cents) : String(p.cents);
    return t('msg.' + m.code, p);
  }

  return {
    LANGS: LANGS, CURRENCIES: CURRENCIES, DICT: D,
    t: t, message: message, setLang: setLang, getLang: getLang, info: info, detect: detect,
    locale: function () { return info().locale; },
    usesComma: function () { return info().comma; }
  };
});
