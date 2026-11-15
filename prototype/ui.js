/* ======================================================================
   AVEGA shell: pages, blocks, router, theme. Shares scope with core.js / explorer.js
   (dataset D, helpers, chart builders). Everything is DEMO data unless stated.
   ====================================================================== */
const calTxt = () => D.meta.baseline_source === 'preflight' ? `до полёта: ${D.meta.baseline_days} дней` : `дни 1–${D.meta.baseline_days}`;
const SRC = { demo: ['b-demo', 'демо'], sim: ['b-sim', 'смоделировано'], real: ['b-real', 'реальные'], soon: ['b-soon', 'скоро'] };
const badge = k => `<span class="badge ${SRC[k][0]}">${SRC[k][1]}</span>`;
const EXTRA = {
  rad: '<circle cx="12" cy="12" r="1.8"/><path d="M10.4 9.3 7.2 3.8a9 9 0 0 0-4.2 7.4h6.3M13.6 9.3l3.2-5.5a9 9 0 0 1 4.2 7.4h-6.3M10.4 14.7l-3.2 5.5a9 9 0 0 0 9.6 0l-3.2-5.5"/>',
  door: '<path d="M6 21V4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21M4 21h16"/><circle cx="14.5" cy="12" r=".9" fill="currentColor"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
  mountain: '<path d="m3 19 6.5-11 4 6.5 2.5-3.5L21 19H3Z"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="m4 18 5-5 4 4 2.5-2.5L20 19"/>',
  gamepad: '<path d="M7 8h10a4 4 0 0 1 3.9 4.8l-.7 3.4a2.4 2.4 0 0 1-4.1 1.1L14 15h-4l-2.1 2.3a2.4 2.4 0 0 1-4.1-1.1l-.7-3.4A4 4 0 0 1 7 8Z"/><path d="M8 11v3M6.5 12.5h3"/><circle cx="15.5" cy="11.5" r=".8" fill="currentColor"/><circle cx="17" cy="13.5" r=".8" fill="currentColor"/>',
  brush: '<path d="M14.5 4.5 19.5 9.5 11 18l-5-5 8.5-8.5Z"/><path d="M6 13c-2 0-3 1.5-3 3.5 0 1.5-.5 2.5-1 3 3 .5 7 0 7-3.5"/>',
  'arrow-left': '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  graph: '<circle cx="6" cy="17" r="2.5"/><circle cx="12" cy="7" r="2.5"/><circle cx="18" cy="15" r="2.5"/><path d="m7.5 15 3-6M14 8.5l3 4.5M8.5 17.2l7-1.5"/>',
  alert: '<path d="M12 3 2.5 20h19Z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.2" r=".7" fill="currentColor"/>',
  heart: '<path d="M12 20s-7.5-4.6-9-9.3C2 7.5 4 5 6.8 5c2 0 3.5 1.1 5.2 3 1.7-1.9 3.2-3 5.2-3C20 5 22 7.5 21 10.7c-1.5 4.7-9 9.3-9 9.3Z"/>',
  db: '<ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5V5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
  moono: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>',
  expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  shrink: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  cal: '<rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M8 3.5v4M16 3.5v4M4 10h16"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
};
const ic = (n, cls) => `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || EXTRA[n] || ''}</svg>`;

