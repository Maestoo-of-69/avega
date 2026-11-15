import asyncio, re, sys, json
from playwright.async_api import async_playwright
import pathlib, os
ROOT = pathlib.Path(__file__).resolve().parent.parent
APP = ROOT / 'index.html'
PROTO = ROOT / 'prototype'
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
CHROME = os.environ.get('CHROME', '/usr/bin/google-chrome')
U = APP.as_uri()
ALLOW = {'AVEGA','NASA','UTC','HRV','SpO','Alex','Carter','D','n','CSV','JSON','ВСР','SD','СО','T','Mira','Okafor','Daniel','Reyes','Yuki','Tanaka','Dr','Eileen','Murphy','REFERENCES','docs','md','C','R','P','r','SANS','CO','S','N','EVA','HRP','NTRS','ISS','HRV'}
ONLY = set(sys.argv[1:])
def want(s): return not ONLY or s in ONLY
passed = total = 0; fails = []; errs = []
def chk(name, ok, info=''):
    global passed, total
    total += 1
    if ok: passed += 1
    else: fails.append(f'{name} {info}')
    print(('PASS ' if ok else 'FAIL ') + name, str(info)[:300] if not ok else '')
async def setup(pg, user, lang, hash_='support-chat', theme=None, chat=None, full=None, extra=''):
    await pg.goto(U + '#' + hash_)
    await pg.evaluate("([u,l,t,c,f])=>{localStorage.clear();localStorage.setItem('avega-user',u);localStorage.setItem('avega-lang',l);if(t)localStorage.setItem('avega-theme',t);if(f!=null)localStorage.setItem('avega-chat-full',f);if(c)localStorage.setItem('avega-chat-'+u,JSON.stringify(c));}", [user, lang, theme, chat, full])
    await pg.reload(); await pg.wait_for_timeout(350)
async def ask(pg, q):
    await pg.fill('#chat-in', q); await pg.press('#chat-in', 'Enter'); await pg.wait_for_timeout(80)
async def last_bot(pg):
    return await pg.evaluate("()=>{const b=[...document.querySelectorAll('.chat-msg.bot .chat-bub')].pop();return b?{i:b.dataset.intent,l:b.dataset.level||'',q:b.dataset.q||'',t:b.innerText,n:b.querySelectorAll('[data-act=ans]').length}:null}")
async def press(pg, code):
    """press the answer button with this code in the newest bubble"""
    ok = await pg.evaluate("(c)=>{const b=[...document.querySelectorAll('.chat-msg.bot .chat-bub')].pop();const x=b&&b.querySelector('[data-act=ans][data-a=\"'+c+'\"]');if(!x)return false;x.click();return true}", code)
    await pg.wait_for_timeout(60); return ok
CLEAN = """()=>{const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const o=[];for(let n=w.nextNode();n;n=w.nextNode()){const e=n.parentElement;if(!e||e.closest('[data-raw],.ref-title,script,style'))continue;o.push(n.data)}return o.join(' ')}"""
async def scan(pg, lang, label):
    txt = await pg.evaluate(CLEAN)
    pat = r'[A-Za-z]{3,}' if lang == 'ru' else r'[А-Яа-яЁё]+'
    bad = sorted({w for w in re.findall(pat, txt) if w not in ALLOW})
    chk(f'scan {label} {lang}', not bad, str(bad[:15]))

KB_IDS = ['sms','sabp','co2','sans','immune','sleep','bhv','cardio','bone','rad','dcs','hypoxia','food','microbe','eva','team','loads']
Q17 = {  # id: (RU, EN, accepted first intents)
 'sms': ('меня тошнит', 'I feel nauseous', ['sms']), 'sabp': ('болит спина', 'back pain', ['sabp']), 'co2': ('болит голова', 'I have a headache', ['co2']),
 'sans': ('стало хуже зрение', 'my vision is blurry', ['red-vision']), 'immune': ('сыпь на губах', 'a rash on my lips', ['immune']),
 'sleep': ('плохо сплю', "I can't sleep", ['sleep']), 'bhv': ('мне тревожно', 'I feel anxious', ['bhv']), 'cardio': ('кружится голова', 'I feel lightheaded', ['cardio']),
 'bone': ('болят мышцы', 'my muscles are weak', ['bone']), 'rad': ('радиация', 'solar flare', ['rad']),
 'dcs': ('декомпрессионная болезнь', 'decompression sickness', ['dcs']), 'hypoxia': ('не хватает кислорода', 'hypoxia', ['hypoxia']),
 'food': ('пропал аппетит', 'no appetite', ['food']), 'microbe': ('у меня температура', 'I have a fever', ['microbe']),
 'eva': ('травма после выхода в открытый космос', 'injury after a spacewalk', ['eva', 'dcs', 'eva+dcs', 'dcs+eva']),
 'team': ('поссорился с коллегой', 'argument with a crewmate', ['team']), 'loads': ('перегрузки при посадке', 'landing loads', ['loads']),
}
HRP = [('Altered immune responses','immune'),('Sensorimotor / vestibular','sms'),('Cardiovascular adaptations','cardio'),('Decompression sickness','dcs'),
 ('Host–microorganism interactions','microbe'),('Hypoxia','hypoxia'),('Inadequate food and nutrition','food'),('Spacewalk (EVA) injury and performance','eva'),
 ('Reduced cardiorespiratory and musculoskeletal fitness','bone'),('SANS','sans'),('Spaceflight-induced bone changes','bone'),
 ('Behavioral conditions and psychiatric disorders','bhv'),('Inadequate teamwork','team'),('Inadequate sleep and irregular schedules','sleep'),
 ('Inadequate systems operations support',None),('Injury from dynamic loads','loads'),('Radiation-induced cancers','rad')]

