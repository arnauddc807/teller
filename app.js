(() => {
  'use strict';

  const KEY = 'teller.sipsaf.v1';
  const COLORS = ['#7c5cff', '#ff3d8b', '#00d4ff', '#3ddc97', '#ffb340', '#ff5d73'];

  const $ = (sel) => document.querySelector(sel);
  const list = $('#list');
  const empty = $('#empty');
  const totalEl = $('#total');
  const subtitle = $('#subtitle');
  const menu = $('#menu');
  const btnMenu = $('#btn-menu');
  const dlg = $('#dlg-counter');
  const form = $('#form-counter');
  const fName = $('#f-name');
  const fStep = $('#f-step');
  const fColors = $('#f-colors');
  const toast = $('#toast');
  const fileInput = $('#file-import');

  /** @type {{id:string,name:string,count:number,step:number,color:string}[]} */
  let counters = [];
  let editingId = null;
  let pickedColor = COLORS[0];
  let toastTimer = null;

  const uid = () =>
    (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

  const defaults = () => [
    { id: uid(), name: 'Sip', count: 0, step: 1, color: COLORS[0] },
    { id: uid(), name: 'Saf', count: 0, step: 1, color: COLORS[1] },
  ];

  // ---------- opslag (localStorage) ----------
  function sanitize(raw) {
    if (!Array.isArray(raw)) return null;
    const clean = raw
      .filter((c) => c && typeof c === 'object')
      .map((c) => ({
        id: typeof c.id === 'string' && c.id ? c.id : uid(),
        name: String(c.name ?? 'Teller').slice(0, 24) || 'Teller',
        count: Number.isFinite(+c.count) ? Math.trunc(+c.count) : 0,
        step: Math.min(999, Math.max(1, Math.trunc(+c.step) || 1)),
        color: COLORS.includes(c.color) ? c.color : COLORS[0],
      }));
    return clean;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw === null) return defaults();
      const parsed = sanitize(JSON.parse(raw));
      return parsed || defaults();
    } catch {
      return defaults();
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(counters));
    } catch {
      showToast('Opslaan lukte niet — is de opslag vol of privé-modus aan?');
    }
  }

  // ---------- helpers ----------
  function haptic(ms = 12) {
    if (navigator.vibrate) navigator.vibrate(ms);
  }

  function showToast(text, actionLabel, onAction) {
    clearTimeout(toastTimer);
    toast.textContent = '';
    toast.append(Object.assign(document.createElement('span'), { textContent: text }));
    if (actionLabel) {
      const btn = Object.assign(document.createElement('button'), { type: 'button', textContent: actionLabel });
      btn.addEventListener('click', () => {
        hideToast();
        onAction();
      });
      toast.append(btn);
    }
    toast.hidden = false;
    toastTimer = setTimeout(hideToast, 5000);
  }

  const hideToast = () => {
    toast.hidden = true;
  };

  const svg = (paths, extra = '') =>
    `<svg viewBox="0 0 24 24" aria-hidden="true" ${extra}>${paths}</svg>`;

  // ---------- rendering ----------
  function render() {
    list.textContent = '';
    for (const c of counters) list.append(cardFor(c));

    empty.hidden = counters.length > 0;
    const total = counters.reduce((sum, c) => sum + c.count, 0);
    totalEl.textContent = counters.length ? `Totaal: ${total}` : '';
    subtitle.textContent = counters.length
      ? counters.map((c) => c.name).slice(0, 3).join(' · ') + (counters.length > 3 ? ' · …' : '')
      : 'Sip & Saf';
  }

  function cardFor(c) {
    const li = document.createElement('li');
    li.className = 'counter';
    li.style.setProperty('--c', c.color);
    li.dataset.id = c.id;
    li.innerHTML = `
      <div class="counter-head">
        <span class="dot"></span>
        <h2 class="counter-name"></h2>
        <button class="mini" type="button" data-act="reset" aria-label="Reset">
          ${svg('<path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/>')}
        </button>
        <button class="mini" type="button" data-act="edit" aria-label="Bewerken">
          ${svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>')}
        </button>
        <button class="mini del" type="button" data-act="delete" aria-label="Verwijderen">
          ${svg('<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>')}
        </button>
      </div>
      <div class="counter-row">
        <button class="step minus" type="button" data-act="dec" aria-label="Eén minder">
          ${svg('<path d="M5 12h14"/>')}
        </button>
        <output class="value" aria-live="polite"></output>
        <button class="step plus" type="button" data-act="inc" aria-label="Eén meer">
          ${svg('<path d="M12 5v14M5 12h14"/>')}
        </button>
      </div>`;

    li.querySelector('.counter-name').textContent = c.name;
    const out = li.querySelector('.value');
    out.textContent = c.count;
    out.setAttribute('aria-label', `${c.name}: ${c.count}`);
    li.querySelector('.minus').disabled = c.count <= 0;
    return li;
  }

  function updateCard(c) {
    const li = list.querySelector(`[data-id="${CSS.escape(c.id)}"]`);
    if (!li) return render();
    const out = li.querySelector('.value');
    out.textContent = c.count;
    out.setAttribute('aria-label', `${c.name}: ${c.count}`);
    out.classList.remove('bump');
    void out.offsetWidth; // herstart de animatie
    out.classList.add('bump');
    li.querySelector('.minus').disabled = c.count <= 0;
    const total = counters.reduce((sum, x) => sum + x.count, 0);
    totalEl.textContent = `Totaal: ${total}`;
  }

  // ---------- acties ----------
  function bump(c, dir) {
    const next = c.count + dir * c.step;
    if (next < 0) return;
    c.count = next;
    save();
    updateCard(c);
    haptic(dir > 0 ? 12 : 8);
  }

  function removeCounter(c) {
    const index = counters.indexOf(c);
    counters.splice(index, 1);
    save();
    render();
    showToast(`"${c.name}" verwijderd`, 'Ongedaan', () => {
      counters.splice(index, 0, c);
      save();
      render();
    });
  }

  list.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const c = counters.find((x) => x.id === btn.closest('.counter').dataset.id);
    if (!c) return;

    switch (btn.dataset.act) {
      case 'inc': return bump(c, 1);
      case 'dec': return bump(c, -1);
      case 'edit': return openDialog(c);
      case 'delete': return removeCounter(c);
      case 'reset': {
        if (c.count === 0) return;
        const before = c.count;
        c.count = 0;
        save();
        updateCard(c);
        haptic(20);
        showToast(`"${c.name}" op nul`, 'Ongedaan', () => {
          c.count = before;
          save();
          updateCard(c);
        });
      }
    }
  });

  // ---------- dialoog ----------
  function paintSwatches() {
    fColors.textContent = '';
    for (const color of COLORS) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch';
      b.style.background = color;
      b.setAttribute('aria-label', `Kleur ${color}`);
      b.setAttribute('aria-pressed', String(color === pickedColor));
      b.addEventListener('click', () => {
        pickedColor = color;
        paintSwatches();
      });
      fColors.append(b);
    }
  }

  function openDialog(c) {
    editingId = c ? c.id : null;
    $('#dlg-title').textContent = c ? 'Teller bewerken' : 'Nieuwe teller';
    fName.value = c ? c.name : '';
    fStep.value = c ? c.step : 1;
    pickedColor = c ? c.color : COLORS[counters.length % COLORS.length];
    paintSwatches();
    dlg.showModal();
    if (!c) setTimeout(() => fName.focus(), 50);
  }

  form.addEventListener('submit', (e) => {
    if (e.submitter && e.submitter.value === 'cancel') return;
    const name = fName.value.trim().slice(0, 24) || 'Teller';
    const step = Math.min(999, Math.max(1, Math.trunc(+fStep.value) || 1));

    if (editingId) {
      const c = counters.find((x) => x.id === editingId);
      if (c) Object.assign(c, { name, step, color: pickedColor });
    } else {
      counters.push({ id: uid(), name, count: 0, step, color: pickedColor });
    }
    save();
    render();
    haptic();
  });

  $('#btn-add').addEventListener('click', () => openDialog(null));

  // ---------- menu ----------
  function toggleMenu(open) {
    menu.hidden = !open;
    btnMenu.setAttribute('aria-expanded', String(open));
  }
  btnMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu(menu.hidden);
  });
  document.addEventListener('click', (e) => {
    if (!menu.hidden && !menu.contains(e.target)) toggleMenu(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') toggleMenu(false);
  });

  menu.addEventListener('click', (e) => {
    const action = e.target.dataset && e.target.dataset.action;
    if (!action) return;
    toggleMenu(false);

    if (action === 'reset-all') {
      const before = counters.map((c) => c.count);
      if (!before.some((n) => n !== 0)) return showToast('Alles staat al op nul.');
      counters.forEach((c) => (c.count = 0));
      save();
      render();
      haptic(25);
      showToast('Alle tellers op nul', 'Ongedaan', () => {
        counters.forEach((c, i) => (c.count = before[i] ?? 0));
        save();
        render();
      });
    }

    if (action === 'export') {
      const blob = new Blob([JSON.stringify(counters, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), {
        href: url,
        download: `teller-${new Date().toISOString().slice(0, 10)}.json`,
      });
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    if (action === 'import') fileInput.click();

    if (action === 'wipe') {
      if (!confirm('Alle tellers wissen? Dit kan niet ongedaan gemaakt worden.')) return;
      counters = [];
      save();
      render();
    }
  });

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files && fileInput.files[0];
    fileInput.value = '';
    if (!file) return;
    try {
      const parsed = sanitize(JSON.parse(await file.text()));
      if (!parsed) throw new Error('bad shape');
      counters = parsed;
      save();
      render();
      showToast(`${parsed.length} teller(s) geïmporteerd`);
    } catch {
      showToast('Dat bestand kon ik niet lezen.');
    }
  });

  // ---------- start ----------
  counters = load();
  save();
  render();

  // andere tabs/vensters in sync houden
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    counters = load();
    render();
  });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', async () => {
      let reg;
      try {
        reg = await navigator.serviceWorker.register('sw.js');
      } catch {
        return;
      }

      // Meld een nieuwe deploy zodra die klaarstaat, i.p.v. stilletjes oud te blijven.
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw || !navigator.serviceWorker.controller) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed') {
            showToast('Nieuwe versie beschikbaar', 'Herladen', () => location.reload());
          }
        });
      });

      // Kijk of er een update is wanneer je terugkomt in de app.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {});
      });
    });
  }
})();
