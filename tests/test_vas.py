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
def chk(n,c,d=''): res.append(c); print('PASS' if c else 'FAILED', n, d if not c else '')
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1440,'height':1000}); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(U); await pg.evaluate("localStorage.clear();localStorage.setItem('avega-user','alex');localStorage.setItem('avega-lang','ru')"); await pg.goto(U+'#psychology-tests'); await pg.reload(); await pg.wait_for_timeout(600)
        rows=await pg.evaluate("document.querySelectorAll('.ins-row').length"); chk('8 rows (6+2)', rows==8, rows)
        await pg.click('.ins[data-id=vas] .ins-act'); await pg.wait_for_timeout(300)
        sl=await pg.evaluate("document.querySelectorAll('.vas input[type=range]').length"); chk('VAS form has 7 sliders', sl==7, sl)
        dis=await pg.evaluate("[...document.querySelectorAll('.vas button')].some(b=>b.disabled)"); chk('save disabled until touched', dis)
        await pg.evaluate("(()=>{const i=document.querySelector('.vas input[type=range]');i.value=70;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}))})()"); await pg.wait_for_timeout(200)
        en=await pg.evaluate("[...document.querySelectorAll('.vas button')].some(b=>!b.disabled)"); chk('save enabled after touch', en)
        await pg.evaluate("[...document.querySelectorAll('.vas button')].find(b=>!b.disabled && /Сохран/.test(b.innerText)).click()"); await pg.wait_for_timeout(400)
        t=await pg.inner_text('.ins[data-id=vas] .ins-row'); chk('VAS status today', 'Сегодня' in t and 'не пройдено' not in t, t)
        await pg.goto(U+'#psychology-results'); await pg.wait_for_timeout(400)
        t=await pg.inner_text('#view'); chk('results show VAS table', 'VAS' in t and '70' in t)
        await pg.evaluate("localStorage.setItem('avega-user','murphy')"); await pg.goto(U+'#psychology-tests'); await pg.reload(); await pg.wait_for_timeout(600)
        n=await pg.evaluate("document.querySelectorAll('.ins-row').length"); chk('doctor sees rows', n==8)
        await pg.click('.ins[data-id=vas] .ins-act').catch(lambda e: None) if False else None
        chk('no page errors', not errs, errs)
        await b.close()
    print('RESULT', sum(res), len(res))
asyncio.run(main())
