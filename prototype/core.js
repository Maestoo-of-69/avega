/* ---------------------------------------------------------------- helpers */
  const MIN = 60e3, HOUR = 36e5, DAY = 864e5;
  const START = D.meta.start_min * MIN, NOW = D.meta.now_min * MIN;
  const FSTART = (D.meta.flight_start_min || D.meta.start_min) * MIN;   // launch; START may be earlier (pre-flight data)
  const HR0 = D.hr.t0 * MIN, HRV = D.hr.values;
  const MET = Object.fromEntries(D.metrics.map(m => [m.key, m]));
  /* A button is the STEP of the points on the chart; `win` is the window that holds them:
     1 minute -> one point per minute over an hour; 1 hour -> per hour over a day; 1 day -> per day over a month;
     1 week -> per week over a quarter; 1 month -> per month over a year; 1 year -> per year over the mission years. */
  const SCALES = [
    { key: 'minute', label: '1 minute', win: 'hour' }, { key: 'hour', label: '1 hour', win: 'day' }, { key: 'day', label: '1 day', win: 'month' },
    { key: 'week', label: '1 week', win: 'quarter' }, { key: 'month', label: '1 month', win: 'year' }, { key: 'year', label: '1 year', win: 'years' },
    { key: 'flight', label: 'Whole flight', win: 'flight' },
  ];
  const STEP_OF = { hour: 'minute', day: 'hour', week: 'day', month: 'day', quarter: 'week', year: 'month', years: 'year', flight: 'flight' };   // window -> button that shows its step
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const WDL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONG = MONL.slice();
  const DIR = { mood: 1, stress: -1, energy: 1, cog: 1 };   // +1: higher is better, -1: lower is better; HR and sleep are judged neutrally (only above/below)
  const SLOT = { morning: 'Morning', evening: 'Evening', extra: 'Extra' };

  const $ = id => document.getElementById(id);
  const pad = n => String(n).padStart(2, '0');
  const dt = ms => new Date(ms);
  const dayFloor = ms => Math.floor(ms / DAY) * DAY;
  const hhmm = ms => { const d = dt(ms); return pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()); };
  const dShort = ms => { const d = dt(ms); return `${WD[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]}`; };
  const dLong = ms => { const d = dt(ms); return `${WDL[d.getUTCDay()]}, ${d.getUTCDate()} ${MONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
  const yearOf = ms => dt(ms).getUTCFullYear();
  const mDay = ms => Math.floor((dayFloor(ms) - dayFloor(FSTART)) / DAY) + 1;
  const dayName = ms => { const n = mDay(ms); return n >= 1 ? `Day ${n}` : `Pre-flight T−${1 - n}`; };
  const dayTick = ms => { const n = mDay(ms); return n >= 1 ? 'D' + n : 'T−' + (1 - n); };
  const iso = ms => { const d = dt(ms); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; };
  const fmt = (v, dec) => (v == null || !isFinite(v)) ? '—'
    : v.toLocaleString(LOC(), { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const sgn = (v, dec) => (v > 0 ? '+' : v < 0 ? '−' : '') + fmt(Math.abs(v), dec);
  const dur = h => { const m = Math.round(h * 60); return `${Math.floor(m / 60)} h ${pad(m % 60)} min`; };
  const scaleLabel = win => SCALES.find(s => s.key === STEP_OF[win]).label;       // label of the step a window shows

  /* ------------------------------------------------------------------- data */
  const CI = D.checkins.map(c => ({ ...c, t: c.t * MIN }));
  const TS = D.tests.map(c => ({ ...c, t: c.t * MIN }));
  const SL = D.sleep.map(c => ({ s: c.s * MIN, e: c.e * MIN, h: c.h }));

  function aggVals(vals) {
    if (!vals.length) return null;
    let sum = 0, mn = Infinity, mx = -Infinity;
    for (const v of vals) { sum += v; if (v < mn) mn = v; if (v > mx) mx = v; }
    return { mean: sum / vals.length, min: mn, max: mx, n: vals.length };
  }
  function aggHR(s, e) {            // [s, e) over per-minute values
    const i0 = Math.max(0, Math.ceil((s - HR0) / MIN)), i1 = Math.min(HRV.length, Math.ceil((e - HR0) / MIN));
    let n = 0, sum = 0, mn = Infinity, mx = -Infinity;
    for (let i = i0; i < i1; i++) {
      const v = HRV[i]; if (v == null) continue;
      n++; sum += v; if (v < mn) mn = v; if (v > mx) mx = v;
    }
    return n ? { mean: sum / n, min: mn, max: mx, n } : null;
  }
  const hrAt = ms => { const i = Math.round((ms - HR0) / MIN); return (i < 0 || i >= HRV.length) ? null : HRV[i]; };

  // DEMO: per-second values are simulated around the real minute average
  // (zero-sum noise, so their mean equals the minute value exactly).
  function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function secondsOf(minMs) {
    const base = hrAt(minMs); if (base == null) return null;
    const r = mulberry(Math.floor(minMs / MIN)), out = []; let x = 0, sum = 0;
    for (let i = 0; i < 60; i++) { x = 0.8 * x + (r() + r() + r() - 1.5) * 2.2; out.push(x); sum += x; }
    const mean = sum / 60; return out.map(v => base + v - mean);
  }

  function samples(key, s, e) {     // event-type samples in [s, e)
    if (key === 'cog') return TS.filter(x => x.t >= s && x.t < e).map(x => ({ t: x.t, v: x.v, ref: x, type: 'test' }));
    if (key === 'sleep') return SL.filter(x => x.e >= s && x.e < e).map(x => ({ t: x.e, v: x.h, ref: x, type: 'sleep' }));
    return CI.filter(x => x.t >= s && x.t < e).map(x => ({ t: x.t, v: x[key], ref: x, type: 'checkin' }));
  }

  /* ---------------------------------------------------------- personal norms */
  function normFor(key, kind, hour) {
    const n = D.norms[key]; if (!n) return null;
    const r = kind === 'hod' ? (n.hour_of_day && n.hour_of_day[hour]) : n[kind];
    return r && r.sd != null ? r : null;
  }
  function normKind(key, scale, forBucket) {
    if (MET[key].kind === 'continuous')
      return (scale === 'minute' || scale === 'hour' || (scale === 'day' && forBucket)) ? 'hod' : 'daily';
    return (scale === 'day' && forBucket) ? 'event' : 'daily';
  }
  function vsText(v, r, dec, unit) {
    if (!r || v == null) return '';
    const d = v - r.m, z = r.sd > 0 ? d / r.sd : 0;
    return `${sgn(d, Math.max(dec, 1))} ${unit} · ${sgn(z, 1)} SD`;
  }
  const isOut = (v, r) => !!r && r.sd > 0 && Math.abs(v - r.m) > r.sd;

  /* ----------------------------------------------------------------- windows */
  function windowFor(scale, c) {
    const d = dt(c);
    switch (scale) {
      case 'hour': { const s = Math.floor(c / HOUR) * HOUR; return { scale, start: s, end: s + HOUR }; }
      case 'day': { const s = dayFloor(c); return { scale, start: s, end: s + DAY }; }
      case 'week': { const s = dayFloor(c) - ((d.getUTCDay() + 6) % 7) * DAY; return { scale, start: s, end: s + 7 * DAY }; }
      case 'month': return { scale, start: Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1), end: Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1) };
      case 'quarter': { const m = Math.floor(d.getUTCMonth() / 3) * 3; return { scale, start: Date.UTC(d.getUTCFullYear(), m, 1), end: Date.UTC(d.getUTCFullYear(), m + 3, 1) }; }
      case 'year': return { scale, start: Date.UTC(d.getUTCFullYear(), 0, 1), end: Date.UTC(d.getUTCFullYear() + 1, 0, 1) };
      case 'years': { const y0 = yearOf(START), y1 = Math.max(yearOf(NOW), y0 + 2); return { scale, start: Date.UTC(y0, 0, 1), end: Date.UTC(y1 + 1, 0, 1) }; }   // at least 3 year slots, so a long mission has room
      default: return { scale: 'flight', start: dayFloor(START), end: dayFloor(NOW) + DAY };
    }
  }
  function neighbor(w, dir) {
    const d = dt(w.start);
    switch (w.scale) {
      case 'hour': return w.start + dir * HOUR;
      case 'day': return w.start + dir * DAY;
      case 'week': return w.start + dir * 7 * DAY;
      case 'month': return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + dir, 1);
      case 'quarter': return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 3 * dir, 1);
      case 'year': return Date.UTC(d.getUTCFullYear() + dir, 0, 1);
      default: return null;
    }
  }
  function canGo(w, dir) {
    if (w.scale === 'flight' || w.scale === 'years') return false;
    const nw = windowFor(w.scale, neighbor(w, dir));
    return dir < 0 ? nw.end > START : nw.start < NOW + MIN;
  }
  function windowLabel(w) {
    const s = w.start, d = dt(s);
    switch (w.scale) {
      case 'hour': return `${dShort(s)} ${yearOf(s)} · ${hhmm(s)}–${hhmm(w.end)} UTC`;
      case 'day': return `${dLong(s)} · ${dayName(s)}`;
      case 'week': { const e = w.end - DAY; return `${dt(s).getUTCDate()} ${MON[d.getUTCMonth()]} – ${dt(e).getUTCDate()} ${MON[dt(e).getUTCMonth()]} ${yearOf(e)}`; }
      case 'month': return `${MONL[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
      case 'quarter': return `Q${Math.floor(d.getUTCMonth() / 3) + 1} ${d.getUTCFullYear()} · ${MON[d.getUTCMonth()]} – ${MON[(d.getUTCMonth() + 2) % 12]}`;
      case 'year': return String(d.getUTCFullYear());
      case 'years': return `${yearOf(w.start)} – ${yearOf(w.end - 1)}`;
      default: return `Pre-flight T−${1 - mDay(w.start)} … Day ${mDay(NOW)} · ${dShort(w.start)} – ${dShort(NOW)} ${yearOf(NOW)}`;
    }
  }

  function makeBuckets(w) {
    const B = []; let kind = '', step = 1, caption = '';
    const add = (s, e, label, tip, drill) => B.push({ s, e, label, tip, drill });
    switch (w.scale) {
      case 'hour':
        kind = 'minute'; step = 5; caption = `One point per minute, ${hhmm(w.start)}–${hhmm(w.end)} UTC`;
        for (let i = 0; i < 60; i++) { const s = w.start + i * MIN; add(s, s + MIN, hhmm(s), `${dShort(s)} · ${hhmm(s)} UTC`, null); }
        break;
      case 'day':
        kind = 'hour'; caption = 'Hour of day (UTC)';
        for (let h = 0; h < 24; h++) { const s = w.start + h * HOUR; add(s, s + HOUR, pad(h), `${dShort(s)} · ${pad(h)}:00–${hhmm(s + HOUR)} UTC`, { scale: 'hour', cursor: s }); }
        break;
      case 'week':
        kind = 'day'; caption = 'Day';
        for (let i = 0; i < 7; i++) { const s = w.start + i * DAY; add(s, s + DAY, `${WD[dt(s).getUTCDay()]} ${dt(s).getUTCDate()}`, `${dShort(s)} · ${dayName(s)}`, { scale: 'day', cursor: s }); }
        break;
      case 'month': {
        kind = 'day'; caption = 'Day of month'; const n = (w.end - w.start) / DAY; step = 1;
        for (let i = 0; i < n; i++) { const s = w.start + i * DAY; add(s, s + DAY, String(dt(s).getUTCDate()), `${dShort(s)} · ${dayName(s)}`, { scale: 'day', cursor: s }); }
        break;
      }
      case 'quarter': {
        kind = 'week'; caption = 'Week starting (Monday)';
        for (let s = w.start - ((dt(w.start).getUTCDay() + 6) % 7) * DAY; s < w.end; s += 7 * DAY)
          add(s, s + 7 * DAY, `${dt(s).getUTCDate()} ${MON[dt(s).getUTCMonth()]}`, `Week of ${dShort(s)}`, { scale: 'week', cursor: Math.max(s, w.start) });
        break;
      }
      case 'years': {
        kind = 'year'; caption = 'Year';
        for (let y = yearOf(w.start); y < yearOf(w.end - 1) + 1; y++) add(Date.UTC(y, 0, 1), Date.UTC(y + 1, 0, 1), String(y), String(y), { scale: 'year', cursor: Date.UTC(y, 0, 1) });
        break;
      }
      case 'year': {
        kind = 'month'; caption = 'Month'; const y = yearOf(w.start);
        for (let m = 0; m < 12; m++) { const s = Date.UTC(y, m, 1); add(s, Date.UTC(y, m + 1, 1), MON[m], `${MONL[m]} ${y}`, { scale: 'month', cursor: s }); }
        break;
      }
      default: {
        const span = (w.end - w.start) / DAY;
        if (span <= 90) {
          kind = 'day'; caption = 'Mission day'; step = Math.max(1, Math.ceil(span / 16));
          for (let s = w.start; s < w.end; s += DAY) add(s, s + DAY, dayTick(s), `${dShort(s)} · ${dayName(s)}`, { scale: 'day', cursor: s });
        } else if (span <= 400) {
          kind = 'week'; caption = 'Week starting';
          for (let s = w.start - ((dt(w.start).getUTCDay() + 6) % 7) * DAY; s < w.end; s += 7 * DAY)
            add(s, s + 7 * DAY, `${dt(s).getUTCDate()} ${MON[dt(s).getUTCMonth()]}`, `Week of ${dShort(s)}`, { scale: 'week', cursor: s });
          step = Math.max(1, Math.ceil(B.length / 14));
        } else {
          kind = 'month'; caption = 'Month';
          const d0 = dt(w.start);
          for (let y = d0.getUTCFullYear(), m = d0.getUTCMonth(), s = Date.UTC(y, m, 1); s < w.end; m++, s = Date.UTC(y, m, 1))
            add(s, Date.UTC(y, m + 1, 1), `${MON[dt(s).getUTCMonth()]} ${String(dt(s).getUTCFullYear()).slice(2)}`, `${MONL[dt(s).getUTCMonth()]} ${dt(s).getUTCFullYear()}`, { scale: 'month', cursor: s });
          step = Math.max(1, Math.ceil(B.length / 14));
        }
      }
    }
    for (const b of B) b.status = b.e <= START ? 'pre' : b.s >= NOW + MIN ? 'future' : 'ok';
    return { B, kind, step, caption };
  }

  function fillAgg(c) {
    const m = c.met;
    for (const b of c.B) {
      if (b.status !== 'ok') { b.agg = null; continue; }
      if (m.kind === 'continuous') b.agg = aggHR(b.s, b.e);
      else b.agg = aggVals(samples(m.key, b.s, b.e).map(x => x.v));
    }
  }

  function winStats(key, w) {
    const m = MET[key];
    if (m.kind === 'continuous') {
      const a = aggHR(w.start, w.end); if (!a) return null;
      const exp = Math.max(0, Math.round((Math.min(w.end, NOW + MIN) - Math.max(w.start, START)) / MIN));
      a.cover = exp ? a.n / exp : null; a.unit = 'min'; return a;
    }
    const a = aggVals(samples(key, w.start, w.end).map(x => x.v)); if (a) a.unit = key === 'sleep' ? 'nights' : key === 'cog' ? 'tests' : 'check-ins';
    return a;
  }
  const flightCache = {};
  const flightStats = key => flightCache[key] || (flightCache[key] = winStats(key, { scale: 'flight', start: dayFloor(FSTART), end: dayFloor(NOW) + DAY }));

  /* ----------------------------------------------------------------- charts */
  const W = 1000, PL = 58, PR = 16, PT = 22, PB = 44;
  let H = 336, PH = H - PT - PB;
  const PW = W - PL - PR;
  const setChartH = h => { H = Math.round(h); PH = H - PT - PB; };

  function niceScale(lo, hi, m) {
    const span0 = m.min_span || 1;
    if (hi - lo < span0) { const mid = (hi + lo) / 2; lo = mid - span0 / 2; hi = mid + span0 / 2; }
    const pad_ = (hi - lo) * 0.1; lo -= pad_; hi += pad_;
    const raw = (hi - lo) / 5, mag = Math.pow(10, Math.floor(Math.log10(raw))), nr = raw / mag;
    const step = (nr < 1.5 ? 1 : nr < 3.5 ? 2 : nr < 7.5 ? 5 : 10) * mag;
    let y0 = Math.floor(lo / step) * step, y1 = Math.ceil(hi / step) * step;
    if (m.bounds) { y0 = Math.max(y0, m.bounds[0]); y1 = Math.min(y1, m.bounds[1]); }
    const ticks = [];
    for (let v = Math.ceil(y0 / step - 1e-9) * step; v <= y1 + 1e-9; v += step) ticks.push(+v.toFixed(6));
    return { y0, y1, ticks, dec: step >= 1 ? 0 : step >= 0.1 ? 1 : 2 };
  }

  const HATCH = '<defs><pattern id="hh" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" style="stroke:var(--hatch)" stroke-width="2"/></pattern></defs>';
  const hoverEl = () => '<line class="hguide" y1="' + PT + '" y2="' + (PT + PH) + '" x1="0" x2="0" visibility="hidden"/><circle class="hdot" r="5.5" stroke-width="2.5" visibility="hidden"/>';

  function yAxis(sc, yv, unit) {
    let s = '';
    for (const t of sc.ticks) s += `<line class="grid" x1="${PL}" x2="${W - PR}" y1="${yv(t).toFixed(1)}" y2="${yv(t).toFixed(1)}"/><text class="ax" x="${PL - 8}" y="${(yv(t) + 4).toFixed(1)}" text-anchor="end">${fmt(t, sc.dec)}</text>`;
    return s + `<text class="axu" x="${PL - 8}" y="12" text-anchor="end">${esc(unit)}</text>`;
  }
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const emptyChart = msg => ({ svg: `<svg class="hchart" viewBox="0 0 ${W} ${H}"><text class="empty-msg" x="${W / 2}" y="${H / 2}" text-anchor="middle">${esc(msg)}</text></svg>`, tips: [], pts: [], drill: [], legend: '' });

  function tipHTML(title, lines, hint) {
    return `<b>${esc(title)}</b>` + lines.map(l => `<br>${l}`).join('') + (hint ? `<br><span class="hint">${esc(hint)}</span>` : '');
  }
  function bucketNorm(c, b) {
    return b.status === 'ok' ? normFor(c.met.key, normKind(c.met.key, c.w.scale, true), dt(b.s).getUTCHours()) : null;
  }

  /* aggregated series: mean line + min–max range + personal-norm band */
  function chartSeries(c) {
    const { B, step, caption } = c.bk, n = B.length, m = c.met;
    const norms = B.map(b => bucketNorm(c, b));
    let lo = Infinity, hi = -Infinity;
    B.forEach((b, i) => {
      if (b.agg) { lo = Math.min(lo, b.agg.min); hi = Math.max(hi, b.agg.max); }
      const r = norms[i]; if (r) { lo = Math.min(lo, r.m - r.sd); hi = Math.max(hi, r.m + r.sd); }
    });
    if (!B.some(b => b.agg)) return null;
    const sc = niceScale(lo, hi, m), bw = PW / n;
    const xc = i => PL + (i + 0.5) * bw, yv = v => PT + PH * (1 - (v - sc.y0) / (sc.y1 - sc.y0));
    let s = `<svg class="hchart" viewBox="0 0 ${W} ${H}">${HATCH}`;

    // no-data ranges (before mission / not yet)
    for (let i = 0; i < n;) {
      if (B[i].status === 'ok') { i++; continue; }
      let j = i; while (j + 1 < n && B[j + 1].status === B[i].status) j++;
      s += `<rect x="${(PL + i * bw).toFixed(1)}" y="${PT}" width="${((j - i + 1) * bw).toFixed(1)}" height="${PH}" fill="url(#hh)" opacity=".7"/>`;
      if ((j - i + 1) * bw > 90) s += `<text class="axu" x="${(PL + (i + (j - i + 1) / 2) * bw).toFixed(1)}" y="${PT + 16}" text-anchor="middle">${B[i].status === 'pre' ? 'before mission' : 'not recorded yet'}</text>`;
      i = j + 1;
    }
    s += yAxis(sc, yv, m.unit);

    // personal norm band (per bucket; flat when constant)
    let hasNorm = false;
    B.forEach((b, i) => {
      const r = norms[i]; if (!r) return; hasNorm = true;
      const y1 = yv(Math.min(sc.y1, r.m + r.sd)), y2 = yv(Math.max(sc.y0, r.m - r.sd));
      s += `<rect x="${(PL + i * bw - 0.3).toFixed(1)}" y="${y1.toFixed(1)}" width="${(bw + 0.6).toFixed(1)}" height="${Math.max(0, y2 - y1).toFixed(1)}" fill="${m.color}" opacity=".10"/>`;
    });

    // x labels
    B.forEach((b, i) => { if (i % step === 0) s += `<text class="ax" x="${xc(i).toFixed(1)}" y="${H - 22}" text-anchor="middle">${esc(b.label)}</text>`; });
    s += `<text class="axu" x="${W - PR}" y="${H - 5}" text-anchor="end">${esc(caption)}</text>`;

    // runs of consecutive buckets with data
    const runs = []; let cur = [];
    B.forEach((b, i) => { if (b.agg) cur.push(i); else if (cur.length) { runs.push(cur); cur = []; } });
    if (cur.length) runs.push(cur);
    const whisk = n <= 14, showBand = !whisk && B.some(b => b.agg && b.agg.n > 1);
    for (const r of runs) {
      if (showBand && r.length > 1) {
        const top = r.map(i => `${xc(i).toFixed(1)},${yv(B[i].agg.max).toFixed(1)}`);
        const bot = r.slice().reverse().map(i => `${xc(i).toFixed(1)},${yv(B[i].agg.min).toFixed(1)}`);
        s += `<polygon points="${top.concat(bot).join(' ')}" fill="${m.color}" opacity=".16"/>`;
      }
      if (r.length > 1) s += `<polyline fill="none" stroke="${m.color}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" points="${r.map(i => `${xc(i).toFixed(1)},${yv(B[i].agg.mean).toFixed(1)}`).join(' ')}"/>`;
    }
    const mr = n <= 14 ? 5 : n <= 31 ? 3.2 : 0; let nTri = 0;
    B.forEach((b, i) => {
      if (!b.agg) return;
      if (whisk && b.agg.max > b.agg.min) s += `<line x1="${xc(i).toFixed(1)}" x2="${xc(i).toFixed(1)}" y1="${yv(b.agg.max).toFixed(1)}" y2="${yv(b.agg.min).toFixed(1)}" stroke="${m.color}" stroke-width="2" opacity=".45"/><line x1="${(xc(i) - 5).toFixed(1)}" x2="${(xc(i) + 5).toFixed(1)}" y1="${yv(b.agg.max).toFixed(1)}" y2="${yv(b.agg.max).toFixed(1)}" stroke="${m.color}" stroke-width="2" opacity=".45"/><line x1="${(xc(i) - 5).toFixed(1)}" x2="${(xc(i) + 5).toFixed(1)}" y1="${yv(b.agg.min).toFixed(1)}" y2="${yv(b.agg.min).toFixed(1)}" stroke="${m.color}" stroke-width="2" opacity=".45"/>`;
      const r0 = norms[i], dev = r0 && r0.sd > 0 ? (b.agg.mean - r0.m) / r0.sd : 0;
      if (mr && Math.abs(dev) > 1) {      // outside the personal band: a triangle shows the direction
        const x = xc(i), y = yv(b.agg.mean), a = mr * 1.9, up = dev > 0; nTri++;
        s += `<polygon class="tri ${up ? 'up' : 'dn'}" points="${up ? `${x - a},${y + a * .8} ${x + a},${y + a * .8} ${x},${y - a}` : `${x - a},${y - a * .8} ${x + a},${y - a * .8} ${x},${y + a}`}" stroke-width="1.6" stroke-linejoin="round"/>`;
      } else if (mr) s += `<circle cx="${xc(i).toFixed(1)}" cy="${yv(b.agg.mean).toFixed(1)}" r="${mr}" class="mk" stroke="${m.color}" stroke-width="2.4"/>`;
    });

    // hover layer
    const tips = [], pts = [], drill = [];
    B.forEach((b, i) => {
      const a = b.agg, r = norms[i];
      pts.push({ x: xc(i), y: a ? yv(a.mean) : PT + 30 });
      drill.push(b.drill && b.status === 'ok' && a ? b.drill : null);
      if (b.status !== 'ok') { tips.push(null); return; }
      if (!a) { tips.push(tipHTML(b.tip, ['<span class="tm">No data</span>'])); }
      else {
        const L = [`${a.n > 1 ? 'Average' : 'Value'} <b>${fmt(a.mean, m.decimals)} ${m.unit}</b>`];
        if (a.n > 1) L.push(`<span class="tm">Range ${fmt(a.min, m.decimals)}–${fmt(a.max, m.decimals)} · n = ${a.n}</span>`);
        if (r) L.push(`<span class="tm">vs your norm ${vsText(a.mean, r, m.decimals, m.unit)}</span>`);
        tips.push(tipHTML(b.tip, L, drill[i] ? `Click to zoom to ${scaleLabel(b.drill.scale)}` : ''));
      }
      s += `<rect class="hv" data-i="${i}" x="${(PL + i * bw).toFixed(1)}" y="${PT}" width="${bw.toFixed(1)}" height="${PH}"/>`;
    });
    s += hoverEl() + '</svg>';
    const legend = `<span><i class="line" style="background:${m.color}"></i>${n <= 14 || c.w.scale === 'hour' ? 'Value / average' : 'Average'}</span>`
      + (showBand ? `<span><i style="background:${m.color};opacity:.25"></i>Min–max range</span>` : whisk && B.some(b => b.agg && b.agg.n > 1) ? `<span><i class="line" style="background:${m.color};opacity:.5"></i>Min–max range</span>` : '')
      + (hasNorm ? `<span><i style="background:${m.color};opacity:.14"></i>Your personal norm (own mean ± 1 SD)</span>` : '')
      + (nTri ? '<span><i class="tri-l up"></i>Above your norm</span><span><i class="tri-l dn"></i>Below your norm</span>' : '')
      + '<span><i style="background:repeating-linear-gradient(45deg,var(--hatch) 0 2px,var(--card) 2px 5px)"></i>No data</span>';
    return { svg: s, tips, pts, drill, legend, dotColor: m.color };
  }

  /* time axis (day window): same x-mapping as the hourly chart */
  function timeAxis(w, yBottom) {
    let s = '';
    for (let h = 0; h < 24; h += 3) {
      const x = PL + h / 24 * PW;
      s += `<line class="grid" x1="${x}" x2="${x}" y1="${PT}" y2="${yBottom}"/><text class="ax" x="${x}" y="${H - 22}" text-anchor="middle">${pad(h)}:00</text>`;
    }
    return s + `<text class="axu" x="${W - PR}" y="${H - 5}" text-anchor="end">Time of day (UTC)</text>`;
  }
  const xT = (w, t) => PL + (t - w.start) / DAY * PW;
  function futureHatch(w) {
    if (w.end <= NOW + MIN) return '';
    const x0 = xT(w, NOW + MIN);
    return `<rect x="${x0.toFixed(1)}" y="${PT}" width="${(PL + PW - x0).toFixed(1)}" height="${PH}" fill="url(#hh)" opacity=".7"/>`;
  }

  /* day window, self-reported / test metrics: individual events on a 24-h axis */
  function chartEvents(c) {
    const m = c.met, w = c.w, ev = samples(m.key, w.start, w.end), nr = normFor(m.key, 'event');
    let lo = Infinity, hi = -Infinity;
    ev.forEach(e => { lo = Math.min(lo, e.v); hi = Math.max(hi, e.v); });
    if (nr) { lo = Math.min(lo, nr.m - nr.sd); hi = Math.max(hi, nr.m + nr.sd); }
    if (!isFinite(lo)) { lo = m.bounds[0]; hi = m.bounds[1]; }
    const sc = niceScale(lo, hi, m), yv = v => PT + PH * (1 - (v - sc.y0) / (sc.y1 - sc.y0));
    let s = `<svg class="hchart" viewBox="0 0 ${W} ${H}">${HATCH}` + futureHatch(w) + yAxis(sc, yv, m.unit) + timeAxis(w, PT + PH);
    if (nr) s += `<rect x="${PL}" y="${yv(Math.min(sc.y1, nr.m + nr.sd)).toFixed(1)}" width="${PW}" height="${Math.max(0, yv(Math.max(sc.y0, nr.m - nr.sd)) - yv(Math.min(sc.y1, nr.m + nr.sd))).toFixed(1)}" fill="${m.color}" opacity=".10"/>`;
    const tips = [], pts = [];
    ev.forEach((e, i) => {
      const x = xT(w, e.t), y = yv(e.v);
      s += `<line x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${y.toFixed(1)}" y2="${PT + PH}" stroke="${m.color}" stroke-width="2" opacity=".35"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8" fill="${m.color}" class="evd" stroke-width="2.5"/><text class="lbl" x="${x.toFixed(1)}" y="${(y - 14).toFixed(1)}" text-anchor="middle">${fmt(e.v, 0)}</text>`;
      const title = e.type === 'checkin' ? `${SLOT[e.ref.k]} check-in · ${hhmm(e.t)} UTC` : `Cognitive test · ${hhmm(e.t)} UTC`;
      tips.push(tipHTML(title, [`${m.label} <b>${fmt(e.v, 0)} ${m.unit}</b>`, nr ? `<span class="tm">vs your norm ${vsText(e.v, nr, m.decimals, m.unit)}</span>` : '']));
      pts.push({ x, y });
      s += `<circle class="hv" data-i="${i}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="16"/>`;
    });
    if (!ev.length) s += `<text class="empty-msg" x="${PL + PW / 2}" y="${PT + PH / 2}" text-anchor="middle">No ${m.key === 'cog' ? 'cognitive tests' : 'check-ins'} recorded on this day</text>`;
    s += hoverEl() + '</svg>';
    return { svg: s, tips, pts, drill: [], dotColor: m.color,
      legend: `<span><i class="dot" style="background:${m.color}"></i>${m.key === 'cog' ? 'Test result' : 'Check-in answer'}</span>` + (nr ? `<span><i style="background:${m.color};opacity:.14"></i>Your personal norm (own mean ± 1 SD)</span>` : '') };
  }

  /* day window, sleep: sessions as bars on a 24-h axis */
  function chartSleep(c) {
    const m = c.met, w = c.w, ses = SL.filter(x => x.s < w.end && x.e > w.start);
    let s = `<svg class="hchart" viewBox="0 0 ${W} ${H}">${HATCH}` + futureHatch(w) + timeAxis(w, PT + PH);
    const tips = [], pts = [], cy = PT + PH / 2;
    ses.forEach((x, i) => {
      const x0 = xT(w, Math.max(x.s, w.start)), x1 = xT(w, Math.min(x.e, w.end));
      s += `<rect x="${x0.toFixed(1)}" y="${cy - 28}" width="${Math.max(2, x1 - x0).toFixed(1)}" height="56" rx="10" fill="${m.color}" opacity=".85"/>`;
      if (x1 - x0 > 90) s += `<text x="${((x0 + x1) / 2).toFixed(1)}" y="${cy + 5}" text-anchor="middle" fill="#fff" font-size="15" font-weight="600" font-family="inherit">${dur(x.h)}</text>`;
      tips.push(tipHTML('Sleep', [`${dShort(x.s)} ${hhmm(x.s)} → ${dShort(x.e)} ${hhmm(x.e)} UTC`, `Duration <b>${dur(x.h)}</b>`,
        normFor('sleep', 'event') ? `<span class="tm">vs your norm ${vsText(x.h, normFor('sleep', 'event'), 1, 'h')}</span>` : '']));
      pts.push({ x: (x0 + x1) / 2, y: cy - 28 });
      s += `<rect class="hv" data-i="${i}" x="${x0.toFixed(1)}" y="${cy - 28}" width="${Math.max(2, x1 - x0).toFixed(1)}" height="56"/>`;
    });
    if (!ses.length) s += `<text class="empty-msg" x="${PL + PW / 2}" y="${cy}" text-anchor="middle">No sleep session on this day</text>`;
    s += hoverEl() + '</svg>';
    return { svg: s, tips, pts, drill: [], legend: `<span><i style="background:${m.color}"></i>Sleep session (a night is counted on the day you wake up)</span>`, noDot: true };
  }

  /* day timeline strip: sleep + check-ins + tests on one 24-h line */
  function dayStrip(w) {
    const SH = 92, ty = 34, th = 28;
    let s = `<svg class="hchart" viewBox="0 0 ${W} ${SH}">${HATCH}<rect x="${PL}" y="${ty}" width="${PW}" height="${th}" rx="14" class="trk"/>`;
    for (let h = 0; h < 24; h += 3) { const x = PL + h / 24 * PW; s += `<line class="grid" x1="${x}" x2="${x}" y1="${ty - 6}" y2="${ty + th + 6}"/><text class="ax" x="${x}" y="${SH - 12}" text-anchor="middle">${pad(h)}:00</text>`; }
    if (w.end > NOW + MIN) { const x0 = xT(w, NOW + MIN); s += `<rect x="${x0.toFixed(1)}" y="${ty}" width="${(PL + PW - x0).toFixed(1)}" height="${th}" rx="6" fill="url(#hh)" opacity=".8"/>`; }
    const tips = [], pts = []; let i = 0;
    SL.filter(x => x.s < w.end && x.e > w.start).forEach(x => {
      const x0 = xT(w, Math.max(x.s, w.start)), x1 = xT(w, Math.min(x.e, w.end));
      s += `<rect x="${x0.toFixed(1)}" y="${ty}" width="${Math.max(2, x1 - x0).toFixed(1)}" height="${th}" rx="8" fill="${MET.sleep.color}" opacity=".8"/>`;
      tips.push(tipHTML('Sleep', [`${hhmm(x.s)} → ${hhmm(x.e)} UTC`, `<b>${dur(x.h)}</b>`])); pts.push({ x: (x0 + x1) / 2, y: ty });
      s += `<rect class="hv" data-i="${i++}" x="${x0.toFixed(1)}" y="${ty}" width="${Math.max(2, x1 - x0).toFixed(1)}" height="${th}"/>`;
    });
    CI.filter(x => x.t >= w.start && x.t < w.end).forEach(x => {
      const px = xT(w, x.t);
      s += `<circle cx="${px.toFixed(1)}" cy="${ty + th / 2}" r="9" fill="${MET.mood.color}" class="evd" stroke-width="2.5"/>`;
      tips.push(tipHTML(`${SLOT[x.k]} check-in · ${hhmm(x.t)} UTC`, [`Mood <b>${x.mood}</b> · Stress <b>${x.stress}</b> · Energy <b>${x.energy}</b>`])); pts.push({ x: px, y: ty });
      s += `<circle class="hv" data-i="${i++}" cx="${px.toFixed(1)}" cy="${ty + th / 2}" r="14"/>`;
    });
    TS.filter(x => x.t >= w.start && x.t < w.end).forEach(x => {
      const px = xT(w, x.t), cy = ty + th / 2;
      s += `<rect x="${(px - 7).toFixed(1)}" y="${cy - 7}" width="14" height="14" transform="rotate(45 ${px.toFixed(1)} ${cy})" fill="${MET.cog.color}" class="evd" stroke-width="2.5"/>`;
      tips.push(tipHTML(`Cognitive test · ${hhmm(x.t)} UTC`, [`Score <b>${x.v}</b>`])); pts.push({ x: px, y: ty });
      s += `<circle class="hv" data-i="${i++}" cx="${px.toFixed(1)}" cy="${cy}" r="14"/>`;
    });
    if (w.start <= NOW && w.end > NOW) { const x = xT(w, NOW); s += `<line x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${ty - 12}" y2="${ty + th + 8}" class="nowl" stroke-width="2"/><text class="axu" x="${x.toFixed(1)}" y="${ty - 16}" text-anchor="middle">now</text>`; }
    s += '<line class="hguide" y1="22" y2="76" x1="0" x2="0" visibility="hidden"/></svg>';
    return { svg: s, tips, pts, drill: [], noDot: true };
  }

  /* ----------------------------------------------------------- mount / hover */
  function mount(wrap, res, onDrill) {
    wrap.innerHTML = res.svg + '<div class="tip" hidden></div>';
    const svg = wrap.querySelector('svg'), tip = wrap.querySelector('.tip');
    const dot = svg.querySelector('.hdot'), guide = svg.querySelector('.hguide');
    const vb = svg.viewBox.baseVal;
    const hide = () => { tip.hidden = true; if (dot) dot.setAttribute('visibility', 'hidden'); if (guide) guide.setAttribute('visibility', 'hidden'); };
    function show(i) {
      const html = res.tips[i], p = res.pts[i]; if (!html || !p) return hide();
      tip.innerHTML = html; localize(tip); tip.hidden = false;
      const k = svg.getBoundingClientRect().width / vb.width, wrapW = wrap.clientWidth, tw = tip.offsetWidth;
      tip.style.left = Math.max(tw / 2 + 4, Math.min(wrapW - tw / 2 - 4, p.x * k)) + 'px';
      tip.style.top = Math.max(tip.offsetHeight + 4, p.y * k - 12) + 'px';
      if (guide) { guide.setAttribute('x1', p.x); guide.setAttribute('x2', p.x); guide.setAttribute('visibility', 'visible'); }
      if (dot && !res.noDot && p.y != null) { dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y); dot.setAttribute('stroke', res.dotColor || '#1a8cf0'); dot.setAttribute('visibility', 'visible'); }
    }
    wrap.querySelectorAll('.hv').forEach(r => {
      const i = +r.dataset.i;
      r.addEventListener('mouseenter', () => show(i));
      r.addEventListener('mouseleave', hide);
      if (res.drill && res.drill[i]) { r.style.cursor = 'pointer'; r.addEventListener('click', () => onDrill(res.drill[i])); }
    });
  }

  