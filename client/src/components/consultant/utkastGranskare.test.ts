import { describe, it, expect } from 'vitest'
import { granskaUtkast, hittaHalsoord, hittaVarderingsord, delaIMeningar, KONTROLLTEXT, type ProblemTyp } from './utkastGranskare'

const UNDERLAG = [
  'senaste 30 dagarna',
  '- [2026-10-01] (GENERAL) Telefonsamtal 14:30. Deltagaren sökte 3 jobb och ringde Lagret AB.',
  '- [2026-10-12] (PROGRESS) Besök på Arbetsförmedlingen. CV uppdaterat.',
  '- Skaffa körkort — status: active, deadline: 2026-12-15, framsteg: 60%',
].join('\n')

const typer = (utkast: string, underlag: string = UNDERLAG): ProblemTyp[] =>
  granskaUtkast(utkast, underlag).meningar.flatMap((m) => m.problem.map((p) => p.typ))
const texter = (utkast: string, underlag: string = UNDERLAG): string[] =>
  granskaUtkast(utkast, underlag).meningar.flatMap((m) => m.problem.map((p) => p.text))

describe('AIX13 utkastGranskare — datum', () => {
  it('släpper igenom datum som finns i underlaget, i flera skrivsätt', () => {
    expect(typer('Deltagaren ringde 2026-10-01.')).toEqual([])
    expect(typer('Deltagaren ringde den 1 oktober 2026.')).toEqual([])
    expect(typer('Deltagaren ringde 1 oktober.')).toEqual([])
    expect(typer('Besöket var 12/10.')).toEqual([])
    expect(typer('Målet har deadline 15.12.2026.')).toEqual([])
    expect(typer('Källa: [journal 2026-10-12].')).toEqual([])
  })

  it('flaggar ett datum som inte finns i underlaget', () => {
    expect(texter('Deltagaren ringde 2026-10-02.')).toEqual(['2026-10-02'])
    expect(texter('Mötet hölls den 5 november.')).toEqual(['5 november'])
    expect(texter('Mötet hölls 7/11.')).toEqual(['7/11'])
  })

  it('samma dag men fel år flaggas när året står i utkastet', () => {
    expect(texter('Deltagaren ringde 1 oktober 2025.')).toEqual(['1 oktober 2025'])
  })

  it('siffrorna i ett datum räknas inte som tal', () => {
    // 2026, 10 och 01 finns inte som egna tal i underlaget — ändå inget talfel.
    expect(typer('Deltagaren ringde 2026-10-01.')).not.toContain('tal')
  })

  it('ett ogiltigt datum (månad 13) tolkas inte som datum utan som tal', () => {
    expect(typer('Se 31/13.')).toContain('tal')
  })
})

describe('AIX13 utkastGranskare — tal', () => {
  it('släpper igenom tal som finns i underlaget', () => {
    expect(typer('Deltagaren sökte 3 jobb.')).toEqual([])
    expect(typer('Framsteg 60 % mot målet.')).toEqual([])
    expect(typer('Perioden är 30 dagar.')).toEqual([])
    expect(typer('Samtalet var kl. 14:30.')).toEqual([])
  })

  it('flaggar ett tal som inte finns i underlaget', () => {
    expect(texter('Deltagaren sökte 7 jobb.')).toEqual(['7'])
    expect(texter('Framsteg 85 %.')).toEqual(['85'])
  })

  it('flaggar ett klockslag som inte finns i underlaget', () => {
    expect(texter('Samtalet var kl. 09:15.')).toEqual(['09:15'])
  })

  it('decimaltal normaliseras (komma = punkt)', () => {
    expect(typer('Det blev 2,5 timmar.', 'Det blev 2.5 timmar.')).toEqual([])
    expect(texter('Det blev 2,5 timmar.', 'Det blev 2 timmar.')).toEqual(['2,5'])
  })

  it('talord före enhet kontrolleras mot siffra eller ord i underlaget', () => {
    expect(typer('Deltagaren hade tre samtal.')).toEqual([]) // "3" finns
    expect(texter('Deltagaren hade fem samtal.')).toEqual(['fem samtal'])
    expect(typer('Deltagaren hade fem samtal.', 'Fem samtal hölls.')).toEqual([])
  })

  it('numrering av listor och rubriker räknas inte som tal', () => {
    expect(typer('1. Sammanfattning')).toEqual([])
    expect(typer('2) Genomförda aktiviteter')).toEqual([])
  })

  it('ett årtal som står i ett datum i underlaget godkänns fristående', () => {
    expect(typer('Perioden gäller hösten 2026.')).toEqual([])
    expect(texter('Perioden gäller hösten 2031.')).toEqual(['2031'])
  })
})

