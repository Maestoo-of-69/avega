/* ------------------------------------------------------------------ AVEGA engine: correlations + rule-based assistant
   Transparent statistics and rules — NOT a language model and NOT a diagnosis. Every recommendation carries the id of its
   source in docs/REFERENCES.md, or «—» when it is a general precaution without a source. */
const EKEYS = ['hr', 'sleep', 'stress', 'mood', 'energy', 'cog'];
const SYM = (D.symptoms && D.symptoms.keys) || [], XLAB = { headache: 'Головная боль', back: 'Боль в спине', nausea: 'Укачивание', skin: 'Кожа и сыпь', co2: 'CO₂ в кабине' };
const AKEYS = EKEYS.concat(SYM.filter(k => k !== 'nausea' && k !== 'back'), D.env ? ['co2'] : []);     // nausea / back pain: only the first flight days, too few events to correlate
const elab = k => MET[k] ? MET[k].label : XLAB[k];
const dayIdx = d => Math.round((d - dayFloor(START)) / DAY);
function xval(k, d) {
  if (MET[k]) return dayMean(k, d);
  const i = dayIdx(d); if (k === 'co2') { const v = D.env.co2_mmHg[i]; return v == null ? null : v; }
  const row = D.symptoms.values[i]; return row && d >= dayFloor(FSTART) ? row[SYM.indexOf(k)] : null;      // symptoms are correlated over flight days only
}
function pearson(x, y) {
  const p = []; for (let i = 0; i < x.length; i++) if (x[i] != null && y[i] != null) p.push([x[i], y[i]]);
  const n = p.length; if (n < 10) return { r: null, n };
  const mx = p.reduce((a, q) => a + q[0], 0) / n, my = p.reduce((a, q) => a + q[1], 0) / n;
  let sxy = 0, sxx = 0, syy = 0; for (const [a, b] of p) { sxy += (a - mx) * (b - my); sxx += (a - mx) ** 2; syy += (b - my) ** 2; }
  return { r: sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : null, n };
}
let ENG = null;
function engine() {
  if (ENG) return ENG;
  const days = []; for (let d = dayFloor(START); d <= dayFloor(NOW); d += DAY) days.push(d);
  const S = {}; AKEYS.forEach(k => S[k] = days.map(d => xval(k, d)));
  const same = [], lag = [];
  for (const a of AKEYS) for (const b of AKEYS) {
    if (a < b) same.push({ a, b, ...pearson(S[a], S[b]) });
    if (a !== b) lag.push({ a, b, ...pearson(S[a].slice(0, -1), S[b].slice(1)) });   // a today -> b tomorrow
  }
  const get = (a, b) => same.find(c => (c.a === a && c.b === b) || (c.a === b && c.b === a));
  const getLag = (a, b) => lag.find(c => c.a === a && c.b === b);
  return ENG = { days, S, same, lag, get, getLag };
}
const strength = r => r == null ? ['нет данных', 'na'] : Math.abs(r) >= 0.5 ? ['сильная', 'warn'] : Math.abs(r) >= 0.3 ? ['заметная', 'ok'] : ['слабая', 'na'];
const corrBg = r => r == null ? 'transparent' : `rgba(${r > 0 ? '39,170,200' : '225,140,45'},${Math.min(0.85, Math.abs(r)).toFixed(2)})`;