async def run(p):
    b = await p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
    pg = await b.new_page(viewport={'width': 1440, 'height': 1000})
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    for name, fn in SECTIONS:
        if want(name): print('==', name); await fn(pg, b)
    await b.close()

async def t_cover(pg, b):
    for lang, ix in (('ru', 0), ('en', 1)):
        await setup(pg, 'alex', lang, full='0')
        for cid in KB_IDS:
            q = Q17[cid][ix]
            await pg.click('#chat-clear'); await ask(pg, q); r = await last_bot(pg)
            chk(f'cover[{lang}] {cid}: {q!r}', r['i'] in Q17[cid][2], f"got {r['i']}")
    # 17 HRP risks
    await setup(pg, 'alex', 'ru', full='0')
    ids = await pg.evaluate("1")  # placeholder to keep structure
    kb = await pg.evaluate("window.__kbids || null")
    html = open(PROTO / 'engine.js').read()
    present = set(re.findall(r"\{ id: '(\w+)', name:", html))
    chk('KB has 17 entries', len(present) == 17, str(sorted(present)))
    chk('HRP table has 17 risks', len(HRP) == 17)
    for title, cid in HRP:
        if cid: chk(f'HRP {title} -> {cid} exists in KB', cid in present)
    for lang in ('ru', 'en'):
        await setup(pg, 'alex', lang, full='0'); await ask(pg, 'Inadequate systems operations support'); r = await last_bot(pg)
        chk(f'HRP systems operations support -> fallback [{lang}]', r['i'] == 'none', r['i'])
    # false-positive guards for whole-word stems
    await setup(pg, 'alex', 'ru', full='0')
    for q, bad in (('весь день работаю', 'food'), ('жарко в отсеке', 'microbe'), ('we need to evaluate the plan', 'eva'), ('надо пропустить весь тест', 'food')):
        await ask(pg, q); r = await last_bot(pg); chk(f'no false {bad} for {q!r}', bad not in r['i'].split('+'), r['i'])
    # new red flag confusion
    for lang, q in (('ru', 'у меня спутанность сознания'), ('en', "I'm confused and disoriented")):
        await setup(pg, 'alex', lang, full='0'); await ask(pg, q); r = await last_bot(pg)
        chk(f'red flag confusion [{lang}]', r['i'] == 'red-confusion', r['i'])

# ---- interview tests ----
ASK_T = {  # id: (query, has_q1, has_q2, dur threshold or None, [flag marks])
 'sms': ('меня тошнит', 1, 1, 2, 'TT'), 'sabp': ('болит спина', 1, 1, None, 'TTT'), 'co2': ('болит голова', 1, 1, 1, 'TU'), 'immune': ('сыпь на губах', 1, 1, None, 'TTT'),
 'sleep': ('плохо сплю', 0, 1, None, ''), 'bhv': ('мне тревожно', 1, 1, 3, 'U'), 'cardio': ('кружится голова', 1, 1, None, 'UUU'), 'bone': ('болят мышцы', 1, 0, None, 'TT'),
 'dcs': ('декомпрессионная болезнь', 0, 0, None, 'U'), 'hypoxia': ('не хватает кислорода', 1, 0, None, 'UU'), 'food': ('пропал аппетит', 0, 1, None, 'TT'),
 'microbe': ('у меня температура', 1, 1, None, 'T'), 'eva': ('выход в открытый космос', 1, 0, None, 'T'), 'team': ('поссорился с коллегой', 0, 1, 3, 'T')}
NOINT = ['rad', 'loads', 'sans']
DEFAULT = {'sev': 's1', 'dur': 'd0', 'flag': 'n'}
async def run_iv(pg, start, plan=None, user='alex', lang='ru'):
    """answer every question; plan(kind, idx)->code overrides; returns (last bubble, list of question texts)"""
    await ask(pg, start); qs = []; idx = 0
    for _ in range(12):
        r = await last_bot(pg)
        if not r['q'] or r['l']: break
        qs.append(await pg.evaluate("[...document.querySelectorAll('.chat-msg.bot .chat-bub')].pop().querySelector('.iv-q').innerText"))
        code = (plan(r['q'], idx) if plan else None) or DEFAULT[r['q']]
        if not await press(pg, code): break
        idx += 1
    return await last_bot(pg), qs
_HTML = open(APP).read()
async def data_of(pg, user):
    m = re.search(r'id="avega-data-%s" type="application/json">(.*?)</script>' % user, _HTML, re.S); d = json.loads(m.group(1))
    return {'sl': [x['h'] for x in d['sleep']], 'm': d['norms']['sleep']['event'], 't': [x['v'] for x in d['tests']], 'c': d['norms']['cog']['event']}

