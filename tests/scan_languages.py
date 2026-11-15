import asyncio,re
from playwright.async_api import async_playwright
import pathlib, os
ROOT = pathlib.Path(__file__).resolve().parent.parent
APP = ROOT / 'index.html'
PROTO = ROOT / 'prototype'
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
CHROME = os.environ.get('CHROME', '/usr/bin/google-chrome')
U=APP.as_uri()
ALLOW={'AVEGA','NASA','UTC','HRV','SpO','Alex','Carter','D','n','CSV','JSON','ВСР','SD','СО','T','Mira','Okafor','Daniel','Reyes','Yuki','Tanaka','Dr','Eileen','Murphy','REFERENCES','docs','md','C','R','P','r','SANS','CO','S'}
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1440,'height':1000})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        for user in ['alex','mira','daniel','yuki','murphy']:
          for h in ['radiation','radiation-physiology','radiation-device','creative','crew-connection','crew-connection-all','crew-connection-memories','crew-connection-games-results','support-handbook','dashboard','correlations','correlations-lags','correlations-explain','alerts','support','support-chat','support-reco','support-contact','mission','mission-notes','psychology','psychology-stress','cognitive','cognitive-results','cognitive-setup']:
            for lang in ['ru','en']:
                await pg.goto(U+'#'+h); await pg.evaluate(f"localStorage.setItem('avega-user','{user}');localStorage.setItem('avega-lang','{lang}')"); await pg.reload(); await pg.wait_for_timeout(350)
                txt = await pg.evaluate("document.body.innerText")
                pat = r'[A-Za-z]{3,}' if lang=='ru' else r'[А-Яа-яЁё]+'
                bad = sorted({w for w in re.findall(pat, txt) if w not in ALLOW})
                if bad: print(user,h,lang,bad[:12])
            if user in('alex','daniel'):
                await pg.evaluate("localStorage.setItem('avega-lang','ru')"); await pg.reload(); await pg.wait_for_timeout(300); await pg.screenshot(path=f'{OUT}/e_{user}_{h}.png')
        print('errs',errs)
        await b.close()
asyncio.run(main())
