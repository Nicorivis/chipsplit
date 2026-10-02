/*
 * Cenários de exemplo — usados pelo menu "Exemplos" do site e pelos testes.
 * Valores de dinheiro são texto, do jeito que a pessoa digita.
 * Os nomes das fichas e dos exemplos vêm do i18n.js (nameKey / labelKey).
 */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var data = factory(isNode ? require('./i18n.js') : root.I18N);
  if (isNode) module.exports = data;
  else root.ChipSplitExamples = data;
})(typeof self !== 'undefined' ? self : this, function (I18N) {
  function kit() {
    return [
      { nameKey: 'chip.white', color: '#F2F2EE', qty: 100, value: '' },
      { nameKey: 'chip.red', color: '#D6453D', qty: 100, value: '' },
      { nameKey: 'chip.blue', color: '#2F6FD6', qty: 100, value: '' },
      { nameKey: 'chip.black', color: '#1B1B1B', qty: 50, value: '' }
    ];
  }
  function withValue(chips, key, value) {
    return chips.map(function (c) { return c.nameKey === key ? Object.assign({}, c, { value: value }) : c; });
  }

  var LIST = [
    { id: 'A', state: { players: 6, currency: 'BRL', buyIn: '50', bigBlind: '0,50', useSmall: true, rebuys: 0, chips: kit() } },
    { id: 'B', state: { players: 6, currency: 'BRL', buyIn: '50', bigBlind: '0,50', useSmall: false, rebuys: 0, chips: kit() } },
    { id: 'C', state: { players: 6, currency: 'BRL', buyIn: '50', bigBlind: '0,50', useSmall: true, rebuys: 0, chips: withValue(kit(), 'chip.red', '2') } },
    { id: 'D', state: { players: 6, currency: 'BRL', buyIn: '50', bigBlind: '0,50', useSmall: true, rebuys: 0, chips: withValue(withValue(kit(), 'chip.red', '1'), 'chip.black', '10') } },
    { id: 'E', state: { players: 8, currency: 'BRL', buyIn: '20', bigBlind: '0,20', useSmall: true, rebuys: 0, chips: kit() } },
    { id: 'F', state: { players: 6, currency: 'BRL', buyIn: '50', bigBlind: '0,50', useSmall: true, rebuys: 2, chips: kit() } },
    {
      id: 'G', state: {
        players: 10, currency: 'USD', buyIn: '100', bigBlind: '1', useSmall: true, rebuys: 0,
        chips: [
          { nameKey: 'chip.white', color: '#F2F2EE', qty: 150, value: '' },
          { nameKey: 'chip.red', color: '#D6453D', qty: 150, value: '' },
          { nameKey: 'chip.green', color: '#2E9E5B', qty: 100, value: '' },
          { nameKey: 'chip.black', color: '#1B1B1B', qty: 100, value: '' }
        ]
      }
    },
    { id: 'H', state: { players: 6, currency: 'BRL', buyIn: '50', bigBlind: '', useSmall: true, rebuys: 0, chips: kit() } }
  ];

  /** Kit que aparece ao abrir o app pela primeira vez: 30 de cada cor. */
  function defaultState(currency) {
    return {
      players: 6, currency: currency || 'BRL', buyIn: '50', bigBlind: '0,50', useSmall: true, rebuys: 0,
      chips: [
        { nameKey: 'chip.white', color: '#F2F2EE', qty: 30, value: '' },
        { nameKey: 'chip.red', color: '#D6453D', qty: 30, value: '' },
        { nameKey: 'chip.blue', color: '#2F6FD6', qty: 30, value: '' },
        { nameKey: 'chip.black', color: '#1B1B1B', qty: 30, value: '' }
      ]
    };
  }

  /** Estado pronto para uso, com os nomes no idioma atual. */
  function resolve(state) {
    var s = JSON.parse(JSON.stringify(state));
    s.chips = s.chips.map(function (c) {
      var out = Object.assign({}, c, { name: c.name || I18N.t(c.nameKey) });
      delete out.nameKey;
      return out;
    });
    return s;
  }

  return {
    list: LIST.map(function (e) { return { id: e.id, labelKey: 'ex.' + e.id }; }),
    get: function (id) {
      var e = LIST.filter(function (x) { return x.id === id; })[0];
      return e ? resolve(e.state) : null;
    },
    defaultState: function (currency) { return resolve(defaultState(currency)); },
    DEFAULT_QTY: 30
  };
});