/* ---------------------------------------------------------- chart helpers */
let uid = 0;
function smooth(pts) {   // straight segments: exact, crisp lines (no curve fitting)
  return 'M' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L');
}
function sparkline(vals, color) {
  const w = 160, h = 34, pd = 4, gid = 'sp' + (++uid);
  if (vals.length < 2) return '';
  const lo = Math.min(...vals), hi = Math.max(...vals), span = (hi - lo) || 1, step = (w - 2 * pd) / (vals.length - 1);
  const pts = vals.map((v, i) => [pd + i * step, h - pd - (v - lo) / span * (h - 2 * pd)]);
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${gid}" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="${color}" stop-opacity=".15"/><stop offset=".25" stop-color="${color}" stop-opacity=".9"/><stop offset=".8" stop-color="${color}" stop-opacity=".9"/><stop offset="1" stop-color="${color}" stop-opacity=".15"/></linearGradient></defs>
    <path d="${smooth(pts, 0.2)}" fill="none" stroke="url(#${gid})" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
/* multi-series smooth trend chart (port of the original dashboard's trend_chart) */
function trendChart(series, labels, ticks, y0, y1, base) {
  const W2 = 800, H2 = 230, L = 100, R = 22, T = 12, B = 36, pw = W2 - L - R, ph = H2 - T - B, n = labels.length;
  const sx = i => L + pw * i / (n - 1), sy = v => T + ph * (1 - (v - y0) / (y1 - y0));
  let defs = '', body = `<rect class="tc-frame" x="${L}" y="${T}" width="${pw}" height="${ph}" rx="4"/>`;
  labels.forEach((l, i) => { body += `<line class="grid" x1="${sx(i).toFixed(1)}" y1="${T}" x2="${sx(i).toFixed(1)}" y2="${T + ph}"/><text class="ax" x="${sx(i).toFixed(1)}" y="${H2 - 10}" text-anchor="middle">${l}</text>`; });
  ticks.forEach(t => { body += `<text class="ax" x="${L - 12}" y="${(sy(t.v) + 5).toFixed(1)}" text-anchor="end">${t.txt}</text>`; });
  if (base != null) body += `<line class="tc-base" x1="${L}" y1="${sy(base).toFixed(1)}" x2="${L + pw}" y2="${sy(base).toFixed(1)}"/>`;
  series.forEach(s => {
    const gid = 'tg' + (++uid), pts = s.values.map((v, i) => [sx(i), sy(v)]), p = smooth(pts);
    defs += `<linearGradient id="${gid}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${s.color}" stop-opacity=".18"/><stop offset="1" stop-color="${s.color}" stop-opacity="0"/></linearGradient>`;
    body += `<path d="${p} L${pts[n - 1][0].toFixed(1)},${T + ph} L${pts[0][0].toFixed(1)},${T + ph} Z" fill="url(#${gid})"/><path d="${p}" fill="none" stroke="${s.color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
    pts.forEach(([x, y], i) => { body += `<circle class="mk" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.2" stroke="${s.color}" stroke-width="2.2"><title>${esc(s.name)} · ${labels[i]}: ${s.fmt(s.values[i])}</title></circle>`; });
  });
  return `<svg class="hchart" viewBox="0 0 ${W2} ${H2}" role="img"><defs>${defs}</defs>${body}</svg>`;
}
const legendHTML = ss => `<div class="legend">${ss.map(s => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>`;

/* ----------------------------------------------------------- data helpers */
const lastDays = (n) => Array.from({ length: n }, (_, i) => dayFloor(NOW) - (n - 1 - i) * DAY);
function dayMean(key, ds) {
  if (key === 'hr') { const a = aggHR(ds, ds + DAY); return a ? a.mean : null; }
  const a = aggVals(samples(key, ds, ds + DAY).map(x => x.v)); return a ? a.mean : null;
}
const dailySeries = (key, n) => lastDays(n).map(ds => dayMean(key, ds)).filter(v => v != null);
function lastHR() { for (let i = HRV.length - 1; i >= 0; i--) if (HRV[i] != null) return { v: HRV[i], t: HR0 + i * MIN }; return null; }
const relTime = ms => { const m = Math.max(0, Math.round((NOW - ms) / MIN)); return m < 1 ? 'сейчас' : m < 60 ? `${m} мин назад` : m < 1440 ? `${Math.round(m / 60)} ч назад` : `${Math.round(m / 1440)} дн назад`; };
function chartFor(c) {
  const w = c.w, m = c.met;
  if (m.kind === 'event' && w.scale === 'day') return m.key === 'sleep' ? chartSleep(c) : chartEvents(c);
  return chartSeries(c) || emptyChart(`No ${m.label.toLowerCase()} data in this window`);
}
function rangeCtx(key, scale) {
  const w = windowFor(scale, NOW), c = { w, met: MET[key], bk: makeBuckets(w) };
  c.B = c.bk.B; fillAgg(c); return c;
}
function openHistory(key, target) {
  Object.assign(state, { scale: target.scale, cursor: clamp(target.cursor), metric: key, notice: '' });
  location.hash = '#history';
}
/* a history chart embedded into a block; clicking a point opens History at that spot */
function rangeChart(key, scale) {
  return el => {
    setChartH(336);
    const c = rangeCtx(key, scale), res = chartFor(c), st = winStats(key, c.w), m = MET[key];
    el.innerHTML = `<div class="chart-wrap"></div><div class="hist-legend">${res.legend || ''}</div>
      <div class="mini-stats">${st ? `<span>Среднее <b>${fmt(st.mean, Math.max(m.decimals, 1))} ${m.unit}</b></span><span>Диапазон <b>${fmt(st.min, m.decimals)}–${fmt(st.max, m.decimals)}</b></span><span>n = <b>${st.n.toLocaleString(LOC())}</b> ${st.unit}</span>` : '<span>Нет данных</span>'}
      <a class="link" href="#history" data-k="${key}" data-s="${scale}">Открыть в History ›</a></div>`;
    mount(el.querySelector('.chart-wrap'), res, t => openHistory(key, t));
    el.querySelector('.link').addEventListener('click', () => openHistory(key, { scale, cursor: NOW }));
  };
}

/* ------------------------------------------------------ custom renderers */
const MEMBER = { name: PERSON.name, role: PERSON.role, first: PERSON.first };
const SEXRU = { M: 'Мужской', F: 'Женский' };
const initials = n => n.replace(/^Dr\.\s*/, '').split(' ').map(w => w[0]).join('');
const ACOLOR = { murphy: '#1f9db8', alex: '#4c7fe0', mira: '#c8578f', daniel: '#d98a2f', yuki: '#4aa57b' };
const iniHTML = a => `<span class="avatar ini" style="background:${ACOLOR[a.id] || '#4c7fe0'}">${initials(a.name)}</span>`;
const msgsGet = () => { try { return JSON.parse(lsGet('avega-msgs') || '[]'); } catch (e) { return []; } };
const openCrew = id => { lsSet('avega-view', id); location.hash = '#dashboard'; location.reload(); };
const avatarHTML = () => `<span class="avatar">${AVATAR}</span>`;

function stateCards() {
  const hr = aggHR(NOW - HOUR, NOW + MIN), hour = dt(NOW).getUTCHours(), lastSl = SL[SL.length - 1], lastCi = CI[CI.length - 1], lastTs = TS[TS.length - 1];
  const out = (v, r) => (v == null || !r) ? null : isOut(v, r);
  return [
    { t: 'Physiological', ic: 'pulse', color: '#3fca7a', v: hr ? `HR ${fmt(hr.mean, 0)} bpm` : '—', o: hr ? out(hr.mean, normFor('hr', 'hod', hour)) : null, sp: dailySeries('hr', 7) },
    { t: 'Psychological', ic: 'brain', color: '#9b7bf2', v: lastCi ? `Mood ${fmt(lastCi.mood, 1)} / 10` : '—', o: lastCi ? out(lastCi.mood, normFor('mood', 'event')) : null, sp: dailySeries('mood', 7) },
    { t: 'Sleep', ic: 'moon', color: '#2b8ff0', v: lastSl ? dur(lastSl.h) : '—', o: lastSl ? out(lastSl.h, normFor('sleep', 'event')) : null, sp: dailySeries('sleep', 7) },
    { t: 'Cognitive', ic: 'target', color: '#f2b81d', v: lastTs ? `${fmt(lastTs.v, 0)} pts` : '—', o: lastTs ? out(lastTs.v, normFor('cog', 'event')) : null, sp: dailySeries('cog', 7) },
  ];
}
function rWellbeing(el) {
  const cards = stateCards();
  el.innerHTML = `<div class="state-grid row4">${cards.map(c => `<div class="state-card ${c.o == null ? '' : c.o ? 'warn' : 'ok'}" style="--accent:${c.color}">
      <div class="state-icon">${ic(c.ic)}</div><div class="state-title">${c.t}</div>
      <div class="pill" ${c.o ? 'style="background:var(--amber-soft);color:var(--amber)"' : ''}>${esc(c.v)}</div>${sparkline(c.sp, c.color)}
      <span class="small muted">${c.o == null ? 'нет личной нормы' : c.o ? 'вне личного диапазона' : 'в личном диапазоне'}</span></div>`).join('')}</div>
    <p class="chart-note">Значения и мини-графики за 7 дней считаются из демонстрационного набора данных; сравнение — с личной нормой этого астронавта: ${calTxt()}.</p>`;
}
function rTransmission(el) {
  el.innerHTML = `<div class="blk-tools"><span class="pill">Up to date</span></div>
    <p class="muted small">Your data is stored securely and shared with the medical team on Earth according to mission protocol.</p>
    <p class="chart-note">Макет блока: реальная передача данных не реализована.</p>`;
}
function rCrewOverview(el) {
  const cards = stateCards();
  el.innerHTML = `<div class="member">${avatarHTML()}<div><b>${MEMBER.name}</b><small>${MEMBER.role} · Mars Mission · день ${mDay(NOW)}</small></div></div>
    <div class="state-grid" style="grid-template-columns:repeat(2,minmax(0,1fr))">${cards.map(c => `<div class="state-card" style="--accent:${c.color}">
      <div class="state-icon">${ic(c.ic)}</div><div class="state-title">${c.t}</div>
      <div class="pill" ${c.o ? 'style="background:var(--amber-soft);color:var(--amber)"' : ''}>${esc(c.v)}</div>${sparkline(c.sp, c.color)}
      <span class="small muted">${c.o == null ? 'нет личной нормы' : c.o ? 'вне личного диапазона' : 'в личном диапазоне'} · 7 дн</span></div>`).join('')}</div>
    <p class="chart-note">Последние значения и 7-дневные мини-графики считаются из демонстрационного набора данных; сравнение — с личной нормой этого астронавта: ${calTxt()}.</p>`;
}

const TREND_TABS = [
  { k: 'wb', label: 'Well-being' }, { k: 'sleep', label: 'Sleep' }, { k: 'hr', label: 'Heart rate' }, { k: 'cog', label: 'Cognitive' },
];
function trendSpec(k) {
  const days = lastDays(7), labels = days.map(d => 'D' + mDay(d));
  const col = key => days.map(d => dayMean(key, d));
  const base = key => { const n = D.norms[key] && D.norms[key].daily; return n ? n.m : null; };
  const dev = (key, sign) => col(key).map(v => v == null ? 0 : sign * (v - (base(key) ?? 0)));
  const pad2 = (lo, hi) => { const p = (hi - lo) * 0.18 || 1; return [lo - p, hi + p]; };
  if (k === 'wb') {
    const ss = [{ name: 'Mood', color: '#2b8ff0', values: dev('mood', 1) }, { name: 'Stress (inverted)', color: '#3fd0e6', values: dev('stress', -1) }, { name: 'Energy', color: '#5fd57a', values: dev('energy', 1) }];
    ss.forEach(s => s.fmt = v => sgn(v, 1));
    const all = ss.flatMap(s => s.values), m = Math.max(1, ...all.map(Math.abs)) * 1.15;
    return { ss, labels, y0: -m, y1: m, ticks: [{ v: m, txt: 'Higher' }, { v: 0, txt: 'Baseline' }, { v: -m, txt: 'Lower' }], base: 0, note: 'Отклонение от личной базовой линии (0 = ваша норма); Stress показан инвертированным: выше = лучше.' };
  }
  const cfg = { sleep: ['Sleep duration (h)', '#2b8ff0', 'sleep', v => fmt(v, 1) + ' h', 'h'], hr: ['Mean HR (bpm)', '#ef5b6f', 'hr', v => fmt(v, 0) + ' bpm', ''], cog: ['Cognitive score', '#f2b81d', 'cog', v => fmt(v, 0) + ' pts', ''] }[k];
  const vals = col(cfg[2]).map(v => v == null ? null : v), ok = vals.filter(v => v != null), b = base(cfg[2]);
  const [y0, y1] = pad2(Math.min(...ok, b ?? Infinity), Math.max(...ok, b ?? -Infinity));
  const dec = k === 'sleep' ? 1 : 0, tk = v => fmt(v, dec) + (k === 'sleep' ? ' h' : k === 'hr' ? ' bpm' : '');
  return { ss: [{ name: cfg[0], color: cfg[1], values: vals.map(v => v ?? b ?? y0), fmt: cfg[3] }], labels, y0, y1, ticks: [{ v: y1, txt: tk(y1) }, { v: (y0 + y1) / 2, txt: tk((y0 + y1) / 2) }, { v: y0, txt: tk(y0) }], base: b, note: 'Пунктир — личная норма (среднее, ' + calTxt() + ').' };
}
function rTrends7(el) {
  let cur = 'wb';
  const draw = () => {
    const sp = trendSpec(cur);
    el.innerHTML = `<div class="chips">${TREND_TABS.map(t => `<button class="chipb ${t.k === cur ? 'active' : ''}" data-k="${t.k}">${t.label}</button>`).join('')}</div>
      ${trendChart(sp.ss, sp.labels, sp.ticks, sp.y0, sp.y1, sp.base)}${legendHTML(sp.ss)}<p class="chart-note">${sp.note} Данные — демонстрационные.</p>`;
    el.querySelectorAll('.chipb').forEach(b => b.addEventListener('click', () => { cur = b.dataset.k; draw(); }));
  };
  draw();
}

function recentItems() {
  const it = [];
  CI.forEach(x => it.push({ t: x.t, ic: MET.mood.color, icon: ICON.checkin, title: `${SLOT[x.k]} check-in`, body: `<span>Mood <b>${x.mood}</b></span><span>Stress <b>${x.stress}</b></span><span>Energy <b>${x.energy}</b></span>` }));
  TS.forEach(x => it.push({ t: x.t, ic: MET.cog.color, icon: ICON.test, title: 'Cognitive test', body: `<span>Score <b>${x.v}</b></span>` }));
  SL.forEach(x => it.push({ t: x.e, ic: MET.sleep.color, icon: ICON.sleep, title: 'Sleep', body: `<span>${hhmm(x.s)} → ${hhmm(x.e)}</span><span><b>${dur(x.h)}</b></span>` }));
  return it.sort((a, b) => b.t - a.t);
}
function rRecentEvents(el) {
  const items = recentItems().slice(0, 8);
  el.innerHTML = `<ul class="ev-list">${items.map((e, i) => `<li class="ev click" data-i="${i}"><div class="ev-ic" style="color:${e.ic};background:color-mix(in srgb,${e.ic} 16%,transparent)">${e.icon}</div>
    <div class="ev-body"><b>${e.title}</b> <span class="ev-time">· ${dShort(e.t)} ${hhmm(e.t)} UTC · ${relTime(e.t)}</span><div class="ev-vals">${e.body}</div></div></li>`).join('')}</ul>
    <a class="link" href="#history">Все события в History ›</a>`;
  el.querySelectorAll('.ev').forEach(li => li.addEventListener('click', () => openHistory('hr', { scale: 'day', cursor: items[+li.dataset.i].t })));
}
function rTimeline(el) {
  setChartH(336);
  el.innerHTML = `<div class="chart-wrap"></div><div class="hist-legend"><span><i style="background:${MET.sleep.color}"></i>Sleep</span><span><i class="dot" style="background:${MET.mood.color}"></i>Check-in</span><span><i style="background:${MET.cog.color};transform:rotate(45deg);width:10px"></i>Cognitive test</span></div>
    <p class="chart-note">Сегодня (день ${mDay(NOW)}), время UTC. Данные — демонстрационные.</p>`;
  mount(el.querySelector('.chart-wrap'), dayStrip(windowFor('day', NOW)), t => openHistory('hr', t));
}

function rCheckin(el) {
  el.innerHTML = `<div class="checkin"><div class="ci-icon">${ic('clipboard')}</div><div class="ci-body"><h4>Daily Check-in</h4>
    <p class="muted">Короткая самооценка для отслеживания текущего состояния.</p>
    <div class="ci-meta"><span>${ic('clock')}2–3 мин</span><span>${ic('list')}Mood · Stress · Sleep · Well-being</span></div></div>
    <span class="btn btn-primary" aria-disabled="true" title="Форма появится позже">Start Check-in ${ic('arrow-right')}</span></div>
    <p class="chart-note">Форма опроса — скоро. Сейчас в системе только демонстрационные чек-ины (см. History).</p>`;
}
function rRecos(el) {
  el.innerHTML = `<ul class="reco-list">${[['bed', 'Maintain a consistent sleep schedule'], ['meditate', 'Try a short breathing exercise (5 min)'], ['run', 'Light physical activity to help recovery']]
    .map(r => `<li><span class="reco-ic">${ic(r[0])}</span><span class="reco-text">${r[1]}</span></li>`).join('')}</ul>
    <p class="chart-note">Демонстрационные формулировки интерфейса. Это не медицинские рекомендации.</p>`;
}
function rProfile(el) {
  const first = dayFloor(START);
  el.innerHTML = `<div class="member">${avatarHTML()}<div><b>${MEMBER.name}</b><small>${MEMBER.role}</small></div></div>
    <dl class="kv"><dt>Возраст · пол</dt><dd>${PERSON.age} · ${SEXRU[PERSON.sex]} ${badge('demo')}</dd><dt>Миссия</dt><dd>Mars Mission (демо)</dd><dt>Старт (день 1)</dt><dd>${dLong(first)}</dd><dt>Сегодня</dt><dd>день ${mDay(NOW)}</dd>
    <dt>Личные нормы</dt><dd>${calTxt()}</dd>${D.meta.baseline_source === 'preflight' ? `<dt>Данные до полёта (Земля)</dt><dd>${dShort(START)} – ${dShort(FSTART - DAY)} ${badge('sim')}</dd>` : ''}<dt>Источник данных</dt><dd>демо ${badge('demo')}</dd></dl>`;
}
function rRoster(el) {
  const n = (p, k, dec) => p.summary.norm[k] == null ? '—' : fmt(p.summary.norm[k], dec);
  const rows = CREWDATA.crew.map(p => `<tr><td><b>${p.name}</b></td><td>${p.role}</td><td class="num">${p.age}</td><td>${SEXRU[p.sex]}</td>
    <td class="num">${n(p, 'hr', 1)}</td><td class="num">${n(p, 'sleep', 1)}</td><td class="num">${n(p, 'mood', 1)}</td><td class="num">${n(p, 'cog', 0)}</td><td>${badge('demo')}</td></tr>`).join('');
  el.innerHTML = `<div class="table-scroll"><table class="htable"><thead><tr><th>Имя</th><th>Роль</th><th>Возраст</th><th>Пол</th><th>Пульс, уд/мин</th><th>Сон, ч</th><th>Настроение</th><th>Когн. балл</th><th>Данные</th></tr></thead><tbody>${rows}
    <tr class="doc-row"><td><b>${CREWDATA.doctor.name}</b></td><td colspan="2">${CREWDATA.doctor.role}</td><td colspan="5">Земля · Центр управления. Собственных данных нет — видит данные экипажа с задержкой связи.</td><td>${badge('demo')}</td></tr></tbody></table></div>
    <p class="chart-note">Все люди вымышленные, возраст и роли придуманы. Колонки показателей — личные нормы каждого (среднее за 30 дней до полёта): у каждого они свои.</p>`;
}
function rBaseline(el) {
  const rows = ['hr', 'mood', 'stress', 'energy', 'sleep', 'cog'].map(k => {
    const m = MET[k], n = D.norms[k] && D.norms[k].daily;
    return `<tr><td><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${m.color};margin-right:8px"></i>${m.label}</td><td class="num">${n ? `<b>${fmt(n.m, Math.max(m.decimals, 1))}</b> ± ${fmt(n.sd, Math.max(m.decimals, 1))} ${m.unit}` : '—'}</td></tr>`;
  }).join('');
  el.innerHTML = `<table class="htable"><thead><tr><th>Показатель</th><th>Личная норма (среднее ± SD, ${calTxt()})</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="chart-note">Нормы вычисляются по собственным данным человека, а не по популяции. Значения демонстрационные; индивидуальные нормы будут подключены позже.</p>`;
}
function rCrewStatus(el) {
  const cell = (v, z, dec, unit) => v == null ? '<td class="num">—</td>' : `<td class="num ${z != null && Math.abs(z) > 1 ? 'dev' : ''}">${fmt(v, dec)}${unit ? ' ' + unit : ''}${z != null && Math.abs(z) > 1 ? `<span class="zf">${z > 0 ? '▲' : '▼'} ${sgn(z, 1)} SD</span>` : ''}</td>`;
  const rows = CREWDATA.crew.map(p => { const s = p.summary, ok = s.out === 0;
    return `<tr><td><b>${p.name}</b><small class="sub-r">${p.role}</small></td>${cell(s.hr, s.hr_z, 0, 'уд/мин')}${cell(s.mood, s.mood_z, 0, '/ 10')}${cell(s.stress, s.stress_z, 0, '/ 10')}${cell(s.sleep_h, s.sleep_z, 1, 'ч')}${cell(s.cog, s.cog_z, 0, 'балл.')}
    <td><span class="chip ${ok ? 'ok' : 'warn'}">${ok ? 'В пределах личной нормы' : `${s.out} из ${s.known} вне личной нормы`}</span></td>
    <td><button class="mini-btn" data-open="${p.id}">Открыть данные</button></td></tr>`; }).join('');
  el.innerHTML = `<div class="table-scroll"><table class="htable"><thead><tr><th>Астронавт</th><th>Пульс</th><th>Настроение</th><th>Стресс</th><th>Сон</th><th>Когнитивный тест</th><th>Статус</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
    <p class="chart-note">Данные на ${hhmm(NOW)} UTC — с задержкой связи ${DELAY} мин (демо). Каждое значение сравнивается с личной нормой самого астронавта; «вне нормы» — отклонение более 1 SD в любую сторону, это не клинический порог. Низкий стресс тоже отмечается как отклонение.</p>`;
  el.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => openCrew(b.dataset.open)));
}
function rLinkInfo(el) {
  el.innerHTML = `<dl class="kv"><dt>Задержка в демо</dt><dd>${DELAY} мин в одну сторону ${badge('demo')}</dd><dt>Реальный диапазон Земля ↔ Марс</dt><dd>3–22 мин в одну сторону (NASA)</dd>
    <dt>Данные на момент</dt><dd>${hhmm(NOW)} UTC</dd><dt>Ответ врача дойдёт</dt><dd>примерно через ${DELAY} мин</dd></dl>
    <p class="chart-note">Источники: docs/REFERENCES.md, записи C1 и C2. Сообщения в этом прототипе хранятся только в вашем браузере и показываются сразу.</p>`;
}
function rNoteForm(el) {
  const sent = msgsGet().filter(m => m.from === 'murphy').slice(-4).reverse();
  el.innerHTML = `<label class="fl">Кому<select id="nf-to">${CREWDATA.crew.map(p => `<option value="${p.id}" ${p.id === VIEW ? 'selected' : ''}>${p.name}</option>`).join('')}<option value="all">Всему экипажу</option></select></label>
    <label class="fl">Сообщение<textarea id="nf-text" rows="4" maxlength="500"></textarea></label>
    <button class="btn btn-primary" id="nf-send" type="button">Отправить экипажу</button>
    <ul class="msg-list">${sent.map(m => `<li><b>${m.to === 'all' ? 'Всему экипажу' : CREWDATA.crew.find(p => p.id === m.to).name}</b> <small>${m.at}</small><p>${esc(m.text)}</p></li>`).join('') || '<li class="muted">Отправленных сообщений пока нет.</li>'}</ul>
    <p class="chart-note">Демо: сообщение хранится только в этом браузере и сразу видно астронавту в «Personal Support → Связь».</p>`;
  el.querySelector('#nf-send').addEventListener('click', () => {
    const text = el.querySelector('#nf-text').value.trim(); if (!text) return;
    const l = msgsGet(); l.push({ from: 'murphy', to: el.querySelector('#nf-to').value, text, at: new Date().toLocaleString(lang === 'en' ? 'en-GB' : 'ru-RU') });
    lsSet('avega-msgs', JSON.stringify(l)); route();
  });
}
function rInbox(el) {
  const who = IS_DOC ? VIEW : ACC, l = msgsGet().filter(m => m.from === 'murphy' && (m.to === who || m.to === 'all')).reverse();
  el.innerHTML = `<ul class="msg-list">${l.map(m => `<li><b>${CREWDATA.doctor.name}</b> <small>${m.at}</small><p>${esc(m.text)}</p></li>`).join('') || '<li class="muted">Сообщений от врача пока нет.</li>'}</ul>
    <p class="chart-note">Демо: сообщения врача с Земли. В реальной миссии они приходили бы с задержкой связи (3–22 мин).</p>`;
}
function rLatestTests(el) {
  const rows = TS.slice(-6).reverse().map(x => `<tr><td class="num">${dShort(x.t)} ${hhmm(x.t)}</td><td class="num"><b>${fmt(x.v, 0)}</b> pts</td><td>${vsCell(x.v, normFor('cog', 'event'), 0, 'pts')}</td></tr>`).join('');
  el.innerHTML = `<table class="htable"><thead><tr><th>Время (UTC)</th><th>Сводный балл</th><th>к личной норме</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="chart-note">Один сводный балл на тест (демо). Разбивка по реакции / памяти / вниманию — скоро.</p>`;
}
function rMindOverview(el) {          // numbers only from assess()/engine(); wording and colours = the History page (verdict())
  const A = assess(), E = engine();
  const rows = ['mood', 'stress', 'energy', 'cog'].map(k => {
    const [v, z] = A.cur[k], m = MET[k], nr = normFor(k, 'event'), d1 = Math.max(m.decimals, 1), lab = `<td><i class="mdot" style="background:${m.color}"></i>${m.label}</td>`;
    if (v == null || !nr) return `<tr data-k="${k}">${lab}<td colspan="4" class="muted">нет данных</td></tr>`;
    const ver = verdict(v - nr.m, Math.abs(z) > 1, DIR[k] || 0);
    return `<tr data-k="${k}">${lab}<td class="num"><b>${fmt(v, 0)}</b> ${m.unit}</td><td class="num">${fmt(nr.m, d1)} ± ${fmt(nr.sd, d1)}</td><td class="num">${vsText(v, nr, m.decimals, m.unit)}</td><td><span class="chip ${ver[1]}">${ver[0]}</span></td></tr>`;
  }).join('');
  const ks = ['mood', 'stress', 'energy', 'cog', 'sleep'], pairs = [];
  ks.forEach((a, i) => ks.slice(i + 1).forEach(b => pairs.push([a, b, E.get(a, b)])));
  const prow = pairs.map(([a, b, c]) => { const s = strength(c.r);
    return `<tr data-a="${a}" data-b="${b}"><td><b>${elab(a)}</b> и <b>${elab(b)}</b></td><td class="num">${c.r == null ? '—' : sgn(c.r, 2)}</td><td><span class="chip ${s[1]}">${s[0]}</span></td></tr>`; }).join('');
  el.innerHTML = `<div class="table-scroll"><table class="htable"><thead><tr><th>Показатель</th><th>Последнее значение</th><th>Ваша норма (среднее ± SD)</th><th>Отклонение</th><th>Статус</th></tr></thead><tbody>${rows}</tbody></table></div>
    <h4 class="as-h">Связи в один день</h4>
    <div class="table-scroll"><table class="htable"><thead><tr><th>Пара показателей</th><th>r</th><th>Связь</th></tr></thead><tbody>${prow}</tbody></table></div>
    <p class="chart-note">Коэффициент корреляции Пирсона между суточными средними этого человека (дни до полёта и полёт, n = ${E.days.length} дней). Корреляция не доказывает причинность. Данные синтетические: связи сна, стресса, настроения и пульса заложены в генератор, поэтому это проверка работы метода, а не научный результат.</p>`;
}
function rDemoDataset(el) {
  const hrOk = HRV.filter(v => v != null).length;
  el.innerHTML = `<dl class="kv"><dt>Тип</dt><dd>синтетический, детерминированный ${badge('demo')}</dd><dt>Период</dt><dd>${dShort(START)} → ${dShort(NOW)} ${yearOf(NOW)} (дни 1–${mDay(NOW)})</dd>
    <dt>Пульс</dt><dd>${hrOk.toLocaleString(LOC())} минутных значений</dd><dt>Чек-ины</dt><dd>${CI.length}</dd><dt>Когнитивные тесты</dt><dd>${TS.length}</dd><dt>Сон</dt><dd>${SL.length} сессий</dd></dl>`;
}
function rSimulated(el) {
  el.innerHTML = `<ul class="bullets"><li>Пульс и сон — <b>смоделированные</b> потоки датчиков ${badge('sim')}</li><li>Секундные значения в окне «1 minute» — симуляция вокруг минутного среднего.</li>
    <li>Радиация — смоделированный поток персонального дозиметра (по образцу CAD) ${badge('sim')}</li><li>Чек-ины и тесты — демонстрационные записи ${badge('demo')}</li><li>Реальных измерений астронавтов в системе нет ${badge('real')} — пока не подключены.</li></ul>`;
}
function rCompleteness(el) {
  const tot = HRV.length, ok = HRV.filter(v => v != null).length, pct = tot ? ok / tot * 100 : 0;
  el.innerHTML = `<div class="big">${fmt(pct, 1)}<small>%</small></div><p class="muted small">минут с данными пульса: ${ok.toLocaleString(LOC())} из ${tot.toLocaleString(LOC())} ${badge('sim')}</p>
    <p class="chart-note">Пропуски в демо-потоке заданы генератором. Для чек-инов и тестов покрытие станет считаться после появления графика опросов.</p>`;
}
function rLimits(el) {
  el.innerHTML = `<ul class="bullets"><li>Все данные в этом прототипе синтетические; они показывают интерфейс, а не состояние реальных людей.</li><li>Пульс — единственный непрерывный сигнал; HRV, стадии сна, температура и SpO₂ пока не моделируются.</li>
    <li>Сводный индекс готовности, пороги тревог и корреляции не рассчитываются, пока не определена методика.</li><li>${D.meta.baseline_source === 'preflight' ? `Личные нормы взяты из смоделированных данных за ${D.meta.baseline_days} дней до полёта; настоящие предполётные данные появятся позже.` : `Личные нормы — по первым ${D.meta.baseline_days} дням; это упрощение для демонстрации.`}</li></ul>`;
}
function rLanguage(el) {
  el.innerHTML = `<p class="muted small">Язык интерфейса.</p><div class="seg" role="group" aria-label="Language">
    <button class="lang-opt ${lang === 'ru' ? 'active' : ''}" data-l="ru">Русский</button><button class="lang-opt ${lang === 'en' ? 'active' : ''}" data-l="en">English</button></div>
    <p class="chart-note">Интерфейс целиком на выбранном языке; имена собственные и аббревиатуры (AVEGA, NASA, UTC) не переводятся. Выбор сохраняется в браузере.</p>`;
  el.querySelectorAll('.lang-opt').forEach(b => b.addEventListener('click', () => { if (b.dataset.l !== lang) setLang(b.dataset.l); }));
}
function rThemeSet(el) {
  el.innerHTML = `<p class="muted small">Оформление интерфейса.</p><div class="seg" role="group" aria-label="Theme">
    <button class="theme-opt" data-t="light">Светлая</button><button class="theme-opt" data-t="dark">Тёмная</button></div>
    <p class="chart-note">Переключатель также есть в верхней панели. Выбор сохраняется в браузере; по умолчанию включена светлая тема.</p>`;
  el.querySelectorAll('.theme-opt').forEach(b => b.addEventListener('click', () => setTheme(b.dataset.t)));
  paintThemeOpts();
}

