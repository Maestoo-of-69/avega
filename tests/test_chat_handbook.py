import asyncio, re, sys, json
from playwright.async_api import async_playwright
import pathlib, os
ROOT = pathlib.Path(__file__).resolve().parent.parent
APP = ROOT / 'index.html'
PROTO = ROOT / 'prototype'
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
CHROME = os.environ.get('CHROME', '/usr/bin/google-chrome')
U = APP.as_uri()
ALLOW = {'AVEGA','NASA','UTC','HRV','SpO','Alex','Carter','D','n','CSV','JSON','ВСР','SD','СО','T','Mira','Okafor','Daniel','Reyes','Yuki','Tanaka','Dr','Eileen','Murphy','REFERENCES','docs','md','C','R','P','r','SANS','CO','S','N'}
NODRUG_RU = 'Лекарства — только по бортовому медицинскому протоколу и указанию врача'
NODRUG_EN = 'Medicines only under the on-board medical protocol and as directed by the doctor'
RU_Q = [('У меня болит голова','co2'),('болит голова и плохо сплю','co2+sleep|sleep+co2'),('меня тошнит','sms'),('кружится голова','~cardio'),
 ('сыпь на губах','immune'),('мне тревожно и одиноко','bhv'),('боль в груди','red-chest'),('я не хочу жить','red-selfharm'),('стало хуже зрение','red-vision'),
 ('какую таблетку выпить','drug'),('какую таблетку выпить от головы','co2'),('как я сейчас','status'),('от чего зависит мой сон','sleep'),
 ('когда ответит врач','doctor'),('кто ты','about'),('какая столица Франции','none')]
EN_Q = [('I have a headache','co2'),("I can't sleep",'sleep'),('chest pain','red-chest'),('what is the capital of France','none')]
SEED = ['Привет','как я сейчас','У меня болит голова','болит голова и плохо сплю','меня тошнит','кружится голова','сыпь на губах','мне тревожно и одиноко','боль в груди','я не хочу жить',
 'стало хуже зрение','трудно дышать','какую таблетку выпить','какую таблетку выпить от головы','от чего зависит мой сон','когда ответит врач','кто ты','какая столица Франции',
 'спина болит','болят кости','радиация','пульс','стресс','настроение','устал','внимание','от чего это зависит','что делать','Космическая болезнь движения','Нейроокулярный синдром (SANS)','Психологическое состояние',
 'Heart rate','Cognitive','Energy','Mood','Stress','Sleep']
passed = total = 0; fails = []; errs = []
def chk(name, ok, info=''):
    global passed, total
    total += 1
    if ok: passed += 1
    else: fails.append(f'{name} {info}')
    print(('PASS ' if ok else 'FAIL ') + name, info if not ok else '')
async def setup(pg, user, lang, hash_='support-chat', theme=None, chat=None):
    await pg.goto(U + '#' + hash_)
    await pg.evaluate("([u,l,t,c])=>{localStorage.clear();localStorage.setItem('avega-user',u);localStorage.setItem('avega-lang',l);if(t)localStorage.setItem('avega-theme',t);if(c)localStorage.setItem('avega-chat-'+u,JSON.stringify(c));}", [user, lang, theme, chat])
    await pg.reload(); await pg.wait_for_timeout(400)
async def ask(pg, q):
    await pg.fill('#chat-in', q); await pg.press('#chat-in', 'Enter'); await pg.wait_for_timeout(60)
async def last_bot(pg):
    return await pg.evaluate("()=>{const b=[...document.querySelectorAll('.chat-msg.bot .chat-bub')].pop();return b?{i:b.dataset.intent,t:b.innerText}:null}")
