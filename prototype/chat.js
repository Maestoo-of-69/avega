/* ------------------------------------------------------------------ AVEGA chat: offline question-and-answer front end
   Retrieval and templates only. NOT a language model. Every medical sentence shown here is taken unchanged from the handbook KB,
   the table RECS (engine.js) or from the fixed texts of docs/CHAT_SPEC.md section 5; every action carries its source id or «без источника».
   Personal numbers come from assess() and engine(). Nothing is generated, nothing is guessed: no match -> the answer says so. */

/* ---- vocabulary (stems are word prefixes after ё->е; a multi-word stem is a run of consecutive words, each starting with
   the matching token; tokens of 1-2 letters must match a whole word) ---- */
const CH_COND = {
  sms: ['укачива', 'тошн', 'рвот', 'мутит', 'морск', 'головокруж', 'nause', 'vomit', 'motion sick', 'queasy', 'dizz'],
  sabp: ['спин', 'поясниц', 'back pain', 'backache', 'lower back', 'spine'],
  co2: ['голов бол', 'болит голов', 'головн', 'мигрен', 'co2', 'углекисл', 'душно', 'от головы', 'headache', 'head hurts', 'migraine', 'carbon dioxide', 'stuffy'],
  immune: ['сып', 'герпес', 'высыпан', 'иммун', 'аллерг', 'кож', 'rash', 'herpes', 'cold sore', 'immun', 'allerg', 'skin'],
  sleep: ['сон', 'сплю', 'спал', 'спать', 'бессонниц', 'не высып', 'недосып', 'засыпа', 'просыпа', 'sleep', 'insomnia', 'awake', 'tired in the morning'],
  bhv: ['тревог', 'тревож', 'подавлен', 'груст', 'одиноч', 'одинок', 'скуча', 'раздраж', 'депресс', 'паник', 'страшно', 'плохо на душе', 'тоск',
    'anxi', 'depress', 'lonely', 'sad', 'irritab', 'panic', 'homesick', 'low mood'],
  cardio: ['головокруж', 'кружится голов', 'давлен', 'dizz', 'lightheaded', 'blood pressure'],
  bone: ['кост', 'мышц', 'тренировк', 'упражнен', 'сила', 'bone', 'muscle', 'workout', 'exercise', 'strength'],
  rad: ['радиац', 'облучен', 'дозиметр', 'вспышк', 'radiat', 'dosimeter', 'solar flare'],
  /* v2 entries. A stem ending in $ must match a whole word (вес, жар, eva would otherwise match весь, жарко, evaluate) */
  dcs: ['декомпресс', 'кессон', 'после выхода', 'суставы после', 'decompress', 'the bends', 'after spacewalk', 'after eva$'],
  hypoxia: ['гипокс', 'кислород', 'нехватк воздух', 'hypox', 'oxygen', 'thin air'],
  food: ['еда', 'еды', 'питан', 'аппетит', 'не хочу есть', 'вес$', 'худе', 'голод', 'food', 'appetite', 'nutrition', 'weight', 'hungry', 'eating'],
  microbe: ['инфекц', 'температур', 'жар$', 'лихорад', 'микроб', 'заболел', 'простуд', 'infect', 'fever', 'temperature', 'microb', 'germ', 'caught a cold'],
  eva: ['выход в открыт', 'скафандр', 'внекорабел', 'spacewalk', 'eva$', 'spacesuit'],
  team: ['экипаж', 'команд', 'коллег', 'ссор', 'конфликт', 'не ладим', 'crew', 'team', 'crewmate', 'argument', 'conflict', 'get along'],
  loads: ['перегруз', 'приземлен', 'посадк', 'g load', 'landing', 'touchdown'],
};
const CH_IND = {
  hr: ['пульс', 'сердцебиен', 'чсс', 'heart rate', 'pulse', 'bpm'],
  stress: ['стресс', 'напряж', 'нерв', 'stress', 'tense', 'nervous'],
  mood: ['настроен', 'mood'],
  energy: ['энерг', 'устал', 'сил нет', 'вял', 'energy', 'fatigue', 'exhausted', 'tired'],
  cog: ['вниман', 'памят', 'концентрац', 'реакц', 'когнитив', 'туплю', 'ошибк', 'attention', 'memory', 'focus', 'concentrat', 'reaction', 'cognitive', 'mistakes'],
};
const CH_TOPICS = Object.entries(CH_COND).concat(Object.entries(CH_IND));
const CH_DRUG = ['таблет', 'лекарств', 'препарат', 'доз', 'принять', 'выпить', 'обезбол', 'снотворн', 'pill', 'medic', 'drug', 'dose', 'painkiller', 'ibuprofen', 'paracetamol', 'melatonin', 'sleeping pill'];
const CH_META = [
  ['week', ['прошла недел', 'за недел', 'неделя$', 'неделю$', 'последнее время', 'последн недел', 'динамик', 'тренд', 'week', 'lately', 'trend', 'recently']],
  ['status', ['как я', 'мое состояние', 'мои показатели', 'что со мной', 'все ли в порядке', 'how am i', 'my status', 'my data', 'am i ok']],
  ['links', ['связ', 'коррел', 'влияет', 'зависит', 'из-за чего', 'из за чего', 'correlat', 'linked', 'affects', 'depends']],
  ['doctor', ['врач', 'доктор', 'мерфи', 'земл', 'когда ответ', 'doctor', 'murphy', 'earth', 'surgeon']],
  ['about', ['кто ты', 'что ты умеешь', 'помощь', 'помоги', 'откуда ты знаешь', 'источник', 'who are you', 'what can you do', 'help', 'source']],
  ['hello', ['привет', 'здравств', 'добрый', 'спасибо', 'hello', 'hi', 'thanks', 'thank you']],
];
const CH_FOLLOW = ['что делать', 'что дальше', 'почему', 'подробнее', 'what to do', 'what next', 'why', 'more'];
const CH_RED = [
  { id: 'selfharm', stems: ['суицид', 'покончить с', 'убить себя', 'не хочу жить', 'причинить себе вред', 'навредить себе', 'suicid', 'kill myself', 'end my life', 'hurt myself', 'self harm', 'dont want to live'] },
  { id: 'chest', stems: ['боль в груд', 'болит в груд', 'давит в груд', 'перебои сердц', 'сердце останавл', 'chest pain', 'palpitation', 'heart skips'] },
  { id: 'faint', stems: ['обморок', 'потерял сознан', 'потеряла сознан', 'теряю сознан', 'fainted', 'passed out', 'lost consciousness'] },
  { id: 'vision', stems: ['зрен', 'вижу хуже', 'размыт', 'двоится', 'плохо вижу', 'vision', 'blurr', 'double vision', 'cant see'] },
  { id: 'confusion', stems: ['спутан', 'путаются мысли', 'не соображаю', 'confus', 'disoriented', 'cant think'] },
  { id: 'breath', stems: ['задыхаюсь', 'не могу дышать', 'трудно дышать', 'одышк', 'cant breathe', 'short of breath', 'breathless'] },
];
const CH_SUG = ['Как я сейчас?', 'Как прошла неделя?', 'Болит голова', 'Плохо сплю', 'Тревожно', 'От чего зависит мой сон?', 'Когда ответит врач?'];

/* personal factors per condition: only what the cited sources link to it (docs/REFERENCES.md S1, S4, S5, R10, P1, P2, R3) */
const CH_FACT = { co2: ['co2', 'sleep', 'stress'], immune: ['stress', 'sleep'], sleep: ['sleep', 'stress', 'cog'], bhv: ['mood', 'stress', 'sleep', 'energy'], sabp: ['sleep'], cardio: ['hr'], sms: [], bone: [], rad: [], sans: [], team: ['mood', 'stress'], hypoxia: ['sleep', 'cog'], dcs: [], food: [], microbe: [], eva: [], loads: [] };
const CH_SYMOF = { co2: 'headache', immune: 'skin' };
const CH_REFS = {
  R2: 'NASA HRP — radiation risk', R3: 'NASA HRP — behavioral conditions', R4: 'NASA HRP — bone changes', R5: 'NASA HRP — cardiovascular adaptations',
  R6: 'NASA HRP — sleep and schedules', R7: 'NASA HRP — fitness', R8: 'NASA — sensorimotor and vestibular function', R9: 'NASA — SANS', R10: 'NASA — immune system responses',
  S1: 'Kerstman et al. 2012 — space adaptation back pain', S2: 'Khalid et al. 2023 — space motion sickness review', S3: 'NASA NTRS 19830021722 — space motion sickness',
  S4: 'Law et al. 2014 — CO₂ and headaches on the ISS', S5: 'Rooney et al. 2019 — herpes virus reactivation', S6: 'Mehta et al. 2017 — virus reactivation on the ISS',
  P1: 'Barger et al. 2014 — sleep deficiency in astronauts', P2: 'Basner et al. 2013 — Mars 520-day simulation', P3: 'Cognition test battery (Basner et al.)',
  P4: 'Goessl et al. 2017 — HRV biofeedback meta-analysis', N6: 'NASA NTRS 20260002661 — behavioural health in isolation',
  R11: 'NASA HRP — decompression sickness', R12: 'NASA HRP — hypoxia', R13: 'NASA HRP — food and nutrition', R14: 'NASA HRP — host–microorganism interactions',
  R15: 'NASA HRP — spacewalk (EVA) injury', R16: 'NASA HRP — teamwork', R17: 'NASA HRP — dynamic loads',
  C1: 'NASA Science — Perseverance communications', C2: 'NASA NTRS — communication delays for Mars missions',
};