/* ------------------------------------------------------------------ pages */
const stubInto = (el, desc) => { el.innerHTML = `<div class="stub"><p>${desc}</p><div class="sk" style="width:82%"></div><div class="sk" style="width:64%"></div><div class="sk" style="width:46%"></div></div>`; };
const S = (t, w, d) => ({ t, w, d });
const C = (t, w, r, src) => ({ t, w, r, src });
const PAGES = [
  { id: 'mission', route: 'mission', name: 'Mission Control', icon: 'graph', grp: 'Врач', doc: true, sub: 'Состояние всего экипажа на Земле: данные приходят с задержкой связи.', tabs: [
    { id: 'crew', label: 'Экипаж', blocks: [C('Crew status', 's12', rCrewStatus, ['demo']), C('Link delay', 's12', rLinkInfo, ['demo'])] },
    { id: 'notes', label: 'Назначения', blocks: [C('Message to crew', 's6', rNoteForm, ['demo']), C('Link delay', 's6', rLinkInfo, ['demo']), C('Questions from the crew', 's12', rCrewQuestions, ['demo'])] }] },
  { id: 'dashboard', name: 'Dashboard', icon: 'home', grp: 'Обзор', sub: 'Сводка по экипажу: состояние, тренды и последние события.', tabs: [
    { id: 'overview', label: 'Самочувствие',
      cols: [{ w: 's8', blocks: [C('Well-being', '', rWellbeing, ['demo']), C('7-day trends', '', rTrends7, ['demo'])] },
             { w: 's4', blocks: [C('AVEGA Assistant', '', rAssistant, ['demo']), C("Today's recommendations", '', rRecos, ['demo']), C('Radiation exposure', '', rRadMini, ['sim']), C('Data transmission', '', rTransmission, ['demo'])] }],
      blocks: [S('Readiness score', 's12', 'Сводный индекс готовности по физиологии, психологии и когнитивным тестам. Формула и веса ещё не определены, поэтому число не показывается.'),
      C('Daily check-in', 's12', rCheckin, ['soon'])] },
    { id: 'events', label: 'События', blocks: [C('Recent events', 's6', rRecentEvents, ['demo']), C('Timeline', 's6', rTimeline, ['demo'])] }] },
  { id: 'history', name: 'History', icon: 'clock', grp: 'Обзор', sub: 'Архив значений: от минуты до всего полёта, с личными нормами.', tabs: [] },
  { id: 'crew', name: 'Crew', icon: 'users', grp: 'Мониторинг', sub: 'Состав экипажа, профиль и медицинская история.', tabs: [
    { id: 'roster', label: 'Список', blocks: [C('Crew roster', 's12', rRoster, ['demo']), S('Roles', 's12', 'Роли и обязанности членов экипажа в миссии.')] },
    { id: 'profile', label: 'Профиль', blocks: [C('Profile card', 's6', rProfile, ['demo']), C('Baseline', 's6', rBaseline, ['demo'])] },
    { id: 'history', label: 'История', blocks: [S('Medical timeline', 's6', 'Хронология медицинских событий и осмотров.'), S('Notes', 's6', 'Заметки врачей и самого астронавта.')] }] },
  { id: 'physiology', name: 'Physiology', icon: 'pulse', grp: 'Мониторинг', sub: 'Физиологические показатели: сердце, сон, активность.', tabs: [
    { id: 'heart', label: 'Сердце', blocks: [C('Heart rate', 's8', rangeChart('hr', 'day'), ['sim']), S('HRV', 's4', 'Вариабельность сердечного ритма. Требует межударных интервалов от датчика; в демо не моделируется.')] },
    { id: 'sleep', label: 'Сон', blocks: [C('Sleep duration', 's8', rangeChart('sleep', 'week'), ['sim']), S('Sleep stages', 's4', 'Стадии сна. Нужны данные носимого датчика; в демо нет.')] },
    { id: 'activity', label: 'Активность', blocks: [S('Exercise load', 's6', 'Нагрузка от тренировок экипажа на борту.'), S('Movement', 's6', 'Уровень движения в течение суток.')] },
    { id: 'other', label: 'Прочее', blocks: [S('Temperature', 's6', 'Температура тела. Источник и способ измерения не выбраны.'), S('SpO₂ / breathing', 's6', 'Насыщение крови кислородом и дыхание.')] }] },
  { id: 'radiation', name: 'Radiation', icon: 'rad', grp: 'Мониторинг', sub: 'Личная радиационная нагрузка по данным дозиметра и её связь со здоровьем.', tabs: [
    { id: 'exposure', label: 'Экспозиция', cols: [{ w: 's8', blocks: [C('Radiation exposure', '', rRadNow, ['sim']), C('Dose rate · 7 days', '', rRadChart, ['sim']), C('Cumulative dose', '', rRadCum, ['sim'])] },
      { w: 's4', blocks: [C('AVEGA analysis', '', rRadAnalysis, ['sim']), C('Reference values', '', rRadContext, ['real'])] }], blocks: [] },
    { id: 'physiology', label: 'Связь с физиологией', blocks: [C('Radiation and physiological response', 's12', rRadLinks, ['soon'])] },
    { id: 'device', label: 'Датчик и данные', blocks: [C('Dosimeter (CAD)', 's6', rRadDevice, ['sim']), C('Measurement record', 's6', rRadRecord, ['sim'])] }] },
  { id: 'psychology', name: 'Psychology', icon: 'brain', grp: 'Мониторинг', sub: 'Оценка состояния, когнитивных функций и командной динамики.', tabs: [
    { id: 'tests', label: 'Набор тестов', blocks: [C('Core instruments', 's12', rInsCore, ['6 инструментов']), C('AVEGA experimental methods', 's12 blk-exp', rInsExp, ['2 методики'])] },
    { id: 'results', label: 'Результаты', blocks: [C('Latest results', 's12', rLatestTests, ['demo']), C('VAS results', 's12', rVasResults, ['demo'])] },
    { id: 'dynamics', label: 'Динамика', blocks: [C('Mind overview', 's12', rMindOverview, ['demo']), C('Mood scale', 's6', rangeChart('mood', 'week'), ['demo']), C('Stress level', 's6', rangeChart('stress', 'week'), ['demo']), C('Score history', 's12', rangeChart('cog', 'month'), ['demo'])] }] },
  { id: 'behavior', name: 'Behavior', icon: 'eye', grp: 'Мониторинг', sub: 'Поведенческие наблюдения и отклонения от рутины.', tabs: [
    { id: 'obs', label: 'Наблюдения', blocks: [S('Observation log', 's8', 'Журнал поведенческих наблюдений.'), S('Add note', 's4', 'Форма добавления заметки.')] },
    { id: 'patterns', label: 'Паттерны', blocks: [S('Daily routine', 's6', 'Распорядок дня и его стабильность.'), S('Communication', 's6', 'Активность общения с экипажем и Землёй.')] },
    { id: 'dev', label: 'Отклонения', blocks: [S('Anomalies', 's6', 'Статистические отклонения от личной нормы.'), S('Flags', 's6', 'Пометки для врача для разбора.')] }] },
  { id: 'correlations', name: 'Correlations', icon: 'graph', grp: 'Аналитика', sub: 'Связи между психологическим и физиологическим состоянием.', tabs: [
    { id: 'matrix', label: 'Матрица', blocks: [C('Correlation matrix', 's12', rCorrMatrix, ['demo']), C('Confidence', 's12', rCorrConfidence, ['demo'])] },
    { id: 'lags', label: 'Лаги', blocks: [C('Lead–lag analysis', 's12', rCorrLags, ['demo'])] },
    { id: 'explain', label: 'Объяснения', blocks: [C('Interpretation', 's6', rCorrExplain, ['demo']), C('AVEGA Assistant', 's6', rAssistantFull, ['demo'])] }] },
  { id: 'alerts', name: 'Risk Alerts', icon: 'alert', grp: 'Аналитика', sub: 'Ранние предупреждения о возможных рисках.', tabs: [
    { id: 'active', label: 'Активные', blocks: [C('Active alerts', 's8', rAlerts, ['demo']), S('Severity levels', 's4', 'Уровни серьёзности.')] },
    { id: 'hist', label: 'История', blocks: [S('Alert history', 's6', 'Архив предупреждений.'), S('Resolved', 's6', 'Закрытые случаи и комментарии.')] },
    { id: 'rules', label: 'Правила', blocks: [S('Thresholds', 's6', 'Пороги срабатывания (на основе личных норм).'), S('Rules', 's6', 'Комбинированные правила.')] }] },
  { id: 'support', name: 'Personal Support', icon: 'heart', grp: 'Аналитика', sub: 'Персональные рекомендации и связь с поддержкой.', tabs: [
    { id: 'chat', label: 'Чат', blocks: [C('AVEGA Assistant chat', 's12', rChat, ['demo'])] },
    { id: 'reco', label: 'Рекомендации', blocks: [C('AVEGA Assistant', 's12', rAssistantFull, ['demo'])] },
    { id: 'handbook', label: 'Справочник', blocks: [C('Space conditions handbook', 's12', rHandbook, ['demo'])] },
    { id: 'practices', label: 'Практики', blocks: [S('Relaxation', 's4', 'Упражнения на расслабление и дыхание.'), S('Sleep hygiene', 's4', 'Материалы по гигиене сна.'), S('Exercise', 's4', 'Лёгкие упражнения для восстановления.')] },
    { id: 'contact', label: 'Связь', blocks: [C('Messages from the flight surgeon', 's6', rInbox, ['demo']), S('Peer support', 's6', 'Поддержка со стороны коллег.')] }] },
  { id: 'data', name: 'Data & Sources', icon: 'db', grp: 'Система', sub: 'Откуда берутся данные и насколько им можно доверять.', tabs: [
    { id: 'sources', label: 'Источники', blocks: [S('NASA open data', 's4', 'Открытые данные NASA. Пока не подключены и не используются.'), C('Demo dataset', 's4', rDemoDataset, ['demo']), C('Simulated signals', 's4', rSimulated, ['sim'])] },
    { id: 'quality', label: 'Качество', blocks: [C('Completeness', 's6', rCompleteness, ['sim']), S('Validation', 's6', 'Проверки диапазонов, дубликатов и сбоев датчиков.')] },
    { id: 'method', label: 'Методология', blocks: [S('References', 's6', 'Научные и NASA-источники методик. Будут добавлены только проверенные ссылки.'), C('Limitations', 's6', rLimits, ['demo'])] }] },
  { id: 'settings', route: 'app-settings', name: 'Settings', icon: 'gear', grp: 'Система', sub: 'Язык, единицы, пороги и экспорт.', tabs: [
    { id: 'general', label: 'Общие', blocks: [C('Language', 's4', rLanguage, []), C('Theme', 's4', rThemeSet, []), S('Units', 's4', 'Единицы измерения (метрические / имперские). Пока все единицы метрические.')] },
    { id: 'thresholds', label: 'Пороги', blocks: [S('Alert thresholds', 's6', 'Пороги предупреждений.'), S('Baselines', 's6', 'Окно калибровки личных норм.')] },
    { id: 'export', label: 'Экспорт', blocks: [S('Export data', 's6', 'Выгрузка данных в CSV/JSON.'), S('Reports', 's6', 'Отчёты для лётного врача.')] }] },
];
const GROUPS = (IS_DOC ? ['Врач'] : []).concat(['Обзор', 'Мониторинг', 'Аналитика', 'Система']);
const routeOf = (p, t) => (p.route || p.id) + (t && p.tabs[0] && t.id !== p.tabs[0].id ? '-' + t.id : '');
const ROUTES = {}; PAGES.filter(p => !p.doc || IS_DOC).forEach(p => { if (!p.tabs.length) ROUTES[routeOf(p)] = { p }; p.tabs.forEach(t => { ROUTES[routeOf(p, t)] = { p, t }; ROUTES[(p.route || p.id) + '-' + t.id] = ROUTES[routeOf(p, t)]; }); });   // the first tab also answers to «page-tab» (e.g. #support-chat)
/* the former page «Cognitive Tests» is now part of Psychology & Cognition: old hashes still open the right tab */
[['cognitive', 'psychology-tests'], ['cognitive-tests', 'psychology-tests'], ['cognitive-results', 'psychology-results'], ['cognitive-setup', 'psychology-tests'], ['psychology-overview', 'psychology-dynamics'], ['psychology-stress', 'psychology-dynamics'], ['psychology-checkin', 'psychology-tests'], ['psychology-crew', 'psychology-tests'], ['psychology-setup', 'psychology-tests']].forEach(([old, nu]) => { ROUTES[old] = ROUTES[nu]; });