function rCorrMatrix(el) {
  const E = engine();
  const head = AKEYS.map(k => `<th>${elab(k)}</th>`).join('');
  const rows = AKEYS.map(a => `<tr><th>${elab(a)}</th>${AKEYS.map(b => {
    if (a === b) return '<td class="cm self">—</td>';
    const c = E.get(a, b); return `<td class="cm" style="background:${corrBg(c.r)}" title="n = ${c.n}">${c.r == null ? '—' : sgn(c.r, 2)}</td>`;
  }).join('')}</tr>`).join('');
  el.innerHTML = `<div class="table-scroll"><table class="htable cmx"><thead><tr><th></th>${head}</tr></thead><tbody>${rows}</tbody></table></div>
    <div class="hist-legend"><span><i style="background:rgba(39,170,200,.8)"></i>растут вместе</span><span><i style="background:rgba(225,140,45,.8)"></i>одно растёт, другое падает</span></div>
    <p class="chart-note">Коэффициент корреляции Пирсона между суточными средними этого человека (дни до полёта и полёт, n = ${E.days.length} дней). Корреляция не доказывает причинность. Данные синтетические: связи сна, стресса, настроения и пульса заложены в генератор, поэтому это проверка работы метода, а не научный результат.</p><p class="chart-note">Симптомы и CO₂ считаются только по дням полёта. Укачивание и боль в спине в матрицу не входят: они бывают в первые дни полёта, событий слишком мало.</p>`;
}
function rCorrLags(el) {
  const E = engine(), top = E.lag.filter(c => c.r != null && Math.abs(c.r) >= 0.2).sort((x, y) => Math.abs(y.r) - Math.abs(x.r)).slice(0, 10);
  el.innerHTML = top.length ? `<div class="table-scroll"><table class="htable"><thead><tr><th>Сегодня</th><th></th><th>Завтра</th><th>r</th><th>Связь</th><th>n</th></tr></thead><tbody>${top.map(c => { const s = strength(c.r);
    return `<tr><td><b>${elab(c.a)}</b></td><td>→</td><td><b>${elab(c.b)}</b></td><td class="num">${sgn(c.r, 2)}</td><td><span class="chip ${s[1]}">${s[0]}</span> ${c.r > 0 ? 'в ту же сторону' : 'в обратную сторону'}</td><td class="num">${c.n}</td></tr>`; }).join('')}</tbody></table></div>
    <p class="chart-note">Сдвиг на одни сутки: значение показателя сегодня и другого показателя завтра. Помогает заметить, что обычно предшествует ухудшению у этого человека.</p>` : '<p class="muted">Заметных связей со сдвигом на сутки пока нет.</p>';
}
function rCorrExplain(el) {
  const E = engine(), top = E.same.filter(c => c.r != null && Math.abs(c.r) >= 0.3).sort((x, y) => Math.abs(y.r) - Math.abs(x.r)).slice(0, 6);
  el.innerHTML = (top.length ? `<ul class="find-list">${top.map(c => `<li><b>${elab(c.a)}</b> и <b>${elab(c.b)}</b>: ${c.r > 0 ? 'обычно меняются в одну сторону' : 'обычно меняются в разные стороны'} <span class="rv">r = ${sgn(c.r, 2)}</span></li>`).join('')}</ul>` : '<p class="muted">Заметных связей пока нет.</p>')
    + `<p class="chart-note">Показаны пары с |r| ≥ 0,3. Связи считаются отдельно для каждого члена экипажа: у разных людей они разные.</p>`;
}
function rCorrConfidence(el) {
  el.innerHTML = `<dl class="kv"><dt>Метод</dt><dd>корреляция Пирсона, суточные средние</dd><dt>Объём данных</dt><dd>${engine().days.length} дней</dd><dt>Слабая связь</dt><dd>|r| меньше 0,3</dd><dt>Заметная связь</dt><dd>|r| от 0,3 до 0,5</dd><dt>Сильная связь</dt><dd>|r| от 0,5</dd></dl>
    <p class="chart-note">Пороги выбраны для демонстрации, это не клинические критерии. Поправка на множественные сравнения не делается.</p>`;
}

