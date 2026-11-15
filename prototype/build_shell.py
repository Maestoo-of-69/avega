"""Build the single-file AVEGA app.

Run from the repo root:  python3 prototype/build_shell.py
Reads sources and icons.html from prototype/, data from data/, and writes the result to
prototype/avega_shell.html (git-ignored) and index.html (GitHub Pages entry).
Python 3.10+, standard library only.
"""
import base64, json, re, sys, pathlib
HERE = pathlib.Path(__file__).parent; ROOT = HERE.parent
sys.path.insert(0, str(ROOT))
from data.history_data import history_json
from data.crew_summary import summarize, export_synthetic
from data import crew as CR

def b64(p): return base64.b64encode((HERE / p).read_bytes()).decode()
tpl = (HERE / 'icons.html').read_text()
icons = {m.group(1): m.group(2).strip() for m in re.finditer(r"name == '([^']+)' -%}\n(.*?)\n\{%-", tpl, re.S)}
av = re.search(r"macro avatar\(\) -%\}.*?<svg[^>]*>(.*?)</svg>", tpl, re.S).group(1)
avatar = f'<svg viewBox="0 0 56 56" aria-hidden="true">{av.replace("avBg","avBgS").replace("avVisor","avVisorS")}</svg>'

DARK = """--bg:#07151b;--bg-wave1:#0e2630;--bg-wave2:#0b1e27;--card:#0e1f29;--card2:#0a1920;--text:#e6f3f5;--text2:#b2cbd1;--muted:#7fa0a8;--line:#1d3a45;
--blue:#27c4d6;--blue-d:#6fdce8;--blue-soft:#10363f;--green:#3fca7a;--green-d:#62d992;--green-soft:#11301f;--amber:#f2b84b;--amber-soft:#3a2c10;--violet:#a999ff;--violet-soft:#26204d;
--grid:#183540;--axis:#93b3ba;--hatch:#25434d;--nav-hover:#10262f;--nav-active:linear-gradient(90deg,#0f3a45,#0c2a33);--btn-soft:#0f3a45;--btn-ghost:#10262f;--pill:#12282f;
--checkin:linear-gradient(100deg,#0d2530 0%,#0c2630 60%,#0f3b47 100%);--shadow:0 8px 30px rgba(0,0,0,.4);--border:#183540;color-scheme:dark;"""
css = (HERE / 'shell.css').read_text()
css = css.replace('%%DARK_MEDIA%%', '@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ' + DARK + ' } }')
css = css.replace('%%DARK_ATTR%%', ':root[data-theme="dark"] { ' + DARK + ' }')

export_synthetic(30)
crew_json = json.dumps({"crew": [dict(p, summary=summarize(p["id"])) for p in CR.CREW], "doctor": CR.DOCTOR, "delay_min": CR.DELAY_MIN},
                       ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
data = "".join(f'<script id="avega-data-{p["id"]}" type="application/json">{history_json(30, p["id"])}</script>\n' for p in CR.CREW)
boot = (HERE / 'boot.js').read_text()
js = ("(function(){'use strict';\n" + boot + "\n"
      f"const ICONS={json.dumps(icons)};\nconst AVATAR={json.dumps(avatar)};\n"
      f"const IMGS={json.dumps({p.stem: 'data:image/jpeg;base64,' + base64.b64encode(p.read_bytes()).decode() for p in sorted((HERE / 'img').glob('*.jpg'))})};\n"
      + ''.join((HERE / f).read_text() + '\n' for f in ('core.js', 'explorer.js', 'i18n.js', 'engine.js', 'chat.js', 'instruments.js', 'radiation.js', 'creative.js', 'ui.js')) + '})();')
js = js.replace('</script', '<\\/script')
svg = lambda inner: f'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{inner}</svg>'
moon = '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>'
sun = '<circle cx="12" cy="12" r="4"/><path d="M12 2.5V5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>'
out = (HERE / 'shell.html').read_text()
for k, v in {'%%CSS%%': css, '%%FAV%%': b64('logo_fav.png'), '%%LOGO%%': b64('logo_sb.png'), '%%MOON%%': svg(moon), '%%SUN%%': svg(sun),
             '%%AVATAR%%': avatar, '%%DATA%%': data, '%%CREW%%': crew_json, '%%JS%%': js}.items():
    out = out.replace(k, v)
(HERE / 'avega_shell.html').write_text(out)
(ROOT / 'index.html').write_text(out)
print('icons', len(icons), 'size KB', round(len(out) / 1024))
