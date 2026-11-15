/* ------------------------------------------------------------------ state */
  const state = { scale: 'day', cursor: NOW, metric: 'hr', notice: '' };
  const available = (key, scale) => MET[key].kind === 'continuous' || scale !== 'hour';       // 'hour' window = one point per minute
  const clamp = ms => Math.min(NOW, Math.max(START, ms));

  function setState(patch) {
    Object.assign(state, patch);
    state.notice = patch.notice || '';
    state.cursor = clamp(state.cursor);
    if (!available(state.metric, state.scale)) {
      state.notice = `${MET[state.metric].label} is recorded only at check-ins / tests, so it can't be shown for a ${scaleLabel(state.scale)} window — showing Heart rate instead.`;
      state.metric = 'hr';
    }
    render();
  }
  const go = target => setState({ scale: target.scale, cursor: target.cursor });

  /* ---------------------------------------------------------------- render */
  function render() {
    const w = windowFor(state.scale, state.cursor), met = MET[state.metric], bk = makeBuckets(w);
    const c = { w, met, bk, B: bk.B };
    fillAgg(c);
    setChartH(chartHeight());
    c.stats = winStats(met.key, w);
    c.flight = flightStats(met.key);
    renderControls(c); renderStats(c); renderChartCard(c); renderTable(c); renderEvents(c); renderDynamics();
    localize(document.getElementById('view'));
  }

  function renderControls(c) {
    const w = c.w;
    document.querySelectorAll('#h-scales button').forEach(b => b.classList.toggle('active', b.dataset.k === STEP_OF[w.scale]));
    $('h-period').textContent = windowLabel(w);
    $('h-prev').disabled = !canGo(w, -1);
    $('h-next').disabled = !canGo(w, +1);
    $('h-date').value = iso(state.cursor);

    const d = dt(w.start), y = d.getUTCFullYear();
    const all = {
      flight: { l: 'Whole flight', s: 'flight' }, years: { l: windowLabel(windowFor('years', NOW)), s: 'years' }, year: { l: String(y), s: 'year' },
      quarter: { l: `Q${Math.floor(d.getUTCMonth() / 3) + 1} ${y}`, s: 'quarter' }, month: { l: MONL[d.getUTCMonth()], s: 'month' },
      week: { l: `Week of ${d.getUTCDate()} ${MON[d.getUTCMonth()]}`, s: 'week' }, day: { l: dShort(w.start), s: 'day' }, hour: { l: `${pad(d.getUTCHours())}:00`, s: 'hour' },
    };
    const top = ['flight', 'years', 'year', 'quarter'], day = [...top, 'month', 'day'];
    const chain = { flight: ['flight'], years: ['flight', 'years'], year: ['flight', 'years', 'year'], quarter: top, month: [...top, 'month'], week: [...top, 'week'], day, hour: [...day, 'hour'] }[w.scale];
    $('h-crumbs').innerHTML = chain.map((k, i) => i === chain.length - 1
      ? `<span class="cur">${esc(all[k].l)}</span>`
      : `<button data-s="${all[k].s}">${esc(all[k].l)}</button><i>›</i>`).join('');
    $('h-crumbs').querySelectorAll('button').forEach(b => b.addEventListener('click', () => setState({ scale: b.dataset.s })));

    $('h-metrics').innerHTML = D.metrics.map(m => {
      const ok = available(m.key, w.scale);
      return `<button class="tab ${m.key === c.met.key ? 'active' : ''}" style="--mc:${m.color}" data-k="${m.key}" ${ok ? '' : 'disabled'} title="${ok ? m.source : m.label + ' is recorded only at check-ins / tests'}">${esc(m.label)}</button>`;
    }).join('');
    $('h-metrics').querySelectorAll('.tab:not([disabled])').forEach(b => b.addEventListener('click', () => setState({ metric: b.dataset.k })));
  }

  /* verdict against the person's OWN norm. Mood/stress/energy/cognitive have a clear "better" direction;
     heart rate and sleep are only reported as above / below (no judgement without clinical context). */
  function verdict(dev, out, dir) {
    if (!out) return ['Within your usual range', 'ok'];
    if (dir) return dev * dir > 0 ? ['Better than your norm', 'ok'] : ['Worse than your norm', 'warn'];
    return [dev > 0 ? 'Above your usual range' : 'Below your usual range', 'warn'];
  }
  function chartHeight() {
    const wrap = $('h-chart'); if (!wrap || !wrap.clientWidth) return 336;
    const top = wrap.getBoundingClientRect().top + window.scrollY;
    const px = window.innerHeight - top - 46 - 34 - 28 - 20 - (state.scale === 'day' ? 124 : 0);
    return Math.max(state.scale === 'day' ? 170 : 230, Math.min(520, px * W / wrap.clientWidth));
  }

  function renderDynamics() {
    const box = $('h-dyn'); if (!box) return;
    const days = lastDays(14), cur7 = days.slice(7), prev7 = days.slice(0, 7), avg = (arr, k) => { const v = arr.map(d => dayMean(k, d)).filter(z => z != null); return v.length >= 3 ? v.reduce((a, b) => a + b, 0) / v.length : null; };
    let rows = '';
    for (const k of ['hr', 'mood', 'stress', 'energy', 'sleep', 'cog']) {
      const m = MET[k], n = D.norms[k] && D.norms[k].daily, a = avg(cur7, k), p = avg(prev7, k); if (!n || a == null || p == null) continue;
      const dec = Math.max(m.decimals, 1), dev = a - n.m, z = n.sd > 0 ? dev / n.sd : 0, out = Math.abs(z) > 1, dir = DIR[k] || 0, dl = a - p, tiny = Math.abs(dl) < 0.25 * n.sd;
      const v = verdict(dev, out, dir);
      let tr, tcls;
      if (tiny) { tr = 'Stable'; tcls = 'na'; }
      else if (dir) { const good = dl * dir > 0; tr = good ? 'Improving' : 'Worsening'; tcls = good ? 'ok' : 'warn'; }
      else { const closer = Math.abs(a - n.m) < Math.abs(p - n.m); tr = closer ? 'Moving toward your norm' : 'Moving away from your norm'; tcls = closer ? 'ok' : 'warn'; }
      rows += `<tr><td><i class="mdot" style="background:${m.color}"></i>${m.label}</td><td class="num">${fmt(n.m, dec)} ± ${fmt(n.sd, dec)}</td><td class="num"><b>${fmt(a, dec)}</b> ${m.unit}</td>
        <td class="num">${sgn(dev, dec)} · ${sgn(z, 1)} SD</td><td><span class="chip ${v[1]}">${v[0]}</span></td>
        <td class="num">${sgn(dl, dec)}</td><td><span class="chip ${tcls}">${tr}</span></td></tr>`;
    }
    box.innerHTML = rows ? `<table class="htable"><thead><tr><th>Indicator</th><th>Your norm (mean ± SD)</th><th>Last 7 days</th><th>Deviation</th><th>Status</th><th>vs previous 7 days</th><th>Trend</th></tr></thead><tbody>${rows}</tbody></table>` : '<div class="ev-empty">Not enough data yet.</div>';
  }

  function statCard(label, color, value, unit, sub, extra) {
    return `<div class="stat-card"><div class="stat-label">${color ? `<i style="background:${color}"></i>` : ''}${esc(label)}</div>
      <div class="stat-value">${value}${unit ? `<small>${esc(unit)}</small>` : ''}</div><div class="stat-sub">${sub}</div>${extra || ''}</div>`;
  }
  function renderStats(c) {
    const m = c.met, st = c.stats, dec = m.decimals, adec = Math.max(dec, 1), fl = c.flight;
    const kind = normKind(m.key, c.w.scale, false), nr = st ? normFor(m.key, kind, dt(c.w.start).getUTCHours()) : null;
    const nTxt = !st ? 'No data in this window'
      : `n = ${st.n.toLocaleString(LOC())} ${st.unit}` + (st.cover != null && st.cover < 0.995 ? ` · ${Math.round(st.cover * 100)}% coverage` : '');
    const cards = [];
    cards.push(statCard(`Average ${m.label.toLowerCase()}`, m.color, st ? fmt(st.mean, adec) : '—', st ? m.unit : '', nTxt));

    if (st && nr) {
      const d = st.mean - nr.m, z = nr.sd > 0 ? d / nr.sd : 0, out = Math.abs(z) > 1;
      const ref = kind === 'hod' ? `your usual for ${pad(dt(c.w.start).getUTCHours())}:00 UTC` : 'your baseline';
      const dir = DIR[m.key] || 0, v = verdict(d, out, dir);
      cards.push(statCard('vs. your personal norm', null, `<span class="arr">${d > 0 ? '▲' : d < 0 ? '▼' : ''}</span>${sgn(d, adec)}`, m.unit,
        `${sgn(z, 1)} SD · ${ref}: ${fmt(nr.m, adec)} ± ${fmt(nr.sd, adec)} ${m.unit}`,
        `<span class="chip ${v[1]}">${v[0]}</span>`));
    } else {
      cards.push(statCard('vs. your personal norm', null, '—', '', st ? 'Not enough personal data yet to define a norm' : 'No data in this window', '<span class="chip na">n/a</span>'));
    }
    cards.push(statCard('Whole-flight average', null, fl ? fmt(fl.mean, adec) : '—', fl ? m.unit : '',
      fl ? `Your own mean, launch to now · n = ${fl.n.toLocaleString(LOC())} ${fl.unit}` : 'No data'));
    cards.push(statCard('Range in window', null, st ? `${fmt(st.min, dec)} – ${fmt(st.max, dec)}` : '—', st ? m.unit : '', 'Lowest – highest value'));
    $('h-stats').innerHTML = cards.join('');
  }

  function renderChartCard(c) {
    const w = c.w, m = c.met;
    $('h-title').textContent = `${m.label} · ${scaleLabel(w.scale)}`;
    $('h-sub').textContent = `${windowLabel(w)}${w.end > NOW + MIN ? ' · in progress' : ''} · ${m.source}`;
    let res;
    if (m.kind === 'event' && w.scale === 'day') res = m.key === 'sleep' ? chartSleep(c) : chartEvents(c);
    else res = chartSeries(c) || emptyChart(w.end <= START ? 'This period is before the mission started' : w.start >= NOW + MIN ? 'Nothing recorded yet for this period' : `No ${m.label.toLowerCase()} data in this window`);
    mount($('h-chart'), res, go);
    $('h-legend').innerHTML = res.legend || '';

    const strip = w.scale === 'day';
    $('h-strip-wrap').hidden = !strip;
    if (strip) {
      mount($('h-strip'), dayStrip(w), go);
      $('h-strip-legend').innerHTML = `<span><i style="background:${MET.sleep.color}"></i>Sleep</span><span><i class="dot" style="background:${MET.mood.color}"></i>Check-in</span><span><i style="background:${MET.cog.color};transform:rotate(45deg);width:10px"></i>Cognitive test</span>`;
    }
    const note = $('h-note');
    note.classList.toggle('notice', !!state.notice);
    note.textContent = state.notice || (res.drill && res.drill.some(Boolean) ? 'Tip: click a point to zoom in; ← → switch periods.' : '');
  }

  function vsCell(v, r, dec, unit) {
    if (!r || v == null) return '<span class="vs">—</span>';
    return `<span class="vs ${isOut(v, r) ? 'warn' : ''}">${vsText(v, r, dec, unit)}</span>`;
  }
  function renderTable(c) {
    const m = c.met, dec = m.decimals, w = c.w, box = $('h-table');
    $('h-bd-by').textContent = m.kind === 'event' && w.scale === 'day' ? '· by event' : `· by ${c.bk.kind}`;
    let rows = '', head = '', drills = [];
    if (m.kind === 'event' && w.scale === 'day') {
      head = '<th>Time (UTC)</th><th>Event</th><th>Value</th><th>vs your norm</th>';
      if (m.key === 'sleep') {
        SL.filter(x => x.s < w.end && x.e > w.start).forEach(x => {
          rows += `<tr><td class="num">${hhmm(x.s)} → ${hhmm(x.e)}</td><td>Sleep session</td><td class="num"><b>${dur(x.h)}</b></td><td>${vsCell(x.h, normFor('sleep', 'event'), 1, 'h')}</td></tr>`;
        });
      } else {
        samples(m.key, w.start, w.end).forEach(e => {
          rows += `<tr><td class="num">${hhmm(e.t)}</td><td>${e.type === 'checkin' ? SLOT[e.ref.k] + ' check-in' : 'Cognitive test'}</td><td class="num"><b>${fmt(e.v, 0)}</b> ${m.unit}</td><td>${vsCell(e.v, normFor(m.key, 'event'), dec, m.unit)}</td></tr>`;
        });
      }
      box.innerHTML = rows ? `<table class="htable"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>` : '<div class="ev-empty">No events on this day.</div>';
      return;
    }
    head = '<th>Period</th><th>Average</th><th>Range</th><th>Samples</th><th>vs your norm</th><th></th>';
    c.B.forEach((b, i) => {
      if (b.status !== 'ok') return;
      const a = b.agg, r = bucketNorm(c, b), click = b.drill && a;
      if (click) drills[i] = b.drill;
      rows += `<tr class="${click ? 'row-click' : ''} ${a ? '' : 'gap'}" data-i="${i}"><td>${esc(b.tip.replace(' UTC', ''))}</td>`
        + (a ? `<td class="num"><b>${fmt(a.mean, Math.max(dec, 1))}</b> ${m.unit}</td><td class="num">${a.n > 1 ? fmt(a.min, dec) + '–' + fmt(a.max, dec) : '—'}</td><td class="num">${a.n}</td><td>${vsCell(a.mean, r, dec, m.unit)}</td>`
          : '<td colspan="4">No data</td>') + `<td>${click ? '›' : ''}</td></tr>`;
    });
    box.innerHTML = rows ? `<table class="htable"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>` : '<div class="ev-empty">No data in this window.</div>';
    box.querySelectorAll('tr.row-click').forEach(tr => tr.addEventListener('click', () => go(drills[+tr.dataset.i])));
  }

  const ICON = {
    checkin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M8.5 10h1M12 10h4M8.5 14h1M12 14h4"/></svg>',
    test: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>',
    sleep: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/></svg>',
  };
  function renderEvents(c) {
    const w = c.w, box = $('h-events'), span = w.end - w.start;
    const counts = [CI.filter(x => x.t >= w.start && x.t < w.end).length, TS.filter(x => x.t >= w.start && x.t < w.end).length, SL.filter(x => x.e >= w.start && x.e < w.end).length];
    if (span > 7 * DAY) {
      box.innerHTML = `<div class="ev-empty"><b>${counts[0]}</b> check-ins · <b>${counts[1]}</b> cognitive tests · <b>${counts[2]}</b> nights of sleep in this period.<br>Choose a week or a day to see each event.</div>`;
      return;
    }
    const items = [];
    CI.filter(x => x.t >= w.start && x.t < w.end).forEach(x => items.push({ t: x.t, type: 'checkin', ic: MET.mood.color, title: `${SLOT[x.k]} check-in`,
      body: `<div class="ev-vals"><span>Mood <b>${x.mood}</b></span><span>Stress <b>${x.stress}</b></span><span>Energy <b>${x.energy}</b></span></div>` }));
    TS.filter(x => x.t >= w.start && x.t < w.end).forEach(x => items.push({ t: x.t, type: 'test', ic: MET.cog.color, title: 'Cognitive test', body: `<div class="ev-vals"><span>Score <b>${x.v}</b></span></div>` }));
    SL.filter(x => x.e >= w.start && x.e < w.end).forEach(x => items.push({ t: x.e, type: 'sleep', ic: MET.sleep.color, title: 'Sleep', body: `<div class="ev-vals"><span>${hhmm(x.s)} → ${hhmm(x.e)}</span><span><b>${dur(x.h)}</b></span></div>` }));
    items.sort((a, b) => a.t - b.t);
    if (!items.length) { box.innerHTML = '<div class="ev-empty">No check-ins, tests or sleep sessions in this window.</div>'; return; }
    box.innerHTML = '<ul class="ev-list">' + items.map((e, i) => `<li class="ev click" data-i="${i}"><div class="ev-ic" style="color:${e.ic};background:${e.ic}22">${ICON[e.type]}</div>
      <div class="ev-body"><b>${e.title}</b> <span class="ev-time">· ${span > DAY ? dShort(e.t) + ' ' : ''}${hhmm(e.t)} UTC</span>${e.body}</div></li>`).join('') + '</ul>';
    box.querySelectorAll('.ev').forEach(li => li.addEventListener('click', () => {
      const e = items[+li.dataset.i];
      if (w.scale === 'day' || w.scale === 'hour') setState({ scale: 'hour', cursor: e.t, metric: 'hr' });
      else setState({ scale: 'day', cursor: e.t });
    }));
  }

  