async def t_iv(pg, b):
    for cid, (q, q1, q2, dur, marks) in ASK_T.items():
        await setup(pg, 'alex', 'ru', full='0')
        r0 = None
        # (a) mild / today / all No
        r, qs = await run_iv(pg, q)
        n_expected = q1 + q2 + len(marks)
        chk(f'{cid} asks {n_expected} questions, none twice', len(qs) == n_expected and len(set(qs)) == len(qs), str(qs))
        if cid == 'sleep':
            fl = await pg.evaluate("[...document.querySelectorAll('.chat-bub[data-level] .iv-data')].map(e=>e.dataset.v)")
            chk('sleep (a): level follows the two data flags', r['l'] == ('tell' if '1' in fl else 'watch') and len(fl) == 2, f"{r['l']} {fl}")
        else: chk(f'{cid} (a) all mild/today/No -> watch', r['l'] == 'watch' and r['i'] == cid, f"{r['l']} {r['i']}")
        # (b) first flag Yes
        if marks:
            await setup(pg, 'alex', 'ru', full='0')
            r, _ = await run_iv(pg, q, lambda k, i: 'y' if k == 'flag' and i == q1 + q2 else None)
            chk(f'{cid} (b) first flag Yes -> {"urgent" if marks[0] == "U" else "tell"}', r['l'] == ('urgent' if marks[0] == 'U' else 'tell'), r['l'])
            if marks[0] == 'U':
                await setup(pg, 'alex', 'ru', full='0')
                r, _ = await run_iv(pg, q, lambda k, i: 'u' if k == 'flag' and i == q1 + q2 else None)
                chk(f'{cid} (f) "Не знаю" on an urgent flag -> tell', r['l'] == 'tell', r['l'])
        # (c) severity 3
        if q1:
            await setup(pg, 'alex', 'ru', full='0')
            r, _ = await run_iv(pg, q, lambda k, i: 's3' if k == 'sev' else None)
            chk(f'{cid} (c) severity 3 -> urgent', r['l'] == 'urgent', r['l'])
        # (e) duration threshold
        if dur is not None:
            await setup(pg, 'alex', 'ru', full='0')
            r, _ = await run_iv(pg, q, lambda k, i: f'd{dur}' if k == 'dur' else None)
            chk(f'{cid} (e) duration >= {dur} -> tell', r['l'] == 'tell', r['l'])
            await setup(pg, 'alex', 'ru', full='0')
            r, _ = await run_iv(pg, q, lambda k, i: f'd{dur-1}' if k == 'dur' else None)
            chk(f'{cid} (e) duration {dur-1} alone -> watch', r['l'] == 'watch', r['l'])
        # (d) skip
        await setup(pg, 'alex', 'ru', full='0'); await ask(pg, q); await press(pg, 'skip'); r = await last_bot(pg)
        chk(f'{cid} (d) skip -> v1 answer without level', r['l'] == '' and r['q'] == '' and r['i'] == cid and 'Что известно' in r['t'] and 'Сводка опроса' not in r['t'], r['i'] + r['t'][:80])
    for cid in NOINT:
        await setup(pg, 'alex', 'ru', full='0'); await ask(pg, {'rad': 'радиация', 'loads': 'перегрузки при посадке', 'sans': 'стало хуже зрение'}[cid]); r = await last_bot(pg)
        chk(f'{cid}: no interview', r['q'] == '' and r['l'] == '' and r['i'] in (cid, 'red-vision'), r['i'])
    # bhv self-harm outcome
    await setup(pg, 'alex', 'ru', full='0'); r, _ = await run_iv(pg, 'мне тревожно', lambda k, i: 'y' if k == 'flag' else None)
    chk('bhv self-harm Yes -> v1 selfharm text', r['l'] == 'urgent' and 'не оставайтесь в одиночестве' in r['t'] and 'Сообщите врачу и члену экипажа' not in r['t'], r['t'][:120])
    # sleep data flags on four accounts
    res = {}
    for user in ('alex', 'mira', 'daniel', 'yuki'):
        await setup(pg, user, 'ru', full='0'); d = await data_of(pg, user)
        r, _ = await run_iv(pg, 'плохо сплю')
        fl = await pg.evaluate("[...document.querySelectorAll('.chat-bub[data-level] .iv-data')].map(e=>({id:e.dataset.flag,v:e.dataset.v,h:e.dataset.h,m:e.dataset.m,sd:e.dataset.sd,z:e.dataset.z}))")
        l3 = d['sl'][-3:]; z3 = [(h - d['m']['m']) / d['m']['sd'] for h in l3]; e1 = all(z < -1 for z in z3)
        zc = (d['t'][-1] - d['c']['m']) / d['c']['sd']; e2 = zc < -1
        ok = len(fl) == 2 and fl[0]['v'] == ('1' if e1 else '0') and fl[1]['v'] == ('1' if e2 else '0') and [round(float(x), 3) for x in fl[0]['h'].split(',')] == [round(x, 3) for x in l3] and abs(float(fl[1]['z']) - zc) < 1e-6
        chk(f'sleep data flags consistent with data [{user}]', ok, f'{fl} exp {e1} {e2}')
        e3 = await pg.evaluate("[...document.querySelectorAll('.chat-bub[data-level] .iv-tr .tr-row')].some(e=>e.dataset.status==='worse'&&+e.dataset.run>=3)")      # v3 rule (CHAT_SPEC_V3 C): a mapped indicator worse with run >= 3 gives at least «tell»
        chk(f'sleep level [{user}] = tell iff a data flag or (v3) a mapped indicator worse for 3+ days', r['l'] == ('tell' if (e1 or e2 or e3) else 'watch'), r['l'])
        res[user] = (e1, e2)
    chk('sleep data flags differ between accounts (not constant)', len(set(res.values())) >= 2, str(res))