/* ---------------------------------------------------------------- render */
const view = $('view'), HIST = document.createElement('div');
let cur = null, histReady = false;

let routed = 0;
function renderSidebar() {
  const nav = $('nav');
  if (!nav.children.length) nav.innerHTML = GROUPS.map(g => `<div class="grp">${g}</div>` + PAGES.filter(p => p.grp === g && (!p.doc || IS_DOC)).map(p =>
    `<a class="nav-item" data-p="${p.id}" href="#${routeOf(p)}">${ic(p.icon)}<span>${p.name}</span></a>`).join('')).join('');
  nav.querySelectorAll('.nav-item').forEach(a => {
    const on = cur && a.dataset.p === cur.p.id;
    a.classList.toggle('active', !!on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  if (++routed > 1) nav.dataset.engaged = '1';   // after the first navigation: active tab recedes, the rest step forward
}
function kpiHTML() {
  const cards = stateCards(), within = cards.filter(c => c.o === false).length, known = cards.filter(c => c.o != null).length, lh = lastHR();
  const k = [
    ['Crew status', `${within} / ${known}`, 'показателей в личной норме', 'demo'],
    ['Active alerts', String(assess().finds.length), 'отклонений от личной нормы сейчас', 'demo'],
    ['Mission day', String(mDay(NOW)), `Mars Mission · старт ${iso(START)}`, 'demo'],
    ['Data freshness', lh ? relTime(lh.t) : '—', 'последний пульс · часы демо-миссии', 'sim'],
  ];
  return `<div class="kpis">${k.map(x => `<div class="kpi"><div class="kpi-top"><span class="kpi-label">${x[0]}</span>${badge(x[3])}</div><div class="kpi-value">${x[1]}</div><div class="kpi-sub">${x[2]}</div></div>`).join('')}</div>`;
}
function blockEl(b) {
  const a = document.createElement('section'); a.className = `card blk ${b.w}`;
  const bs = b.r ? b.src : ['soon'];
  a.innerHTML = `<div class="blk-h"><h3>${b.t}</h3><div class="blk-tools">${bs.map(k => SRC[k] ? badge(k) : `<span class="cnt-pill">${k}</span>`).join('')}</div></div><div class="blk-body" style="flex:1;display:flex;flex-direction:column;gap:10px"></div>`;
  const body = a.querySelector('.blk-body');
  if (b.r) b.r(body); else stubInto(body, b.d);
  return a;
}
function renderAccount() {
  const me = ACCOUNTS.find(a => a.id === ACC), box = $('acct');
  box.innerHTML = `<button class="profile" id="acct-btn" type="button" aria-haspopup="menu" aria-expanded="false" title="Сменить аккаунт">${iniHTML(me)}<div class="profile-text"><strong>${me.name}</strong><small>${me.role}</small></div><span class="chev">▾</span></button>
    <div class="acct-menu" id="acct-menu" role="menu" hidden><p class="acct-h">Аккаунты (демо)</p>${ACCOUNTS.map(a => `<button type="button" role="menuitem" class="acct-item ${a.id === ACC ? 'on' : ''}" data-id="${a.id}">${iniHTML(a)}<span><b>${a.name}</b><small>${a.where ? 'Земля' : 'Борт'} · ${a.role}</small></span></button>`).join('')}</div>`;
  const menu = $('acct-menu'), btn = $('acct-btn');
  btn.addEventListener('click', e => { e.stopPropagation(); menu.hidden = !menu.hidden; btn.setAttribute('aria-expanded', String(!menu.hidden)); });
  menu.querySelectorAll('.acct-item').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.id === ACC) { menu.hidden = true; return; }
    lsSet('avega-user', b.dataset.id); location.hash = b.dataset.id === CREWDATA.doctor.id ? '#mission' : '#dashboard'; location.reload();
  }));
}
document.addEventListener('click', () => { const m = $('acct-menu'); if (m && !m.hidden) { m.hidden = true; const b = $('acct-btn'); if (b) b.setAttribute('aria-expanded', 'false'); } });
function renderViewbar(p) {
  const vb = $('viewbar'); vb.hidden = !IS_DOC || p.id === 'mission'; if (vb.hidden) return;
  vb.innerHTML = `<span>Вы смотрите данные астронавта:</span><select id="vb-sel" aria-label="Астронавт">${CREWDATA.crew.map(q => `<option value="${q.id}" ${q.id === VIEW ? 'selected' : ''}>${q.name}</option>`).join('')}</select>
    <span class="vb-r">${ic('clock')}Данные на ${hhmm(NOW)} UTC — с задержкой связи ${DELAY} мин (демо)</span>`;
  $('vb-sel').addEventListener('change', e => { lsSet('avega-view', e.target.value); location.reload(); });
}
/* the demo footer wraps onto two lines on narrower screens; the sidebar height must follow its real height or every page scrolls by the difference */
function fitDemobar() { const d = document.querySelector('.demobar'); if (d) document.documentElement.style.setProperty('--demo-h', d.offsetHeight + 'px'); }
window.addEventListener('resize', fitDemobar);
function route() {
  chLeave();
  requestAnimationFrame(fitDemobar);
  const h = (location.hash || '').replace(/^#/, '');
  const sp = subRoute(h);
  cur = sp ? { p: PAGES.find(x => x.id === 'psychology'), t: null, sp } : ROUTES[h] || (IS_DOC ? ROUTES.mission : ROUTES.dashboard);
  const { p, t } = cur;
  document.querySelector('.topbar').classList.toggle('has-back', !!sp);
  if (sp) {
    document.title = `AVEGA · ${sp.raw || sp.html ? 'Crew Connection' : sp.title}`;
    $('page-title').innerHTML = `<a class="back-btn" href="${sp.back}" aria-label="${LR('Назад', 'Back')}">${ic('arrow-left')}</a><span class="pt-t"${sp.raw ? ' data-raw' : ''}>${sp.title}</span>${sp.tag}`;
    $('page-sub').textContent = sp.sub;
    document.body.classList.remove('on-hist'); renderAccount(); renderViewbar(p); renderSidebar(); paintToggle(); $('side-day').textContent = `Mars Mission · день ${mDay(NOW)}`;
    const w = document.createElement('div'); w.className = 'subpage'; sp.render(w); view.replaceChildren(w); localize(document.body); window.scrollTo(0, 0); return;
  }
  document.title = `AVEGA · ${tr(p.name)}`;
  $('page-title').textContent = p.name;
  $('page-sub').textContent = t ? `${t.label}. ${p.sub}` : p.sub;
  document.body.classList.toggle('on-hist', p.id === 'history');
  renderAccount(); renderViewbar(p);
  renderSidebar(); paintToggle(); $('side-day').textContent = `Mars Mission · день ${mDay(NOW)}`;
  if (!p.tabs.length) {
    view.replaceChildren(HIST);
    if (!histReady) initHistory();
    render(); localize(document.body); window.scrollTo(0, 0); return;
  }
  const wrap = document.createElement('div');
  wrap.insertAdjacentHTML('beforeend', `<div class="subtabs" role="tablist">${p.tabs.map(x => `<a class="tab ${x === t ? 'active' : ''}" role="tab" href="#${routeOf(p, x)}">${x.label}</a>`).join('')}</div>`);
  const g = document.createElement('div'); g.className = 'blocks';
  (t.cols || []).forEach(cl => { const d = document.createElement('div'); d.className = 'col ' + cl.w; cl.blocks.forEach(b => d.appendChild(blockEl(b))); g.appendChild(d); });
  t.blocks.forEach(b => g.appendChild(blockEl(b))); wrap.appendChild(g);
  if (p.id === 'dashboard') wrap.insertAdjacentHTML('beforeend', kpiHTML());
  view.replaceChildren(wrap);
  localize(document.body);
  window.scrollTo(0, 0);
}

/* ---------------------------------------------------------------- History */
function initHistory() {
  histReady = true;
  HIST.className = 'hist';
  HIST.innerHTML = `<section class="card hist-controls"><div class="hc-row"><div class="seg" id="h-scales" role="tablist" aria-label="Time window"></div><div class="hc-spacer"></div>
    <div class="navp"><button class="navbtn" id="h-prev" aria-label="Previous period" title="Previous (←)">‹</button><div class="period-label" id="h-period"></div><button class="navbtn" id="h-next" aria-label="Next period" title="Next (→)">›</button>
    <button class="mini-btn" id="h-latest">Latest</button><label class="date-jump">Jump to <input type="date" id="h-date"></label></div></div><div class="crumbs" id="h-crumbs" aria-label="Zoom path"></div></section>
    <section class="stats-row" id="h-stats"></section>
    <section class="card hist-chart-card"><div class="hcc-head"><div><h3 id="h-title"></h3><p class="muted small" id="h-sub"></p></div><div class="mtabs" id="h-metrics" role="tablist"></div></div>
    <div class="chart-wrap" id="h-chart"></div><div class="hist-legend" id="h-legend"></div>
    <div id="h-strip-wrap" hidden><h4 class="strip-title">Day timeline <span class="muted">· sleep, check-ins and tests (UTC)</span></h4><div class="chart-wrap" id="h-strip"></div><div class="hist-legend" id="h-strip-legend"></div></div>
    <p class="chart-note" id="h-note"></p></section>
    <section class="card hist-panel"><h3>Dynamics vs personal norm <span class="light">· ${badge('demo')}</span></h3><p class="muted small" style="margin:-4px 0 8px">Norm = this astronaut's own pre-flight data; compared with the last 7 days and with the 7 days before them.</p><div class="table-scroll" id="h-dyn"></div></section>
    <div class="hist-lower"><section class="card hist-panel"><h3>Breakdown <span class="light" id="h-bd-by"></span></h3><div class="table-scroll" id="h-table"></div></section>
    <section class="card hist-panel"><h3>Events</h3><div class="events-scroll" id="h-events"></div></section></div>
    <section class="card hist-info"><h4>How personal norms work ${badge('demo')}</h4><p>Every «norm» on this page is learned from <b>this astronaut's own data</b> in a calibration window (<span id="h-cal-days"></span>): the usual value for each hour of the day for physiology, and the usual day-to-day level for everything else, plus the person's own variability (SD). Population reference ranges are intentionally not used. Times are mission time (UTC).</p>
    <p class="muted">All values shown are synthetic demo data (heart rate and sleep are simulated sensor streams; one point per minute in the 1-minute view comes from the simulated minute stream).</p></section>`;
  $('h-cal-days').textContent = calTxt();
  $('h-scales').innerHTML = SCALES.map(s => `<button data-k="${s.key}">${s.label}</button>`).join('');
  $('h-scales').querySelectorAll('button').forEach(b => b.addEventListener('click', () => setState({ scale: SCALES.find(s => s.key === b.dataset.k).win })));
  $('h-prev').addEventListener('click', () => { const w = windowFor(state.scale, state.cursor); if (canGo(w, -1)) setState({ cursor: neighbor(w, -1) }); });
  $('h-next').addEventListener('click', () => { const w = windowFor(state.scale, state.cursor); if (canGo(w, +1)) setState({ cursor: neighbor(w, +1) }); });
  $('h-latest').addEventListener('click', () => setState({ cursor: NOW }));
  const di = $('h-date'); di.min = iso(START); di.max = iso(NOW);
  di.addEventListener('change', () => {
    if (!di.value) return;
    const base = Date.parse(di.value + 'T00:00:00Z'), tod = state.cursor - dayFloor(state.cursor);
    setState({ cursor: state.scale === 'hour' ? base + tod : base });
  });
  document.addEventListener('keydown', e => {
    if (!cur || cur.p.id !== 'history' || (e.target.closest && e.target.closest('input, textarea'))) return;
    if (e.key === 'ArrowLeft') $('h-prev').click(); else if (e.key === 'ArrowRight') $('h-next').click();
  });
}

/* ------------------------------------------------------------------ theme */
const root = document.documentElement;
const themeNow = () => root.dataset.theme || ('light');
function paintToggle() {
  const t = themeNow(), b = $('theme-toggle');
  b.setAttribute('aria-label', tr(t === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'));
  b.title = b.getAttribute('aria-label'); b.setAttribute('aria-pressed', t === 'dark');
}
function paintThemeOpts() { document.querySelectorAll('.theme-opt').forEach(o => o.classList.toggle('active', o.dataset.t === themeNow())); }
function setTheme(n) {
  root.dataset.theme = n;
  try { localStorage.setItem('avega-theme', n); } catch (e) { /* storage unavailable: choice lasts for this visit only */ }
  paintToggle(); paintThemeOpts();
}
$('theme-toggle').addEventListener('click', () => setTheme(themeNow() === 'dark' ? 'light' : 'dark'));
/* ------------------------------------------------------------------- boot */
window.addEventListener('hashchange', route);
let rz = 0; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (cur && cur.p.id === 'history' && histReady) render(); }, 150); });
route();
