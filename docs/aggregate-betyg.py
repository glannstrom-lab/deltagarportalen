"""Aggregate team-betyg-*.md files into a master table at docs/team-betyg.md"""
import os
import re
from collections import defaultdict
from statistics import mean

DOCS = os.path.dirname(os.path.abspath(__file__))
AGENTS = [
    'ux-designer',
    'accessibility-specialist',
    'qa-testare',
    'performance-engineer',
    'security-specialist',
    'ai-engineer',
    'fullstack-utvecklare',
    'product-owner',
    'arbetskonsulent',
    'langtidsarbetssokande',
]

SHORT = {
    'ux-designer': 'UX',
    'accessibility-specialist': 'A11y',
    'qa-testare': 'QA',
    'performance-engineer': 'Perf',
    'security-specialist': 'Sec',
    'ai-engineer': 'AI',
    'fullstack-utvecklare': 'Dev',
    'product-owner': 'PO',
    'arbetskonsulent': 'Kons',
    'langtidsarbetssokande': 'User',
}

# Master surface order (from surfaces.md) — keeps the aggregate readable
SURFACE_ORDER = [
    # Hubs
    ('H1', 'Översikt-hubben'),
    ('H2', 'Söka jobb-hubben'),
    ('H3', 'Karriär-hubben'),
    ('H4', 'Resurser-hubben'),
    ('H5', 'Min vardag-hubben'),
    # Dashboard
    ('D1', 'Dashboard översikt'),
    ('D2', 'Mina Quests'),
    # Job-search
    ('JS1', 'Sök'),
    ('JS2', 'Dagens jobb'),
    ('JS3', 'Sparade jobb'),
    ('JS4', 'Matchningar'),
    # Applications
    ('AP1', 'Pipeline'),
    ('AP2', 'Historik'),
    ('AP3', 'Kalender (ansökningar)'),
    ('AP4', 'Kontakter'),
    ('AP5', 'Statistik (ansökningar)'),
    # CV
    ('CV1', 'Skapa CV'),
    ('CV2', 'Mina CV'),
    ('CV3', 'Anpassa CV'),
    ('CV4', 'ATS-analys'),
    ('CV5', 'CV-tips'),
    # Cover letter
    ('CL1', 'Skriv brev'),
    ('CL2', 'Mina brev'),
    # Spontaneous
    ('SP1', 'Sök företag (spontan)'),
    ('SP2', 'Mina företag'),
    ('SP3', 'Statistik (spontan)'),
    # Söka jobb singles
    ('SJ1', 'Intervjuträning'),
    ('SJ2', 'Lön & Förhandling'),
    ('SJ3', 'Internationell guide'),
    ('SJ4', 'LinkedIn-optimering'),
    # Career tabs
    ('CA1', 'Arbetsmarknad'),
    ('CA2', 'Anpassning'),
    ('CA3', 'Credentials'),
    ('CA4', 'Flytta'),
    ('CA5', 'Karriärplan'),
    # Interest guide
    ('IG1', 'Intresseguide-test'),
    ('IG2', 'Intresseguide-resultat'),
    ('IG3', 'Yrken'),
    ('IG4', 'Utforska'),
    ('IG5', 'Historik (intresseguide)'),
    # Karriär singles
    ('KA1', 'Kompetensanalys'),
    ('KA2', 'Personligt varumärke'),
    ('KA3', 'Utbildning'),
    # Knowledge base tabs
    ('KB1', 'För dig'),
    ('KB2', 'Komma igång'),
    ('KB3', 'Ämnen'),
    ('KB4', 'Snabbhjälp'),
    ('KB5', 'Min resa'),
    ('KB6', 'Verktyg'),
    ('KB7', 'Trendar'),
    ('KB8', 'Berättelser'),
    # Resurser singles
    ('RE1', 'Mina dokument'),
    ('RE2', 'Utskriftsmaterial'),
    ('RE3', 'Externa resurser'),
    ('RE4', 'AI-team'),
    ('RE5', 'Nätverk'),
    # Wellness tabs
    ('WE1', 'Hälsa'),
    ('WE2', 'Rutiner'),
    ('WE3', 'Kognitiv träning'),
    ('WE4', 'Akut stöd'),
    # Min vardag singles
    ('MV1', 'Dagbok'),
    ('MV2', 'Kalender'),
    ('MV3', 'Övningar'),
    ('MV4', 'Min konsulent'),
    # Övriga
    ('OV1', 'Profil'),
    ('OV2', 'Inställningar'),
    ('OV3', 'Vanliga frågor'),
]

ROW_RE = re.compile(r'^\s*\|\s*([A-Z]{1,3}\d+)\s*\|([^|]*)\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|([^|]*)\|', re.MULTILINE)

def parse_agent_file(path):
    with open(path, encoding='utf-8') as f:
        text = f.read()
    rows = {}
    for m in ROW_RE.finditer(text):
        sid, name, u, f_, a, note = m.groups()
        rows[sid.strip()] = {
            'name': name.strip(),
            'u': int(u),
            'f': int(f_),
            'a': int(a),
            'note': note.strip(),
        }
    return rows

