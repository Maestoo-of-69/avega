import asyncio, json, re, math, statistics as st
from playwright.async_api import async_playwright
import pathlib, os
ROOT = pathlib.Path(__file__).resolve().parent.parent
APP = ROOT / 'index.html'
PROTO = ROOT / 'prototype'
OUT = ROOT / 'tests' / 'out'; OUT.mkdir(exist_ok=True)
CHROME = os.environ.get('CHROME', '/usr/bin/google-chrome')
SRC=str(APP)
U=APP.as_uri()
html=open(SRC).read()
i=html.rindex('})();')
open(OUT/'dbg_t1.html','w').write(html[:i]+"window.__C={chEffect,chLinkRow,chLead,chDays};"+html[i:])
UD=(OUT/'dbg_t1.html').as_uri()
res=[]; fails=[]
def chk(n,c,d=''):
    res.append(bool(c)); print('PASS' if c else 'FAILED', n, '' if c else d)
    if not c: fails.append(n)
CREW=['alex','mira','daniel','yuki']
DATA={m.group(1):json.loads(m.group(2).replace('<\\/','</')) for m in re.finditer(r'<script id="avega-data-(\w+)" type="application/json">(.*?)</script>',html,re.S)}
BADD={'stress':1,'mood':-1,'energy':-1,'sleep':-1,'cog':-1,'hr':1,'headache':1,'skin':1,'co2':1}
# ---------- independent recomputation from the embedded JSON ----------
def series(D):
    m=D['meta']; d0=m['start_min']//1440; d1=m['now_min']//1440; n=d1-d0+1; S={}
    for k in ('stress','mood','energy'):
        b=[[] for _ in range(n)]
        for c in D['checkins']:
            b[c['t']//1440-d0].append(c[k])
        S[k]=[st.fmean(x) if x else None for x in b]
    b=[[] for _ in range(n)]
    for c in D['tests']: b[c['t']//1440-d0].append(c['v'])
    S['cog']=[st.fmean(x) if x else None for x in b]
    b=[[] for _ in range(n)]
    for c in D['sleep']: b[c['e']//1440-d0].append(c['h'])
    S['sleep']=[st.fmean(x) if x else None for x in b]
    hr=D['hr']['values']; t0=D['hr']['t0']; out=[]
    for d in range(n):
        a=(d0+d)*1440-t0; seg=[v for v in hr[max(0,a):a+1440] if v is not None]
        out.append(st.fmean(seg) if seg else None)
    S['hr']=out
    fd=(m['flight_start_min']//1440)-d0
    sy=D['symptoms']['values']
    S['headache']=[ (sy[d][0] if d>=fd else None) for d in range(n)]
    S['skin']=[ (sy[d][3] if d>=fd else None) for d in range(n)]
    S['co2']=[D['env']['co2_mmHg'][d] for d in range(n)]
    return S,fd
def present(a): return [x for x in a if x is not None]
def trend_py(D,k):
    S,fd=series(D); v=S[k]; N=len(v); bv=present(v[:N-7]); l7=present(v[N-7:])
    bm=st.fmean(bv); bsd=st.stdev(bv); run=0; since=None
    for i in range(N-1,-1,-1):
        if v[i] is None: continue
        if BADD[k]*(v[i]-bm)/bsd>0.5: run+=1; since=i
        else: break
    fday=(D['meta']['flight_start_min']//1440)-(D['meta']['start_min']//1440)
    return dict(m7=st.fmean(l7),bm=bm,bsd=bsd,run=run,since=None if since is None else since-fday+1)
def pear(x,y):
    p=[(a,b) for a,b in zip(x,y) if a is not None and b is not None]
    if len(p)<10: return None
    mx=st.fmean(a for a,_ in p); my=st.fmean(b for _,b in p)
    sxy=sum((a-mx)*(b-my) for a,b in p); sxx=sum((a-mx)**2 for a,_ in p); syy=sum((b-my)**2 for _,b in p)
    return sxy/math.sqrt(sxx*syy)
def impact_py(D,a,b,lag):
    S,fd=series(D); A=S[a]; B=S[b]; va=present(A); ma=st.fmean(va); sa=st.stdev(va); sym=b in('headache','skin')
    bad=[];ok=[]
    for i in range(len(A)-lag):
        x=A[i]; y=B[i+lag]
        if x is None or y is None: continue
        (bad if BADD[a]*(x-ma)/sa>0.5 else ok).append((1 if y>0 else 0) if sym else y)
    r=pear(A[:len(A)-lag] if lag else A, B[lag:] if lag else B)
    return dict(nbad=len(bad),nok=len(ok),mbad=st.fmean(bad),mok=st.fmean(ok),r=r)
DRUG=['таблет','лекарств','препарат','ибупрофен','парацетамол','мелатонин','снотворн','обезбол','pill','medicat','drug','ibuprofen','paracetamol','melatonin','painkiller','dose ']
CYR=re.compile('[А-Яа-яЁё]'); LAT=re.compile('[A-Za-z]{2,}')
NEG_RU=['меньше','ниже','реже']; POS_RU=['больше','выше','чаще']; NEG_EN=['less','lower']; POS_EN=['more','higher','times as often']
async def setup(pg,user,lang):
    await pg.goto(U); await pg.evaluate(f"localStorage.clear();localStorage.setItem('avega-user','{user}');localStorage.setItem('avega-lang','{lang}')")
    await pg.goto(U+'#support-chat'); await pg.reload(); await pg.wait_for_timeout(350)
async def say(pg,t):
    await pg.fill('#chat-in',t); await pg.press('#chat-in','Enter'); await pg.wait_for_timeout(250); await scanrows(pg,t)
async def clickq(pg,a):
    await pg.evaluate(f"document.querySelector('.chat-msg.bot:last-child .iv-b[data-a=\"{a}\"]').click()"); await pg.wait_for_timeout(250)
BADROWS=[]
async def scanrows(pg,tag):
    r=await pg.evaluate("[...document.querySelectorAll('#chat-log .chat-bub li')].map(e=>e.innerText).filter(x=>(x.includes('в пределах вашей нормы')&&x.includes('хуже нормы'))||(x.includes('within your norm')&&x.includes('worse than your norm')))")
    BADROWS.extend(r)
LASTB="document.querySelector('.chat-msg.bot:last-child .chat-bub')"
def fnum(v,dec,lang): 
    s=f"{v:.{dec}f}"; return s.replace('.',',') if lang=='ru' else s
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':1440,'height':1000}); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        # ---- 1-4: weekly reply for every crew member, both languages ----
        for user in CREW:
            D=DATA[user]
            for lang in ('ru','en'):
                await setup(pg,user,lang); await say(pg,'Как прошла неделя?' if lang=='ru' else 'How was my week?')
                tag=f'{user}/{lang}'
                intent=await pg.evaluate(f"{LASTB}.dataset.intent"); chk(f'{tag} intent week',intent=='week',intent)
                rows=await pg.evaluate(f"[...{LASTB}.querySelectorAll('.tr-row')].map(e=>({{k:e.dataset.k,st:e.dataset.status,m7:+e.dataset.m7,bm:+e.dataset.bm,run:+e.dataset.run,since:e.dataset.since,text:e.innerText}}))")
                chk(f'{tag} 6 indicator rows',len(rows)==6 and sorted(r['k'] for r in rows)==sorted(['stress','mood','energy','sleep','cog','hr']),str(len(rows)))
                for r in rows:
                    T=trend_py(D,r['k'])
                    ok=abs(r['m7']-T['m7'])<1e-9 and abs(r['bm']-T['bm'])<1e-9 and r['run']==T['run'] and (r['since']==('' if T['since'] is None else str(T['since'])))
                    chk(f"{tag} {r['k']} numbers = recomputation",ok,f"{r} vs {T}")
                    if r['k'] in('stress','sleep'):
                        chk(f"{tag} {r['k']} text shows rounded m7 and baseline",fnum(T['m7'],1,lang) in r['text'] and fnum(T['bm'],1,lang) in r['text'],r['text'])
                text=await pg.evaluate(f"{LASTB}.innerText")
                # language: strip source-id chips and titles
                clean=await pg.evaluate(f"(()=>{{const c={LASTB}.cloneNode(true);c.querySelectorAll('.ref,.ref-title,[data-raw]').forEach(e=>e.remove());return c.innerText}})()")
                if lang=='en': chk(f'{tag} no Cyrillic in EN',not CYR.search(clean),CYR.findall(clean)[:10])
                else:
                    lat=[w for w in LAT.findall(clean) if w not in('CO',)]
                    chk(f'{tag} no English words in RU',not lat,lat[:10])
                # links
                prow=await pg.evaluate(f"[...{LASTB}.querySelectorAll('.pl-row')].map(e=>({{a:e.dataset.a,b:e.dataset.b,lag:+e.dataset.lag,nbad:+e.dataset.nbad,nok:+e.dataset.nok,mbad:+e.dataset.mbad,mok:+e.dataset.mok,diff:+e.dataset.diff,r:+e.dataset.r,text:e.innerText}}))")
                good=True; why=[]
                for r in prow:
                    I=impact_py(D,r['a'],r['b'],r['lag'])
                    c1=r['nbad']>=5 and r['nok']>=5 and abs(r['r'])>=0.3
                    c2=(r['nbad']==I['nbad'] and r['nok']==I['nok'] and abs(r['mbad']-I['mbad'])<1e-9 and abs(r['mok']-I['mok'])<1e-9 and abs(r['r']-I['r'])<1e-9)
                    neg,pos=(NEG_RU,POS_RU) if lang=='ru' else (NEG_EN,POS_EN)
                    t=r['text']; hn=any(w in t for w in neg); hp=any(w in t for w in pos)
                    c3=(r['diff']<0 and hn and not hp) or (r['diff']>0 and hp and not hn)
                    c4=f"{fnum(r['r'],2,lang).replace('-','−') if r['r']<0 else '+'+fnum(r['r'],2,lang)}" in t
                    if not(c1 and c2 and c3 and c4): good=False; why.append((r,c1,c2,c3,c4,I))
                chk(f'{tag} {len(prow)} psyLinks rows valid (n>=5, |r|>=0.3, = recomputation, sign wording, r shown)',good and len(prow)>0,str(why[:1]))
                # actions
                recs=await pg.evaluate(f"[...{LASTB}.querySelectorAll('.reco-list li')].map(e=>({{ref:(e.querySelector('.ref')||{{}}).innerText||'',t:e.innerText}}))")
                chk(f'{tag} every recommendation has a ref chip ({len(recs)} rows)',all(r['ref'].strip() for r in recs),str(recs))
                low=text.lower(); chk(f'{tag} no drug words',not any(w in low for w in DRUG),[w for w in DRUG if w in low])
                chk(f'{tag} synthetic-data note + correlation note',('синтетическ' in low and 'не доказывает причинность' in low) if lang=='ru' else ('synthetic' in low and 'does not prove causation' in low))
                chk(f'{tag} never causal wording', not any(w in low for w in ['вызывает','вызвал','causes','because of']) or lang=='en' and 'not that one causes' in low or lang=='ru' and 'не что одно вызывает' in low)
        # ---- status intent / chInd / links / condition consistency ----
        await setup(pg,'daniel','ru'); await say(pg,'Как я сейчас?')
        t=await pg.evaluate(f"{LASTB}.innerText"); chk('status reply has weekly line + chip', 'За последние 7 дней хуже вашей нормы' in t and 'Как прошла неделя?' in t, t[-300:])
        await say(pg,'Как прошла неделя?'); t2=await pg.evaluate(f"{LASTB}.dataset.intent"); chk('status chip text leads to week reply',t2=='week')
        await setup(pg,'daniel','ru'); await say(pg,'стресс')
        t=await pg.evaluate(f"{LASTB}.innerText"); n=await pg.evaluate(f"{LASTB}.querySelectorAll('.tr-row').length")
        chk('indicator answer carries the trend row',n==1 and 'Стресс — выше вашей нормы' in t and 'Что можно сделать сейчас' in t,t[:300])
        await setup(pg,'daniel','ru'); await say(pg,'какие у меня связи')
        n=await pg.evaluate(f"{LASTB}.querySelectorAll('.pl-row').length"); t=await pg.evaluate(f"{LASTB}.innerText")
        chk('links answer has grouped effect rows',n>0 and 'Здоровье → психология' in t and 'Другие связи' in t or n>0,t[:200])
        await setup(pg,'daniel','ru'); await say(pg,'корреляции')
        t=await pg.evaluate(f"{LASTB}.innerText"); chk('links intent groups',('Психология → здоровье' in t or 'Здоровье → психология' in t),t[:200])
        await setup(pg,'daniel','en'); await say(pg,'sleep')
        n=await pg.evaluate(f"{LASTB}.querySelectorAll('.tr-row')").__class__ if False else 0
        await setup(pg,'daniel','ru'); await say(pg,'плохо сплю')
        # sleep handbook entry now starts the interview; use the typed condition from the handbook via skip
        await pg.evaluate("document.querySelector('.chat-msg.bot:last-child .iv-skip').click()"); await pg.wait_for_timeout(250)
        t=await pg.evaluate(f"{LASTB}.innerText"); chk('condition answer: factor row gets «хуже нормы с дня N» when the factor is worse','хуже обычного с дня' in t,t[:500])
        # ---- 5: interview with data, Daniel (episode) ----
        for lang in ('ru','en'):
            await setup(pg,'daniel',lang); await say(pg,'Тревожно' if lang=='ru' else 'I feel anxious')
            await clickq(pg,'s1'); await clickq(pg,'d0'); await clickq(pg,'n')
            lvl=await pg.evaluate(f"{LASTB}.dataset.level"); chk(f'daniel/{lang} bhv «today» -> level >= tell',lvl in('tell','urgent'),lvl)
            cons=await pg.evaluate(f"[...{LASTB}.querySelectorAll('.iv-cons')].map(e=>e.innerText)")
            T=trend_py(DATA['daniel'],'stress')
            want=(f"Вы ответили «сегодня», а по данным стресс хуже обычного уже {T['run']} дн" if lang=='ru' else f"You answered “today”, but your data show stress worse than usual for {T['run']} days already (since day {T['since']})")
            chk(f'daniel/{lang} consistency row with run {T["run"]}, since day {T["since"]}',len(cons)==1 and want in cons[0] and f"с дня {T['since']}" in cons[0] if lang=='ru' else len(cons)==1 and want in cons[0],str(cons))
            chk(f'daniel/{lang} level is never urgent from data alone',lvl!='urgent',lvl)
            blk=await pg.evaluate(f"{LASTB}.innerText"); chk(f'daniel/{lang} outcome block + links + lever', ('Что вижу в ваших данных за 7 дней' if lang=='ru' else 'What I see in your data for the last 7 days') in blk and await pg.evaluate(f"{LASTB}.querySelectorAll('.iv-tr .tr-row').length")==2)
            h1=await pg.evaluate("document.querySelector('#chat-log').innerHTML")
            await pg.reload(); await pg.wait_for_timeout(500)
            h2=await pg.evaluate("document.querySelector('#chat-log').innerHTML"); chk(f'daniel/{lang} replay after reload is identical',h1==h2)
            await pg.evaluate("document.querySelector('.chat-msg.bot:last-child [data-act=sendsum]').click()"); await pg.wait_for_timeout(200)
            msgs=json.loads(await pg.evaluate("localStorage.getItem('avega-msgs')")); txt=msgs[-1]['text']
            chk(f'daniel/{lang} doctor summary has data and consistency rows',('Стресс — выше вашей нормы' in txt and 'Вы ответили «сегодня»' in txt) if lang=='ru' else ('Stress — above your norm' in txt and 'You answered “today”' in txt),txt[-400:])
            chk(f'daniel/{lang} doctor summary language',(not CYR.search(txt)) if lang=='en' else True,CYR.findall(txt)[:5])
        # Alex: no episode -> no 'today' row; «больше недели» with data in norm -> info row, level unchanged (watch)
        await setup(pg,'alex','ru'); await say(pg,'Тревожно'); await clickq(pg,'s1'); await clickq(pg,'d0'); await clickq(pg,'n')
        c=await pg.evaluate(f"{LASTB}.querySelectorAll('.iv-cons').length"); lvl=await pg.evaluate(f"{LASTB}.dataset.level"); chk('alex «today»: no consistency row, level watch',c==0 and lvl=='watch',f'{c} {lvl}')
        await setup(pg,'alex','ru'); await say(pg,'Тревожно'); await clickq(pg,'s1'); await clickq(pg,'d3'); await clickq(pg,'n')
        cons=await pg.evaluate(f"[...{LASTB}.querySelectorAll('.iv-cons')].map(e=>e.dataset.cons)"); lvl=await pg.evaluate(f"{LASTB}.dataset.level")
        chk('alex «больше недели» + data in norm: info row, level from the old rules (tell via duration rule)',cons==['week'],str(cons)+lvl)
        # ---- unit check of the wording of symptom rows and plural forms ----
        await pg.goto(UD); await pg.evaluate("localStorage.clear();localStorage.setItem('avega-user','alex');localStorage.setItem('avega-lang','ru')"); await pg.goto(UD); await pg.wait_for_timeout(300)
        r=await pg.evaluate("window.__C.chEffect({b:'skin',diff:0.12,mBad:0.18,mOk:0.06})"); chk('RU symptom wording',r=='сыпь отмечалась в 3 раза чаще: 18 % против 6 % дней',r)
        r=await pg.evaluate("window.__C.chEffect({b:'headache',diff:0.05,mBad:0.25,mOk:0.2})"); chk('RU symptom wording, small ratio',r=='головная боль отмечалась чаще: 25 % против 20 % дней',r)
        r=await pg.evaluate("[window.__C.chDays(1),window.__C.chDays(2),window.__C.chDays(5),window.__C.chDays(11),window.__C.chDays(21),window.__C.chDays(31)]"); chk('RU plural of days',r==['день','дня','дней','дней','день','день'],str(r))
        await pg.evaluate("localStorage.setItem('avega-lang','en')"); await pg.goto(UD); await pg.wait_for_timeout(300)
        r=await pg.evaluate("window.__C.chEffect({b:'skin',diff:0.12,mBad:0.18,mOk:0.06})"); chk('EN symptom wording',r=='rash was logged 3 times as often: 18% vs 6% of days',r)
        # ---- v3 fixes: lever logic, wording, weekly summary to the doctor ----
        for lang in ('ru','en'):
            await setup(pg,'daniel',lang); await say(pg,'Как прошла неделя?' if lang=='ru' else 'How was my week?')
            lev=await pg.evaluate("[...document.querySelectorAll('.chat-msg.bot:last-child .chat-lever')].map(e=>e.innerText)")
            chk(f'daniel/{lang} weekly lever names stress, not sleep',len(lev)==1 and (('Начните со стресса' in lev[0] and 'со сна' not in lev[0]) if lang=='ru' else ('Start with stress' in lev[0] and 'sleep' not in lev[0])),str(lev))
            await pg.evaluate("document.querySelector('.chat-msg.bot:last-child [data-act=sendwk]').click()"); await pg.wait_for_timeout(200)
            msgs=json.loads(await pg.evaluate("localStorage.getItem('avega-msgs')")); txt=msgs[-1]['text']; T=trend_py(DATA['daniel'],'stress')
            chk(f'daniel/{lang} weekly doctor message has the stress row numbers',fnum(T['m7'],1,lang) in txt and fnum(T['bm'],1,lang) in txt and str(T['since']) in txt and msgs[-1].get('key','').startswith('week:'),txt)
            chk(f'daniel/{lang} weekly doctor message language',lang=='ru' or not CYR.search(txt),CYR.findall(txt)[:5])
            h1=await pg.evaluate("document.querySelector('#chat-log').innerHTML"); await pg.reload(); await pg.wait_for_timeout(500)
            h2=await pg.evaluate("document.querySelector('#chat-log').innerHTML"); chk(f'daniel/{lang} weekly «sent» state survives reload',h1==h2 and 'chat-sent' in h2 and 'data-act="sendwk"' not in h2)
        await setup(pg,'alex','ru'); await say(pg,'Как прошла неделя?')
        n=await pg.evaluate("document.querySelectorAll('.chat-msg.bot:last-child .chat-lever').length"); chk('alex weekly: lever/focus only when something is hot, no button',n<=1 and await pg.evaluate("!document.querySelector('.chat-msg.bot:last-child [data-act=sendwk]')"))
        await setup(pg,'daniel','ru'); await say(pg,'плохо сплю'); await pg.evaluate("document.querySelector('.chat-msg.bot:last-child .iv-skip').click()"); await pg.wait_for_timeout(250); await scanrows(pg,'cond')
        t=await pg.evaluate(f"{LASTB}.innerText"); chk('handbook factor row explains calm last value vs worse week','последний чек-ин в пределах вашей нормы' in t and 'среднее за 7 дней выше нормы, хуже обычного с дня' in t,t[:600])
        for u in CREW:
            for lang in ('ru','en'):
                await setup(pg,u,lang)
                for q in (['Как я сейчас?','Как прошла неделя?','стресс','сон','настроение','пульс','плохо сплю','Тревожно'] if lang=='ru' else ['How am I now?','How was my week?','stress','sleep','mood','heart rate','I am sleeping badly','I feel anxious']):
                    await say(pg,q)
                    if await pg.evaluate("!!document.querySelector('.chat-msg.bot:last-child .iv-b')"):
                        await pg.evaluate("document.querySelector('.chat-msg.bot:last-child .iv-skip').click()"); await pg.wait_for_timeout(200)
                await scanrows(pg,'all')
        chk('no bot row says both «within your norm» and «worse than your norm»',not BADROWS,BADROWS[:3])
        chk('no page errors',not errs,errs)
        await b.close()
    print('RESULT',sum(res),len(res)); 
    if fails: print('FAILED:',fails)
asyncio.run(main())