/* ---- matching ---- */
const CH_NORM = s => String(s).toLowerCase().replace(/ё/g, 'е').replace(/₂/g, '2').replace(/['’ʼ`]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
function chHas(toks, stem) {
  const st = stem.split(' '), n = st.length;
  for (let i = 0; i + n <= toks.length; i++) {
    let ok = true;
    for (let j = 0; j < n && ok; j++) { const w = toks[i + j], s = st[j]; ok = s.endsWith('$') ? w === s.slice(0, -1) : s.length <= 2 ? w === s : w.startsWith(s); }
    if (ok) return true;
  }
  return false;
}
let CH_LBL = null;
function chLabels() {      // a chip carries the name of a handbook entry: it must lead to that entry in either language
  if (!CH_LBL) { CH_LBL = {}; KB.forEach(c => { CH_LBL[CH_NORM(c.name)] = c.id; CH_LBL[CH_NORM(toEN(c.name))] = c.id; }); }
  return CH_LBL;
}

/* ---- small renderers ---- */
const chRefLabel = r => r === '—' ? 'без источника' : r;
const chDelay = () => 2 * CREWDATA.delay_min;
const chRows = (rows, cls) => `<ul class="reco-list ${cls || ''}">${rows.map(r => `<li class="${r === NODRUG ? 'nodrug' : ''}"><span class="reco-ic">${ic(cls === 'red' ? 'alert' : 'play')}</span><span class="reco-text">${r[0]}</span><span class="ref">${chRefLabel(r[1])}</span></li>`).join('')}</ul>`;
const chSources = ids => `<p class="chat-src"><span class="muted">Источники:</span> ${ids.map(id => `<span class="src-i"><span class="ref">${id}</span> <span class="ref-title" data-raw>${CH_REFS[id] || ''}</span></span>`).join(' ')}</p>`;
const chChips = list => `<div class="chat-sug in">${list.map(q => `<button type="button" class="chipb" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>`;
const chSentHTML = () => `<span class="chat-sent">Отправлено врачу. Ответ не раньше чем через <b>${chDelay()}</b> мин (демо).</span>`;
function chSendBtn(ctx, urgent) {
  const q = (ctx.texts || [])[ctx.i];
  if (q != null && msgsGet().some(m => m.from === VIEW && m.to === 'murphy' && m.text === q)) return chSentHTML();
  return `<button type="button" class="btn btn-ghost" data-act="send" data-i="${ctx.i}" ${urgent ? 'data-urgent="1"' : ''}>${ic('antenna')}${urgent ? 'Отправить врачу как срочное' : 'Отправить вопрос врачу'}</button>`;
}
const chDelayLine = () => `<p class="as-doc">${ic('clock')}<span>Ответ с Земли придёт не раньше чем через <b>${chDelay()}</b> мин (демо).</span></p>`;

/* ======================================================================== v3: weekly trend, strength of links, lever rule (docs/CHAT_SPEC_V3.md)
   Numbers come from trend() / impact() / psyLinks() (engine.js). Sentences with numbers are written in both languages with LR(ru, en).
   Wording is «связано / в дни после», never «вызывает»: a correlation is not a cause. */
const CH_WK = ['stress', 'mood', 'energy', 'sleep', 'cog', 'hr'];
const CH_NM = { stress: ['Стресс', 'Stress', 'стресс', 'stress'], mood: ['Настроение', 'Mood', 'настроение', 'mood'], energy: ['Энергия', 'Energy', 'энергия', 'energy'],
  sleep: ['Сон', 'Sleep', 'сон', 'sleep'], cog: ['Когнитивный балл', 'Cognitive score', 'когнитивный балл', 'cognitive score'], hr: ['Пульс', 'Heart rate', 'пульс', 'heart rate'] };
const chNm = (k, lower) => LR(CH_NM[k][lower ? 2 : 0], CH_NM[k][lower ? 3 : 1]);
const CH_CASE = { stress: ['со стресса', 'со стрессом', 'он связан'], mood: ['с настроения', 'с настроением', 'оно связано'], energy: ['с энергии', 'с энергией', 'она связана'],
  sleep: ['со сна', 'со сном', 'он связан'], cog: ['с когнитивного балла', 'с когнитивным баллом', 'он связан'], hr: ['с пульса', 'с пульсом', 'он связан'] };
const CH_WORSE_W = { stress: ['выше', 'above'], mood: ['ниже', 'below'], energy: ['ниже', 'below'], sleep: ['короче', 'shorter than'], cog: ['ниже', 'below'], hr: ['выше', 'above'] };
const CH_UNIT = { stress: ['/ 10', '/ 10'], mood: ['/ 10', '/ 10'], energy: ['/ 10', '/ 10'], sleep: ['ч', 'h'], cog: ['балл.', 'pts'], hr: ['уд/мин', 'bpm'] };
const chDays = n => lang === 'en' ? (n === 1 ? 'day' : 'days') : (n % 10 === 1 && n % 100 !== 11 ? 'день' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'дня' : 'дней');

function chTrParts(k) {       // the weekly sentence of one indicator, as parts: name · verdict · numbers · extra
  const t = trend(k), u = LR(CH_UNIT[k][0], CH_UNIT[k][1]), name = chNm(k);
  if (t.status === 'nodata') return { k, t, name, verdict: LR('нет данных за 7 дней', 'no data for 7 days'), nums: '', extra: '', cls: 'na' };
  const nums = `${fmt(t.m7, 1)} ${LR('против', 'vs')} ${fmt(t.base.m, 1)} ${u}`;
  if (t.status === 'worse') {
    const w = CH_WORSE_W[k];
    return { k, t, name, verdict: LR(`${w[0]} вашей нормы`, `${w[1]} your norm`), nums: `${nums} (${sgn(t.z7, 1)} SD)`, cls: 'warn',
      extra: t.run > 0 ? LR(`хуже обычного с дня ${mDay(t.since)} (${t.run} ${chDays(t.run)} подряд)`, `worse than usual since day ${mDay(t.since)} (${t.run} ${chDays(t.run)} in a row)`) : '' };
  }
  if (t.status === 'better') return { k, t, name, verdict: LR('лучше вашей нормы', 'better than your norm'), nums: `${nums} (${sgn(t.z7, 1)} SD)`, extra: '', cls: 'ok' };
  return { k, t, name, verdict: LR('в пределах вашей нормы', 'within your norm'), nums, cls: 'norm',
    extra: t.dir ? LR(', но хуже, чем неделей раньше', ', but worse than the week before') : '' };
}
const chTrPlain = k => { const p = chTrParts(k); return `${p.name} — ${p.verdict}${p.nums ? ': ' + p.nums : ''}${p.extra ? (p.t.status === 'worse' ? ' · ' : '') + p.extra : ''}`; };
function chTrRow(k) {
  const p = chTrParts(k), t = p.t;
  return `<li class="tr-row ${p.cls}" data-k="${k}" data-status="${t.status}" data-dir="${t.dir || ''}" data-m7="${t.m7 == null ? '' : t.m7}" data-bm="${t.base ? t.base.m : ''}" data-bsd="${t.base ? t.base.sd : ''}" data-z="${t.z7 == null ? '' : t.z7}" data-run="${t.run}" data-since="${t.since == null ? '' : mDay(t.since)}">`
    + `<b>${p.name}</b> <span>— ${p.verdict}${p.nums ? ':' : ''}</span>${p.nums ? ` <span class="rv">${p.nums}</span>` : ''}${p.extra ? (t.status === 'worse' ? ' <span>· ' : '<span>') + p.extra + '</span>' : ''}</li>`;
}
const chTrRank = k => { const t = trend(k); return t.status === 'worse' ? 0 : t.dir ? 1 : t.status === 'norm' ? 2 : t.status === 'better' ? 3 : 4; };
const chTrList = ks => `<ul class="find-list tr-list">${ks.slice().sort((a, b) => chTrRank(a) - chTrRank(b)).map(chTrRow).join('')}</ul>`;
const chHot = k => { const t = trend(k); return t.status === 'worse' || t.dir === 'rising-bad'; };

function chLead(a, lag) {      // «bad days» of a, in words
  if (a === 'sleep') return LR('В дни после короткого сна', 'On days after short sleep');
  if (a === 'co2') return LR('В дни с высоким CO₂', 'On days with high CO₂');
  const w = { stress: ['высоким стрессом', 'high stress'], mood: ['низким настроением', 'low mood'], energy: ['низкой энергией', 'low energy'], cog: ['низким когнитивным баллом', 'a low cognitive score'] }[a];
  return lag ? LR(`После дней с ${w[0]}`, `After days with ${w[1]}`) : LR(`В дни с ${w[0]}`, `On days with ${w[1]}`);
}
function chEffect(l) {
  const neg = l.diff < 0, ad = Math.abs(l.diff), vs = LR('против', 'vs'), mm = (dec, u) => `${fmt(l.mBad, dec)} ${vs} ${fmt(l.mOk, dec)} ${u}`;
  const cmp = (lo, hi) => neg ? lo : hi;
  switch (l.b) {
    case 'sleep': return LR(`вы спите в среднем на ${fmt(ad, 1)} ч ${cmp('меньше', 'больше')}: ${mm(1, 'ч')}`, `you sleep ${fmt(ad, 1)} h ${cmp('less', 'more')} on average: ${mm(1, 'h')}`);
    case 'hr': return LR(`пульс в среднем на ${fmt(ad, 1)} уд/мин ${cmp('ниже', 'выше')}: ${mm(1, 'уд/мин')}`, `heart rate is ${fmt(ad, 1)} bpm ${cmp('lower', 'higher')} on average: ${mm(1, 'bpm')}`);
    case 'cog': return LR(`когнитивный балл в среднем на ${fmt(ad, 1)} балл. ${cmp('ниже', 'выше')}: ${mm(1, 'балл.')}`, `the cognitive score is ${fmt(ad, 1)} pts ${cmp('lower', 'higher')} on average: ${mm(1, 'pts')}`);
    case 'stress': return LR(`стресс в среднем на ${fmt(ad, 1)} ${cmp('ниже', 'выше')}: ${mm(1, '/ 10')}`, `stress is ${fmt(ad, 1)} ${cmp('lower', 'higher')} on average: ${mm(1, '/ 10')}`);
    case 'mood': return LR(`настроение в среднем на ${fmt(ad, 1)} ${cmp('ниже', 'выше')}: ${mm(1, '/ 10')}`, `mood is ${fmt(ad, 1)} ${cmp('lower', 'higher')} on average: ${mm(1, '/ 10')}`);
    case 'energy': return LR(`энергия в среднем на ${fmt(ad, 1)} ${cmp('ниже', 'выше')}: ${mm(1, '/ 10')}`, `energy is ${fmt(ad, 1)} ${cmp('lower', 'higher')} on average: ${mm(1, '/ 10')}`);
    default: {         // symptoms: share of days with the symptom
      const noun = l.b === 'skin' ? LR('сыпь', 'rash') : LR('головная боль', 'headache'), p = v => fmt(100 * v, 0) + LR(' %', '%'), ratio = l.mOk > 0 ? l.mBad / l.mOk : null, rr = ratio == null ? null : Math.round(ratio * 10) / 10;
      const times = !neg && rr != null && rr >= 1.5 ? (Number.isInteger(rr) ? rr : fmt(rr, 1)) : null;
      const ruTimes = times == null ? '' : `в ${times} ${Number.isInteger(rr) && rr >= 5 ? 'раз' : 'раза'} `;
      return LR(`${noun} отмечалась ${ruTimes}${neg ? 'реже' : 'чаще'}: ${p(l.mBad)} против ${p(l.mOk)} дней`, `${noun} was logged ${times == null ? (neg ? 'less' : 'more') + ' often' : times + ' times as often'}: ${p(l.mBad)} vs ${p(l.mOk)} of days`);
    }
  }
}
function chLinkRow(l) {
  const text = `${chLead(l.a, l.lag)} ${chEffect(l)} (${l.nBad} ${LR('и', 'and')} ${l.nOk} ${chDays(l.nOk)}, r = ${sgn(l.r, 2)})`;
  return `<li class="pl-row" data-a="${l.a}" data-b="${l.b}" data-lag="${l.lag}" data-nbad="${l.nBad}" data-nok="${l.nOk}" data-mbad="${l.mBad}" data-mok="${l.mOk}" data-diff="${l.diff}" data-r="${l.r}" data-dir="${l.dirType}">${text}</li>`;
}
const CH_LEVER_RECS = 2;
const chBz = k => BAD[k] * (trend(k).z7 || 0);       // how far the week is on the unfavourable side, in SD of the baseline
function chLever(ks) {         // lever: a noticeable worsening link a -> b where BOTH are hot (worse, or getting worse inside the norm); the most deviating a first, then the largest |r|.
  // No such link but some indicator of ks is hot: no «start with», a focus line on the most deviating hot indicator instead. Nothing hot: nothing.
  const L = psyLinks().filter(l => l.dirType !== 'control' && l.a !== l.b && chHot(l.a) && ks.includes(l.b) && chHot(l.b)).sort((x, y) => chBz(y.a) - chBz(x.a) || Math.abs(y.r) - Math.abs(x.r));
  if (L.length) return { lev: L[0], focus: null };
  const hot = ks.filter(chHot).sort((x, y) => chBz(y) - chBz(x));
  return { lev: null, focus: hot.length ? hot[0] : null };
}
const chLeverLine = l => LR(`Начните ${CH_CASE[l.a][0]}: у вас ${CH_CASE[l.a][2]} ${CH_CASE[l.b][1]}`, `Start with ${chNm(l.a, true)}: in your data it is linked to ${chNm(l.b, true)}`);
function chFocusLine(k) {
  const t = trend(k), n = chNm(k, true);
  return t.run > 0 ? LR(`Главное сейчас — ${n}: он хуже обычного ${t.run} ${chDays(t.run)} подряд`.replace(/ он | она | оно /, k === 'mood' ? ' оно ' : k === 'energy' ? ' она ' : ' он '), `The main thing now is ${n}: worse than usual for ${t.run} ${chDays(t.run)} in a row`)
    : LR(`Главное сейчас — ${n}: за 7 дней он хуже, чем неделей раньше`.replace(' он ', k === 'mood' ? ' оно ' : k === 'energy' ? ' она ' : ' он '), `The main thing now is ${n}: worse over 7 days than the week before`);
}
const chLeverRows = X => X.lev ? RECS[X.lev.a].slice(0, CH_LEVER_RECS) : X.focus ? RECS[X.focus] : [];
const chLeverHTML = X => X.lev ? `<p class="chat-p chat-lever">${chLeverLine(X.lev)}</p>` : X.focus ? `<p class="chat-p chat-lever">${chFocusLine(X.focus)}</p>` : '';
const chUniq = rows => { const s = new Set(); return rows.filter(r => !s.has(r[0]) && s.add(r[0])); };
function chActions(ks) {      // lever or focus first, then the recommendations of the worse indicators (most deviating first, one row of each in turn so none is cut off by the limit of 5)
  const X = chLever(ks), worse = ks.filter(k => trend(k).status === 'worse').sort((x, y) => chBz(y) - chBz(x)), mix = [];
  for (let i = 0; worse.some(k => i < RECS[k].length); i++) worse.forEach(k => { if (RECS[k][i]) mix.push(RECS[k][i]); });
  return { X, rows: chUniq(chLeverRows(X).concat(mix)).slice(0, 5) };
}
const chLinkOrder = L => { const sc = l => (chHot(l.a) && chHot(l.b) ? 0 : chHot(l.a) ? 1 : 2); return L.map((l, i) => [l, i]).sort((x, y) => sc(x[0]) - sc(y[0]) || x[1] - y[1]).map(x => x[0]); };
const chRefIds = rows => [...new Set(rows.map(r => r[1]).filter(r => r && r !== '—'))];
const chStatusWeek = () => { const l = chWeekLine(); return (l ? `<p class="chat-p">${l}</p>` : '') + chChips(['Как прошла неделя?']); };
const chWeekLine = () => {
  const bad = CH_WK.filter(k => trend(k).status === 'worse'), nd = CH_WK.filter(k => trend(k).status === 'nodata');
  return bad.length ? LR(`За последние 7 дней хуже вашей нормы: ${bad.map(k => chNm(k, true)).join(', ')}.`, `Over the last 7 days worse than your norm: ${bad.map(k => chNm(k, true)).join(', ')}.`)
    : nd.length === CH_WK.length ? '' : LR('За последние 7 дней ни один показатель не хуже вашей нормы.', 'Over the last 7 days no indicator is worse than your norm.');
};
function chWeekSummary() {        // plain text for the doctor, in the language of the sender's screen; the key makes the «sent» state survive replay
  const bad = CH_WK.filter(k => trend(k).status === 'worse').sort((x, y) => chBz(y) - chBz(x));
  return { text: [tr('Недельная сводка')].concat(bad.map(chTrPlain)).concat([tr('Данные в прототипе синтетические.')]).join('\n'), key: 'week:' + dayFloor(NOW) };
}
const chWeekBtn = () => msgsGet().some(m => m.from === VIEW && m.to === 'murphy' && m.key === chWeekSummary().key) ? chSentHTML()
  : `<button type="button" class="btn btn-ghost" data-act="sendwk">${ic('antenna')}Отправить недельную сводку врачу</button>`;
function chWeek(ctx) {
  const pick = chLinkOrder(psyLinks().filter(l => l.dirType !== 'control')).slice(0, 4);
  let h = `<h4 class="as-h">За последние 7 дней</h4>${chTrList(CH_WK)}<h4 class="as-h">Как это связано у вас</h4>`;
  h += pick.length ? `<ul class="find-list pl-list">${pick.map(chLinkRow).join('')}</ul>` : '<p class="chat-p">Заметных связей пока нет.</p>';
  const A = chActions(CH_WK);
  h += '<h4 class="as-h">Что стоит сделать</h4>';
  if (A.rows.length) h += chLeverHTML(A.X) + chRows(A.rows);
  else h += '<p class="chat-p">Показатели в пределах вашей нормы. Продолжайте текущий режим.</p>';
  h += '<p class="chart-note">Данные в прототипе синтетические. Корреляция не доказывает причинность: связь показывает, что показатели меняются вместе, а не что одно вызывает другое. «Хуже обычного» — день хуже вашей нормы больше чем на 0,5 SD; пороги демонстрационные, не клинические.</p>';
  const ids = chRefIds(A.rows); if (ids.length) h += chSources(ids);
  if (CH_WK.some(k => { const t = trend(k); return t.status === 'worse' && t.run >= 3; })) h += `<div class="chat-acts">${chWeekBtn()}</div>`;
  return h;
}

/* ---- condition answer (5.2) ---- */
function chFactor(k, c) {
  const A = assess(), E = engine();
  let h;
  if (k === 'co2') h = `<b>${elab('co2')}</b> ` + (A.co2 == null ? '<span class="rv">нет данных</span>' : `<span class="rv">${fmt(A.co2, 1)} мм рт. ст.</span> <span>сегодня</span>`);
  else {
    const [v, z, dec, unit] = A.cur[k];
    h = `<b>${elab(k)}</b> ` + (v == null ? '<span class="rv">нет данных</span>'
      : `<span class="rv">${fmt(v, dec)} ${unit}${z != null && Math.abs(z) > 1 ? ` · ${sgn(z, 1)} SD` : ''}</span> ` + (z == null ? '' : `<span>${Math.abs(z) > 1 ? 'к вашей норме' : trend(k).status === 'worse' ? LR('последний чек-ин в пределах вашей нормы', 'the latest check-in is within your norm') : 'в пределах вашей нормы'}</span>`));
  }
  if (k !== 'co2') {         // the week is judged by 1 SD («norm»), the run by 0.5 SD («usual»): say both, so a calm last value and a worse week do not contradict
    const t = trend(k);
    if (t.status === 'worse') { const w = CH_WORSE_W[k]; h += ` <span class="tr-note">${LR(`· среднее за 7 дней ${w[0]} нормы`, `· the 7-day mean is ${w[1]} the norm`)}${t.run > 0 ? LR(`, хуже обычного с дня ${mDay(t.since)} (${t.run} ${chDays(t.run)})`, `, worse than usual since day ${mDay(t.since)} (${t.run} ${chDays(t.run)})`) : ''}</span>`; }
  }
  const sk = CH_SYMOF[c.id], cc = sk && E.get(sk, k);
  if (cc && cc.r != null && Math.abs(cc.r) >= 0.3) h += `<div class="chat-link"><span>По вашим данным этот симптом и показатель связаны:</span> <span class="rv">r = ${sgn(cc.r, 2)}</span></div>`;
  return `<li>${h}</li>`;
}
function chCond(c, ctx, o) {
  o = o || {};
  const f = CH_FACT[c.id] || [], mine = c.sym.length ? c.sym[0] : null;
  const ids = c.refs.split(',').map(s => s.trim());
  let h = `<div class="chat-h"><b>${c.name}</b><span class="ref">${c.refs}</span></div>
    <h4 class="as-h">Что известно</h4><p class="chat-p"><span>${c.when}</span> <span>${c.signs}</span></p>
    <h4 class="as-h">Что видно в ваших данных</h4>`;
  h += f.length ? `<ul class="find-list">${f.map(k => chFactor(k, c)).join('')}</ul>` : '<p class="chat-p">Для этого состояния в приложении нет связанных показателей.</p>';
  h += `<p class="chart-note">Данные в прототипе синтетические; связь показывает работу метода, а не медицинский вывод.</p>
    <h4 class="as-h">Что можно сделать сейчас</h4>${chRows(c.now)}
    <p class="as-doc">${ic('alert')}<span><b>Сообщите врачу, если:</b> ${c.doc}</span></p>${chSources(ids)}`;
  const acts = [];
  if (mine && !o.noTick) acts.push(symGet().includes(mine) ? '<span class="chat-sent">Отмечено в журнале симптомов.</span>' : `<button type="button" class="btn btn-ghost" data-act="tick" data-sym="${mine}">${ic('check')}Отметить в журнале симптомов</button>`);
  if (!o.noSend) acts.push(chSendBtn(ctx));
  return h + (acts.length ? `<div class="chat-acts">${acts.join('')}</div>` : '');
}

/* ---- indicator answer (5.5) ---- */
function chInd(k) {
  const A = assess(), E = engine(), [v, z, dec, unit] = A.cur[k];
  const nr = k === 'hr' ? normFor('hr', 'hod', dt(NOW).getUTCHours()) : normFor(k, 'event'), d1 = Math.max(dec, 1);
  const bad = z != null && z * BAD[k] > 1;
  let verdict = '';
  if (z != null) verdict = bad ? FIND[k] : Math.abs(z) <= 1 ? 'в пределах вашей нормы' : k === 'hr' ? 'ниже вашей нормы для этого часа' : 'лучше вашей нормы';
  let h = '<ul class="find-list"><li>' + (v == null ? '<span class="rv">нет данных</span>'
    : `<b>${elab(k)}</b> <span class="rv">${fmt(v, dec)} ${unit}</span>` + (nr ? ` <span>Ваша личная норма:</span> <span class="rv">${fmt(nr.m, d1)} ± ${fmt(nr.sd, d1)} ${unit}</span>` : '')
      + (z != null ? ` <span class="rv">${sgn(z, 1)} SD</span> <b>${verdict}</b>` : '')) + '</li>' + chTrRow(k) + '</ul>';        // v3: the weekly sentence under the current value
  h += '<h4 class="as-h">По вашим данным</h4>';
  if (k === 'hr') h += '<p class="chat-p">Для пульса связи по дням не считаются.</p>';
  else {
    const L = [];
    EKEYS.forEach(o => {
      if (o === k) return;
      [[k, o], [o, k]].forEach(([a, b]) => {
        if (a === 'hr') return;
        const c = E.getLag(a, b); if (!c || c.r == null || Math.abs(c.r) < 0.3) return;
        if (BAD[a] * c.r * BAD[b] > 0) L.push({ a, b, r: c.r });      // same rule as assess(): a worse day of a is followed by a worse day of b
      });
    });
    h += L.length ? `<ul class="find-list">${L.map(l => { const im = impact(l.a, l.b, 1);       // v3: effect size where it can be computed, the old r-only row otherwise
      return im && impWorse(im) ? chLinkRow(im) : `<li><b>${elab(l.a)}</b> → на следующий день хуже показатель <b>${elab(l.b)}</b> <span class="rv">r = ${sgn(l.r, 2)}</span></li>`; }).join('')}</ul>` : '';
    if (!L.length) h = h.replace('<h4 class="as-h">По вашим данным</h4>', '');
  }
  h += '<h4 class="as-h">Что можно сделать сейчас</h4>' + (bad || trend(k).status === 'worse' ? chRows(RECS[k]) : '<p class="chat-p">Особых действий не требуется.</p>');
  return h;
}
function chLinks() {
  const P = psyLinks(), grp = t => P.filter(l => l.dirType === t), seen = new Set(P.map(l => [l.a, l.b].sort().join('|')));
  const list = rows => `<ul class="find-list pl-list">${rows.map(chLinkRow).join('')}</ul>`;
  const top = engine().same.filter(c => c.r != null && Math.abs(c.r) >= 0.3 && !seen.has([c.a, c.b].sort().join('|'))).sort((x, y) => Math.abs(y.r) - Math.abs(x.r)).slice(0, 5);
  let h = '<h4 class="as-h">По вашим данным</h4>';
  if (grp('psy→health').length) h += '<h4 class="as-h">Психология → здоровье</h4>' + list(grp('psy→health'));
  if (grp('health→psy').length) h += '<h4 class="as-h">Здоровье → психология</h4>' + list(grp('health→psy'));
  if (grp('control').length) h += '<h4 class="as-h">Контрольная связь (не психология)</h4>' + list(grp('control'));
  if (top.length) h += '<h4 class="as-h">Другие связи</h4>' + `<ul class="find-list">${top.map(c => `<li><b>${elab(c.a)}</b> и <b>${elab(c.b)}</b>: ${c.r > 0 ? 'обычно меняются в одну сторону' : 'обычно меняются в разные стороны'} <span class="rv">r = ${sgn(c.r, 2)}</span></li>`).join('')}</ul>`;
  if (!P.length && !top.length) h += '<p class="chat-p">Заметных связей пока нет.</p>';
  return h + '<p class="chart-note">Связи считаются отдельно для каждого члена экипажа: у разных людей они разные. Корреляция не доказывает причинность. «Хуже обычного» — день хуже вашей нормы больше чем на 0,5 SD; данные синтетические, пороги демонстрационные.</p>';
}
function chAbout() {
  const ids = new Set(); const add = r => { if (r && r !== '—') ids.add(r); };
  KB.forEach(c => { c.refs.split(',').forEach(s => add(s.trim())); c.now.forEach(r => add(r[1])); });
  Object.values(RECS).forEach(l => l.forEach(r => add(r[1])));
  return `<p class="chat-p">Я — бортовой помощник AVEGA. Я работаю без связи с Землёй и отвечаю только по бортовому справочнику и вашим личным данным. У каждого совета указан номер источника; если источника нет, я это пишу. Я не языковая модель: я не сочиняю ответы, не ставлю диагноз и не назначаю лекарства. Если ответа в базе нет, я так и скажу и предложу отправить вопрос врачу.</p>
    <ul class="find-list"><li>Записей в справочнике: <b>${KB.length}</b></li><li>Различных источников: <b>${ids.size}</b></li></ul>`;
}
function chDoctor(ctx) {
  const n = CREWDATA.delay_min;
  return `<p class="chat-p">Врач на Земле — <b>${CREWDATA.doctor.name}</b>. Сообщение идёт <b>${n}</b> мин в одну сторону (демо; реальный диапазон Земля–Марс 3–22 мин), ответ придёт не раньше чем через <b>${2 * n}</b> мин. Пока ответа нет, я подскажу, что можно сделать по бортовому справочнику.</p>${chSources(['C1', 'C2'])}<div class="chat-acts">${chSendBtn(ctx)}</div>`;
}
const chDrugHTML = ctx => `<div class="chat-red"><ul class="reco-list red"><li class="nodrug"><span class="reco-ic">${ic('alert')}</span><span class="reco-text">Я не подсказываю лекарства и дозы. Лекарства — только по бортовому медицинскому протоколу и указанию врача.</span><span class="ref">без источника</span></li></ul></div>
  <p class="chat-p">Напишите, что именно беспокоит: я покажу, что можно сделать без лекарств.</p><div class="chat-acts">${chSendBtn(ctx)}</div>`;
const chFallback = ctx => `<p class="chat-p">В моей базе нет ответа на этот вопрос, а выдумывать я не буду.</p><p class="chat-p">Я знаю:</p>${chChips(KB.map(c => c.name).concat(EKEYS.map(elab)))}<div class="chat-acts">${chSendBtn(ctx)}</div>`;

/* ---- red flags (5.1) ---- */
const CH_RED_TXT = {
  selfharm: [['Сообщите об этом командиру или члену экипажа, отвечающему за медицину, прямо сейчас и не оставайтесь в одиночестве.', '—'], ['Отправьте сообщение врачу с пометкой "срочно".', 'R3'], ['Я — справочная программа и не могу заменить человека в такой ситуации.', '—']],
  chest: [['Боль в груди, перебои сердца и обморок — повод сообщить врачу сразу (справочник, раздел "Сердце, сосуды и посадка").', 'R5'], ['Прекратите нагрузку и сообщите члену экипажа, отвечающему за медицину.', '—']],
  breath: [['В моей базе нет раздела о затруднённом дыхании. Сообщите члену экипажа, отвечающему за медицину, и врачу прямо сейчас.', '—']],
};
function chRed(flags, ctx) {
  const seen = new Set(); let h = '';
  flags.forEach(f => {
    const key = f.id === 'faint' ? 'chest' : f.id; if (seen.has(key)) return; seen.add(key);
    if (key === 'confusion') h += `<div class="chat-red">${chRows([['Спутанность сознания — повод сообщить врачу сразу.', 'R12']], 'red')}</div>` + chCond(KB.find(c => c.id === 'hypoxia'), ctx, { noSend: true });
    else if (key === 'vision') h += `<div class="chat-red">${chRows([['Любое изменение зрения — повод сообщить врачу сразу.', 'R9']], 'red')}</div>` + chCond(KB.find(c => c.id === 'sans'), ctx, { noSend: true });
    else h += `<div class="chat-red">${chRows(CH_RED_TXT[key], 'red')}</div>`;
  });
  return h + `<div class="chat-acts">${chSendBtn(ctx, true)}</div>` + chDelayLine();
}

const chNod = () => `<ul class="reco-list"><li class="nodrug"><span class="reco-ic">${ic('play')}</span><span class="reco-text">${NODRUG[0]}</span><span class="ref">${chRefLabel(NODRUG[1])}</span></li></ul>`;
const chWithDrug = (h, drug) => drug && !h.includes('class="nodrug"') ? h + chNod() : h;
const chTopicHTML = (ids, ctx, o) => ids.map(id => { const c = KB.find(q => q.id === id); return `<div class="chat-part">${c ? chCond(c, ctx, o) : chInd(id)}</div>`; }).join('');
const CH_VAGUE = ['плохо', 'нехорошо', 'болит', 'боль$', 'больно$', 'что то не так', 'заболел', 'заболела', 'плохо себя чувств', 'не по себе',
  'feel bad', 'unwell', 'sick', 'pain$', 'hurts', 'something is wrong', 'not feeling well'];

/* ---- the pipeline (spec section 3) ---- */
function chatReply(text, ctx) {
  ctx = ctx || {};
  const toks = CH_NORM(text).split(' ').filter(Boolean), has = s => chHas(toks, s);
  const flags = CH_RED.filter(r => r.stems.some(has));
  if (flags.length) return { intent: flags.map(f => 'red-' + f.id).join('+'), html: chRed(flags, ctx), last: ctx.last, urgent: true };
  const drug = CH_DRUG.some(has), withDrug = h => chWithDrug(h, drug);
  const label = chLabels()[CH_NORM(text)];
  let tops = label ? [label] : CH_TOPICS.map(([id, st]) => [id, st.filter(has).length]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 2).map(x => x[0]);
  const topicHTML = ids => chTopicHTML(ids, ctx);
  if (tops.length) return { intent: tops.join('+'), html: withDrug(topicHTML(tops)), last: tops[0], tops, drug };
  if (!drug && CH_VAGUE.some(has)) return { intent: 'q0', vague: true, html: '', last: ctx.last };       // v2: vague opening -> question Q0
  const meta = CH_META.find(m => m[1].some(has));
  if (meta) {
    const id = meta[0];
    const h = id === 'week' ? chWeek(ctx) : id === 'status' ? assistantHTML(true) + chStatusWeek() : id === 'links' ? chLinks() : id === 'doctor' ? chDoctor(ctx) : id === 'about' ? chAbout()
      : `<p class="chat-p">Я на связи. Спросите о самочувствии или о состоянии из справочника.</p>${chChips(CH_SUG)}`;
    return { intent: id, html: withDrug(h), last: ctx.last };
  }
  if (ctx.last && CH_FOLLOW.some(has)) return { intent: ctx.last, html: withDrug(topicHTML([ctx.last])), last: ctx.last };
  if (drug) return { intent: 'drug', html: chDrugHTML(ctx), last: ctx.last };
  return { intent: 'none', html: chFallback(ctx), last: ctx.last };
}

/* ======================================================================== v2: interview
   The interview asks one plain question at a time. Every question is a restatement of an entry's "tell the doctor if" text (KB.doc);
   the level comes from the rules in docs/CHAT_SPEC_V2.md B.4, not from any medical judgement made here. The state is never stored:
   it is recomputed by replaying the stored entries, so a reload or a language switch gives the same dialogue. */
const CH_Q0 = [['Голова', 'co2'], ['Глаза или зрение', 'red:vision'], ['Тошнота, укачивание', 'sms'], ['Головокружение', 'cardio'], ['Спина', 'sabp'], ['Кожа, сыпь', 'immune'], ['Сон', 'sleep'],
  ['Настроение, тревога', 'bhv'], ['Отношения в экипаже', 'team'], ['Сердце или грудь', 'red:chest'], ['Дыхание', 'red:breath'], ['Аппетит, еда', 'food'], ['Температура, простуда', 'microbe'], ['Другое', 'none']];
const CH_BTN = {
  sev: [['s1', 'Слабо: работать не мешает'], ['s2', 'Средне: мешает, но работать могу'], ['s3', 'Сильно: не могу работать или спать']],
  dur: [['d0', 'Сегодня'], ['d1', '2–3 дня'], ['d2', 'Больше трёх дней'], ['d3', 'Больше недели']],
  flag: [['y', 'Да'], ['n', 'Нет'], ['u', 'Не знаю']],
};
const CH_QTXT = { sev: 'Насколько сильно это мешает?', dur: 'Как давно это началось?' };
const CH_DUR = ['сегодня', '2–3 дня', 'больше трёх дней', 'больше недели'];
const CH_ANS = { y: 'Да', n: 'Нет', u: 'Не знаю' };
const CH_TYPED = { y: ['да', 'yes'], n: ['нет', 'no'], u: ['не знаю', 'dont know'], s1: ['слабо', 'mild'], s2: ['средне', 'moderate'], s3: ['сильно', 'severe'] };
const CH_LEVEL = { urgent: ['Срочно', 'Сообщите врачу и члену экипажа, отвечающему за медицину, сейчас', 'bad'], tell: ['Сообщить врачу', 'Отправьте сводку врачу в ближайший сеанс связи', 'warn'],
  watch: ['Наблюдать', 'Можно начать с мер из справочника и наблюдать', 'ok'] };
/* ASK: q1 = severity question, q2 = duration question, dur = duration answer (0-3) from which the duration itself counts as a «tell the doctor» flag,
   f = flags [mark, question]: U urgent, T tell the doctor. Each flag restates the entry's `doc` text. data = flags filled from the person's own data,
   ind = indicators of the person's weekly data that belong to the entry (v3, docs/CHAT_SPEC_V3.md B3). */
const CH_ASK = {
  sms: { q1: 1, q2: 1, dur: 2, f: [['T', 'Рвота повторяется?'], ['T', 'Не удаётся пить?']] },
  sabp: { q1: 1, q2: 1, f: [['T', 'Боль мешает сну или работе?'], ['T', 'Боль отдаёт в ногу?'], ['T', 'Есть онемение?']] },
  co2: { q1: 1, q2: 1, dur: 1, f: [['T', 'Боль необычная, не похожа на прежние?'], ['U', 'Есть нарушение зрения?']], ind: ['sleep', 'stress'] },
  immune: { q1: 1, q2: 1, f: [['T', 'Сыпь болезненная и идёт полосой?'], ['T', 'Есть температура?'], ['T', 'Высыпания около глаза?']], ind: ['stress', 'sleep'] },
  sleep: { q2: 1, f: [], data: 1, ind: ['sleep', 'stress'] },
  bhv: { q1: 1, q2: 1, dur: 3, f: [['U', 'Были ли мысли причинить себе вред?']], ind: ['stress', 'mood'] },
  cardio: { q1: 1, q2: 1, f: [['U', 'Была боль в груди?'], ['U', 'Были перебои сердца?'], ['U', 'Был обморок?']], ind: ['hr', 'stress'] },
  bone: { q1: 1, f: [['T', 'Есть травма или боль при нагрузке?'], ['T', 'Не получается выполнять план тренировок?']] },
  dcs: { f: [['U', 'Вы недавно выходили в открытый космос или сейчас в скафандре?']] },
  hypoxia: { q1: 1, f: [['U', 'Есть спутанность мыслей?'], ['U', 'Ухудшилось зрение?']] },
  food: { q2: 1, f: [['T', 'Вы едите заметно меньше несколько дней?'], ['T', 'Вы теряете вес?']], ind: ['energy'] },
  microbe: { q1: 1, q2: 1, f: [['T', 'Есть температура?']] },
  eva: { q1: 1, f: [['T', 'Есть травма или боль после выхода?']] },
  team: { q2: 1, dur: 3, f: [['T', 'Конфликт мешает совместной работе?']], ind: ['stress', 'mood'] },
};
function chNew(id, extra, drug, src, intent) {
  const a = CH_ASK[id], steps = [];
  if (a.q1) steps.push({ k: 'sev' }); if (a.q2) steps.push({ k: 'dur' });
  a.f.forEach(f => steps.push({ k: 'flag', u: f[0] === 'U', q: f[1] }));
  return { id, extra, drug, src, intent, steps, ans: [] };
}
const chBtns = iv => iv ? CH_BTN[iv.steps[iv.ans.length].k] : CH_Q0.map(x => ['q0:' + x[1], x[0]]);
function chTyped(iv, text) {       // a typed word that equals a button of the current question (spec B.5); never when the text holds a red flag
  const toks = CH_NORM(text).split(' ').filter(Boolean), norm = toks.join(' '), has = s => chHas(toks, s);
  if (CH_RED.some(r => r.stems.some(has))) return null;
  const btns = chBtns(iv).concat(iv ? [['skip', 'Пропустить вопросы']] : []);
  for (const [code, label] of btns) if (CH_NORM(label) === norm || CH_NORM(toEN(label)) === norm) return code;
  if (iv && toks.length <= 4) for (const code of ['u', 'n', 'y', 's1', 's2', 's3']) if (btns.some(b => b[0] === code) && CH_TYPED[code].some(has)) return code;
  return null;
}
function chDataFlags() {
  const nr = normFor('sleep', 'event'), l3 = SL.slice(-3), A = assess(), cg = A.cur.cog, zs = l3.map(x => nr && nr.sd > 0 ? (x.h - nr.m) / nr.sd : null);
  return [
    { id: 'sleep3', t: 'Каждая из трёх последних ночей короче вашей нормы больше чем на 1 SD', v: l3.length === 3 && zs.every(z => z != null && z < -1),
      nums: `<span class="rv">${l3.map(x => fmt(x.h, 1)).join(' · ')} ч</span>` + (nr ? ` <span>Ваша личная норма:</span> <span class="rv">${fmt(nr.m, 1)} ± ${fmt(nr.sd, 1)} ч</span>` : ''),
      attrs: `data-h="${l3.map(x => x.h).join(',')}" data-m="${nr ? nr.m : ''}" data-sd="${nr ? nr.sd : ''}"` },
    { id: 'cog1', t: 'Последний результат когнитивного теста ниже вашей нормы больше чем на 1 SD', v: cg[1] != null && cg[1] < -1,
      nums: cg[0] == null ? '<span class="rv">нет данных</span>' : `<span class="rv">${fmt(cg[0], 0)} балл.</span>` + (cg[1] != null ? ` <span class="rv">${sgn(cg[1], 2)} SD</span>` : ''),
      attrs: `data-z="${cg[1] == null ? '' : cg[1]}"` },
  ];
}
function chEval(iv) {
  const A = CH_ASK[iv.id], c = KB.find(q => q.id === iv.id), rows = [['kv', 'Что беспокоит', c.name]];
  let urgent = false, tell = false, self = false;
  iv.steps.forEach((st, k) => {
    const a = iv.ans[k];
    if (st.k === 'sev') { const n = +a[1]; rows.push(['kv', 'Насколько сильно это мешает', SEV[n]]); if (n === 3) urgent = true; }
    else if (st.k === 'dur') { const n = +a[1]; rows.push(['kv', 'Как давно это началось', CH_DUR[n]]); if (A.dur && n >= A.dur) tell = true; }
    else {
      rows.push(['q', st.q, CH_ANS[a]]);
      if (st.u && a === 'y') { urgent = true; if (iv.id === 'bhv') self = true; } else if (st.u && a === 'u') tell = true; else if (!st.u && a === 'y') tell = true;
    }
  });
  if (A.data) chDataFlags().forEach(f => { rows.push(['data', f]); if (f.v) tell = true; });
  if (A.ind) {                                  // v3: the person's own weekly data; informational rows never lower a level, a long worse run raises it to «tell» (never to «urgent»)
    A.ind.forEach(k => rows.push(['trend', k]));
    const t0 = trend(A.ind[0]), di = iv.steps.findIndex(x => x.k === 'dur'), dn = di >= 0 ? +iv.ans[di][1] : -1;
    if (dn === 0 && t0.run >= 3) rows.push(['cons', 'today', A.ind[0]]);
    else if (dn === 3 && t0.status === 'norm') rows.push(['cons', 'week', A.ind[0]]);
    if (A.ind.some(k => { const t = trend(k); return t.status === 'worse' && t.run >= 3; })) tell = true;
  }
  return { rows, level: urgent ? 'urgent' : tell ? 'tell' : 'watch', self };
}
function chConsText(r) {
  const t = trend(r[2]), nm = chNm(r[2], true);
  return r[1] === 'today' ? LR(`Вы ответили «сегодня», а по данным ${nm} хуже обычного уже ${t.run} ${chDays(t.run)} (с дня ${mDay(t.since)})`, `You answered “today”, but your data show ${nm} worse than usual for ${t.run} ${chDays(t.run)} already (since day ${mDay(t.since)})`)
    : LR('По данным показатель в пределах вашей нормы — опишите врачу, что именно беспокоит', 'In your data the indicator is within your norm — tell the doctor what exactly worries you');
}
const chRowHTML = r => r[0] === 'trend' ? chTrRow(r[1]) : r[0] === 'cons' ? `<li class="iv-cons" data-cons="${r[1]}">${chConsText(r)}</li>` : r[0] === 'kv' ? `<li><b>${r[1]}</b> <span>${r[2]}</span></li>`
  : r[0] === 'q' ? `<li><span>${r[1]}</span> <b class="iv-a">${r[2]}</b></li>`
  : `<li class="iv-data" data-flag="${r[1].id}" data-v="${r[1].v ? 1 : 0}" ${r[1].attrs}><span class="muted">Вижу по вашим данным:</span> <span>${r[1].t}</span> <b class="iv-a">${r[1].v ? 'Да' : 'Нет'}</b> ${r[1].nums}</li>`;
function chSummary(iv) {         // the text that goes to the doctor, in the language of the sender's screen
  const o = chEval(iv), lines = [tr('Сводка опроса')];
  o.rows.forEach(r => lines.push(r[0] === 'trend' ? chTrPlain(r[1]) : r[0] === 'cons' ? chConsText(r) : r[0] === 'kv' ? `${tr(r[1])}: ${tr(r[2])}` : r[0] === 'q' ? `${tr(r[1])} ${tr(r[2])}` : `${tr('Вижу по вашим данным:')} ${tr(r[1].t)}: ${tr(r[1].v ? 'Да' : 'Нет')}`));
  lines.push(`${tr('Уровень')}: ${tr(CH_LEVEL[o.level][0])}`);
  return { text: lines.join('\n'), urgent: o.level === 'urgent', level: o.level, key: iv.id + ':' + iv.ans.join(',') };
}
function chQHTML(iv, live) {
  const st = iv.steps[iv.ans.length], c = KB.find(q => q.id === iv.id), txt = st.k === 'flag' ? st.q : CH_QTXT[st.k];
  let h = `<p class="iv-top"><span class="muted">${c.name}</span>${iv.steps.length > 1 ? ` <span class="iv-n">${iv.ans.length + 1} / ${iv.steps.length}</span>` : ''}</p><p class="iv-q">${txt}</p>`;
  if (iv.ans.length === 0 && iv.drug) h += chNod();
  if (live) h += `<div class="iv-btns">${chBtns(iv).map(([a, l]) => `<button type="button" class="chipb iv-b" data-act="ans" data-a="${a}" data-t="${esc(l)}">${l}</button>`).join('')}</div>
    <button type="button" class="iv-skip" data-act="ans" data-a="skip" data-t="Пропустить вопросы">Пропустить вопросы</button>`;
  return h;
}
const chQ0HTML = live => `<p class="iv-q">Что беспокоит больше всего?</p>` + (live ? `<div class="iv-btns">${chBtns(null).map(([a, l]) => `<button type="button" class="chipb iv-b" data-act="ans" data-a="${a}" data-t="${esc(l)}">${l}</button>`).join('')}</div>` : '');
function chOutcomeHTML(iv, ctx, i) {
  const c = KB.find(q => q.id === iv.id), o = chEval(iv), L = CH_LEVEL[o.level], sm = chSummary(iv);
  let h = `<div class="iv-level iv-${o.level}"><span class="chip ${L[2]}">${L[0]}</span>${o.self ? '' : `<p class="iv-instr">${L[1]}</p>`}</div>`;
  if (o.self) h += `<div class="chat-red">${chRows(CH_RED_TXT.selfharm, 'red')}</div>`;
  h += `<h4 class="as-h">Сводка опроса</h4><ul class="find-list iv-sum">${o.rows.filter(r => r[0] !== 'trend' && r[0] !== 'cons').map(chRowHTML).join('')}</ul>`;
  const ind = (CH_ASK[iv.id] || {}).ind || [], wk = o.rows.filter(r => r[0] === 'trend' || r[0] === 'cons');
  if (wk.length) {            // v3: what the weekly data say, how it fits the answers, links and the lever
    h += `<h4 class="as-h">Что вижу в ваших данных за 7 дней</h4><ul class="find-list iv-tr">${wk.map(chRowHTML).join('')}</ul>`;
    const lk = chLinkOrder(psyLinks().filter(l => l.dirType !== 'control' && (ind.includes(l.a) || ind.includes(l.b)))).slice(0, 2);
    if (lk.length) h += `<h4 class="as-h">Как это связано у вас</h4><ul class="find-list pl-list">${lk.map(chLinkRow).join('')}</ul>`;
    const X = chLever(ind);
    if (X.lev || X.focus) h += '<h4 class="as-h">Что стоит сделать</h4>' + chLeverHTML(X) + chRows(chUniq(chLeverRows(X)).slice(0, 5));
  }
  h += chCond(c, ctx, { noSend: true, noTick: true });
  h += '<p class="chart-note">Уровень определён по простым правилам из справочника. Это не диагноз и не клиническая сортировка.</p>';
  const sent = msgsGet().some(m => m.from === VIEW && m.to === 'murphy' && m.key === sm.key), mine = c.sym.length ? c.sym[0] : null;
  h += `<div class="chat-acts">${sent ? chSentHTML() : `<button type="button" class="btn btn-ghost" data-act="sendsum" data-i="${i}">${ic('antenna')}Отправить сводку врачу</button>`}`
    + (mine ? (symGet().includes(mine) ? '<span class="chat-sent">Отмечено в журнале симптомов.</span>' : `<button type="button" class="btn btn-ghost" data-act="tick" data-sym="${mine}">${ic('check')}Записать в журнал симптомов</button>`) : '')
    + `<button type="button" class="btn btn-ghost" data-act="ans" data-a="redo" data-t="Ответить заново">Ответить заново</button></div>`;
  if (iv.extra.length) h += chTopicHTML(iv.extra, ctx, { noSend: true });
  return chWithDrug(h, iv.drug);
}

/* ---- conversation: entries { t: text shown, a: answer code or null }, last 30 kept; answers are rebuilt on every render ---- */
const chKey = () => 'avega-chat-' + VIEW;
const chTrim = a => { a = a.slice(-30); while (a.length && a[0].a != null) a.shift(); return a; };     // an answer without its question cannot be replayed
function chGet() {
  try { const a = JSON.parse(lsGet(chKey()) || '[]'); return Array.isArray(a) ? chTrim(a.map(x => typeof x === 'string' ? { t: x, a: null } : x).filter(x => x && typeof x.t === 'string').map(x => ({ t: x.t, a: x.a == null ? null : String(x.a) }))) : []; } catch (e) { return []; }
}
const chSet = a => lsSet(chKey(), JSON.stringify(chTrim(a)));
function chReplay(entries) {
  const texts = entries.map(e => e.t), out = []; let iv = null, q0 = null, last = null, lastIv = null;
  entries.forEach((e, i) => {
    const ctx = { last, i, texts }; let b = null, code = null;
    if (iv || q0) {
      if (e.a != null) code = chBtns(iv).some(x => x[0] === e.a) || (iv && e.a === 'skip') ? e.a : null; else code = chTyped(iv, e.t);
      if (!code) { iv = q0 = null; }                                       // anything else abandons the interview; the text is a new message
    }
    if (code && iv && code === 'skip') {
      const ids = [iv.id].concat(iv.extra); b = { intent: iv.intent, html: chWithDrug(chTopicHTML(ids, { last, i: iv.src, texts }), iv.drug) }; last = iv.id; iv = null;
    } else if (code && iv) {
      iv = { ...iv, ans: iv.ans.concat(code) };
      if (iv.ans.length >= iv.steps.length) { b = { intent: iv.intent, level: chEval(iv).level, sum: chSummary(iv), html: chOutcomeHTML(iv, { last, i, texts }, i) }; lastIv = iv; iv = null; }
      else b = { intent: iv.intent, q: iv.steps[iv.ans.length].k, qiv: iv };
    } else if (code && q0) {
      const t = code.slice(3), src = q0.src; q0 = null;
      if (t === 'none') b = { intent: 'none', html: chFallback({ last, i: src, texts }) };
      else if (t.startsWith('red:')) { const id = t.slice(4); b = { intent: 'red-' + id, html: chRed([{ id }], { last, i: src, texts }), urgent: true }; }
      else { iv = chNew(t, [], false, src, t); last = t; b = { intent: t, q: iv.steps[0].k, qiv: iv }; }
    } else if (e.a === 'redo' && lastIv) {
      iv = chNew(lastIv.id, lastIv.extra, lastIv.drug, lastIv.src, lastIv.intent); b = { intent: iv.intent, q: iv.steps[0].k, qiv: iv };
    } else {
      const r = chatReply(e.t, ctx);
      if (r.vague) { q0 = { src: i }; b = { intent: 'q0', q: 'q0', q0: true }; }
      else {
        const cid = (r.tops || []).find(id => CH_ASK[id]);
        if (cid) { iv = chNew(cid, r.tops.filter(x => x !== cid), r.drug, i, r.intent); last = cid; b = { intent: r.intent, q: iv.steps[0].k, qiv: iv }; }
        else { b = { intent: r.intent, html: r.html }; if (r.last) last = r.last; }
      }
    }
    out.push(b);
  });
  const n = out.length - 1;
  out.forEach((b, i) => { if (b.qiv) b.html = chQHTML(b.qiv, i === n); else if (b.q0) b.html = chQ0HTML(i === n); });
  return out;
}
function chDraw(log) {
  const entries = chGet(); let h = '';
  if (!entries.length) h = `<div class="chat-msg bot"><div class="chat-bub" data-intent="about">${chAbout()}</div></div>`;
  else chReplay(entries).forEach((b, i) => {
    const e = entries[i];
    h += `<div class="chat-msg me"><div class="chat-bub" ${e.a == null ? 'data-raw' : ''}>${esc(e.t)}</div></div><div class="chat-msg bot"><div class="chat-bub" data-intent="${b.intent}"${b.level ? ` data-level="${b.level}"` : ''}${b.q ? ` data-q="${b.q}"` : ''}>${b.html}</div></div>`;
  });
  log.innerHTML = h; localize(log);
  const root = log.closest('.chat'), lastMsg = log.lastElementChild;
  if (root) root.classList.toggle('iv-on', !!(lastMsg && lastMsg.querySelector('.chat-bub[data-q]')));      // while a question waits for its answer the suggestion chips are hidden
  log.scrollTop = log.scrollHeight;
  if (lastMsg && lastMsg.offsetHeight > log.clientHeight) log.scrollTop += lastMsg.getBoundingClientRect().top - log.getBoundingClientRect().top - 6;     // a long outcome opens at its level chip, not at its end
}
/* ---- full screen (v2 C): the chat root is moved to <body> as a fixed overlay and back; preference in avega-chat-full, default on ---- */
const chWantFull = () => lsGet('avega-chat-full') !== '0';
function chLeave() {             // leaving the chat tab (or re-rendering it) closes the overlay
  document.querySelectorAll('.chat.is-full').forEach(r => r.remove());
  document.documentElement.classList.remove('chat-lock');
}
function chFit() {              // in-page card: fill the main area down to the demo footer so the input is visible without scrolling
  const r = document.querySelector('#view .chat'); if (!r || r.classList.contains('is-full')) return;
  const top = r.getBoundingClientRect().top + window.scrollY, dem = document.querySelector('.demobar');
  r.style.height = Math.max(340, window.innerHeight - top - (dem ? dem.offsetHeight : 46) - 48) + 'px';
}
window.addEventListener('resize', chFit);
document.addEventListener('keydown', e => { if (e.key === 'Escape') { const r = document.querySelector('.chat.is-full'); if (r && r._exit) { e.preventDefault(); r._exit(); } } });
function rChat(el) {
  chLeave();
  if (IS_DOC) { el.innerHTML = '<p class="muted">Чат доступен астронавту на борту. Вопросы экипажа — в разделе Mission Control → Назначения.</p>'; return; }
  const me = ACCOUNTS.find(a => a.id === ACC);
  el.innerHTML = `<div class="chat" id="chat-root"><div class="chat-head"><b class="chat-title">Чат с ассистентом AVEGA</b><span class="chat-who" data-raw>${esc(me.name)}</span><span class="chat-sp"></span><span class="chat-slot-h"></span>
      <button type="button" class="btn btn-ghost chat-fs" id="chat-fs"></button><button type="button" class="chat-x" id="chat-x">${ic('x')}</button></div>
    <div class="chat-col"><div class="chat-log" id="chat-log" role="log" aria-live="polite" tabindex="0"></div>
    <div class="chat-sug">${CH_SUG.map(q => `<button type="button" class="chipb" data-q="${esc(q)}">${q}</button>`).join('')}</div>
    <form class="chat-form" id="chat-form" autocomplete="off"><input id="chat-in" type="text" maxlength="300"><button class="btn btn-primary" type="submit">Отправить</button></form>
    <div class="chat-slot-f"><button type="button" class="btn btn-ghost chat-clear" id="chat-clear">Очистить диалог</button></div></div></div>`;
  const root = el.querySelector('#chat-root'), log = root.querySelector('#chat-log'), inp = root.querySelector('#chat-in'), fs = root.querySelector('#chat-fs'), x = root.querySelector('#chat-x');
  const clr = root.querySelector('#chat-clear'), slotH = root.querySelector('.chat-slot-h'), slotF = root.querySelector('.chat-slot-f');
  inp.placeholder = tr('Напишите вопрос'); inp.setAttribute('aria-label', tr('Напишите вопрос'));
  x.title = 'Свернуть'; x.setAttribute('aria-label', tr('Свернуть'));
  let ph = null;
  const paintFs = on => { fs.innerHTML = on ? `${ic('shrink')}Свернуть` : `${ic('expand')}На весь экран`; localize(fs); fs.setAttribute('aria-pressed', on); };
  function setFull(on, save) {
    if (save) lsSet('avega-chat-full', on ? '1' : '0');
    if (on === root.classList.contains('is-full')) return;
    root.classList.toggle('is-full', on);
    if (on) root.style.removeProperty('height');      // the in-page card height (chFit) must not survive into full screen
    if (on) { root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', tr('Чат с ассистентом AVEGA')); } else { root.removeAttribute('role'); root.removeAttribute('aria-modal'); root.removeAttribute('aria-label'); }
    if (on) { ph = document.createElement('div'); ph.className = 'chat-ph'; ph.style.height = root.offsetHeight + 'px'; root.before(ph); document.body.appendChild(root); document.documentElement.classList.add('chat-lock'); }
    else { document.documentElement.classList.remove('chat-lock'); if (ph && ph.isConnected) ph.replaceWith(root); else el.appendChild(root); ph = null; }
    (on ? slotH : slotF).appendChild(clr); paintFs(on); if (!on) chFit(); log.scrollTop = log.scrollHeight; if (on) inp.focus();
  }
  root._exit = () => setFull(false, true);
  fs.addEventListener('click', () => setFull(!root.classList.contains('is-full'), true)); x.addEventListener('click', () => setFull(false, true));
  paintFs(false);
  const push = (t, a) => { const l = chGet(); l.push({ t, a }); chSet(l); chDraw(log); };
  const send = t => { t = String(t).trim().slice(0, 300); if (!t) return; push(t, null); inp.value = ''; };
  root.querySelector('#chat-form').addEventListener('submit', e => { e.preventDefault(); send(inp.value); inp.focus(); });
  clr.addEventListener('click', () => { chSet([]); chDraw(log); });
  root.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || !root.contains(b)) return;
    if (b.dataset.q != null) { send(tr(b.dataset.q)); return; }
    const act = b.dataset.act; if (!act) return;
    const done = html => { const s = document.createElement('span'); b.replaceWith(s); s.outerHTML = html; localize(log); };
    const msg = (text, urgent, extra) => { const l = msgsGet(); l.push({ from: VIEW, to: 'murphy', text, urgent: !!urgent, at: new Date().toLocaleString(lang === 'en' ? 'en-GB' : 'ru-RU'), ...extra }); lsSet('avega-msgs', JSON.stringify(l)); };
    if (act === 'ans') push(b.dataset.t, b.dataset.a);
    else if (act === 'send') { const q = chGet()[+b.dataset.i]; if (q == null) return; msg(q.t, !!b.dataset.urgent); done(chSentHTML()); }
    else if (act === 'sendwk') { const sm = chWeekSummary(); msg(sm.text, false, { key: sm.key }); done(chSentHTML()); }
    else if (act === 'sendsum') { const bb = chReplay(chGet())[+b.dataset.i]; if (!bb || !bb.sum) return; msg(bb.sum.text, bb.sum.urgent, { key: bb.sum.key, level: bb.sum.level }); done(chSentHTML()); }
    else if (act === 'tick') { const l = symGet(); if (!l.includes(b.dataset.sym)) l.push(b.dataset.sym); lsSet(symKey(), JSON.stringify(l)); ASSESS = null; done('<span class="chat-sent">Отмечено в журнале симптомов.</span>'); }
  });
  chDraw(log);
  if (chWantFull()) setFull(true, false); else requestAnimationFrame(chFit);
}
function rCrewQuestions(el) {
  const l = msgsGet().filter(m => m.to === 'murphy').reverse();
  el.innerHTML = l.length ? `<ul class="msg-list">${l.map(m => { const p = CREWDATA.crew.find(q => q.id === m.from);
    return `<li><b>${p ? p.name : esc(m.from)}</b> ${m.urgent ? '<span class="chip warn">срочно</span>' : ''} <small>${esc(m.at || '')}</small><p data-raw>${esc(m.text)}</p></li>`; }).join('')}</ul>`
    : '<p class="muted">Вопросов от экипажа пока нет.</p>';
}