/* ---- assistant ---- */
const RECS = {
  sleep: [['Держите постоянное время отбоя и подъёма', 'P2'], ['Яркий свет днём и приглушённый свет за час до сна', 'R6'], ['Оставьте сегодня время на отдых', 'R6']],
  stress: [['Сделайте 5 минут медленного дыхания', 'P4'], ['Запишите мысли в личный дневник', 'R3'], ['Свяжитесь с близкими в ближайший сеанс связи', 'R3']],
  mood: [['Запишите мысли в личный дневник', 'R3'], ['Проведите время у иллюминатора или с растениями', 'R3'], ['Свяжитесь с близкими в ближайший сеанс связи', 'R3']],
  energy: [['Проверьте, хватало ли сна в последние ночи', 'P1'], ['Не пропускайте плановую тренировку', 'R7']],
  cog: [['Повторите когнитивный тест после отдыха', 'P3'], ['Попросите коллегу перепроверить ответственные операции', '—']],
  hr: [['Отдохните 10 минут и измерьте пульс повторно', '—'], ['Отметьте, была ли перед этим тренировка или нагрузка', '—']],
};
const FIND = { sleep: 'Сон короче вашей нормы', stress: 'Стресс выше вашей нормы', mood: 'Настроение ниже вашей нормы', energy: 'Энергия ниже вашей нормы', cog: 'Когнитивный балл ниже вашей нормы', hr: 'Пульс выше вашей нормы для этого часа' };
const BAD = { sleep: -1, stress: 1, mood: -1, energy: -1, cog: -1, hr: 1 };
let ASSESS = null;
function assess() {
  if (ASSESS) return ASSESS;
  const E = engine(), hour = dt(NOW).getUTCHours(), hr = aggHR(NOW - HOUR, NOW + MIN), ci = CI[CI.length - 1], sl = SL[SL.length - 1], ts = TS[TS.length - 1];
  const z = (v, n) => v == null || !n || !(n.sd > 0) ? null : (v - n.m) / n.sd;
  const cur = {
    hr: [hr && hr.mean, z(hr && hr.mean, normFor('hr', 'hod', hour)), 0, 'уд/мин'], sleep: [sl && sl.h, z(sl && sl.h, normFor('sleep', 'event')), 1, 'ч'],
    stress: [ci && ci.stress, z(ci && ci.stress, normFor('stress', 'event')), 0, '/ 10'], mood: [ci && ci.mood, z(ci && ci.mood, normFor('mood', 'event')), 0, '/ 10'],
    energy: [ci && ci.energy, z(ci && ci.energy, normFor('energy', 'event')), 0, '/ 10'], cog: [ts && ts.v, z(ts && ts.v, normFor('cog', 'event')), 0, 'балл.'],
  };
  const finds = EKEYS.filter(k => cur[k][1] != null && cur[k][1] * BAD[k] > 1).map(k => ({ k, v: cur[k][0], z: cur[k][1], dec: cur[k][2], unit: cur[k][3] }));
  // personal links: what usually follows a bad value of the flagged indicator (this person's own lag-1 correlations)
  const links = [];
  for (const f of finds.filter(q => q.k !== 'hr')) for (const b of EKEYS) {   // HR finding is hourly, lag links are daily: not mixed
    if (b === f.k) continue; const c = E.getLag(f.k, b); if (!c || c.r == null || Math.abs(c.r) < 0.3) continue;
    const worse = BAD[f.k] * c.r * BAD[b] > 0;      // a "bad" move of a tends to be followed by a "bad" move of b
    if (worse) links.push({ a: f.k, b, r: c.r });
  }
  // symptoms: today's synthetic log + what the user ticked in the handbook today
  const today = (D.symptoms && D.symptoms.values[dayIdx(dayFloor(NOW))]) || [], mine = symGet();
  const sym = []; SYM.forEach((k, j) => { const v = Math.max(today[j] || 0, mine.includes(k) ? 1 : 0); if (v) sym.push({ k, v }); });
  ['vision', 'dizzy'].forEach(k => { if (mine.includes(k)) sym.push({ k, v: 1 }); });
  const co2 = D.env ? D.env.co2_mmHg[dayIdx(dayFloor(NOW))] : null;
  const recs = []; const add = r => { if (!recs.some(x => x[0] === r[0])) recs.push(r); };
  sym.forEach(q => KB.filter(c => c.sym.includes(q.k)).forEach(c => c.now.slice(0, 2).forEach(add)));
  finds.forEach(f => RECS[f.k].forEach(add));
  const severe = finds.some(f => Math.abs(f.z) >= 2) || sym.some(q => q.v >= 3) || sym.some(q => q.k === 'vision');
  const n = finds.length + sym.length, level = !n ? 0 : (n >= 3 || severe) ? 2 : 1;
  return ASSESS = { cur, finds, links, sym, co2, recs: recs.slice(0, 8), level };
}
function assistantHTML(full) {
  const A = assess(), rt = 2 * CREWDATA.delay_min;
  const st = [['Все последние показатели в пределах вашей личной нормы', 'ok'], ['Есть отклонения от вашей личной нормы', 'warn'], ['Несколько отклонений: сообщите врачу', 'warn']][A.level];
  let h = `<p class="as-status"><span class="chip ${st[1]}">${st[0]}</span></p>`;
  if (A.finds.length) h += `<ul class="find-list">${A.finds.map(f => `<li><b>${FIND[f.k]}</b> <span class="rv">${fmt(f.v, f.dec)} ${f.unit} · ${sgn(f.z, 1)} SD</span></li>`).join('')}</ul>`;
  if (A.sym.length) h += `<ul class="find-list">${A.sym.map(q => `<li><b>${SLAB[q.k]}</b> <span class="rv">${SEV[q.v]}${q.k === 'headache' && A.co2 != null ? ` · CO₂ ${fmt(A.co2, 1)} мм рт. ст.` : ''}</span> <a class="kb-link" href="#support-handbook">справочник</a></li>`).join('')}</ul>`;
  if (A.links.length && full) h += `<h4 class="as-h">По вашим данным за этим обычно следует</h4><ul class="find-list">${A.links.slice(0, 4).map(l => `<li><b>${elab(l.a)}</b> → на следующий день хуже показатель <b>${elab(l.b)}</b> <span class="rv">r = ${sgn(l.r, 2)}</span></li>`).join('')}</ul>`;
  if (A.recs.length) h += `<h4 class="as-h">Что можно сделать сейчас</h4><ul class="reco-list">${A.recs.slice(0, full ? 8 : 3).map(r => `<li><span class="reco-ic">${ic('play')}</span><span class="reco-text">${r[0]}</span><span class="ref" title="Источник: docs/REFERENCES.md">${r[1] === '—' ? 'без источника' : r[1]}</span></li>`).join('')}</ul>`;
  else h += `<p class="muted">Особых действий не требуется. Продолжайте обычный режим.</p>`;
  h += `<p class="as-doc">${ic('clock')}${A.level === 2 ? 'Рекомендуется отправить сводку врачу.' : 'Врач на Земле видит эти данные.'} Ответ с Земли придёт не раньше чем через ${rt} мин (демо).</p>
    <p class="chart-note">Ассистент работает по открытым правилам и статистике на борту, без связи с Землёй. Он не ставит диагноз и не назначает лечение; при тревожных симптомах свяжитесь с врачом. Метки вида R3, P2 — номера источников в docs/REFERENCES.md.</p>`;
  return h;
}
function rAssistant(el) { el.innerHTML = assistantHTML(false) + (cur && cur.p.id === 'dashboard' ? `<a class="btn btn-ghost" href="#support-reco">${ic('book')}Подробнее</a><a class="btn btn-ghost" href="#support-chat">${ic('chat')}Спросить ассистента</a>` : ''); }
function rAssistantFull(el) { el.innerHTML = assistantHTML(true); }
function rAlerts(el) {
  const A = assess();
  el.innerHTML = (A.sym.length ? `<ul class="find-list">${A.sym.map(q => `<li><span class="chip warn">симптом</span> <b>${SLAB[q.k]}</b> <span class="rv">${SEV[q.v]}</span></li>`).join('')}</ul>` : '') + (A.finds.length ? `<ul class="find-list">${A.finds.map(f => `<li><span class="chip warn">${Math.abs(f.z) >= 2 ? 'сильное отклонение' : 'отклонение'}</span> <b>${FIND[f.k]}</b> <span class="rv">${fmt(f.v, f.dec)} ${f.unit} · ${sgn(f.z, 1)} SD</span></li>`).join('')}</ul>` : A.sym.length ? '' : '<p class="muted">Активных предупреждений нет.</p>')
    + `<p class="chart-note">Правило: последнее значение отличается от личной нормы более чем на 1 SD в неблагоприятную сторону; от 2 SD — сильное отклонение. Это демонстрационные пороги, не клинические.</p>`;
}