def main():
    # agent_data[agent][surface_id] = {u, f, a, note}
    agent_data = {}
    for a in AGENTS:
        path = os.path.join(DOCS, f'team-betyg-{a}.md')
        if os.path.exists(path):
            agent_data[a] = parse_agent_file(path)
            print(f'{a}: {len(agent_data[a])} rows')
        else:
            print(f'WARNING: missing {path}')

    # Build aggregate per surface
    out = []
    out.append('# Team-betyg — samlat resultat')
    out.append('')
    out.append('Aggregerat resultat från 10 specialagenter som betygsatt alla ~65 ytor på 1-10-skala för **Utseende (U)**, **Funktionalitet (F)** och **Användbarhet (A)**.')
    out.append('')
    out.append('Detaljerade noteringar per agent finns i `docs/team-betyg-{agent}.md`. Master-listan över ytor finns i `docs/team-betyg-surfaces.md`.')
    out.append('')
    out.append('## Översikt — medelvärde per yta')
    out.append('')
    out.append('Sorterat efter total-medel (lägst först → mest att förbättra). Tre kolumner per agent visas i appendix nedan.')
    out.append('')
    out.append('| ID | Yta | U | F | A | Total | Lägst | Högst |')
    out.append('|---|---|---|---|---|---|---|---|')

    rows_with_avg = []
    for sid, name in SURFACE_ORDER:
        us, fs, as_ = [], [], []
        all_scores = []
        per_agent = []
        for a in AGENTS:
            entry = agent_data.get(a, {}).get(sid)
            if entry:
                us.append(entry['u'])
                fs.append(entry['f'])
                as_.append(entry['a'])
                all_scores.append((a, entry['u'], entry['f'], entry['a']))
                per_agent.append((a, (entry['u'] + entry['f'] + entry['a']) / 3))
        if not us:
            continue
        u_avg = round(mean(us), 1)
        f_avg = round(mean(fs), 1)
        a_avg = round(mean(as_), 1)
        total = round((u_avg + f_avg + a_avg) / 3, 1)
        lowest = min(per_agent, key=lambda x: x[1])
        highest = max(per_agent, key=lambda x: x[1])
        rows_with_avg.append((sid, name, u_avg, f_avg, a_avg, total, lowest, highest))

    rows_with_avg.sort(key=lambda r: r[5])  # by total ascending
    for sid, name, u, f_, a, total, lo, hi in rows_with_avg:
        out.append(f'| {sid} | {name} | {u} | {f_} | {a} | **{total}** | {SHORT[lo[0]]} ({lo[1]:.1f}) | {SHORT[hi[0]]} ({hi[1]:.1f}) |')

    out.append('')
    out.append('## Per-dimensionsmatriser')
    out.append('')
    out.append('Tre tabeller — en per dimension. Surface × Agent (kortnamn). Färgkodning ej tillämpat (Markdown).')
    out.append('')

    for dim_key, dim_name in [('u', 'Utseende'), ('f', 'Funktionalitet'), ('a', 'Användbarhet')]:
        out.append(f'### {dim_name}')
        out.append('')
        header = '| ID | Yta | ' + ' | '.join(SHORT[a] for a in AGENTS) + ' | Snitt |'
        sep = '|---|---|' + '---|' * (len(AGENTS) + 1)
        out.append(header)
        out.append(sep)
        for sid, name in SURFACE_ORDER:
            cells = []
            scores = []
            for a in AGENTS:
                entry = agent_data.get(a, {}).get(sid)
                if entry:
                    cells.append(str(entry[dim_key]))
                    scores.append(entry[dim_key])
                else:
                    cells.append('—')
            if scores:
                avg = round(mean(scores), 1)
                out.append(f'| {sid} | {name} | ' + ' | '.join(cells) + f' | **{avg}** |')
        out.append('')

    out.append('## Topp & botten')
    out.append('')
    if rows_with_avg:
        bottom5 = rows_with_avg[:5]
        top5 = list(reversed(rows_with_avg[-5:]))
        out.append('### 5 ytor med lägst totalsnitt')
        out.append('')
        out.append('| ID | Yta | Total | Värst | Snitt-not |')
        out.append('|---|---|---|---|---|')
        for sid, name, _, _, _, total, lo, _ in bottom5:
            # find the lowest agent's note
            lo_agent = lo[0]
            note = agent_data.get(lo_agent, {}).get(sid, {}).get('note', '')
            out.append(f'| {sid} | {name} | **{total}** | {SHORT[lo_agent]} ({lo[1]:.1f}) | {note} |')
        out.append('')
        out.append('### 5 ytor med högst totalsnitt')
        out.append('')
        out.append('| ID | Yta | Total | Bäst | Snitt-not |')
        out.append('|---|---|---|---|---|')
        for sid, name, _, _, _, total, _, hi in top5:
            hi_agent = hi[0]
            note = agent_data.get(hi_agent, {}).get(sid, {}).get('note', '')
            out.append(f'| {sid} | {name} | **{total}** | {SHORT[hi_agent]} ({hi[1]:.1f}) | {note} |')
    out.append('')

    out.append('## Agent-koder')
    out.append('')
    out.append('| Kort | Agent |')
    out.append('|---|---|')
    for a in AGENTS:
        out.append(f'| {SHORT[a]} | [{a}](team-betyg-{a}.md) |')
    out.append('')

    out_path = os.path.join(DOCS, 'team-betyg.md')
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(out))
    print(f'Wrote {out_path}, {len(rows_with_avg)} surfaces')

if __name__ == '__main__':
    main()
