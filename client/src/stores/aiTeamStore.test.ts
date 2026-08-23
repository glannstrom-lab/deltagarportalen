import { describe, it, expect, beforeEach } from 'vitest'
import { useAITeamStore } from './aiTeamStore'
import type { AgentId, ChatMessage, PersonalityId } from '@/components/ai-team/types'

// Fixturen speglar ChatMessage i prod-form: agentId och personalityId ingår.
// (Lärdomen 2026-08-03: fixturer som är snällare än verkligheten bevisar
// att koden fungerar på data som inte finns.)
const meddelande = (role: 'user' | 'assistant', content: string) => ({
  role,
  content,
  agentId: 'arbetskonsulent' as AgentId,
  personalityId: 'professional' as PersonalityId,
})

const nollställ = () =>
  useAITeamStore.setState({
    selectedAgent: 'arbetskonsulent',
    selectedPersonality: 'professional',
    responseMode: 'medium',
    messages: [],
    isLoading: false,
    error: null,
  })

/**
 * AI-teamets chattstore. Två saker här är inte kosmetiska:
 * (1) att byte av agent RENSAR historiken — annars läser nästa agent en
 *     konversation den aldrig deltog i, och svaren blir obegripliga;
 * (2) 50-meddelanderstaket — utan det växer localStorage-persistensen tills
 *     sidan blir seg på svaga enheter.
 */
describe('aiTeamStore', () => {
  beforeEach(nollställ)

  it('startar med arbetskonsulenten och tom historik', () => {
    const s = useAITeamStore.getState()

    expect(s.selectedAgent).toBe('arbetskonsulent')
    expect(s.messages).toEqual([])
    expect(s.error).toBeNull()
  })

  /**
   * ÄNDRAT 2026-08-23: testet krävde tidigare att historiken RENSAS vid
   * agentbyte, och cementerade därmed två buggar.
   *
   * 1. Agentkorten är en `radiogroup` — en piltangent räckte för att radera
   *    hela samtalet, utan varning.
   * 2. Sparningen till `ai_team_sessions` är debouncead 1000 ms. Bytte man
   *    agent inom den sekunden avbröt effektens cleanup timern samtidigt som
   *    `messages` nollställdes — meddelandet fanns då varken i minnet eller i
   *    databasen.
   *
   * `AgentChat` laddar historiken per agent vid byte, så det finns ingen
   * anledning att tömma här.
   */
  it('byte av agent behåller historiken men nollställer laddning/fel', () => {
    const s = useAITeamStore.getState()
    s.addMessage(meddelande('user', 'Hej'))
    useAITeamStore.setState({ isLoading: true, error: 'gammalt fel' })

    useAITeamStore.getState().setAgent('studievagledare')

    const efter = useAITeamStore.getState()
    expect(efter.selectedAgent).toBe('studievagledare')
    expect(efter.messages).toHaveLength(1)
    expect(efter.messages[0].content).toBe('Hej')
    expect(efter.isLoading).toBe(false)
    expect(efter.error).toBeNull()
  })

  it('att välja samma agent igen är en nolloperation', () => {
    useAITeamStore.getState().addMessage(meddelande('user', 'Hej'))
    useAITeamStore.setState({ error: 'gammalt fel' })

    useAITeamStore.getState().setAgent('arbetskonsulent')

    // Felet står kvar: inget byte skedde, så ingenting ska nollställas.
    expect(useAITeamStore.getState().error).toBe('gammalt fel')
  })

  it('byte av personlighet behåller historiken', () => {
    useAITeamStore.getState().addMessage(meddelande('user', 'Hej'))

    useAITeamStore.getState().setPersonality('empathetic')

    expect(useAITeamStore.getState().messages).toHaveLength(1)
    expect(useAITeamStore.getState().selectedPersonality).toBe('empathetic')
  })

  it('addMessage sätter id och timestamp', () => {
    useAITeamStore.getState().addMessage(meddelande('user', 'Vad gör jag nu?'))

    const [msg] = useAITeamStore.getState().messages
    expect(msg.content).toBe('Vad gör jag nu?')
    expect(msg.id).toBeTruthy()
    expect(msg.timestamp).toBeInstanceOf(Date)
  })

  it('ger varje meddelande ett unikt id', () => {
    const s = useAITeamStore.getState()
    s.addMessage(meddelande('user', 'a'))
    s.addMessage(meddelande('assistant', 'b'))

    const [a, b] = useAITeamStore.getState().messages
    expect(a.id).not.toBe(b.id)
  })

  it('addMessage rensar ett tidigare fel', () => {
    useAITeamStore.setState({ error: 'timeout' })

    useAITeamStore.getState().addMessage(meddelande('user', 'igen'))

    expect(useAITeamStore.getState().error).toBeNull()
  })

  it('behåller de 50 SENASTE meddelandena, inte de 50 första', () => {
    const s = useAITeamStore.getState()
    for (let i = 0; i < 55; i++) {
      s.addMessage(meddelande('user', `nr ${i}`))
    }

    const msgs = useAITeamStore.getState().messages
    expect(msgs).toHaveLength(50)
    expect(msgs[0].content).toBe('nr 5')
    expect(msgs[49].content).toBe('nr 54')
  })

  it('setMessages ersätter hela historiken', () => {
    useAITeamStore.getState().addMessage(meddelande('user', 'gammalt'))

    const nya: ChatMessage[] = [
      { id: '1', ...meddelande('user', 'inläst'), timestamp: new Date() },
    ]
    useAITeamStore.getState().setMessages(nya)

    expect(useAITeamStore.getState().messages).toEqual(nya)
  })

  it('setError stänger av laddningsläget', () => {
    useAITeamStore.setState({ isLoading: true })

    useAITeamStore.getState().setError('AI svarade inte')

    expect(useAITeamStore.getState().isLoading).toBe(false)
    expect(useAITeamStore.getState().error).toBe('AI svarade inte')
  })

  it('setLoading rör inte felet', () => {
    useAITeamStore.setState({ error: 'kvarstår' })

    useAITeamStore.getState().setLoading(true)

    expect(useAITeamStore.getState().error).toBe('kvarstår')
    expect(useAITeamStore.getState().isLoading).toBe(true)
  })

  it('clearMessages och resetChat tömmer historiken', () => {
    const s = useAITeamStore.getState()
    s.addMessage(meddelande('user', 'a'))
    s.clearMessages()
    expect(useAITeamStore.getState().messages).toEqual([])

    useAITeamStore.getState().addMessage(meddelande('user', 'b'))
    useAITeamStore.setState({ isLoading: true, error: 'fel' })
    useAITeamStore.getState().resetChat()

    const efter = useAITeamStore.getState()
    expect(efter.messages).toEqual([])
    expect(efter.isLoading).toBe(false)
    expect(efter.error).toBeNull()
  })

  it('resetChat behåller vald agent och personlighet', () => {
    useAITeamStore.setState({ selectedAgent: 'studievagledare', selectedPersonality: 'empathetic' })

    useAITeamStore.getState().resetChat()

    expect(useAITeamStore.getState().selectedAgent).toBe('studievagledare')
    expect(useAITeamStore.getState().selectedPersonality).toBe('empathetic')
  })

  it('setResponseMode uppdaterar svarsläget', () => {
    useAITeamStore.getState().setResponseMode('short')

    expect(useAITeamStore.getState().responseMode).toBe('short')
  })
})