async def t_q0(pg, b):
    targets = [('Голова','co2'),('Глаза или зрение','red-vision'),('Тошнота, укачивание','sms'),('Головокружение','cardio'),('Спина','sabp'),('Кожа, сыпь','immune'),('Сон','sleep'),
      ('Настроение, тревога','bhv'),('Отношения в экипаже','team'),('Сердце или грудь','red-chest'),('Дыхание','red-breath'),('Аппетит, еда','food'),('Температура, простуда','microbe'),('Другое','none')]
    for text in ('мне плохо', 'feel bad'):
        await setup(pg, 'alex', 'ru', full='0'); await ask(pg, text); r = await last_bot(pg)
        chk(f'vague {text!r} -> Q0 with 14 buttons', r['i'] == 'q0' and r['q'] == 'q0' and r['n'] == 14, f"{r['i']} {r['n']}")
    for text in ('у меня что-то не так', 'I am not feeling well', 'мне нехорошо', 'unwell', 'болит живот'):
        await setup(pg, 'alex', 'ru', full='0'); await ask(pg, text); r = await last_bot(pg); chk(f'vague {text!r} -> Q0', r['i'] == 'q0', r['i'])
    for lab, tgt in targets:
        await setup(pg, 'alex', 'ru', full='0'); await ask(pg, 'мне плохо')
        code = await pg.evaluate("(l)=>{const b=[...document.querySelectorAll('.chat-bub[data-intent=q0] button[data-act=ans]')].pop();return null}", lab)
        ok = await pg.evaluate("(l)=>{const b=[...document.querySelectorAll('.chat-msg.bot .chat-bub')].pop();const x=[...b.querySelectorAll('[data-act=ans]')].find(e=>e.dataset.t===l);if(!x)return false;x.click();return true}", lab)
        r = await last_bot(pg); chk(f'Q0 {lab!r} -> {tgt}', ok and r['i'] == tgt, f"{r['i']}")
    # Q0 then the whole interview and the outcome
    await setup(pg, 'alex', 'ru', full='0'); await ask(pg, 'мне плохо'); await press(pg, 'q0:sms'); r, qs = await run_iv_cont(pg)
    chk('Q0 -> sms -> outcome', r['l'] == 'watch' and r['i'] == 'sms', r['l'])
    # a vague word does not hijack a topic or a red flag
    await setup(pg, 'alex', 'ru', full='0'); await ask(pg, 'мне плохо, боль в груди'); r = await last_bot(pg); chk('vague + red flag -> red flag', r['i'] == 'red-chest', r['i'])
    await ask(pg, 'плохо сплю'); r = await last_bot(pg); chk('vague word + topic -> topic interview', r['i'] == 'sleep' and r['q'] == 'dur', r['i'])
async def run_iv_cont(pg):
    qs = []
    for _ in range(12):
        r = await last_bot(pg)
        if not r['q'] or r['l']: break
        qs.append(r['q']); await press(pg, DEFAULT[r['q']])
    return await last_bot(pg), qs

async def t_typed(pg, b):
    await setup(pg, 'alex', 'ru', full='0'); await ask(pg, 'меня тошнит'); await ask(pg, 'слабо'); r = await last_bot(pg); chk('typed "слабо" answers severity', r['q'] == 'dur', r['q'])
    await ask(pg, 'Сегодня'); r = await last_bot(pg); chk('typed label "Сегодня" answers duration', r['q'] == 'flag', r['q'])
    await ask(pg, 'да'); r = await last_bot(pg); chk('typed "да" answers flag 1', r['q'] == 'flag' and 'Не удаётся пить' in r['t'], r['t'][:80])
    await ask(pg, 'не знаю'); r = await last_bot(pg); chk('typed "не знаю" answers flag 2 -> outcome tell (Yes on T flag)', r['l'] == 'tell', r['l'])
    ans = await pg.evaluate("[...document.querySelectorAll('.chat-msg.me .chat-bub')].map(e=>e.innerText)")
    chk('typed answers shown as the user bubbles', ans[:3] == ['меня тошнит', 'слабо', 'Сегодня'], str(ans))
    await setup(pg, 'alex', 'en', full='0'); await ask(pg, 'I feel nauseous'); await ask(pg, 'mild'); await ask(pg, 'today'); r = await last_bot(pg); chk('EN typed mild/today', r['q'] == 'flag', r['q'])
    await ask(pg, 'no'); await ask(pg, "I don't know"); r = await last_bot(pg); chk('EN typed no / I don\'t know -> watch', r['l'] == 'watch', r['l'])
    # unrelated text abandons
    await setup(pg, 'alex', 'ru', full='0'); await ask(pg, 'меня тошнит'); await ask(pg, 'какая столица Франции'); r = await last_bot(pg)
    n = await pg.evaluate("document.querySelectorAll('.chat-bub [data-act=ans]').length")
    chk('unrelated text abandons interview (fallback, no stale buttons)', r['i'] == 'none' and n == 0, f"{r['i']} {n}")
    await setup(pg, 'alex', 'ru', full='0'); await ask(pg, 'меня тошнит'); await ask(pg, 'да'); r = await last_bot(pg); chk('"да" to the severity question abandons (not a severity answer)', r['q'] == '' and r['i'] == 'none', f"{r['i']} {r['q']}")
    await setup(pg, 'alex', 'ru', full='0'); await ask(pg, 'меня тошнит'); await ask(pg, 'нет, у меня боль в груди'); r = await last_bot(pg); chk('red flag typed mid-interview wins', r['i'] == 'red-chest', r['i'])
    await setup(pg, 'alex', 'ru', full='0'); await ask(pg, 'меня тошнит'); await ask(pg, 'плохо сплю'); r = await last_bot(pg); chk('new topic mid-interview starts a new interview', r['i'] == 'sleep' and r['q'] == 'dur', r['i'])
    await ask(pg, 'какую таблетку выпить от головы'); r = await last_bot(pg); chk('drug + topic: interview starts and NODRUG is shown', r['i'] == 'co2' and r['q'] == 'sev' and 'Лекарства — только по бортовому' in r['t'], r['t'][:100])
    # redo
    await setup(pg, 'alex', 'ru', full='0'); r, _ = await run_iv(pg, 'меня тошнит'); await press(pg, 'redo'); r = await last_bot(pg); chk('«Ответить заново» restarts at question 1', r['i'] == 'sms' and r['q'] == 'sev' and not r['l'], r['q'])
    # old conversation (plain strings) migrates
    await setup(pg, 'alex', 'ru', full='0', chat=['кто ты', 'меня тошнит']); r = await last_bot(pg); chk('old string storage migrates', r['i'] == 'sms' and r['q'] == 'sev', r['i'])