describe('AIX13 utkastGranskare — värdeomdömen och hälsoord', () => {
  it('flaggar värdeomdömen oavsett om de står i underlaget', () => {
    expect(typer('Deltagaren är motiverad.')).toEqual(['varderingsord'])
    expect(typer('Deltagaren är motiverad.', 'Deltagaren är motiverad.')).toEqual(['varderingsord'])
    expect(typer('Tyvärr kom deltagaren inte.')).toEqual(['varderingsord'])
    expect(typer('Visade en dålig attityd.')).toEqual(['varderingsord', 'varderingsord'])
  })

  it('KSL21: giltig/ogiltig frånvaro är ett värdeomdöme', () => {
    expect(texter('Frånvaron var ogiltig.')).toEqual(['ogiltig'])
    expect(texter('Skälet var giltigt.')).toEqual(['giltigt'])
  })

  it('flaggar hälsoord', () => {
    expect(typer('Deltagaren har en diagnos.')).toEqual(['halsoord'])
    expect(typer('Hon mår sämre.')).toEqual(['halsoord'])
    expect(typer('Deltagaren var sjukskriven.')).toEqual(['halsoord'])
    expect(typer('Besök på vårdcentralen.')).toEqual(['halsoord'])
  })

  it('ordgränser: "lat" matchar inte inuti andra ord, "beroende på" är inte ett hälsoord', () => {
    expect(typer('Deltagaren lade ett latinskt namn.')).toEqual([])
    expect(typer('Det blir en kontakt, beroende på tid.')).toEqual([])
    expect(typer('Mötet hölls i Södertälje.')).toEqual([])
  })

  it('hittaHalsoord / hittaVarderingsord är fristående och unika', () => {
    expect(hittaHalsoord('Depression och ångest. Depression igen.')).toEqual(['depression', 'ångest'])
    expect(hittaHalsoord('Kom på möte 3 gånger.')).toEqual([])
    expect(hittaVarderingsord('Motiverad och Duktig')).toEqual(['motiverad', 'duktig'])
  })
})

describe('AIX13 utkastGranskare — resultat och meningsdelning', () => {
  it('delar på rader och meningsslut men inte på förkortningar', () => {
    expect(delaIMeningar('Sammanfattning\nFörsta meningen. Andra meningen! Tredje?\n- punkt ett')).toEqual([
      'Sammanfattning', 'Första meningen.', 'Andra meningen!', 'Tredje?', '- punkt ett',
    ])
    expect(delaIMeningar('Det gäller t.ex. kontakt med AF.')).toEqual(['Det gäller t.ex. kontakt med AF.'])
  })

  it('markdown-markörer påverkar inte tal- eller ordkontrollen', () => {
    expect(typer('**Sammanfattning**')).toEqual([])
    expect(typer('- Deltagaren sökte 3 jobb.')).toEqual([])
  })

  it('flaggar per mening och räknar rätt', () => {
    const r = granskaUtkast('Deltagaren sökte 3 jobb. Deltagaren sökte 9 jobb. Hon är motiverad.', UNDERLAG)
    expect(r.meningar.map((m) => m.problem.length)).toEqual([0, 1, 1])
    expect(r.antalFlaggade).toBe(2)
    expect(r.antalProblem).toBe(2)
    expect(r.ren).toBe(false)
  })

  it('ett rent utkast är rent, och underlag kan ges som lista', () => {
    const r = granskaUtkast('Deltagaren sökte 3 jobb.', ['Deltagaren sökte', '3 jobb'])
    expect(r.ren).toBe(true)
    expect(r.antalFlaggade).toBe(0)
  })

  it('tomt utkast ger tomt resultat', () => {
    expect(granskaUtkast('', UNDERLAG)).toMatchObject({ meningar: [], antalFlaggade: 0, ren: true })
  })

  it('kontrolltexten säger vad granskningen inte är', () => {
    expect(KONTROLLTEXT).toMatch(/inte mot sanningen/)
  })
})
