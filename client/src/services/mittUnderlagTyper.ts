/** Dokumentmodellen för "Mitt underlag" — delad av mittUnderlag.ts och PDF-ritaren (undviker cirkulär import). */
export interface DokSektion {
  id: 'ansokningar' | 'aktivitet' | 'plan' | 'mal' | 'journal'
  rubrik: string
  /** Ersätter tabellen när delen är tom, kunde inte läsas eller utelämnades. */
  meddelande?: string
  ingress?: string
  kolumner?: string[]
  rader?: string[][]
  stycken?: string[]
}

export interface Dokument {
  titel: string
  undertitel: string
  sektioner: DokSektion[]
}