CLEAN = """()=>{const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const o=[];for(let n=w.nextNode();n;n=w.nextNode()){const e=n.parentElement;if(!e||e.closest('[data-raw],.ref-title,script,style'))continue;o.push(n.data)}return o.join(' ')}"""
async def scan(pg, lang, label):
    txt = await pg.evaluate(CLEAN)
    pat = r'[A-Za-z]{3,}' if lang == 'ru' else r'[А-Яа-яЁё]+'
    bad = sorted({w for w in re.findall(pat, txt) if w not in ALLOW})
    chk(f'scan {label} {lang}', not bad, str(bad[:15]))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1440, 'height': 1000})
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        # 1. queries
        for lang, Q in (('ru', RU_Q), ('en', EN_Q)):
            await setup(pg, 'alex', lang)
            for q, exp in Q:
                await pg.click('#chat-clear'); await ask(pg, q); r = await last_bot(pg)
                if exp.startswith('~'): ok = exp[1:] in r['i'].split('+')
                else: ok = r['i'] in exp.split('|')
                chk(f'query[{lang}] {q!r}', ok, f'got {r["i"]} expected {exp}')
                if q == 'какую таблетку выпить от головы': chk('nodrug in co2+drug reply', NODRUG_RU in r['t'], r['t'][:200])
        # 2. user text unchanged both languages, escaped
        raw = '<b>Врач</b> Пульс и сон & болит голова'
        for lang in ('ru', 'en'):
            await setup(pg, 'alex', lang); await ask(pg, raw)
            t = await pg.evaluate("document.querySelector('.chat-msg.me .chat-bub').innerText"); h = await pg.evaluate("document.querySelector('.chat-msg.me .chat-bub').innerHTML")
            chk(f'user text unchanged {lang}', t == raw and '<b>' not in h, t)
        # switch language with text stored: still unchanged
        await pg.evaluate("localStorage.setItem('avega-lang','ru')"); await pg.reload(); await pg.wait_for_timeout(300)
        t = await pg.evaluate("document.querySelector('.chat-msg.me .chat-bub').innerText"); chk('user text after lang switch', t == raw)
        # 3. reload restores
        await setup(pg, 'alex', 'ru'); await ask(pg, 'меня тошнит'); await ask(pg, 'кто ты')
        await pg.reload(); await pg.wait_for_timeout(300)
        n = await pg.evaluate("document.querySelectorAll('.chat-msg.me').length"); last = await last_bot(pg)
        chk('reload restores conversation', n == 2 and last['i'] == 'about', f'{n} {last and last["i"]}')
        # max 30
        await setup(pg, 'alex', 'ru', chat=['кто ты'] * 35); n = await pg.evaluate("document.querySelectorAll('.chat-msg.me').length")
        await ask(pg, 'привет'); n2 = await pg.evaluate("document.querySelectorAll('.chat-msg.me').length"); st = await pg.evaluate("JSON.parse(localStorage.getItem('avega-chat-alex')).length")
        chk('max 30 stored', n2 == 30 and st == 30, f'{n} {n2} {st}')
        # 4. follow-up uses previous topic
        await setup(pg, 'alex', 'ru'); await ask(pg, 'меня тошнит'); await ask(pg, 'что делать'); r = await last_bot(pg); chk('follow-up -> sms', r['i'] == 'sms', r['i'])
        # 5. send to doctor (normal + urgent), tick symptom, clear, separate accounts
        await setup(pg, 'alex', 'ru'); await ask(pg, 'меня тошнит'); await pg.click('.chat-bub[data-intent="sms"] [data-a="skip"]'); await pg.wait_for_timeout(100)   # v2: the interview starts first; skip -> v1 answer
        await pg.click('.chat-bub[data-intent="sms"] button[data-act="send"]'); await pg.wait_for_timeout(100)
        sent = await pg.evaluate("document.querySelector('.chat-sent').innerText"); chk('sent confirmation', 'Отправлено врачу' in sent and '26' in sent, sent)
        await pg.click('.chat-bub[data-intent="sms"] button[data-act="tick"]'); await pg.wait_for_timeout(100)
        tick = await pg.evaluate("JSON.parse(localStorage.getItem([...Object.keys(localStorage)].find(k=>k.startsWith('avega-sym-alex')))||'[]')"); chk('tick adds symptom', tick == ['nausea'], str(tick))
        await ask(pg, 'боль в груди'); await pg.click('.chat-bub[data-intent="red-chest"] button[data-act="send"]'); await pg.wait_for_timeout(100)
        msgs = await pg.evaluate("JSON.parse(localStorage.getItem('avega-msgs'))")
        chk('msgs shape', len(msgs) == 2 and msgs[0]['from'] == 'alex' and msgs[0]['to'] == 'murphy' and msgs[0]['text'] == 'меня тошнит' and msgs[0]['urgent'] is False and msgs[1]['urgent'] is True and msgs[1]['at'], str(msgs))
        await pg.reload(); await pg.wait_for_timeout(300)
        cnt = await pg.evaluate("document.querySelectorAll('.chat-bub .chat-sent').length"); chk('sent state survives reload', cnt >= 2, str(cnt))
        # other crew account has separate conversation
        await pg.evaluate("localStorage.setItem('avega-user','mira')"); await pg.reload(); await pg.wait_for_timeout(300)
        n = await pg.evaluate("document.querySelectorAll('.chat-msg.me').length"); chk('other crew account: separate conversation', n == 0, str(n))
        await ask(pg, 'кто ты'); await pg.evaluate("localStorage.setItem('avega-user','alex')"); await pg.reload(); await pg.wait_for_timeout(300)
        n = await pg.evaluate("document.querySelectorAll('.chat-msg.me').length"); chk('alex conversation intact', n == 3, str(n))   # 2 typed + the «skip questions» answer
        # doctor
        for lang in ('ru', 'en'):
            await pg.evaluate(f"localStorage.setItem('avega-user','murphy');localStorage.setItem('avega-lang','{lang}')"); await pg.goto(U + '#mission-notes'); await pg.reload(); await pg.wait_for_timeout(400)
            t = await pg.evaluate("document.querySelector('.msg-list') ? document.body.innerText : ''")
            ok = 'меня тошнит' in t and 'боль в груди' in t and 'Alex Carter' in t and ('срочно' in t if lang == 'ru' else 'urgent' in t)
            chk(f'doctor sees crew questions {lang}', ok, t[-300:])
            first = await pg.evaluate("document.querySelector('.msg-list li p').innerText"); chk(f'newest first {lang}', first == 'боль в груди', first)
            await scan(pg, lang, 'doctor mission-notes')
        await pg.goto(U + '#support-chat'); await pg.reload(); await pg.wait_for_timeout(300)
        t = await pg.evaluate("document.body.innerText"); chk('doctor: no chat input', await pg.evaluate("!document.querySelector('#chat-in')") and 'Mission Control' in t)
        # existing readers still work (doctor messages to crew)
        await pg.evaluate("localStorage.setItem('avega-lang','ru')")
        await setup(pg, 'murphy', 'ru', 'mission-notes'); await pg.evaluate("localStorage.removeItem('avega-msgs')"); await pg.reload(); await pg.wait_for_timeout(300)
        t = await pg.evaluate("document.body.innerText"); chk('doctor empty state', 'Вопросов от экипажа пока нет.' in t)
        await pg.fill('#nf-text', 'тест врача'); await pg.click('#nf-send'); await pg.wait_for_timeout(200)
        await pg.evaluate("localStorage.setItem('avega-user','alex')"); await pg.goto(U + '#support-contact'); await pg.reload(); await pg.wait_for_timeout(300)
        t = await pg.evaluate("document.body.innerText"); chk('crew inbox still shows doctor message', 'тест врача' in t)
        # clear
        await setup(pg, 'alex', 'ru', chat=['кто ты', 'привет']); await pg.click('#chat-clear'); n = await pg.evaluate("document.querySelectorAll('.chat-msg.me').length")
        first = await last_bot(pg); chk('clear empties list', n == 0 and first['i'] == 'about' and await pg.evaluate("localStorage.getItem('avega-chat-alex')") == '[]')
        # dashboard button + routes
        await setup(pg, 'alex', 'ru', 'dashboard'); await pg.click('a[href="#support-chat"]'); await pg.wait_for_timeout(300)
        chk('dashboard button opens chat', await pg.evaluate("!!document.querySelector('#chat-in')"))
        await pg.goto(U + '#support'); await pg.reload(); await pg.wait_for_timeout(300); chk('#support opens chat (first tab)', await pg.evaluate("!!document.querySelector('#chat-in')"))
        # 6. full-language scans of every answer type, all crew accounts
        for user in ('alex', 'mira', 'daniel', 'yuki'):
            for lang in ('ru', 'en'):
                for part, ch in enumerate((SEED[:20], SEED[20:])):
                    await setup(pg, user, lang, chat=ch); n = await pg.evaluate("document.querySelectorAll('.chat-msg.bot').length")
                    await scan(pg, lang, f'seeded chat {user} part{part} ({n} answers)')
        # fallback chips lead to topic
        await setup(pg, 'alex', 'en', chat=['what is the capital of France'])
        names = await pg.evaluate("[...document.querySelectorAll('.chat-bub .chipb')].map(b=>b.dataset.q)"); chk('fallback chips = 17 KB + 6 indicators', len(names) == 23, str(len(names)))
        okc = True; bad = []
        for i in range(23):
            await setup(pg, 'alex', 'en', chat=['what is the capital of France'])
            await pg.evaluate(f"document.querySelectorAll('.chat-bub .chipb')[{i}].click()"); await pg.wait_for_timeout(60); r = await last_bot(pg)
            if r['i'] == 'none': okc = False; bad.append(i)
        chk('every fallback chip gives an answer (EN)', okc, str(bad))
        okc = True; bad = []
        for i in range(23):
            await setup(pg, 'alex', 'ru', chat=['какая столица Франции'])
            await pg.evaluate(f"document.querySelectorAll('.chat-bub .chipb')[{i}].click()"); await pg.wait_for_timeout(60); r = await last_bot(pg)
            if r['i'] == 'none': okc = False; bad.append(i)
        chk('every fallback chip gives an answer (RU)', okc, str(bad))
        # 7. screenshots + overflow
        demo = ['болит голова и плохо сплю', 'боль в груди', 'какую таблетку выпить от головы']
        for theme in ('dark', 'light'):
            await setup(pg, 'alex', 'ru', theme=theme, chat=demo)
            await pg.evaluate("document.querySelector('#chat-log').scrollTop=0")
            ov = await pg.evaluate("()=>{const l=document.querySelector('#chat-log');return [document.documentElement.scrollWidth>innerWidth, l.scrollWidth>l.clientWidth+1]}")
            chk(f'no horizontal overflow {theme}', ov == [False, False], str(ov))
            await pg.screenshot(path=f'{OUT}/chat_{theme}.png')
            await pg.evaluate("document.querySelector('#chat-log').scrollTop=document.querySelector('#chat-log').scrollHeight"); await pg.screenshot(path=f'{OUT}/chat_{theme}_bottom.png')
        await setup(pg, 'alex', 'ru', theme='light', chat=['болит голова'])
        await pg.set_viewport_size({'width': 390, 'height': 800}); await pg.wait_for_timeout(200)
        ov = await pg.evaluate("document.documentElement.scrollWidth>innerWidth"); chk('no horizontal overflow mobile', not ov); await pg.screenshot(path=str(OUT/'chat_mobile.png'))
        await b.close()
    print(f'RESULT queries+checks passed {passed}/{total}; page errors {len(errs)}', errs[:5])
    for f in fails: print('FAILED:', f)
asyncio.run(main())