async def t_reload(pg, b):
    await setup(pg, 'alex', 'ru', full='0'); await ask(pg, 'меня тошнит'); await press(pg, 's2'); await press(pg, 'd1')
    await pg.reload(); await pg.wait_for_timeout(350); r = await last_bot(pg)
    chk('reload mid-interview resumes at the same question', r['q'] == 'flag' and 'Рвота повторяется?' in r['t'] and r['n'] == 4, r['t'][:80])
    st = await pg.evaluate("JSON.parse(localStorage.getItem('avega-chat-alex'))")
    chk('storage is entries {t,a}', st == [{'t': 'меня тошнит', 'a': None}, {'t': 'Средне: мешает, но работать могу', 'a': 's2'}, {'t': '2–3 дня', 'a': 'd1'}], str(st))
    await pg.evaluate("localStorage.setItem('avega-lang','en')"); await pg.reload(); await pg.wait_for_timeout(350); r = await last_bot(pg)
    chk('language switch mid-interview: same question in English', r['q'] == 'flag' and 'Does the vomiting keep coming back?' in r['t'], r['t'][:80])
    me = await pg.evaluate("[...document.querySelectorAll('.chat-msg.me .chat-bub')].map(e=>e.innerText)")
    chk('answers shown translated, typed text raw', me == ['меня тошнит', 'Moderate: it gets in the way, but I can work', '2–3 days'], str(me))
    await press(pg, 'y'); r = await last_bot(pg); chk('can continue after the switch', r['q'] == 'flag' and 'keep fluids down' in r['t'], r['t'][:60])
    # trim keeps replay valid
    await setup(pg, 'alex', 'ru', full='0', chat=[{'t': 'Да', 'a': 'y'}] + [{'t': 'кто ты', 'a': None}] * 3); n = await pg.evaluate("JSON.parse(localStorage.getItem('avega-chat-alex')||'[]').length")
    await ask(pg, 'привет'); st = await pg.evaluate("JSON.parse(localStorage.getItem('avega-chat-alex'))"); chk('entries starting with an orphan answer are dropped', st[0]['a'] is None, str(st[:2]))

async def t_send(pg, b):
    for lang in ('ru', 'en'):
        for level in ('urgent', 'tell'):
            await setup(pg, 'alex', lang, full='0')
            r, _ = await run_iv(pg, 'меня тошнит', (lambda k, i: 's3' if k == 'sev' else None) if level == 'urgent' else (lambda k, i: 'y' if k == 'flag' and i == 2 else None))
            await pg.evaluate("document.querySelector('.chat-bub[data-level] [data-act=sendsum]').click()"); await pg.wait_for_timeout(100)
            sent = await pg.evaluate("document.querySelector('.chat-bub[data-level] .chat-sent').innerText")
            chk(f'summary sent confirmation [{lang},{level}]', ('Отправлено врачу' in sent) or ('Sent to the doctor' in sent), sent)
            msgs = await pg.evaluate("JSON.parse(localStorage.getItem('avega-msgs'))")
            chk(f'message shape [{lang},{level}]', len(msgs) == 1 and msgs[0]['to'] == 'murphy' and msgs[0]['from'] == 'alex' and msgs[0]['urgent'] == (level == 'urgent') and msgs[0]['level'] == level, str(msgs)[:200])
            await pg.reload(); await pg.wait_for_timeout(300)
            cnt = await pg.evaluate("document.querySelectorAll('.chat-bub[data-level] .chat-sent').length"); chk(f'sent state survives reload [{lang},{level}]', cnt == 1 and await pg.evaluate("!document.querySelector('[data-act=sendsum]')"))
            await pg.evaluate(f"localStorage.setItem('avega-user','murphy');localStorage.setItem('avega-lang','{lang}')"); await pg.goto(U + '#mission-notes'); await pg.reload(); await pg.wait_for_timeout(400)
            t = await pg.evaluate("[...document.querySelectorAll('.msg-list')].pop().innerText")
            head = 'Сводка опроса' if lang == 'ru' else 'Interview summary'
            chk(f'doctor sees the summary [{lang},{level}]', head in t and ('Alex Carter' in t) and (('Космическая болезнь движения' in t) if lang == 'ru' else ('Space motion sickness' in t)), t[:200])
            chk(f'doctor sees urgent chip only at level 1 [{lang},{level}]', (('срочно' in t) if lang == 'ru' else ('urgent' in t)) == (level == 'urgent'), t[:120])
            await scan(pg, lang, f'doctor notes with summary [{level}]')
    # red-flag-style source: question list not duplicated by pressing twice
    await setup(pg, 'alex', 'ru', full='0'); r, _ = await run_iv(pg, 'болит голова')
    await pg.evaluate("document.querySelector('.chat-bub[data-level] [data-act=tick]').click()"); await pg.wait_for_timeout(80)
    tick = await pg.evaluate("JSON.parse(localStorage.getItem([...Object.keys(localStorage)].find(k=>k.startsWith('avega-sym-alex')))||'[]')"); chk('«Записать в журнал симптомов» ticks the symptom', tick == ['headache'], str(tick))
    await setup(pg, 'alex', 'ru', full='0'); r, _ = await run_iv(pg, 'пропал аппетит'); has = await pg.evaluate("!!document.querySelector('.chat-bub[data-level] [data-act=tick]')"); chk('no symptom-log button where the entry has no tracked symptom', not has)

# ---- full screen ----
async def geom(pg):
    return await pg.evaluate("""()=>{const r=document.querySelector('.chat.is-full');if(!r)return null;const b=r.getBoundingClientRect(),c=r.querySelector('.chat-col').getBoundingClientRect();
      const top=(x,y)=>{const e=document.elementFromPoint(x,y);return !!(e&&e.closest('.chat.is-full'))};
      return {x:b.x,y:b.y,w:b.width,h:b.height,iw:innerWidth,ih:innerHeight,col:c.width,sidebar:top(60,300),bottom:top(700,innerHeight-10),parent:r.parentElement.tagName,lock:getComputedStyle(document.documentElement).overflow}}""")
