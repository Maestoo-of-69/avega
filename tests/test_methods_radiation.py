import asyncio
from playwright.async_api import async_playwright
import pathlib, os
ROOT = pathlib.Path(__file__).resolve().parent.parent
APP = ROOT / 'index.html'
PROTO = ROOT / 'prototype'
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
CHROME = os.environ.get('CHROME', '/usr/bin/google-chrome')
U=APP.as_uri()
res=[]
def chk(n,c,d=''): res.append(c); print('PASS' if c else 'FAILED', n, '' if c else d)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1440,'height':1000}); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(U); await pg.evaluate("localStorage.clear();localStorage.setItem('avega-user','alex');localStorage.setItem('avega-lang','ru')")
        await pg.goto(U+'#psychology'); await pg.reload(); await pg.wait_for_timeout(500)
        chk('title Психология', (await pg.inner_text('#page-title'))=='Психология')
        await pg.click('.ins[data-id=nar] .ins-act'); await pg.wait_for_timeout(300)
        chk('catalogue → #creative', 'creative' in pg.url)
        chk('next disabled empty', await pg.is_disabled('#cre-next'))
        for k in range(5):
            if k==2: await pg.click('#cre-skip'); await pg.wait_for_timeout(150); continue
            await pg.fill('#cre-ta', f'Ответ {k}: я бы позвал экипаж вместе'); await pg.click('#cre-next'); await pg.wait_for_timeout(150)
        t=await pg.inner_text('#view'); chk('result screen', 'Задание завершено' in t and '4 / 5' in t, t[:200])
        await pg.goto(U+'#psychology'); await pg.wait_for_timeout(300)
        chk('status updated', 'Пройдено' in await pg.inner_text('.ins[data-id=nar]'))
        await pg.goto(U+'#crew-connection'); await pg.wait_for_timeout(300)
        chk('4 cards', await pg.evaluate("document.querySelectorAll('.cc-card').length")==4)
        await pg.click('.cc-card[href$=creative]'); await pg.wait_for_timeout(300)
        await pg.click('.cc-q[data-k="0"]'); await pg.click('.cc-q[data-k="2"]'); await pg.wait_for_timeout(100)
        chk('2 selected', 'Выбрано 2' in await pg.inner_text('#view'))
        await pg.click('#cc-start'); await pg.wait_for_timeout(200)
        await pg.click('.cc-who-b[data-id=mira]'); await pg.click('#cc-next'); await pg.wait_for_timeout(150); await pg.click('#cc-next'); await pg.wait_for_timeout(400)
        t=await pg.inner_text('#view'); chk('results after session', 'results' in pg.url and 'Сессий' in t, pg.url)
        await pg.goto(U+'#crew-connection'); await pg.wait_for_timeout(300)
        chk('progress 50%', '50%' in await pg.inner_text('.cc-prog'))
        await pg.goto(U+'#radiation'); await pg.wait_for_timeout(300)
        t=await pg.inner_text('#view'); chk('radiation kpis', 'мкГр/ч' in t and 'мГр' in t and '600' in t)
        for h in ('radiation-physiology','radiation-device'):
            await pg.goto(U+'#'+h); await pg.wait_for_timeout(250); chk(h+' renders', len(await pg.inner_text('#view'))>200)
        await pg.evaluate("localStorage.setItem('avega-user','murphy')"); await pg.goto(U+'#creative'); await pg.reload(); await pg.wait_for_timeout(500)
        chk('doctor sees privacy note only', 'личные' in await pg.inner_text('#view') and not await pg.query_selector('#cre-ta'))
        await pg.goto(U+'#crew-connection-games'); await pg.wait_for_timeout(300); chk('doctor start disabled', await pg.is_disabled('#cc-start'))
        chk('no page errors', not errs, errs)
        await b.close()
    print('RESULT', sum(res), len(res))
asyncio.run(main())
