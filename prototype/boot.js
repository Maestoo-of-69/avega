/* accounts: one flight surgeon on Earth + four crew members, each with a separate database */
const CREWDATA = JSON.parse(document.getElementById('avega-crew').textContent);
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } };
const ACCOUNTS = [CREWDATA.doctor, ...CREWDATA.crew];
let ACC = lsGet('avega-user'); if (!ACCOUNTS.some(a => a.id === ACC)) ACC = 'alex';
const IS_DOC = ACC === CREWDATA.doctor.id;
let VIEW = IS_DOC ? lsGet('avega-view') : ACC; if (!CREWDATA.crew.some(p => p.id === VIEW)) VIEW = CREWDATA.crew[0].id;
const PERSON = CREWDATA.crew.find(p => p.id === VIEW);
const D = JSON.parse(document.getElementById('avega-data-' + VIEW).textContent);
const DELAY = IS_DOC ? CREWDATA.delay_min : 0;     // the doctor on Earth sees data as of (now − delay)
if (DELAY) {
  const cut = D.meta.now_min - DELAY;
  D.hr.values.length = Math.max(0, Math.min(D.hr.values.length, cut - D.hr.t0 + 1));
  D.checkins = D.checkins.filter(r => r.t <= cut); D.tests = D.tests.filter(r => r.t <= cut); D.sleep = D.sleep.filter(r => r.e <= cut);
  D.meta.now_min = cut;
}