async def overflow(pg):
    return await pg.evaluate("""()=>{const r=document.querySelector('.chat'),out=[];const root=r.getBoundingClientRect();
      r.querySelectorAll('*').forEach(e=>{const b=e.getBoundingClientRect();if(b.width&&(b.right>root.right+1||b.left<root.left-1))out.push(e.className||e.tagName)});
      const l=document.querySelector('#chat-log');return {page:document.documentElement.scrollWidth>innerWidth,log:l.scrollWidth>l.clientWidth+1,kids:out.slice(0,5)}}""")
async def t_full(pg, b):
    await setup(pg, 'alex', 'ru', chat=['болит голова'])
    g = await geom(pg)
    chk('full-screen is on by default', g is not None and g['parent'] == 'BODY', str(g))
    chk('overlay covers the whole viewport', g and g['x'] == 0 and g['y'] == 0 and abs(g['w'] - g['iw']) < 1 and abs(g['h'] - g['ih']) < 1, str(g))
    chk('overlay is above the sidebar and the demo footer', g and g['sidebar'] and g['bottom'], str(g))
    chk('page behind does not scroll (overflow hidden)', g and g['lock'] == 'hidden', str(g))
    chk('content column <= 860 px and centred', g and g['col'] <= 861, str(g))
    chk('toggle says «Свернуть» in full-screen', 'Свернуть' in await pg.inner_text('#chat-fs'))
    await pg.keyboard.press('Escape'); await pg.wait_for_timeout(100)
    chk('Esc leaves full-screen', await geom(pg) is None)
    chk('card is back in the page', await pg.evaluate("!!document.querySelector('#view .chat') && !document.querySelector('.chat.is-full')"))
    chk('Esc is remembered (avega-chat-full = 0)', await pg.evaluate("localStorage.getItem('avega-chat-full')") == '0')
    chk('conversation kept across the toggle', await pg.evaluate("document.querySelectorAll('.chat-msg.me').length") == 1)
    chk('toggle says «На весь экран» in the card', 'На весь экран' in await pg.inner_text('#chat-fs'))
    await pg.reload(); await pg.wait_for_timeout(350); chk('choice survives reload (card)', await geom(pg) is None and await pg.evaluate("!!document.querySelector('#view .chat')"))
    await pg.click('#chat-fs'); await pg.wait_for_timeout(100); g = await geom(pg); chk('«На весь экран» opens it', g is not None)
    chk('opening is remembered', await pg.evaluate("localStorage.getItem('avega-chat-full')") == '1')
    await pg.reload(); await pg.wait_for_timeout(350); chk('choice survives reload (full)', await geom(pg) is not None)
    await pg.click('#chat-fs'); await pg.wait_for_timeout(100); chk('«Свернуть» closes it', await geom(pg) is None and await pg.evaluate("localStorage.getItem('avega-chat-full')") == '0')
    await pg.click('#chat-fs'); await pg.click('#chat-x'); await pg.wait_for_timeout(100); chk('× closes it', await geom(pg) is None)
    # in card mode the input is visible without scrolling
    for vh in (700, 800, 1000):
        await pg.set_viewport_size({'width': 1440, 'height': vh}); await setup(pg, 'alex', 'ru', chat=['болит голова'], full='0'); await pg.wait_for_timeout(150)
        r = await pg.evaluate("()=>{const f=document.querySelector('#chat-form').getBoundingClientRect(),d=document.querySelector('.demobar').getBoundingClientRect();return {bottom:f.bottom,top:f.top,dtop:d.top,ih:innerHeight,sy:scrollY}}")
        chk(f'card: input visible without scrolling at height {vh}', r['top'] > 0 and r['bottom'] <= r['dtop'] + 1, str(r))
    await pg.set_viewport_size({'width': 1440, 'height': 1000})
    # leaving the tab closes the overlay; dashboard button opens it
    await setup(pg, 'alex', 'ru'); await pg.evaluate("location.hash='#dashboard'"); await pg.wait_for_timeout(200)
    chk('leaving the chat tab closes the overlay', await geom(pg) is None and await pg.evaluate("getComputedStyle(document.documentElement).overflow") != 'hidden')
    await pg.click('a[href="#support-chat"]'); await pg.wait_for_timeout(250); chk('«Спросить ассистента» opens full-screen', await geom(pg) is not None)
    await pg.evaluate("location.hash='#history'"); await pg.wait_for_timeout(200); chk('history reachable after the overlay (nothing in front)', await pg.evaluate("document.elementFromPoint(700,300).closest('.chat')===null"))
    await setup(pg, 'murphy', 'ru', hash_='support-chat'); chk('doctor: no overlay', await geom(pg) is None)
    # overflow at three widths, both themes, both modes, an outcome on screen
    for theme in ('dark', 'light'):
        for w in (1440, 1000, 390):
            for full in ('1', '0'):
                await pg.set_viewport_size({'width': w, 'height': 900})
                await setup(pg, 'alex', 'en' if w == 390 else 'ru', theme=theme, full=full)
                await ask(pg, 'мне тревожно' if w != 390 else 'I feel anxious'); await press(pg, 's1'); await press(pg, 'd3'); await press(pg, 'n'); await pg.wait_for_timeout(100)
                o = await overflow(pg); chk(f'no horizontal overflow {w}px {theme} full={full}', not o['page'] and not o['log'] and not o['kids'], str(o))
                if w in (390, 1440) and full == '1': await pg.screenshot(path=f'{OUT}/v2_ov_{w}_{theme}.png')
    await pg.set_viewport_size({'width': 1440, 'height': 1000})