/* ---- offline handbook of space-specific conditions (docs/REFERENCES.md ids in refs) ---- */
const SLAB = { headache: 'Головная боль', back: 'Боль в спине', nausea: 'Тошнота или укачивание', skin: 'Сыпь или герпес на губах', vision: 'Изменение зрения', dizzy: 'Головокружение', insomnia: 'Плохой сон', lowmood: 'Подавленность или тревога' };
const SEV = ['', 'лёгкая степень', 'средняя степень', 'сильная степень'];
const symKey = () => 'avega-sym-' + VIEW + '-' + iso(NOW);
const symGet = () => { try { return JSON.parse(lsGet(symKey()) || '[]'); } catch (e) { return []; } };
const NODRUG = ['Лекарства — только по бортовому медицинскому протоколу и указанию врача', '—'];
const KB = [
  { id: 'sms', name: 'Космическая болезнь движения', sym: ['nausea', 'dizzy'], when: 'Обычно первые 2–5 дней полёта и первые дни после посадки.',
    signs: 'Тошнота, рвота, головокружение, холодный пот, усталость, головная боль.',
    now: [['Ограничьте резкие движения головой, двигайтесь плавно', '—'], ['Отложите сложные операции, если симптомы мешают работе', 'R8'], NODRUG],
    doc: 'Симптомы не проходят после первых дней, рвота повторяется, не удаётся пить.', refs: 'R8, S2, S3' },
  { id: 'sabp', name: 'Боль в спине при адаптации', sym: ['back'], when: 'Чаще в первые дни полёта; у большинства лёгкая и проходит сама.',
    signs: 'Боль в пояснице, реже в середине спины.',
    now: [['Подтяните колени к груди на несколько минут (поза эмбриона)', 'S1'], ['Выполните плановую тренировку на беговой дорожке или велоэргометре', 'S1'], NODRUG],
    doc: 'Боль средняя или сильная, мешает сну или работе, отдаёт в ногу, есть онемение.', refs: 'S1' },
  { id: 'co2', name: 'Головная боль и CO₂ в кабине', sym: ['headache'], when: 'В любой день; чаще при повышенном CO₂, недосыпе и стрессе.',
    signs: 'Головная боль; при высоком CO₂ также проблемы со сном, усталость, раздражительность.',
    now: [['Проверьте показания CO₂ и работу вентиляции в вашем отсеке', 'S4'], ['Перейдите в зону с лучшей циркуляцией воздуха', 'S4'], ['Отметьте боль в журнале: время и силу', '—'], NODRUG],
    doc: 'Боль сильная, необычная, с нарушением зрения, или держится несколько дней.', refs: 'S4' },
  { id: 'sans', name: 'Нейроокулярный синдром (SANS)', sym: ['vision'], when: 'Длительные полёты; риск растёт с длительностью.',
    signs: 'Изменения находят при осмотре глаза; человек может заметить ухудшение чёткости зрения.',
    now: [['Сообщите врачу о любом изменении зрения', 'R9'], ['Пройдите плановый осмотр глазного дна, не пропускайте его', 'R9']],
    doc: 'Любое изменение зрения — повод сообщить врачу сразу.', refs: 'R9' },
  { id: 'immune', name: 'Иммунитет и реактивация вирусов', sym: ['skin'], when: 'В любой момент полёта; связана со стрессом и недосыпом.',
    signs: 'Герпес на губах, сыпь, необычная аллергия, инфекции. Часто протекает без симптомов.',
    now: [['Сообщите врачу и опишите место и вид высыпаний', 'R10'], ['Восстановите сон: постоянное время отбоя и подъёма', 'R10'], ['Снизьте нагрузку и стресс, где это возможно', 'S5'], ['Не делитесь посудой и полотенцами при высыпаниях', '—']],
    doc: 'Болезненная сыпь полосой, температура, высыпания около глаза.', refs: 'R10, S5, S6' },
  { id: 'sleep', name: 'Недосып и сбой режима', sym: ['insomnia'], when: 'Весь полёт; экипажи на МКС спали около 6 часов.',
    signs: 'Короткий сон, сонливость, ошибки внимания, раздражительность.',
    now: [['Держите постоянное время отбоя и подъёма', 'P2'], ['Яркий свет днём и приглушённый свет за час до сна', 'R6'], ['Пройдите тест внимания перед ответственной работой', '—'], NODRUG],
    doc: 'Несколько ночей подряд короче вашей нормы или заметно упали результаты тестов.', refs: 'R6, P1, P2' },
  { id: 'bhv', name: 'Психологическое состояние', sym: ['lowmood'], when: 'Растёт с изоляцией, монотонностью и удалённостью от Земли.',
    signs: 'Сниженное настроение, тревога, раздражительность, конфликты, потеря интереса.',
    now: [['Запишите мысли в личный дневник', 'R3'], ['Свяжитесь с близкими в ближайший сеанс связи', 'R3'], ['Проведите время у иллюминатора или с растениями', 'R3'], ['Сделайте 5 минут медленного дыхания', 'P4']],
    doc: 'Состояние держится больше недели, мешает работе или появились мысли причинить себе вред — сообщите врачу сразу.', refs: 'R3, N6' },
  { id: 'cardio', name: 'Сердце, сосуды и посадка', sym: ['dizzy'], when: 'Адаптация весь полёт; риск обморока при посадке.',
    signs: 'Головокружение или предобморочное состояние при возвращении к гравитации.',
    now: [['Не пропускайте тренировки', 'R5'], ['Перед посадкой: компрессионная одежда и питьё по протоколу', 'R5']],
    doc: 'Боль в груди, перебои сердца, обморок — сообщите врачу сразу.', refs: 'R5' },
  { id: 'bone', name: 'Кости и мышцы', sym: [], when: 'Потери копятся весь полёт; заметны после возвращения.',
    signs: 'В полёте обычно без симптомов. Сила и аэробная форма падают примерно на 10–12 %.',
    now: [['Силовые и аэробные тренировки по плану, около 1,5 часа в день', 'R7'], ['Отмечайте пропущенные тренировки в журнале', '—']],
    doc: 'Травма, боль при нагрузке, невозможность выполнять план тренировок.', refs: 'R4, R7' },
  { id: 'rad', name: 'Радиация', sym: [], when: 'Доза копится весь полёт.',
    signs: 'В полёте обычно без симптомов; риск отдалённый.',
    now: [['Следуйте указаниям центра управления по радиационной защите', '—'], ['Не снимайте личный дозиметр, если он выдан', '—']],
    doc: 'Решения по дозе принимает врач и центр управления.', refs: 'R2' },
  { id: 'dcs', name: 'Декомпрессионная болезнь', sym: [], when: 'При переходе из корабля в скафандр с более низким давлением, во время выхода в открытый космос.',
    signs: 'Страница NASA не перечисляет симптомы у астронавтов. У водолазов описана сильная боль; в тяжёлых случаях — нарушение дыхания и признаки, похожие на инсульт.',
    now: [['При симптомах во время выхода безопасно, но быстро завершите выход и вернитесь в корабль', 'R11'], ['Перед выходом дышите кислородом по протоколу', 'R11']],
    doc: 'Любые симптомы во время или после выхода в открытый космос — сообщите врачу сразу.', refs: 'R11' },
  { id: 'hypoxia', name: 'Лёгкая гипоксия', sym: [], when: 'Будущие дальние полёты с пониженным давлением в кабине; сейчас — в шлюзе перед выходом. NASA оценивает риск как относительно низкий.',
    signs: 'Спутанность сознания, головная боль, ухудшение зрения, проблемы со сном.',
    now: [['Проверьте показания давления и кислорода в вашем отсеке', '—'], ['Сообщите члену экипажа, отвечающему за медицину', '—']],
    doc: 'Спутанность сознания или ухудшение зрения — сообщите врачу сразу.', refs: 'R12' },
  { id: 'food', name: 'Питание', sym: [], when: 'Весь полёт; труднее всего, когда запасы нельзя пополнить.',
    signs: 'NASA называет общие последствия: снижение работоспособности и болезни. Конкретные симптомы в источнике не перечислены.',
    now: [['Ешьте по плану питания, не пропускайте приёмы пищи', '—'], ['Отметьте в журнале, если еда надоела и вы едите меньше', 'R13']],
    doc: 'Вы едите заметно меньше несколько дней или теряете вес.', refs: 'R13' },
  { id: 'microbe', name: 'Инфекции и микроорганизмы', sym: [], when: 'В любой момент полёта.',
    signs: 'Симптомы в источнике не перечислены. Сказано, что астронавты могут заболеть, несмотря на меры предосторожности.',
    now: [['Сообщите врачу о признаках инфекции', '—'], ['Берите пробы и мазки с поверхностей по плану', 'R14']],
    doc: 'Температура или другие признаки инфекции.', refs: 'R14' },
  { id: 'eva', name: 'Травмы при выходе в открытый космос', sym: [], when: 'Во время выхода в открытый космос и тренировок к нему.',
    signs: 'Конкретные травмы в источнике не перечислены. Причины: перепад давления, физическая и умственная нагрузка, тяжёлый скафандр.',
    now: [['Поддерживайте силу мышц и костей плановыми тренировками', 'R15'], ['О любой травме или боли после выхода сообщите врачу', '—']],
    doc: 'Любая травма или боль после выхода в открытый космос.', refs: 'R15' },
  { id: 'team', name: 'Отношения в экипаже', sym: [], when: 'Растёт с изоляцией, задержкой связи, нехваткой ресурсов и тесным жилым объёмом.',
    signs: 'Проблемы с кооперацией, координацией и общением в экипаже, конфликты.',
    now: [['Используйте навыки командной работы, отработанные до полёта', 'R16'], ['Обратитесь за поддержкой к врачу-психологу на Земле', 'R16'], ['Сделайте 5 минут медленного дыхания', 'P4']],
    doc: 'Конфликт мешает совместной работе или длится больше недели.', refs: 'R16' },
  { id: 'loads', name: 'Посадка и перегрузки', sym: [], when: 'При посадке и при переходах между уровнями гравитации.',
    signs: 'Возможна дезориентация. Ослабленные кости и мышцы повышают риск травмы.',
    now: [['Используйте кресло и привязные ремни по процедуре посадки', 'R17'], ['Не пропускайте тренировки', 'R5']],
    doc: 'Любая травма или боль после посадки.', refs: 'R17' },
];
function rHandbook(el) {
  const mine = symGet();
  const chips = Object.keys(SLAB).map(k => `<button type="button" class="chipb ${mine.includes(k) ? 'active' : ''}" data-s="${k}">${SLAB[k]}</button>`).join('');
  const list = mine.length ? KB.filter(c => c.sym.some(k => mine.includes(k))) : KB;
  el.innerHTML = `<p class="muted small">Отметьте, что беспокоит сегодня. Отметки сохраняются на сегодня и учитываются ассистентом.</p><div class="chips">${chips}</div>
    <div class="kb">${list.map(c => `<details class="kb-card" ${mine.length ? 'open' : ''}><summary><b>${c.name}</b><span class="ref">${c.refs}</span></summary>
      <dl class="kv"><dt>Когда бывает</dt><dd>${c.when}</dd><dt>Признаки</dt><dd>${c.signs}</dd></dl>
      <h4 class="as-h">Что можно сделать сейчас</h4><ul class="reco-list">${c.now.map(r => `<li><span class="reco-ic">${ic('play')}</span><span class="reco-text">${r[0]}</span><span class="ref">${r[1] === '—' ? 'без источника' : r[1]}</span></li>`).join('')}</ul>
      <p class="as-doc">${ic('alert')}<span><b>Сообщите врачу, если:</b> ${c.doc}</span></p></details>`).join('')}</div>
    <p class="chart-note">Справочник хранится в приложении и работает без связи с Землёй. Это не диагноз и не замена врачу. Метки — номера источников в docs/REFERENCES.md; «без источника» — общая мера предосторожности.</p>`;
  el.querySelectorAll('.chipb').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.s, l = symGet(), i = l.indexOf(k); if (i >= 0) l.splice(i, 1); else l.push(k);
    lsSet(symKey(), JSON.stringify(l)); ASSESS = null; rHandbook(el); localize(el);
  }));
}

