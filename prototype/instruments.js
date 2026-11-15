/* ======================================================================
   Psychology & Cognition: the instrument catalogue ("Набор тестов"), VAS self-rating and its results.
   Sources: docs/REFERENCES.md (N2, N3, N4, P3, P6, P7, R18–R21). Periodicity and statuses are AVEGA demo values,
   not NASA schedules; statuses come from the prototype's own demo data where it exists.
   ====================================================================== */
const INS_HRR = 'https://humanresearchroadmap.nasa.gov/Tasks/task.aspx?i=1623';
const INS = [
  { id: 'sbh', raw: 1, ic: 'brain', tone: '#1a8cf0', name: 'Spaceflight Behavioral Health', freq: 'Ежедневно',
    about: 'Основной источник регулярной информации о психологическом состоянии. Можно отслеживать изменения показателей относительно индивидуального baseline.',
    demo: 'ежедневные чек-ины настроения, стресса и энергии (демо-данные); это не оригинальный опросник NASA.',
    src: [['NASA NTRS 20190000670', 'https://ntrs.nasa.gov/citations/20190000670'], ['NASA NTRS 20170005421', 'https://ntrs.nasa.gov/citations/20170005421']] },
  { id: 'vas', raw: 1, ic: 'pulse', tone: '#7c5ce6', name: 'VAS — Visual Analogue Scales', freq: 'Регулярно',
    about: 'Короткая регулярная самооценка. Например, астронавт отмечает уровень стресса на шкале от 0 до 100.',
    demo: 'семь шкал 0–100 по списку из задачи NASA; подписи краёв шкал — формулировки AVEGA.',
    src: [['NASA HRR, задача 1623', INS_HRR]] },
  { id: 'tfa', raw: 1, ic: 'users', tone: '#e09a1a', name: 'Team Functioning Assessment', freq: 'Еженедельно',
    about: 'Еженедельная оценка состояния экипажа. Результаты можно показывать как командные тенденции, не раскрывая индивидуальные ответы другим членам экипажа.',
    demo: 'опросник пока не добавлен: нужны валидированные тексты вопросов.',
    src: [['NASA NTRS 20200001281', 'https://ntrs.nasa.gov/citations/20200001281'], ['PubMed 31156490', 'https://pubmed.ncbi.nlm.nih.gov/31156490/', 1]] },
  { id: 'bars', raw: 1, ic: 'target', tone: '#22a559', name: 'Team Performance BARS', freq: 'Ежедневно',
    about: 'Отображать динамику оценки командной работы и выявлять устойчивое ухудшение взаимодействия.',
    demo: 'шкала пока не добавлена: нужны валидированные описания уровней.',
    src: [['NASA NTRS 20210023420', 'https://ntrs.nasa.gov/citations/20210023420']] },
  { id: 'ctb', raw: 1, ic: 'clipboard', tone: '#1fa6c4', name: 'Cognition Test Battery (CTB)', freq: 'По протоколу',
    about: 'Отслеживать изменения когнитивной производительности конкретного астронавта относительно его исходных результатов.',
    demo: 'один сводный демо-балл вместо десяти тестов батареи.',
    src: [['Basner et al. 2015, PMC4691281', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4691281/'], ['Nature, npj Microgravity', 'https://www.nature.com/articles/s41526-025-00532-6', 1]] },
  { id: 'act', ic: 'moon', tone: '#8b6be0', name: 'Актография / Дневник сна', freq: 'Постоянно',
    about: 'Объединять объективные показатели активности и субъективные оценки сна, а затем сопоставлять их с психологическими показателями.',
    demo: 'смоделированный поток сна; данных с браслета нет.',
    src: [['NASA Spaceflight Standard Measures', 'https://www.nasa.gov/reference/standard-measures/']] },
];
const INS_EXP = [
  { id: 'nar', ic: 'sparkle', tone: '#7c5ce6', name: 'Креативное задание', tag: 'Авторская методика', freq: 'Еженедельно',
    about: 'Пять абстрактных сценариев со свободными ответами. Помогает отслеживать, как меняется восприятие от недели к неделе. Ответы видит только астронавт.',
    demo: 'ответы хранятся в этом браузере; подсчитываются только слова, без психологической оценки.' },
  { id: 'crw', raw: 1, ic: 'users', tone: '#7c5ce6', name: 'Crew Connection', tag: 'Авторская методика', freq: 'По запросу',
    about: 'Командные активности в четырёх подгруппах: воспоминания, игры, открытые вопросы и творческие задания. AVEGA хранит только дату сессии и участников.',
    demo: 'три прошлые сессии — демонстрационные записи.' },
];
const VAS_ITEMS = [['mental', 'Умственное истощение', 'Совсем нет', 'Предельно сильно'], ['physical', 'Физическое истощение', 'Совсем нет', 'Предельно сильно'], ['fatigue', 'Усталость', 'Совсем нет', 'Предельно сильно'],
  ['stress', 'Стресс', 'Совсем нет', 'Предельно сильно'], ['workload', 'Рабочая нагрузка', 'Совсем нет', 'Предельно сильно'], ['conflict', 'Конфликт', 'Совсем нет', 'Предельно сильно'], ['sleepq', 'Качество сна', 'Очень плохое', 'Отличное']];
const vasKey = () => 'avega-vas-' + VIEW;
const vasGet = () => { try { const l = JSON.parse(lsGet(vasKey()) || '[]'); return Array.isArray(l) ? l : []; } catch (e) { return []; } };
const insRgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const insDot = k => k === 'ok' ? '<svg class="ins-dot" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="currentColor"/><path d="m6 10.3 2.7 2.7L14 7.6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  : `<svg class="ins-dot" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="2"${k === 'soon' ? ' stroke-dasharray="3 3"' : ''}/></svg>`;
function insStatus(id) {
  const today = dayFloor(NOW);
  if (id === 'sbh') return CI.some(x => x.t >= today && x.t <= NOW + MIN) ? ['ok', 'Сегодня'] : ['todo', 'Сегодня не заполнено'];
  if (id === 'vas') return vasGet().some(e => e.t >= today) ? ['ok', 'Сегодня'] : ['todo', 'Сегодня не пройдено'];
  if (id === 'ctb') { const t = TS[TS.length - 1]; return t ? ['ok', `Тест: ${relTime(t.t)}`] : ['todo', 'Тестов пока нет']; }
  if (id === 'act') { const s = SL[SL.length - 1]; return s ? ['ok', `Сон: ${relTime(s.e)}`] : ['todo', 'Данных пока нет']; }
  return ['soon', id === 'tfa' || id === 'bars' ? 'Скоро' : 'В разработке'];
}
function insAction(id) {                       // [label, handler] or null
  if (id === 'sbh') return ['Результаты', () => { location.hash = '#psychology-dynamics'; }];
  if (id === 'vas') return IS_DOC ? ['Результаты', () => { location.hash = '#psychology-results'; }] : ['Пройти', 'form'];
  if (id === 'ctb') return ['Результаты', () => { location.hash = '#psychology-results'; }];
  if (id === 'act') return ['Данные', () => openHistory('sleep', { scale: 'week', cursor: NOW })];
  if (id === 'nar') return [IS_DOC ? 'Результаты' : 'Пройти', () => { location.hash = '#creative'; }];
  if (id === 'crw') return ['Открыть', () => { location.hash = '#crew-connection'; }];
  return null;
}
function insVasForm() {
  return `<form class="vas" autocomplete="off"><p class="vas-h">Отметьте, как вы себя чувствуете сейчас. Шкала от 0 до 100; отмечайте только то, что хотите.</p>
    ${VAS_ITEMS.map(([k, l, a0, a1]) => `<label class="vas-i"><span class="vas-l">${l}</span><input type="range" min="0" max="100" value="50" data-k="${k}" class="untouched" aria-label="${l}"><output class="vas-v">—</output>
      <span class="vas-e"><small>${a0}</small><small>${a1}</small></span></label>`).join('')}
    <div class="vas-f"><button type="submit" class="btn btn-primary" disabled>Сохранить</button><span class="muted small vas-hint">Отметьте хотя бы одну шкалу</span></div></form>`;
}
function insRow(r, exp) {
  const st = exp ? (r.id === 'nar' ? creStatus() : ccStatus()) : insStatus(r.id), act = insAction(r.id);
  const src = (r.src || []).map(([t, u, unv]) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${t}</a>${unv ? ' <span class="ins-unv">(не проверено)</span>' : ''}`).join(' · ');
  return `<li class="ins" data-id="${r.id}" style="--tone:${r.tone};--tone-bg:${insRgba(r.tone, .14)}">
    <div class="ins-row"><span class="ins-ic">${ic(r.ic)}</span>
      <button type="button" class="ins-name" aria-expanded="false" aria-controls="ins-more-${r.id}"><b${r.raw ? ' data-raw' : ''}>${r.name}</b>${r.tag ? `<span class="ins-tag">${r.tag}</span>` : ''}${ic('chevron-down', 'ins-chev')}</button>
      <span class="ins-freq">${ic('cal')}${r.freq}</span><span class="ins-st ${st[0]}">${insDot(st[0])}${st[1]}</span>
      <span class="ins-aw">${act ? `<button type="button" class="ins-act" data-act="${r.id}">${act[0]}${ic('chevron-right')}</button>` : ''}</span></div>
    <div class="ins-more" id="ins-more-${r.id}" hidden><p><b>В AVEGA:</b> ${r.about}</p>${r.demo ? `<p class="muted"><b>В прототипе:</b> ${r.demo}</p>` : ''}
      ${src ? `<p class="ins-src muted"><b>Источники:</b> ${src}</p>` : ''}${r.id === 'vas' && !IS_DOC ? insVasForm() : ''}</div></li>`;
}
function insMount(el, list, exp) {
  el.innerHTML = `<ul class="ins-list">${list.map(r => insRow(r, exp)).join('')}</ul>`;
  const open = (li, on) => { const b = li.querySelector('.ins-name'), m = li.querySelector('.ins-more'); b.setAttribute('aria-expanded', on); m.hidden = !on; li.classList.toggle('open', on); };
  el.querySelectorAll('.ins').forEach(li => li.querySelector('.ins-name').addEventListener('click', () => open(li, li.querySelector('.ins-more').hidden)));
  el.querySelectorAll('.ins-act').forEach(b => b.addEventListener('click', () => {
    const a = insAction(b.dataset.act); if (!a) return;
    if (a[1] === 'form') { const li = b.closest('.ins'); open(li, true); li.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } else a[1]();
  }));
  const f = el.querySelector('.vas'); if (!f) return;
  const btn = f.querySelector('button[type=submit]'), hint = f.querySelector('.vas-hint');
  f.querySelectorAll('input[type=range]').forEach(i => i.addEventListener('input', () => {
    i.classList.remove('untouched'); i.nextElementSibling.textContent = i.value;
    const n = f.querySelectorAll('input:not(.untouched)').length; btn.disabled = !n; hint.hidden = !!n;
  }));
  f.addEventListener('submit', e => {
    e.preventDefault(); const v = {};
    f.querySelectorAll('input:not(.untouched)').forEach(i => { v[i.dataset.k] = +i.value; });
    if (!Object.keys(v).length) return;
    const l = vasGet(); l.push({ t: NOW, v }); lsSet(vasKey(), JSON.stringify(l.slice(-60)));
    ASSESS = null; route();
  });
}
const rInsCore = el => { insMount(el, INS, false); el.insertAdjacentHTML('beforeend', '<p class="chart-note">Периодичность и статусы — демонстрация AVEGA: расписание NASA в источниках не указано. Данные демонстрационные; «Скоро» — инструмент ещё не встроен.</p>'); };
const rInsExp = el => insMount(el, INS_EXP, true);
function rVasResults(el) {
  const l = vasGet().slice(-6).reverse();
  if (!l.length) { el.innerHTML = `<p class="muted">Записей VAS пока нет.</p>${IS_DOC ? '' : `<a class="btn btn-ghost" href="#psychology-tests">${ic('play')}Пройти</a>`}`; return; }
  el.innerHTML = `<div class="table-scroll"><table class="htable vas-t"><thead><tr><th>Шкала (0–100)</th>${l.map(e => `<th class="num">${dShort(e.t)} ${hhmm(e.t)}</th>`).join('')}</tr></thead><tbody>
    ${VAS_ITEMS.map(([k, lab]) => `<tr><td>${lab}</td>${l.map(e => `<td class="num">${e.v[k] == null ? '—' : `<b>${e.v[k]}</b>`}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <p class="chart-note">Сравнение с личной нормой появится, когда накопится достаточно записей. «Качество сна»: больше — лучше; на остальных шкалах больше — сильнее выражено.</p>`;
}