# ---- merged page ----
async def active_tab(pg): return await pg.evaluate("(document.querySelector('.subtabs .tab.active')||{}).innerText||''")
async def t_merge(pg, b):
    for h, tab in (('cognitive', 'Набор тестов'), ('cognitive-tests', 'Набор тестов'), ('cognitive-results', 'Результаты'), ('cognitive-setup', 'Набор тестов'), ('psychology', 'Набор тестов'), ('psychology-dynamics', 'Динамика'), ('psychology-stress', 'Динамика'), ('psychology-checkin', 'Набор тестов'), ('psychology-crew', 'Набор тестов')):
        await setup(pg, 'alex', 'ru', hash_=h); title = await pg.inner_text('#page-title')
        chk(f'#{h} opens tab «{tab}» of the merged page', await active_tab(pg) == tab and title == 'Психология', f'{await active_tab(pg)} / {title}')
    await setup(pg, 'alex', 'ru', hash_='cognitive-results'); t = await pg.evaluate("document.querySelector('#view').innerText"); chk('old cognitive results content is there', 'Сводный балл' in t)
    tabs = await pg.evaluate("[...document.querySelectorAll('.subtabs .tab')].map(e=>e.innerText)"); chk('tabs: Набор тестов, Результаты, Динамика', tabs == ['Набор тестов', 'Результаты', 'Динамика'], str(tabs))
    for lang, name in (('ru', 'Психология'), ('en', 'Psychology')):
        await setup(pg, 'alex', lang, hash_='dashboard'); nav = await pg.evaluate("[...document.querySelectorAll('#nav .nav-item')].map(e=>e.innerText.trim())")
        chk(f'nav [{lang}]: merged item present, no separate Cognitive item', name in nav and not any((n == 'Cognitive Tests' or n == 'Когнитивные тесты') for n in nav) and len(nav) == 12, str(nav))
        chk(f'nav [{lang}]: no data-p=cognitive', await pg.evaluate("!document.querySelector('#nav [data-p=cognitive]')"))
    # overview numbers = History numbers
    for user in ('alex', 'mira'):
        await setup(pg, user, 'en', hash_='psychology-dynamics'); ov = {}
        for k in ('mood', 'stress', 'energy', 'cog'):
            ov[k] = await pg.evaluate("(k)=>{const tds=[...document.querySelectorAll('#view tr[data-k=\"'+k+'\"] td')].map(e=>e.innerText.trim());return tds}", k)
        for k in ('mood', 'stress', 'energy', 'cog'):
            await pg.evaluate("location.hash='#history'"); await pg.wait_for_timeout(250)
            await pg.click(f'#h-metrics [data-k="{k}"]'); await pg.wait_for_timeout(150)
            await pg.evaluate("document.querySelector('#h-scales [data-k=hour]').click()"); await pg.click('#h-latest'); await pg.wait_for_timeout(150)
            rows = await pg.evaluate("[...document.querySelectorAll('#h-table tbody tr')].map(r=>[...r.querySelectorAll('td')].map(e=>e.innerText.trim()))")
            last = rows[-1] if rows else None
            # History day view: event rows -> [time, event, value, vs norm]
            cands = [r for r in rows if len(r) >= 4]
            val = ov[k][1].replace('\n', ' ') if len(ov[k]) > 3 else ''; dev = ov[k][3] if len(ov[k]) > 3 else ''
            match = any(r[2].replace('\xa0', ' ') == val.replace('\xa0', ' ') and r[3].replace('\xa0', ' ') == dev.replace('\xa0', ' ') for r in cands)
            chk(f'overview {k} [{user}] latest value and deviation equal the History events row', match, f'ov={ov[k]} hist={cands[-2:]}')
        # correlations equal the matrix
        await pg.evaluate("location.hash='#correlations'"); await pg.wait_for_timeout(250)
        mat = await pg.evaluate("(()=>{const rows=[...document.querySelectorAll('.cmx tbody tr')];const heads=[...document.querySelectorAll('.cmx thead th')].map(e=>e.innerText.trim()).slice(1);const o={};rows.forEach(r=>{const a=r.querySelector('th').innerText.trim();[...r.querySelectorAll('td')].forEach((td,i)=>{o[a+'|'+heads[i]]=td.innerText.trim()})});return o})()")
        await pg.evaluate("location.hash='#psychology-dynamics'"); await pg.wait_for_timeout(250)
        pr = await pg.evaluate("[...document.querySelectorAll('#view tr[data-a]')].map(r=>[r.querySelectorAll('td')[0].innerText.replace(' and ','|').trim(), r.querySelectorAll('td')[1].innerText.trim(), r.querySelectorAll('td')[2].innerText.trim()])")
        ok = len(pr) == 10 and all(mat.get(a) == r for a, r, _ in pr); chk(f'overview 10 correlation pairs equal the Correlations matrix [{user}]', ok, str(pr[:3]) + str(list(mat.items())[:3]))
        chk(f'overview has the correlation caveat [{user}]', 'Correlation does not prove causation' in await pg.evaluate("document.querySelector('#view').innerText"))
    await setup(pg, 'murphy', 'ru', hash_='psychology-dynamics'); n = await pg.evaluate("document.querySelectorAll('#view tr[data-k]').length"); chk('doctor sees the merged page overview for the selected astronaut', n == 4 and await active_tab(pg) == 'Динамика', str(n))
    await pg.evaluate("location.hash='#cognitive-results'"); await pg.wait_for_timeout(200); chk('doctor: old hash works', await active_tab(pg) == 'Результаты')

