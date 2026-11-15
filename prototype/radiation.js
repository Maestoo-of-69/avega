/* ======================================================================
   Radiation Exposure Monitoring — a SIMULATED personal dosimeter stream modelled on NASA's Crew Active Dosimeter (CAD).
   Sources (docs/REFERENCES.md): R22 SRAG/CAD, R23 Artemis I, R24 ISS doses, R25 RAD cruise, R26 NASA-STD-3001 limits,
   R27 chromosome aberrations, R28 NASA Ames radiation biophysics, R10 immune.
   What is real: the device type, what it records (timestamped absorbed dose, total dose, recent dose rate), the order of
   magnitude of deep-space dose (RAD cruise ~461 µGy/day absorbed, ~1.8 mSv/day dose equivalent) and NASA's limits.
   What is invented: every number in this stream, the per-person shielding factors and the solar event on mission day 31.
   CAD measures ABSORBED dose (Gy). Sievert values are an AVEGA estimate, not a CAD reading.
   ====================================================================== */
const RAW = s => `<span data-raw>${s}</span>`;
const RAD_GCR = 461 / 24;                 // µGy/h — RAD cruise mean in plastic (Zeitlin et al. 2013), R25
const RAD_Q = 1.8 / 0.461;                // ≈3.9 Sv/Gy — RAD cruise ratio of dose equivalent to absorbed dose (GCR), R25
const RAD_LIMIT = 600;                    // mSv — NASA career limit, effective dose (NASA-STD-3001), R26
const RAD_SPE_LIMIT = 250;                // mSv — short-term limit per solar particle event (NASA-STD-3001), R26
const RAD_SHIELD = { alex: 1.00, mira: 0.94, daniel: 1.06, yuki: 0.97 };   // invented: where each person spends time inside the vehicle
const RAD_SPE_DAY = 31;                   // invented demo solar particle event

let RADC = null;
function radData() {
  if (RADC && RADC.view === VIEW && RADC.now === NOW) return RADC;
  let seed = 0; for (const c of VIEW) seed = (seed * 31 + c.charCodeAt(0)) >>> 0;
  const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const k = RAD_SHIELD[VIEW] || 1, t0 = Math.ceil(FSTART / HOUR) * HOUR, speT = dayFloor(FSTART) + (RAD_SPE_DAY - 1) * DAY + 9 * HOUR;
  const pts = []; let cum = 0, cumSpe = 0;
  for (let t = t0; t <= NOW; t += HOUR) {
    const d = (t - FSTART) / DAY, slow = 1 + 0.03 * Math.sin(d / 9);           // slow drift (demo stand-in for solar modulation)
    let r = RAD_GCR * k * slow * (1 + (rnd() - 0.5) * 0.08), spe = 0;
    if (t >= speT && t < speT + 30 * HOUR) { const h = (t - speT) / HOUR; spe = 170 * k * (h < 3 ? h / 3 : Math.exp(-(h - 3) / 6)); }
    r += spe; cum += r / 1000; cumSpe += spe / 1000;
    pts.push({ t, r, cum });
  }
  return RADC = { view: VIEW, now: NOW, pts, cum, cumSpe, speT, k };
}
const radEq = mgy => mgy * RAD_Q;        // mSv estimate
const radU = { rate: () => LR('мкГр/ч', 'µGy/h'), dose: () => LR('мГр', 'mGy'), eq: () => LR('мЗв', 'mSv') };
function radDaily(n) {
  const R = radData(), out = [];
  for (const ds of lastDays(n)) { const v = R.pts.filter(p => p.t >= ds && p.t < ds + DAY).map(p => p.r); out.push({ ds, v: v.length ? v.reduce((a, b) => a + b, 0) / v.length : null }); }
  return out;
}
function radNow() {
  const R = radData(), last = R.pts[R.pts.length - 1], today = radDaily(1)[0].v;
  const base = R.pts.filter(p => !(p.t >= R.speT && p.t < R.speT + 30 * HOUR)).map(p => p.r).sort((a, b) => a - b);
  const med = base.length ? base[Math.floor(base.length / 2)] : RAD_GCR;
  return { R, last, today, med, eq: radEq(R.cum), pct: radEq(R.cum) / RAD_LIMIT * 100, high: today != null && today > 2 * med };
}