/* ======================================================================== v3: weekly trend and strength of psychology <-> health links
   Rules: docs/CHAT_SPEC_V3.md sections A and C. Transparent statistics, not a model. Thresholds are demonstration values, not clinical criteria.
   Alignment of S.sleep: a night is counted on the day it ENDS (the sample time is the wake-up time, see samples() and the generator, where
   session d ends on day d). So sleep(day d) is the night BEFORE day d: «sleep → stress / mood / energy / cognition, lag 0» reads
   «the short night before the day» -> that day's value; «stress (day d) → sleep, lag 1» reads «stress today -> the following night». */
const BADX = Object.assign({ co2: 1, headache: 1, skin: 1 }, BAD);       // «worse» direction, also for symptoms and CO2
const SYMB = ['headache', 'skin'];
const eVals = a => a.filter(v => v != null);
const eMean = a => a.reduce((s, v) => s + v, 0) / a.length;
const eSd = (a, m) => a.length > 1 ? Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1)) : 0;      // sample SD, like the norms of the generator
const TRM = {}, IMP = {};
function trend(k) {
  if (TRM[k]) return TRM[k];
  const E = engine(), v = E.S[k], N = v.length, c7 = Math.max(0, N - 7), c14 = Math.max(0, N - 14);
  const l7 = eVals(v.slice(c7)), p7 = eVals(v.slice(c14, c7)), bv = eVals(v.slice(0, c7));
  let base = null; if (bv.length >= 10) { const m = eMean(bv); base = { m, sd: eSd(bv, m), n: bv.length }; }
  const T = { k, n7: l7.length, m7: l7.length ? eMean(l7) : null, mPrev: p7.length ? eMean(p7) : null, base, z7: null, delta: null, run: 0, since: null, status: 'nodata', dir: null };
  if (T.n7 < 3 || !base || !(base.sd > 0)) return TRM[k] = T;
  T.z7 = (T.m7 - base.m) / base.sd; T.delta = T.mPrev == null ? null : T.m7 - T.mPrev;
  for (let i = N - 1; i >= 0; i--) {                       // consecutive most-recent days WITH data on the bad side by more than 0.5 SD
    if (v[i] == null) continue;
    if (BAD[k] * (v[i] - base.m) / base.sd > 0.5) { T.run++; T.since = E.days[i]; } else break;
  }
  const bz = BAD[k] * T.z7;
  T.status = bz > 1 ? 'worse' : bz < -1 ? 'better' : 'norm';
  if (T.status === 'norm' && T.delta != null && BAD[k] * T.delta > 0.5 * base.sd) T.dir = 'rising-bad';
  return TRM[k] = T;
}
function impact(a, b, lag) {
  const key = a + '|' + b + '|' + lag; if (key in IMP) return IMP[key];
  const E = engine(), A = E.S[a], B = E.S[b], va = eVals(A), vb = eVals(B); let res = null;
  if (va.length >= 10 && vb.length >= 10) {
    const ma = eMean(va), sa = eSd(va, ma), sym = SYMB.includes(b), bad = [], ok = [];
    for (let i = 0; i + lag < A.length; i++) {
      const x = A[i], y = B[i + lag]; if (x == null || y == null) continue;
      (BADX[a] * (x - ma) / sa > 0.5 ? bad : ok).push(sym ? (y > 0 ? 1 : 0) : y);      // symptoms: share of days with the symptom
    }
    const c = lag ? E.getLag(a, b) : E.get(a, b);
    if (sa > 0 && bad.length >= 5 && ok.length >= 5 && c && c.r != null) {
      const yb = sym ? vb.map(y => y > 0 ? 1 : 0) : vb, mb = eMean(bad), mo = eMean(ok);
      res = { a, b, lag, nBad: bad.length, nOk: ok.length, mBad: mb, mOk: mo, diff: mb - mo, r: c.r, sdB: eSd(yb, eMean(yb)), sym };
    }
  }
  return IMP[key] = res;
}
const impNotable = i => !!i && Math.abs(i.r) >= 0.3 && Math.abs(i.diff) >= 0.3 * i.sdB;
const impWorse = i => BADX[i.b] * i.diff > 0;
let PSY = null;
function psyLinks() {
  if (PSY) return PSY;
  const pairs = [];
  for (const a of ['stress', 'mood', 'energy']) for (const [b, l] of [['sleep', 1], ['hr', 0], ['cog', 0], ['cog', 1], ['headache', 0], ['skin', 1]]) pairs.push([a, b, l, 'psy→health']);
  for (const b of ['stress', 'mood', 'energy', 'cog']) pairs.push(['sleep', b, 0, 'health→psy']);
  if (D.env) pairs.push(['co2', 'headache', 0, 'control']);           // not psychology: shown separately as a control row
  return PSY = pairs.map(([a, b, l, t]) => { const i = impact(a, b, l); return i && impNotable(i) && impWorse(i) ? { ...i, dirType: t } : null; })
    .filter(Boolean).sort((x, y) => Math.abs(y.r) - Math.abs(x.r));
}
