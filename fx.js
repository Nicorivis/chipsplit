/*
 * ChipSplit — animações de confirmação.
 *  - Ondinha (ripple) ao tocar em qualquer botão importante.
 *  - ChipFX.deal(n): fichas sendo distribuídas ao começar um jogo.
 *  - ChipFX.flash(el): destaque dourado num cartão (rebuy, entrada, saque, nome).
 *  - ChipFX.success(btn): botão mostra ✓ por um instante.
 * Tudo respeita "reduzir movimento" do sistema.
 */
(function () {
  'use strict';
  const reduce = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const RIPPLE = 'button.primary, button.gold-btn, button.ok-btn, button.small, button.danger-btn, button.danger-outline, button.dashed, button.ghost, .tab, .stepper button, .mini-stepper button';
  const CHIP_COLORS = ['#F2F2EE', '#D6453D', '#2F6FD6', '#1B1B1B', '#2E9E5B', '#E3B23C'];

  /* ---------- ondinha ao tocar ---------- */
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest(RIPPLE);
    if (!b || b.disabled || reduce()) return;
    const r = b.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2;
    const s = document.createElement('span');
    s.className = 'ripple';
    s.style.width = s.style.height = size + 'px';
    s.style.left = (e.clientX - r.left - size / 2) + 'px';
    s.style.top = (e.clientY - r.top - size / 2) + 'px';
    b.appendChild(s);
    setTimeout(() => s.remove(), 600);
  });

  /* ---------- destaque num elemento ---------- */
  function flash(el) {
    if (!el) return;
    el.classList.remove('fx-flash');
    void el.offsetWidth; // reinicia a animação
    el.classList.add('fx-flash');
    setTimeout(() => el.classList.remove('fx-flash'), 1300);
  }

  /* ---------- botão com ✓ ---------- */
  function success(btn) {
    if (!btn) return;
    btn.classList.add('fx-done');
    setTimeout(() => btn.classList.remove('fx-done'), 900);
  }

  /* ---------- distribuindo fichas ---------- */
  function deal(players, label) {
    return new Promise((resolve) => {
      if (reduce()) return resolve();
      const n = Math.max(2, Math.min(players || 6, 10));
      const ov = document.createElement('div');
      ov.className = 'deal-overlay';
      ov.setAttribute('role', 'status');
      let seats = '';
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(ang) * 120, y = Math.sin(ang) * 82;
        let chips = '';
        for (let k = 0; k < 3; k++) {
          const c = CHIP_COLORS[(i + k) % CHIP_COLORS.length];
          chips += `<span class="deal-chip" style="--x:${x}px;--y:${y - k * 5}px;--c:${c};animation-delay:${i * 70 + k * 120}ms"></span>`;
        }
        seats += `<span class="deal-seat" style="left:calc(50% + ${x}px);top:calc(50% + ${y}px);animation-delay:${i * 70}ms"></span>` + chips;
      }
      ov.innerHTML = `<div class="deal-table">${seats}<span class="deal-center"></span></div><p class="deal-label">${label || ''}</p>`;
      document.body.appendChild(ov);
      requestAnimationFrame(() => ov.classList.add('show'));
      const total = n * 70 + 240 + 650;
      setTimeout(() => {
        ov.classList.remove('show');
        setTimeout(() => { ov.remove(); resolve(); }, 220);
      }, total);
    });
  }

  /* ---------- telas e janelas entram suaves ---------- */
  document.addEventListener('chipsplit:view', (e) => {
    const el = document.getElementById('view-' + e.detail.view);
    if (!el || reduce()) return;
    el.classList.remove('fx-view');
    void el.offsetWidth;
    el.classList.add('fx-view');
  });

  window.ChipFX = { flash, success, deal };
})();