# ---- language scan of every interview question, outcome and entry ----
LAB = {'s1': 'Слабо: работать не мешает', 's2': 'Средне: мешает, но работать могу', 's3': 'Сильно: не могу работать или спать', 'd0': 'Сегодня', 'd1': '2–3 дня', 'd2': 'Больше трёх дней', 'd3': 'Больше недели', 'y': 'Да', 'n': 'Нет', 'u': 'Не знаю', 'skip': 'Пропустить вопросы'}
def entries_for(cid, level, stop=None):
    q, q1, q2, dur, marks = ASK_T[cid]; e = [{'t': q, 'a': None}]; steps = []
    if q1: steps.append('sev')
    if q2: steps.append('dur')
    steps += ['flag'] * len(marks); fi = 0
    for n, k in enumerate(steps):
        if stop is not None and n >= stop: break
        if k == 'sev': c = 's3' if level == 'urgent' else 's1'
        elif k == 'dur': c = f'd{dur}' if (level == 'tell' and dur is not None) else 'd0'
        else:
            c = 'n'
            if fi == 0 and level == 'urgent' and marks[0] == 'U': c = 'y'
            if fi == 0 and level == 'tell' and marks[0] == 'T': c = 'y'
            fi += 1
        e.append({'t': LAB[c], 'a': c})
    return e
def chunks(lists, cap=28):
    cur = []
    for l in lists:
        if cur and len(cur) + len(l) > cap: yield cur; cur = []
        cur = cur + l
    if cur: yield cur
async def t_scan(pg, b):
    ids17 = [(KB_IDS[i], Q17[KB_IDS[i]][0]) for i in range(17)]
    v1 = [[{'t': q, 'a': None}, {'t': LAB['skip'], 'a': 'skip'}] if cid in ASK_T else [{'t': q, 'a': None}] for cid, q in ids17]
    outs = [entries_for(cid, lv) for lv in ('watch', 'tell', 'urgent') for cid in ASK_T]
    parts = [[{'t': 'мне плохо', 'a': None}], [{'t': 'меня тошнит', 'a': None}], [{'t': 'меня тошнит', 'a': None}, {'t': LAB['s2'], 'a': 's2'}], [{'t': 'меня тошнит', 'a': None}, {'t': LAB['s2'], 'a': 's2'}, {'t': LAB['d1'], 'a': 'd1'}],
             [{'t': 'мне плохо', 'a': None}, {'t': 'Сон', 'a': 'q0:sleep'}], [{'t': 'мне плохо', 'a': None}, {'t': 'Сердце или грудь', 'a': 'q0:red:chest'}], [{'t': 'мне плохо', 'a': None}, {'t': 'Другое', 'a': 'q0:none'}]]
    groups = list(chunks(v1)) + list(chunks(outs)) + parts
    for user in ('alex', 'mira', 'daniel', 'yuki'):
        for lang in ('ru', 'en'):
            nb = 0; seen = {'sum': 0, 'lv': set()}
            for gi, g in enumerate(groups):
                await setup(pg, user, lang, chat=g, full='1' if gi % 2 == 0 else '0')
                txt = await pg.evaluate(CLEAN); pat = r'[A-Za-z]{3,}' if lang == 'ru' else r'[А-Яа-яЁё]+'
                bad = sorted({w for w in re.findall(pat, txt) if w not in ALLOW}); nb += 1
                if ('Interview summary' in txt) or ('Сводка опроса' in txt): seen['sum'] += 1
                for w_ in ('Urgent', 'Срочно', 'Tell the doctor', 'Сообщить врачу', 'Watch', 'Наблюдать'): 
                    if w_ in txt: seen['lv'].add(w_)
                if bad: chk(f'scan interview/entries {user} {lang} group {gi}', False, str(bad[:12]))
            chk(f'scan interview questions, 3 outcome levels, 17 entries: {user} {lang} ({nb} chats) really rendered summaries and all 3 levels', seen['sum'] >= 3 and len(seen['lv']) >= 3, str(seen))

async def t_extra(pg, b):
    await setup(pg, 'alex', 'ru', full='0'); r, _ = await run_iv(pg, 'болит голова и плохо сплю')
    chk('two topics: interview for the first, v1 answer of the second after the outcome', r['i'] in ('co2+sleep', 'sleep+co2') and r['l'] in ('watch', 'tell') and 'Недосып и сбой режима' in r['t'] and r['t'].index('Уровень определён') < r['t'].index('Недосып и сбой режима'), r['i'] + r['l'])
    await setup(pg, 'alex', 'ru', full='0'); await ask(pg, 'какая столица Франции'); await ask(pg, 'что делать'); r = await last_bot(pg); chk('follow-up after fallback still gives fallback', r['i'] == 'none', r['i'])
    await ask(pg, 'меня тошнит'); await press(pg, 'skip'); await ask(pg, 'что делать'); r = await last_bot(pg); chk('follow-up after a skipped interview reuses the topic (v1)', r['i'] == 'sms' and r['q'] == '', r['i'])
    await setup(pg, 'alex', 'ru', full='0'); r, _ = await run_iv(pg, 'меня тошнит'); await ask(pg, 'что делать'); r = await last_bot(pg); chk('follow-up after an outcome reuses the topic (v1)', r['i'] == 'sms' and r['q'] == '' and r['l'] == '', r['i'])
    await setup(pg, 'alex', 'ru', full='0'); await ask(pg, 'жарко в отсеке весь день'); r = await last_bot(pg); chk('«жарко», «весь» do not start food/microbe interviews', r['i'] == 'none', r['i'])

SECTIONS = [('cover', t_cover), ('iv', t_iv), ('q0', t_q0), ('typed', t_typed), ('reload', t_reload), ('send', t_send), ('full', t_full), ('merge', t_merge), ('extra', t_extra), ('scan', t_scan)]
async def main():
    async with async_playwright() as p: await run(p)
    print(f'RESULT c2 passed {passed}/{total}; page errors {len(errs)}', errs[:5])
    for f in fails: print('FAILED:', f)
if __name__ == '__main__': asyncio.run(main())
