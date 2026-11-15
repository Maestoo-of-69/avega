/* ======================================================================
   AVEGA authored methods (not validated instruments; never used for diagnosis):
   1) «Креативное задание» (formerly Narrative Assessment) — 5 abstract scenarios, free-text answers, kept private.
   2) Crew Connection — shared crew activities in 4 subgroups; AVEGA stores only that a session happened and who took part.
   Context: NASA lists inadequate teamwork and behavioural conditions among HRP risks (docs/REFERENCES.md R3, R16).
   Scenario pictures: drawn here as abstract placeholders until the team's own images are added (CRE_IMG).
   ====================================================================== */
const CRE_IMG = [IMGS.door, null, null, IMGS.nebula, null];   // team images (data: URLs): «Слабый сигнал» — a signal from deep space → the nebula
const CRE = [
  { ttl: ['Неизвестная дверь', 'The Unknown Door'], intro: ['Во время исследовательской миссии вы находите одну дверь посреди незнакомого ландшафта.', 'During an exploration mission you find a single door standing in an unfamiliar landscape.'],
    q: [['door', 'Что вы думаете об этой двери?', 'What do you think about this door?'], ['compass', 'Вы откроете её? Почему?', 'Will you open it? Why?'], ['users', 'Вы возьмёте с собой кого-то из экипажа?', 'Would you take someone from the crew with you?'], ['mountain', 'Что, по вашему мнению, может быть за дверью?', 'What do you think might be behind the door?']] },
  { ttl: ['Сад под куполом', 'The Garden Under the Dome'], intro: ['В дальнем отсеке станции вы находите оранжерею, где растёт одно незнакомое растение.', 'In a far module of the station you find a greenhouse with a single plant you do not recognise.'],
    q: [['leaf', 'Что вы чувствуете, глядя на него?', 'What do you feel looking at it?'], ['heart', 'Станете ли вы за ним ухаживать?', 'Will you take care of it?'], ['users', 'Кому из экипажа вы бы показали его первым?', 'Who in the crew would you show it to first?'], ['sparkle', 'Каким оно станет через год?', 'What will it become in a year?']] },
  { ttl: ['Мост в тумане', 'The Bridge in the Fog'], intro: ['Перед вами узкий мост. Его другой конец скрыт густым туманом.', 'A narrow bridge lies ahead. Its far end is hidden in thick fog.'],
    q: [['compass', 'Что вы сделаете первым?', 'What will you do first?'], ['eye', 'Что вы видите и слышите вокруг?', 'What do you see and hear around you?'], ['users', 'Пойдёте один или с кем-то?', 'Will you go alone or with someone?'], ['mountain', 'Что ждёт на другой стороне?', 'What waits on the other side?']] },
  { ttl: ['Слабый сигнал', 'A Faint Signal'], intro: ['Ночью на пульте появляется тихий повторяющийся сигнал. Источник неизвестен.', 'At night a quiet repeating signal appears on the console. Its source is unknown.'],
    q: [['antenna', 'Какая ваша первая мысль?', 'What is your first thought?'], ['chat', 'Попробуете ли вы ответить? Как?', 'Will you try to answer? How?'], ['users', 'С кем вы это обсудите?', 'Who will you discuss it with?'], ['sparkle', 'Что может означать этот сигнал?', 'What might this signal mean?']] },
  { ttl: ['Комната тишины', 'The Quiet Room'], intro: ['Вы получаете один свободный час в комнате, где ничто не отвлекает.', 'You are given one free hour in a room where nothing can distract you.'],
    q: [['clock', 'Чем вы займётесь?', 'What will you do?'], ['layers', 'Что вы возьмёте с собой?', 'What will you bring with you?'], ['users', 'Позовёте ли вы кого-нибудь? Кого?', 'Will you invite anyone? Who?'], ['meditate', 'Что изменится после этого часа?', 'What will change after this hour?']] },
];
const L2 = a => lang === 'en' ? a[1] : a[0];
const CRE_KEY = () => 'avega-cre-' + VIEW;
const creLog = () => { try { const a = JSON.parse(localStorage.getItem(CRE_KEY()) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
let CRS = { i: 0, ans: CRE.map(() => ''), done: null };

/* abstract scene placeholders — the AVEGA team will replace them with its own pictures */
function creArt(i) {
  if (CRE_IMG[i]) return `<img src="${CRE_IMG[i]}" alt="">`;
  const P = [['#2b2357', '#b48ad6', '#f5b38a'], ['#12343b', '#3f8f86', '#c9e7b5'], ['#2d3346', '#8a93ad', '#e6e2da'], ['#0d1b3a', '#2f4c8f', '#8fd3ff'], ['#3a2346', '#c27aa0', '#ffd7a8']][i];
  const st = Array.from({ length: 26 }, (_, k) => `<circle cx="${(k * 97) % 400}" cy="${(k * 53) % 150}" r="${k % 3 ? 0.9 : 1.5}" fill="#fff" opacity="${0.35 + (k % 4) * 0.12}"/>`).join('');
  const motif = [
    '<rect x="172" y="120" width="56" height="110" rx="4" fill="#6d6170"/><rect x="182" y="132" width="36" height="98" rx="2" fill="url(#cg)"/><ellipse cx="200" cy="232" rx="60" ry="8" fill="#ffcf9a" opacity=".35"/>',
    '<path d="M120 232a80 80 0 0 1 160 0" fill="#c9e7b5" opacity=".18" stroke="#c9e7b5" stroke-width="2"/><path d="M200 232v-48" stroke="#7bd0a0" stroke-width="3"/><path d="M200 200c-18-4-24-18-22-26 14 0 22 10 22 26Zm0-8c16-6 22-20 20-28-14 2-20 12-20 28Z" fill="#7bd0a0"/>',
    '<path d="M60 250 196 170M340 250 204 170" stroke="#cfd3dd" stroke-width="3"/><path d="M80 238h240M110 221h180M140 204h120M166 189h68" stroke="#cfd3dd" stroke-width="2" opacity=".7"/><ellipse cx="200" cy="168" rx="120" ry="34" fill="#fff" opacity=".55"/>',
    '<path d="M168 230l18-54h28l18 54" fill="#3a4d74"/><ellipse cx="200" cy="168" rx="34" ry="12" fill="#5a75b0"/><path d="M226 140a40 40 0 0 1 0 40M240 128a60 60 0 0 1 0 64M254 116a80 80 0 0 1 0 88" stroke="#8fd3ff" stroke-width="2.5" fill="none" opacity=".85"/>',
    '<path d="M150 232v-80a50 50 0 0 1 100 0v80" fill="#4b2d55"/><path d="M162 232v-76a38 38 0 0 1 76 0v76" fill="url(#cg)"/><ellipse cx="200" cy="234" rx="70" ry="8" fill="#ffd7a8" opacity=".35"/>',
  ][i];
  return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="cs${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P[0]}"/><stop offset=".65" stop-color="${P[1]}"/><stop offset="1" stop-color="${P[2]}"/></linearGradient>
    <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6e6"/><stop offset="1" stop-color="#ffb26b"/></linearGradient></defs>
    <rect width="400" height="300" fill="url(#cs${i})"/>${st}<circle cx="96" cy="78" r="44" fill="#fff" opacity=".22"/><circle cx="96" cy="78" r="44" fill="none" stroke="#fff" opacity=".35"/>
    <path d="M0 236c60-18 110-6 170-14s120-24 230-4v82H0Z" fill="${P[0]}" opacity=".55"/>${motif}<path d="M0 252c90-12 160 6 230-4s110-10 170 0v52H0Z" fill="${P[0]}" opacity=".85"/></svg>`;
}

function creAbout(cur) {
  const it = [['target', 'Исследование индивидуального восприятия', 'Exploring individual perception'], ['layers', 'Абстрактные сценарии', 'Abstract scenarios'], ['user', 'Индивидуально', 'Individual'], ['bars', 'Качественный профиль ответов', 'Qualitative answer profile'], ['meditate', 'Саморефлексия', 'Self-reflection']];
  return `<section class="card cre-about">${cur !== 3 ? `<div class="cre-cover"><img src="${IMGS.nebula}" alt=""></div>` : ''}<h3>${ic('info')}${LR('О методике', 'About the method')}</h3><ul>${it.map(x => `<li><span class="cre-ic">${ic(x[0])}</span>${LR(x[1], x[2])}</li>`).join('')}</ul>
    <p class="chart-note">${LR('Авторская методика AVEGA. Не валидирована и не используется для диагностики. Ответы видите только вы.', 'An AVEGA authored method. Not validated and never used for diagnosis. Only you see the answers.')}</p></section>`;
}
function creStats(ans) {
  const txt = ans.join(' '), words = (txt.match(/[\p{L}\p{N}]+/gu) || []).length;
  const others = (txt.toLowerCase().match(/(экипаж|команд|вместе|друз|сем[ьея]|\bмы\b|\bнас\b|\bнам\b|crew|team|together|friend|family|\bwe\b|\bus\b)/gu) || []).length;
  return { done: ans.filter(a => a.trim()).length, words, others };
}
function rCreative(el) {
  const log = creLog();
  if (IS_DOC) {
    el.innerHTML = `<div class="cre-doc card"><h3>${LR('Ответы астронавта личные', 'The astronaut’s answers are private')}</h3><p class="muted">${LR('Врач видит только факт выполнения задания.', 'The flight surgeon sees only that the task was completed.')}</p>
      <ul class="cre-hist">${log.length ? log.slice(-6).reverse().map(e => `<li>${ic('check')}${iso(e.t)} · ${LR('ответов', 'answers')}: ${e.ans.filter(a => a.trim()).length} / ${CRE.length}</li>`).join('') : `<li class="muted">${LR('Задание ещё не выполнялось.', 'Not completed yet.')}</li>`}</ul></div>`;
    return;
  }
  if (CRS.done) return creResult(el);
  const i = CRS.i, s = CRE[i], v = CRS.ans[i];
  el.innerHTML = `<div class="cre-grid"><div class="cre-main">
      <section class="card cre-prog"><b>${LR(`Сценарий ${i + 1} из ${CRE.length}`, `Scenario ${i + 1} of ${CRE.length}`)}</b><ol class="cre-steps">${CRE.map((_, k) => `<li class="${k < i ? 'past' : k === i ? 'now' : ''}">${k < i ? ic('check') : ''}</li>`).join('')}</ol></section>
      <section class="card cre-scene"><div class="cre-img">${creArt(i)}</div><div class="cre-txt"><h2>${LR('Сценарий', 'Scenario')}: ${L2(s.ttl)}</h2><p class="muted">${L2(s.intro)}</p>
        <ul class="cre-q">${s.q.map(q => `<li><span class="cre-ic">${ic(q[0])}</span>${lang === 'en' ? q[2] : q[1]}</li>`).join('')}</ul></div></section></div>${creAbout(i)}</div>
    <section class="card cre-input"><textarea id="cre-ta" maxlength="1000" placeholder="${LR('Опишите свои мысли, чувства и решения…', 'Describe your thoughts, feelings and decisions…')}" data-raw></textarea><span class="cre-cnt" id="cre-cnt">${v.length} / 1000</span></section>
    <div class="cre-nav"><button type="button" class="av-btn" id="cre-back" ${i === 0 ? 'disabled' : ''}>${ic('arrow-left')}${LR('Назад', 'Back')}</button><span class="hc-spacer"></span>
      <button type="button" class="av-btn" id="cre-skip">${LR('Пропустить', 'Skip')}</button><button type="button" class="av-pri" id="cre-next" ${v.trim() ? '' : 'disabled'}>${i === CRE.length - 1 ? LR('Завершить', 'Finish') : LR('Далее', 'Next')}${ic('arrow-right')}</button></div>`;
  const ta = el.querySelector('#cre-ta'); ta.value = v;
  ta.addEventListener('input', () => { CRS.ans[i] = ta.value; el.querySelector('#cre-cnt').textContent = `${ta.value.length} / 1000`; el.querySelector('#cre-next').disabled = !ta.value.trim(); });
  const go = d => { const n = i + d; if (n >= CRE.length) { const e = { t: NOW, ans: CRS.ans.slice() }; const l = creLog(); l.push(e); try { localStorage.setItem(CRE_KEY(), JSON.stringify(l.slice(-20))); } catch (x) { } CRS.done = e; } else CRS.i = Math.max(0, n); rCreative(el); localize(el); window.scrollTo(0, 0); };
  el.querySelector('#cre-back').addEventListener('click', () => go(-1));
  el.querySelector('#cre-skip').addEventListener('click', () => { CRS.ans[i] = ''; go(1); });
  el.querySelector('#cre-next').addEventListener('click', () => go(1));
}
function creResult(el) {
  const e = CRS.done, S = creStats(e.ans);
  const k = [[LR('Ответов', 'Answered'), `${S.done} / ${CRE.length}`], [LR('Пропущено', 'Skipped'), String(CRE.length - S.done)], [LR('Слов', 'Words'), String(S.words)], [LR('Упоминаний других людей', 'Mentions of other people'), String(S.others)]];
  el.innerHTML = `<div class="cre-grid"><div class="cre-main"><section class="card cre-res"><h2>${ic('check')}${LR('Задание завершено', 'Task completed')}</h2>
      <div class="cre-kpis">${k.map(x => `<div><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div>
      <p class="chart-note">${LR('Это подсчёт слов, а не психологическая оценка. Профиль показывает, как менялись ваши ответы от недели к неделе.', 'This is a word count, not a psychological assessment. The profile shows how your answers change from week to week.')}</p>
      <ul class="cre-ans">${CRE.map((s, j) => `<li><b>${L2(s.ttl)}</b>${e.ans[j].trim() ? `<p data-raw>${esc(e.ans[j])}</p>` : `<p class="muted">${LR('Пропущено', 'Skipped')}</p>`}</li>`).join('')}</ul>
      <div class="cre-nav"><a class="av-btn" href="#psychology">${ic('arrow-left')}${LR('К набору тестов', 'Back to the test set')}</a><span class="hc-spacer"></span><button type="button" class="av-pri" id="cre-again">${LR('Пройти заново', 'Start again')}</button></div></section></div>${creAbout()}</div>`;
  el.querySelector('#cre-again').addEventListener('click', () => { CRS = { i: 0, ans: CRE.map(() => ''), done: null }; rCreative(el); localize(el); });
}
function creStatus() {
  const l = creLog(), last = l[l.length - 1];
  if (last && NOW - last.t < 7 * DAY) return ['ok', LR(`Пройдено: ${relTime(last.t)}`, `Done: ${relTime(last.t)}`)];
  return ['todo', LR('На этой неделе не пройдено', 'Not done this week')];
}

/* ------------------------------------------------------------ Crew Connection */
const CC = [
  { id: 'memories', name: 'Shared Memories', sub: ['Воспоминания, опыт и жизнь на Земле.', 'Memories, experience and life on Earth.'], icon: 'image', tone: '#7c5ce6', mins: 15, img: 'table', pos: '50% 60%',
    items: [['Какая твоя любимая активность на Земле?', 'What is your favourite activity on Earth?'], ['Какое место на Земле вызывает у тебя самые тёплые чувства?', 'Which place on Earth gives you the warmest feelings?'], ['Какое воспоминание ты чаще всего вспоминаешь?', 'Which memory do you return to most often?'], ['Какое блюдо с Земли ты больше всего скучаешь?', 'Which food from Earth do you miss most?'], ['Кем ты мечтал стать в детстве?', 'What did you dream of becoming as a child?'], ['Какой простой момент из прошлого делает тебя счастливым?', 'Which simple moment from the past makes you happy?'], ['Какой звук напоминает тебе о доме?', 'Which sound reminds you of home?'], ['Какую традицию твоей семьи ты бы показал экипажу?', 'Which family tradition would you show the crew?'], ['Какой день был самым смешным в твоей жизни?', 'What was the funniest day of your life?'], ['Какую книгу или фильм ты пересматривал много раз?', 'Which book or film have you returned to many times?'], ['Чему тебя научил первый наставник?', 'What did your first mentor teach you?'], ['Куда ты отправишься первым делом после возвращения?', 'Where will you go first after you return?']] },
  { id: 'games', name: 'Team Games', sub: ['Совместные игры и головоломки.', 'Shared games and puzzles.'], icon: 'gamepad', tone: '#1a8cf0', mins: 20, img: 'puzzle', pos: '50% 50%',
    items: [['«20 вопросов»: один загадывает предмет на станции, остальные угадывают', '“20 questions”: one person picks an object on the station, the others guess'], ['Цепочка ассоциаций: каждый продолжает словом за 5 секунд', 'Association chain: everyone adds a word within 5 seconds'], ['Общая история: каждый добавляет по одному предложению', 'Shared story: everyone adds one sentence'], ['Две правды и одна выдумка', 'Two truths and a lie'], ['Описать предмет, не называя его, — команда угадывает', 'Describe an object without naming it — the team guesses'], ['Совместная логическая головоломка на время', 'A timed logic puzzle solved together'], ['Викторина о Земле: столицы, реки, горы', 'Earth quiz: capitals, rivers, mountains'], ['Нарисовать схему станции по памяти — сравнить версии', 'Draw the station from memory — compare versions']] },
  { id: 'questions', name: 'Open Questions', sub: ['Необычные вопросы, чтобы узнать друг друга лучше.', 'Unusual questions to get to know each other better.'], icon: 'chat', tone: '#18a07a', mins: 15, img: 'dialog', pos: '50% 50%',
    items: [['Какую суперспособность ты бы выбрал для этой миссии?', 'Which superpower would you choose for this mission?'], ['Если бы ты мог поужинать с любым человеком в истории — с кем?', 'If you could have dinner with anyone in history — who?'], ['Какое правило ты бы добавил в жизнь экипажа?', 'Which rule would you add to crew life?'], ['Что ты умеешь, о чём мы ещё не знаем?', 'What can you do that we do not know about yet?'], ['Какой совет ты дал бы себе десять лет назад?', 'What advice would you give yourself ten years ago?'], ['Какой предмет на борту ты назвал бы талисманом?', 'Which object on board would you call our mascot?'], ['О чём ты мог бы говорить часами?', 'What could you talk about for hours?'], ['Что для тебя значит хороший день здесь?', 'What does a good day here mean to you?'], ['Какую песню ты бы поставил на посадке на Марс?', 'Which song would you play at the Mars landing?'], ['Какой маленький жест экипажа тебе особенно приятен?', 'Which small crew gesture do you appreciate most?'], ['Чему ты научился у кого-то из нас?', 'What have you learned from one of us?'], ['Каким ты хочешь запомнить этот полёт?', 'How do you want to remember this flight?']] },
  { id: 'creative', name: 'Creative Challenges', sub: ['Совместное творчество: истории, рисунки и идеи.', 'Creating together: stories, drawings and ideas.'], icon: 'brush', tone: '#e8823a', mins: 25, img: 'bubbles', pos: '50% 45%',
    items: [['Придумать эмблему следующего этапа миссии', 'Design a patch for the next mission phase'], ['Рассказ из шести слов о сегодняшнем дне', 'A six-word story about today'], ['Нарисовать вид из иллюминатора, каким он будет на Марсе', 'Draw the view from the window as it will look at Mars'], ['Сочинить девиз экипажа', 'Write a crew motto'], ['Придумать новое блюдо из бортового меню', 'Invent a new dish from the on-board menu'], ['Записать короткое послание будущему экипажу', 'Record a short message to a future crew'], ['Придумать название для безымянного кратера', 'Name an unnamed crater'], ['Собрать «музей» из пяти предметов на борту и описать его', 'Build a “museum” of five objects on board and describe it']] },
];
const CC_KEY = 'avega-cc';
function ccLog() {
  let a = null; try { a = JSON.parse(localStorage.getItem(CC_KEY) || 'null'); } catch (e) { }
  if (!Array.isArray(a)) a = [{ t: NOW - 3 * DAY - 5 * HOUR, g: 'memories', n: 5, who: ['alex', 'mira', 'daniel', 'yuki'], demo: 1 }, { t: NOW - 9 * DAY, g: 'games', n: 3, who: ['alex', 'daniel', 'yuki'], demo: 1 }, { t: NOW - 16 * DAY, g: 'questions', n: 6, who: ['alex', 'mira', 'yuki'], demo: 1 }];
  return a;
}
const ccSave = a => { try { localStorage.setItem(CC_KEY, JSON.stringify(a.slice(-60))); } catch (e) { } };
const ccIni = p => p.name.split(' ').map(x => x[0]).join('');
const ccAv = (p, on) => `<span class="cc-av${on === false ? ' off' : ''}" title="${p.name}" data-raw>${ccIni(p)}</span>`;
let CCS = { sel: {}, run: null };

function ccBanner(g, big) {
  const st = Array.from({ length: 14 }, (_, k) => `<circle cx="${(k * 71) % 300}" cy="${(k * 37) % 120}" r="${k % 3 ? 0.8 : 1.4}" fill="#fff" opacity=".5"/>`).join('');
  if (g.img && IMGS[g.img]) return `<div class="cc-ban has-img${big ? ' big' : ''}" style="--tone:${g.tone}"><img src="${IMGS[g.img]}" alt="" style="object-position:${g.pos}"></div>`;
  return `<div class="cc-ban${big ? ' big' : ''}" style="--tone:${g.tone}"><svg viewBox="0 0 300 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${st}<circle cx="248" cy="96" r="70" fill="#fff" opacity=".08"/><circle cx="40" cy="-10" r="46" fill="#fff" opacity=".07"/></svg>
    ${big ? '' : `<span class="cc-ban-ic">${ic(g.icon)}</span>`}</div>`;
}
function ccWeek() {
  const log = ccLog(), done = CC.filter(g => log.some(e => e.g === g.id && NOW - e.t < 7 * DAY));
  return { done, left: CC.filter(g => !done.includes(g)), pct: Math.round(done.length / CC.length * 100) };
}
function ccSide() {
  const W = ccWeek(), r = 46, c = 2 * Math.PI * r, nx = W.left[0];
  return `<section class="card cc-prog"><div class="blk-h"><h3>${LR('Командный прогресс', 'Team progress')}</h3>${badge('demo')}</div><div class="cc-ring-row">
      <svg class="cc-ring" viewBox="0 0 120 120"><circle cx="60" cy="60" r="${r}" class="cc-ring-bg"/><circle cx="60" cy="60" r="${r}" class="cc-ring-fg" stroke-dasharray="${(c * W.pct / 100).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 60 60)"/><text x="60" y="66" text-anchor="middle">${W.pct}%</text></svg>
      <ul><li>${insDot('ok')}<b>${W.done.length}</b> ${LR('из 4 подгрупп за 7 дней', 'of 4 subgroups in 7 days')}</li><li>${insDot('todo')}<b>${W.left.length}</b> ${LR('запланировано', 'planned')}</li></ul></div></section>
    ${nx ? `<a class="card cc-next" href="#crew-connection-${nx.id}"><span class="cc-next-ic">${ic('cal')}</span><span><small>${LR('Ближайшая активность', 'Next activity')}</small><b data-raw>${nx.name}</b><span class="muted">${LR('Сегодня · 18:00 (демо-расписание)', 'Today · 18:00 (demo schedule)')}</span></span>${ic('chevron-right')}</a>` : ''}
    <section class="card cc-crew"><div class="blk-h"><h3>${LR('Участники экипажа', 'Crew members')} (${CREWDATA.crew.length})</h3></div><div class="cc-avs">${CREWDATA.crew.map(p => ccAv(p)).join('')}</div></section>`;
}
function rCrewConn(el, tab) {
  const log = ccLog();
  const tabs = `<div class="subtabs" role="tablist"><a class="tab ${tab !== 'all' ? 'active' : ''}" href="#crew-connection">${ic('grid')}${LR('Подгруппы', 'Subgroups')}</a><a class="tab ${tab === 'all' ? 'active' : ''}" href="#crew-connection-all">${ic('list')}${LR('Все активности', 'All activities')}</a></div>`;
  let main;
  if (tab === 'all') {
    main = `<section class="card"><div class="blk-h"><h3>${LR('Все активности', 'All activities')}</h3><span class="cnt-pill">${CC.reduce((a, g) => a + g.items.length, 0)}</span></div>
      ${CC.map(g => `<h4 class="cc-h4" style="--tone:${g.tone}">${ic(g.icon)}<span data-raw>${g.name}</span><a href="#crew-connection-${g.id}">${LR('Открыть', 'Open')} ${ic('chevron-right')}</a></h4><ul class="cc-list">${g.items.map(q => `<li>${L2(q)}</li>`).join('')}</ul>`).join('')}</section>`;
  } else {
    main = `<section class="card"><div class="blk-h"><h3>${LR('Подгруппы активностей', 'Activity subgroups')}</h3><span class="cnt-pill">${LR('4 подгруппы', '4 subgroups')}</span></div>
      <div class="cc-cards">${CC.map(g => { const n = log.filter(e => e.g === g.id).length; return `<a class="cc-card" href="#crew-connection-${g.id}">${ccBanner(g)}<div class="cc-card-b"><div><b data-raw>${g.name}</b><span class="muted">${L2(g.sub)}</span><small class="muted">${LR(`Сессий: ${n} · ≈${g.mins} мин`, `Sessions: ${n} · ≈${g.mins} min`)}</small></div><span class="cc-go">${ic('chevron-right')}</span></div></a>`; }).join('')}</div></section>`;
  }
  el.innerHTML = tabs + `<div class="cc-grid"><div>${main}</div><div class="cc-side">${ccSide()}</div></div>`;
}
function rCrewGroup(el, g, tab) {
  const log = ccLog().filter(e => e.g === g.id), sel = CCS.sel[g.id] || (CCS.sel[g.id] = []);
  const base = '#crew-connection-' + g.id, tabs = [['', 'list', LR('Подборка', 'Selection')], ['activity', 'users', LR('Активность экипажа', 'Crew activity')], ['results', 'bars', LR('Результаты', 'Results')]];
  let main;
  if (CCS.run && CCS.run.g === g.id) main = ccRunHTML(g);
  else if (tab === 'activity') main = `<section class="card"><div class="blk-h"><h3>${LR('Активность экипажа', 'Crew activity')}</h3><span class="cnt-pill">${log.length}</span></div>${log.length ? `<ul class="cc-log">${log.slice().reverse().map(e => `<li><span>${iso(e.t)} · ${relTime(e.t)}${e.demo ? ' ' + badge('demo') : ''}</span><span>${LR(`пунктов: ${e.n}`, `items: ${e.n}`)}</span><span class="cc-avs sm">${CREWDATA.crew.map(p => ccAv(p, e.who.includes(p.id))).join('')}</span></li>`).join('')}</ul>` : `<p class="muted">${LR('Сессий пока не было.', 'No sessions yet.')}</p>`}</section>`;
  else if (tab === 'results') {
    const tot = log.reduce((a, e) => a + e.n, 0), mx = Math.max(1, log.length);
    main = `<section class="card"><div class="blk-h"><h3>${LR('Результаты', 'Results')}</h3></div><div class="cre-kpis"><div><span>${LR('Сессий', 'Sessions')}</span><b>${log.length}</b></div><div><span>${LR('Пунктов обсуждено', 'Items discussed')}</span><b>${tot}</b></div><div><span>${LR('Средне участников', 'Avg participants')}</span><b>${log.length ? fmt(log.reduce((a, e) => a + e.who.length, 0) / log.length, 1) : '—'}</b></div></div>
      <ul class="cc-part">${CREWDATA.crew.map(p => { const n = log.filter(e => e.who.includes(p.id)).length; return `<li>${ccAv(p)}<span data-raw>${p.name}</span><i><b style="width:${(n / mx * 100).toFixed(0)}%"></b></i><span>${n} / ${log.length}</span></li>`; }).join('')}</ul>
      <p class="chart-note">${LR('Обсуждение устное: AVEGA не записывает ответы, а хранит только дату, число пунктов и участников.', 'The discussion is spoken: AVEGA does not record answers — only the date, number of items and who took part.')}</p></section>`;
  } else main = `<section class="card"><div class="blk-h"><h3>${LR('Подборка', 'Selection')}</h3><span class="cnt-pill">${LR(`Выбрано ${sel.length} из ${g.items.length}`, `${sel.length} of ${g.items.length} selected`)}</span></div>
      <ul class="cc-qs">${g.items.map((q, k) => `<li><button type="button" class="cc-q ${sel.includes(k) ? 'on' : ''}" data-k="${k}" aria-pressed="${sel.includes(k)}"><span class="cc-q-ic">${ic(sel.includes(k) ? 'check' : g.id === 'games' ? 'gamepad' : g.id === 'creative' ? 'brush' : 'chat')}</span><span>${L2(q)}</span>${ic('chevron-right')}</button></li>`).join('')}</ul></section>`;
  el.innerHTML = `<section class="card cc-head">${ccBanner(g, 1)}<div><span class="cc-head-ic" style="--tone:${g.tone}">${ic(g.icon)}</span><b data-raw>${g.name}</b><span class="muted">${L2(g.sub)}</span></div></section>
    <div class="subtabs" role="tablist">${tabs.map(t => `<a class="tab ${(tab || '') === t[0] && !(CCS.run && CCS.run.g === g.id) ? 'active' : ''}" href="${base}${t[0] ? '-' + t[0] : ''}">${ic(t[1])}${t[2]}</a>`).join('')}</div>
    <div class="cc-grid"><div>${main}</div><div class="cc-side">
      <section class="card cc-about"><h3>${LR('О сессии', 'About the session')}</h3><ul><li>${ic('users')}${LR('Командная активность', 'Team activity')}</li><li>${ic('clock')}≈ ${g.mins} ${LR('минут', 'minutes')}</li><li>${ic('heart')}${LR('Цель: общение и взаимопонимание', 'Aim: talking and understanding each other')}</li></ul></section>
      <section class="card cc-start"><h3>${ic('users')}${LR('Старт сессии', 'Start a session')}</h3><p class="muted">${sel.length ? LR('Обсудите выбранные пункты вместе с экипажем.', 'Discuss the selected items together with the crew.') : LR('Выберите пункты или начните с пяти случайных.', 'Pick items or start with five random ones.')}</p>
        <button type="button" class="av-pri wide" id="cc-start" ${IS_DOC || CCS.run ? 'disabled' : ''}>${LR('Начать', 'Start')}${ic('arrow-right')}</button>${IS_DOC ? `<p class="chart-note">${LR('Сессии запускает экипаж.', 'Sessions are started by the crew.')}</p>` : ''}</section>
      <section class="card cc-crew"><div class="blk-h"><h3>${LR('Участники', 'Participants')} (${CREWDATA.crew.length})</h3></div><div class="cc-avs">${CREWDATA.crew.map(p => ccAv(p)).join('')}</div></section></div></div>`;
  el.querySelectorAll('.cc-q').forEach(b => b.addEventListener('click', () => { const k = +b.dataset.k, j = sel.indexOf(k); if (j < 0) sel.push(k); else sel.splice(j, 1); rCrewGroup(el, g, tab); localize(el); }));
  const st = el.querySelector('#cc-start');
  if (st) st.addEventListener('click', () => {
    let q = sel.slice().sort((a, b) => a - b);
    if (!q.length) { const idx = g.items.map((_, k) => k); for (let k = idx.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [idx[k], idx[j]] = [idx[j], idx[k]]; } q = idx.slice(0, 5).sort((a, b) => a - b); }
    CCS.run = { g: g.id, q, i: 0, who: CREWDATA.crew.map(p => p.id) }; rCrewGroup(el, g, tab); localize(el); window.scrollTo(0, 0);
  });
  if (CCS.run && CCS.run.g === g.id) ccRunBind(el, g, tab);
}
function ccRunHTML(g) {
  const R = CCS.run, last = R.i === R.q.length - 1;
  return `<section class="card cc-run"><div class="blk-h"><h3>${LR(`Пункт ${R.i + 1} из ${R.q.length}`, `Item ${R.i + 1} of ${R.q.length}`)}</h3><ol class="cre-steps">${R.q.map((_, k) => `<li class="${k < R.i ? 'past' : k === R.i ? 'now' : ''}">${k < R.i ? ic('check') : ''}</li>`).join('')}</ol></div>
    <p class="cc-run-q">${L2(g.items[R.q[R.i]])}</p>
    <div class="cc-who"><span class="muted small">${LR('Кто участвует:', 'Taking part:')}</span>${CREWDATA.crew.map(p => `<button type="button" class="cc-who-b ${R.who.includes(p.id) ? 'on' : ''}" data-id="${p.id}" aria-pressed="${R.who.includes(p.id)}">${ccAv(p)}<span data-raw>${p.first || p.name}</span></button>`).join('')}</div>
    <div class="cre-nav"><button type="button" class="av-btn" id="cc-cancel">${LR('Отменить', 'Cancel')}</button><span class="hc-spacer"></span><button type="button" class="av-btn" id="cc-prev" ${R.i ? '' : 'disabled'}>${ic('arrow-left')}${LR('Назад', 'Back')}</button>
      <button type="button" class="av-pri" id="cc-next" ${R.who.length ? '' : 'disabled'}>${last ? LR('Завершить сессию', 'Finish session') : LR('Следующий', 'Next')}${ic('arrow-right')}</button></div></section>`;
}
function ccRunBind(el, g, tab) {
  const R = CCS.run, re = () => { rCrewGroup(el, g, tab); localize(el); };
  el.querySelectorAll('.cc-who-b').forEach(b => b.addEventListener('click', () => { const j = R.who.indexOf(b.dataset.id); if (j < 0) R.who.push(b.dataset.id); else R.who.splice(j, 1); re(); }));
  el.querySelector('#cc-cancel').addEventListener('click', () => { CCS.run = null; re(); });
  el.querySelector('#cc-prev').addEventListener('click', () => { R.i--; re(); });
  el.querySelector('#cc-next').addEventListener('click', () => {
    if (R.i < R.q.length - 1) { R.i++; re(); return; }
    const l = ccLog(); l.push({ t: NOW, g: g.id, n: R.q.length, who: R.who.slice() }); ccSave(l); CCS.run = null; CCS.sel[g.id] = []; location.hash = '#crew-connection-' + g.id + '-results';
  });
}
function ccStatus() { const l = ccLog(), last = l[l.length - 1]; return last ? ['ok', LR(`Сессия: ${relTime(last.t)}`, `Session: ${relTime(last.t)}`)] : ['todo', LR('Сессий не было', 'No sessions yet')]; }

/* sub-pages of «Психология» (not in the sidebar): #creative, #crew-connection[-all|-<group>[-activity|-results]] */
function subRoute(h) {
  const tag = `<span class="ins-tag">${LR('Авторская методика', 'Authored method')}</span>`;
  if (h === 'creative') return { back: '#psychology', title: LR('Креативное задание', 'Creative Task'), tag, sub: LR('Исследование индивидуального восприятия через абстрактные сценарии.', 'Exploring individual perception through abstract scenarios.'), render: rCreative };
  if (h === 'crew-connection' || h === 'crew-connection-all') return { back: '#psychology', title: 'Crew Connection', raw: 1, tag, sub: LR('Командные активности для общения, взаимопонимания и поддержки экипажа.', 'Team activities for talking, understanding and supporting each other.'), render: el => rCrewConn(el, h.endsWith('-all') ? 'all' : '') };
  const m = /^crew-connection-([a-z]+)(?:-(activity|results))?$/.exec(h), g = m && CC.find(x => x.id === m[1]);
  if (g) return { back: '#crew-connection', title: `<span data-raw>Crew Connection</span><span class="crumb-sep">›</span><span data-raw>${g.name}</span>`, html: 1, tag, sub: L2(g.sub), render: el => rCrewGroup(el, g, m[2] || '') };
  return null;
}