/* ---------------------------------------------------------------- blocks */
function rRadNow(el) {
  const N = radNow();
  if (!N.last) { el.innerHTML = `<p class="muted">${LR('Полёт ещё не начался — данных дозиметра нет.', 'The flight has not started yet — no dosimeter data.')}</p>`; return; }
  const kp = [
    [LR('Мощность дозы сейчас', 'Current dose rate'), fmt(N.last.r, 1), radU.rate(), LR(`среднее за последний час · ${hhmm(N.last.t)} UTC`, `last-hour mean · ${hhmm(N.last.t)} UTC`), 'rk-blue'],
    [LR('Накопленная доза', 'Cumulative dose'), fmt(N.R.cum, 1), radU.dose(), LR(`поглощённая, с начала полёта (день ${mDay(NOW)})`, `absorbed, since launch (day ${mDay(NOW)})`), 'rk-violet'],
    [LR('Эквивалентная доза (оценка)', 'Dose equivalent (estimate)'), fmt(N.eq, 0), radU.eq(), LR('поглощённая доза × 3,9 (соотношение RAD)', 'absorbed dose × 3.9 (RAD ratio)'), 'rk-amber'],
  ];
  el.innerHTML = `<div class="rad-kpis">${kp.map(x => `<div class="rad-kpi ${x[4]}"><span class="rk-l">${x[0]}</span><div class="rk-v">${x[1]}<small>${x[2]}</small></div><span class="rk-s">${x[3]}</span></div>`).join('')}</div>
    <div class="rad-limit"><div class="rl-top"><span>${LR('Доля карьерного лимита NASA', 'Share of NASA career limit')} <b>${fmt(N.pct, 1)} %</b></span><span class="muted">${fmt(N.eq, 0)} / ${RAD_LIMIT} ${radU.eq()}</span></div>
      <div class="rl-bar"><i style="width:${Math.min(100, N.pct).toFixed(1)}%"></i></div>
      <p class="chart-note">${LR('Лимит 600 мЗв задан NASA как эффективная доза за всю карьеру (NASA-STD-3001). AVEGA сравнивает с ним грубую оценку: CAD измеряет поглощённую дозу, а не эффективную.', 'The 600 mSv limit is NASA’s career limit in effective dose (NASA-STD-3001). AVEGA compares it with a rough estimate: CAD measures absorbed dose, not effective dose.')}</p></div>`;
}
function rRadChart(el) {
  const days = radDaily(7).filter(d => d.v != null);
  if (days.length < 2) { el.innerHTML = `<p class="muted">${LR('Недостаточно данных.', 'Not enough data.')}</p>`; return; }
  const vals = days.map(d => d.v), hi = Math.max(...vals), top = Math.ceil(Math.max(hi * 1.15, RAD_GCR * 1.5) / 5) * 5;
  const ticks = [0, top / 2, top].map(v => ({ v, txt: fmt(v, 0) }));
  const s = [{ name: LR('Мощность дозы, мкГр/ч', 'Dose rate, µGy/h'), color: '#7c5ce6', values: vals, fmt: v => `${fmt(v, 1)} ${radU.rate()}` }];
  el.innerHTML = trendChart(s, days.map(d => dayTick(d.ds)), ticks, 0, top, RAD_GCR) + legendHTML(s)
    + `<p class="chart-note">${LR('Среднесуточная мощность поглощённой дозы. Линия — средний фон галактических космических лучей в перелёте к Марсу по данным RAD (≈19 мкГр/ч). Значения смоделированы.', 'Daily mean absorbed dose rate. The line is the mean galactic-cosmic-ray background in transit to Mars measured by RAD (≈19 µGy/h). Values are simulated.')}</p>`;
}
function rRadCum(el) {
  const R = radData(); if (R.pts.length < 48) { el.innerHTML = `<p class="muted">${LR('Недостаточно данных.', 'Not enough data.')}</p>`; return; }
  const n = 8, idx = Array.from({ length: n }, (_, i) => Math.round(i * (R.pts.length - 1) / (n - 1))), P = idx.map(i => R.pts[i]);
  const top = Math.ceil(R.cum * 1.15 / 5) * 5, ticks = [0, top / 2, top].map(v => ({ v, txt: fmt(v, 0) }));
  const s = [{ name: LR('Накопленная доза, мГр', 'Cumulative dose, mGy'), color: '#1a8cf0', values: P.map(p => p.cum), fmt: v => `${fmt(v, 1)} ${radU.dose()}` }];
  el.innerHTML = trendChart(s, P.map(p => dayTick(p.t)), ticks, 0, top) + legendHTML(s)
    + `<p class="chart-note">${LR(`Скачок около дня ${RAD_SPE_DAY} — смоделированное солнечное протонное событие: +${fmt(R.cumSpe, 1)} мГр.`, `The step near day ${RAD_SPE_DAY} is a simulated solar particle event: +${fmt(R.cumSpe, 1)} mGy.`)}</p>`;
}
function rRadAnalysis(el) {
  const N = radNow(); if (!N.last) { el.innerHTML = ''; return; }
  const ratio = N.today / N.med, st = N.high ? 'warn' : 'ok';
  const lines = [
    [st, N.high ? LR(`Сегодня мощность дозы в ${fmt(ratio, 1)} раза выше обычного для этого полёта. Возможное солнечное событие: решения об укрытии принимают ЦУП и служба радиационной безопасности, AVEGA их не даёт.`, `Today’s dose rate is ${fmt(ratio, 1)}× this flight’s usual level. A possible solar event: shelter decisions belong to Mission Control and the radiation team; AVEGA does not make them.`)
      : LR(`Сегодня ${fmt(N.today, 1)} мкГр/ч — в пределах обычного для этого полёта уровня (медиана ${fmt(N.med, 1)} мкГр/ч).`, `Today ${fmt(N.today, 1)} µGy/h — within this flight’s usual level (median ${fmt(N.med, 1)} µGy/h).`)],
    ['info', LR(`Доза сохраняется в личном профиле вместе с временем, единицами и источником каждого измерения.`, `The dose is kept in the personal profile with the time, units and source of every reading.`)],
    ['info', LR('Доза не входит в матрицу корреляций с пульсом, сном и настроением: в источниках, которые мы прочитали, такая краткосрочная связь не описана. Биологический ответ на радиацию оценивают по анализам крови — см. вкладку «Связь с физиологией».', 'Dose is not in the correlation matrix with heart rate, sleep and mood: the sources we read do not describe such a short-term link. The biological response is assessed from blood tests — see the «Link to physiology» tab.')],
  ];
  el.innerHTML = `<ul class="rad-an">${lines.map(([k, t]) => `<li class="ra-${k}">${ic(k === 'warn' ? 'alert' : k === 'ok' ? 'check' : 'info')}<span>${t}</span></li>`).join('')}</ul>
    <p class="chart-note">${LR('Анализ AVEGA — правила над смоделированными данными, а не медицинское заключение.', 'AVEGA analysis is rules over simulated data, not a medical opinion.')}</p>`;
}
function rRadMini(el) {
  const N = radNow(); if (!N.last) { el.innerHTML = `<p class="muted small">${LR('Нет данных', 'No data')}</p>`; return; }
  const sp = radDaily(7).map(d => d.v).filter(v => v != null);
  el.innerHTML = `<div class="rad-mini"><div><span class="muted small">${LR('Мощность дозы', 'Dose rate')}</span><b>${fmt(N.last.r, 1)} <small>${radU.rate()}</small></b></div>
    <div><span class="muted small">${LR('За полёт', 'This flight')}</span><b>${fmt(N.R.cum, 1)} <small>${radU.dose()}</small></b></div></div>
    ${sparkline(sp, '#7c5ce6')}<a class="link-more" href="#radiation">${LR('Подробнее', 'Details')} ${ic('chevron-right')}</a>`;
}
function rRadLinks(el) {
  const rows = [
    [LR('Накопленная доза', 'Cumulative dose'), LR('Хромосомные аберрации в лимфоцитах крови', 'Chromosome aberrations in blood lymphocytes'), LR('Анализ крови до и после полёта; в исследовании NASA (43 экипаже-миссии) личная радиочувствительность до полёта помогала объяснить различия после полёта.', 'Blood test before and after flight; in a NASA study (43 crew-missions) pre-flight individual radiosensitivity helped explain post-flight differences.'), 'R27', 'lab'],
    [LR('История облучения', 'Exposure history'), LR('Маркеры повреждения ДНК (γH2AX, 53BP1)', 'DNA-damage markers (γH2AX, 53BP1)'), LR('Исследуются в лаборатории NASA Ames как способ оценить индивидуальную чувствительность.', 'Studied at NASA Ames as a way to estimate individual sensitivity.'), 'R28', 'res'],
    [LR('Доза и мощность дозы', 'Dose and dose rate'), LR('Иммунологические показатели, цитокины, экзосомы', 'Immune markers, cytokines, exosomes'), LR('Радиация названа среди факторов изменения иммунитета; секретируемые маркеры изучаются как возможные персональные.', 'Radiation is named among factors of immune change; secreted markers are studied as possible personal markers.'), 'R10, R28', 'res'],
    [LR('Тип излучения (GCR / SPE)', 'Radiation type (GCR / SPE)'), LR('Разный биологический эффект', 'Different biological effect'), LR('CAD тип частиц не различает; это делают приборы корабля (например, HERA).', 'CAD does not tell particle types apart; vehicle instruments do (e.g. HERA).'), 'R22, R23', 'no'],
  ];
  const ST = { lab: LR('Лабораторный анализ', 'Lab test'), res: LR('Исследование', 'Research'), no: LR('Нет в CAD', 'Not in CAD') };
  el.innerHTML = `<div class="rad-link-head"><span>${ic('rad')}${LR('Радиационное воздействие', 'Radiation exposure')}</span>${ic('arrow-right')}<span>${ic('pulse')}${LR('Физиологический ответ', 'Physiological response')}</span></div>
    <div class="table-scroll"><table class="htable rad-tbl"><thead><tr><th>${LR('Что измеряем', 'What we measure')}</th><th>${LR('С чем сопоставлять', 'What to compare with')}</th><th>${LR('Как это известно', 'What is known')}</th><th>${LR('Статус', 'Status')}</th></tr></thead>
    <tbody>${rows.map(r => `<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]} <span class="muted small">[${r[3]}]</span></td><td><span class="rad-st rs-${r[4]}">${ST[r[4]]}</span></td></tr>`).join('')}</tbody></table></div>
    <p class="chart-note">${LR('Ни один из этих показателей в демо-данных AVEGA не моделируется: их нельзя получить носимым датчиком. Как только появятся результаты анализов, AVEGA будет показывать их рядом с дозой на одной шкале времени.', 'None of these markers is simulated in AVEGA’s demo data: a wearable cannot produce them. Once lab results exist, AVEGA will show them next to the dose on one timeline.')}</p>`;
}
function rRadDevice(el) {
  el.innerHTML = `<div class="rad-dev"><span class="rad-dev-ic">${ic('rad')}</span><div><b>${RAW('Crew Active Dosimeter (CAD)')}</b>
    <p class="muted small">${LR('Персональный активный дозиметр NASA (разработан Mirion вместе со Space Radiation Analysis Group). На МКС используется с 2020 года, летал на Artemis I и Artemis II.', 'NASA’s personal active dosimeter (built by Mirion with the Space Radiation Analysis Group). Used on the ISS since 2020, flown on Artemis I and Artemis II.')}</p></div></div>
    <ul class="rad-facts">
      <li>${ic('clock')}<span>${LR('Измеряет поглощённую дозу непрерывно; каждое показание имеет метку времени.', 'Measures absorbed dose continuously; every reading is timestamped.')}</span></li>
      <li>${ic('antenna')}<span>${LR('Передаёт данные по Bluetooth в систему корабля и службе SRAG.', 'Sends data over Bluetooth to the vehicle system and to SRAG.')}</span></li>
      <li>${ic('chart-small')}<span>${LR('Дисплей всегда показывает дозу за миссию и недавнюю мощность дозы.', 'The always-on display shows total mission dose and the recent dose rate.')}</span></li>
    </ul><p class="chart-note">${LR('В прототипе поток CAD смоделирован: подключения к реальному устройству нет.', 'In the prototype the CAD stream is simulated: there is no connection to a real device.')}</p>`;
}
function rRadRecord(el) {
  const R = radData(), last = R.pts[R.pts.length - 1];
  const f = [
    ['timestamp', last ? `${iso(last.t)} ${hhmm(last.t)} UTC` : '—', LR('Когда получена доза', 'When the dose was received')],
    ['dose_rate', last ? `${fmt(last.r, 2)} ${radU.rate()}` : '—', LR('Мощность поглощённой дозы', 'Absorbed dose rate')],
    ['cumulative_dose', `${fmt(R.cum, 3)} ${radU.dose()}`, LR('Поглощённая доза с начала полёта', 'Absorbed dose since launch')],
    ['unit', 'µGy/h · mGy', LR('Единицы хранятся явно', 'Units are stored explicitly')],
    ['source', LR('CAD · симуляция', 'CAD · simulated'), LR('Источник и тип данных', 'Source and data type')],
    ['device_id', `CAD-${VIEW.toUpperCase()}-01`, LR('Устройство (вымышленный номер)', 'Device (invented id)')],
  ];
  el.innerHTML = `<div class="table-scroll"><table class="htable"><thead><tr><th>${LR('Поле', 'Field')}</th><th>${LR('Последнее значение', 'Latest value')}</th><th>${LR('Назначение', 'Purpose')}</th></tr></thead>
    <tbody>${f.map(r => `<tr><td><code>${r[0]}</code></td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div>
    <p class="chart-note">${LR(`Одна запись в час · ${R.pts.length.toLocaleString(LOC())} записей за полёт. Без времени, единиц и источника запись не принимается.`, `One record per hour · ${R.pts.length.toLocaleString(LOC())} records this flight. A record without time, units and source is rejected.`)}</p>`;
}
function rRadContext(el) {
  const rows = [
    [LR('Перелёт к Марсу (RAD, 2011–2012)', 'Transit to Mars (RAD, 2011–2012)'), LR('≈1,8 мЗв/сут', '≈1.8 mSv/day'), 'R25'],
    [LR('МКС, эффективная доза', 'ISS, effective dose'), LR('≈0,2–0,5 мЗв/сут', '≈0.2–0.5 mSv/day'), 'R24'],
    [LR('Карьерный лимит NASA', 'NASA career limit'), LR('600 мЗв', '600 mSv'), 'R26'],
    [LR('Лимит на одно солнечное событие', 'Limit per solar particle event'), LR('250 мЗв', '250 mSv'), 'R26'],
  ];
  el.innerHTML = `<ul class="rad-ctx">${rows.map(r => `<li><span>${r[0]}</span><b>${r[1]}</b><span class="muted small">[${r[2]}]</span></li>`).join('')}</ul>
    <p class="chart-note">${LR('Опорные значения из источников NASA и рецензируемых работ (docs/REFERENCES.md). Это не пороги тревоги AVEGA.', 'Reference values from NASA and peer-reviewed sources (docs/REFERENCES.md). They are not AVEGA alert thresholds.')}</p>`;
}
