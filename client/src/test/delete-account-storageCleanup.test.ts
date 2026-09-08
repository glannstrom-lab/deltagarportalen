/**
 * SD3: storageCleanup — rekursiv listning under `<uid>/`, radering, och att
 * ett fel aldrig ser ut som "inga filer".
 *
 * Ligger i client/src/test/ (inte bredvid modulen) för att client/vitest.config.ts
 * har include: src/** — bredvid modulen kördes testet aldrig av `npm run test:run`
 * eller CI. Modulen har inga Deno-beroenden just för att kunna testas här.
 */
import { describe, it, expect, vi } from 'vitest'
import { cleanupUserStorage, listAllFiles, describeCleanup, USER_OWNED_BUCKETS, type StorageEntry } from '../../../supabase/functions/delete-account/storageCleanup'

const UID = 'aaaaaaaa-0000-0000-0000-000000000003'

/** En bucket i minnet med samma listningssemantik som storage.list(): en nivå i taget, mappar som id=null. */
function fakeBucket(paths: string[], opts: { failList?: string; failRemove?: boolean } = {}) {
  let files = [...paths]
  const removed: string[][] = []
  const list = vi.fn(async (folder: string, o?: { limit?: number; offset?: number }) => {
    if (opts.failList === folder) return { data: null, error: { message: 'boom' } }
    const prefix = `${folder}/`
    const seen = new Map<string, StorageEntry>()
    for (const f of files) {
      if (!f.startsWith(prefix)) continue
      const rest = f.slice(prefix.length)
      const [head, ...tail] = rest.split('/')
      if (tail.length > 0) seen.set(head, { name: head, id: null })
      else seen.set(head, { name: head, id: `id-${f}` })
    }
    const all = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name))
    const offset = o?.offset ?? 0
    const limit = o?.limit ?? 100
    return { data: all.slice(offset, offset + limit), error: null }
  })
  const remove = vi.fn(async (p: string[]) => {
    if (opts.failRemove) return { data: null, error: { message: 'nope' } }
    removed.push(p)
    files = files.filter((f) => !p.includes(f))
    return { data: p, error: null }
  })
  return { list, remove, removed, remaining: () => files }
}

describe('listAllFiles', () => {
  it('går ner i undermappar (cvApi lägger CV under <uid>/cv/) och tar bara filer', async () => {
    const b = fakeBucket([
      `${UID}/1_intyg.pdf`,
      `${UID}/cv/2_cv.pdf`,
      `${UID}/cv/gammal/3_cv.docx`,
      'annan-anvandare/4_intyg.pdf',
    ])
    const files = await listAllFiles(b, UID)
    expect(files.sort()).toEqual([`${UID}/1_intyg.pdf`, `${UID}/cv/2_cv.pdf`, `${UID}/cv/gammal/3_cv.docx`])
  })

  it('paginerar förbi 100 poster i en mapp', async () => {
    const many = Array.from({ length: 205 }, (_, i) => `${UID}/${String(i).padStart(3, '0')}.pdf`)
    const b = fakeBucket(many)
    const files = await listAllFiles(b, UID)
    expect(files).toHaveLength(205)
    expect(b.list.mock.calls.map((c) => c[1]?.offset)).toEqual([0, 100, 200])
  })

  it('kastar vid listningsfel i stället för att svara tomt', async () => {
    const b = fakeBucket([`${UID}/cv/x.pdf`], { failList: `${UID}/cv` })
    await expect(listAllFiles(b, UID)).rejects.toThrow(/list\(.*cv\) misslyckades: boom/)
  })
})

describe('cleanupUserStorage', () => {
  it('raderar allt under <uid>/ i varje användarägd bucket och rapporterar antal', async () => {
    const docs = fakeBucket([`${UID}/a.pdf`, `${UID}/cv/b.pdf`, 'nagon-annan/c.pdf'])
    const imgs = fakeBucket([])
    const storage = { from: (n: string) => (n === 'profile-documents' ? docs : imgs) }

    const result = await cleanupUserStorage(storage, UID)

    expect(result).toEqual([
      { bucket: 'profile-documents', deleted: 2 },
      { bucket: 'profile-images', deleted: 0 },
    ])
    expect(docs.removed).toEqual([[`${UID}/a.pdf`, `${UID}/cv/b.pdf`]])
    expect(docs.remaining()).toEqual(['nagon-annan/c.pdf'])
    expect(imgs.remove).not.toHaveBeenCalled()
  })

  it('rapporterar fel per bucket utan att kasta, och fortsätter med nästa bucket', async () => {
    const docs = fakeBucket([`${UID}/a.pdf`], { failRemove: true })
    const imgs = fakeBucket([`${UID}/bild.png`])
    const storage = { from: (n: string) => (n === 'profile-documents' ? docs : imgs) }

    const result = await cleanupUserStorage(storage, UID)

    expect(result[0]).toEqual({ bucket: 'profile-documents', deleted: 0, error: 'remove() misslyckades: nope' })
    expect(result[1]).toEqual({ bucket: 'profile-images', deleted: 1 })
    expect(docs.remaining()).toEqual([`${UID}/a.pdf`])
  })

  it('listningsfel blir ett rapporterat fel, aldrig "deleted 0" utan error', async () => {
    const docs = fakeBucket([`${UID}/a.pdf`], { failList: UID })
    const storage = { from: () => docs }
    const [r] = await cleanupUserStorage(storage, UID, ['profile-documents'])
    expect(r.error).toMatch(/misslyckades/)
    expect(docs.remove).not.toHaveBeenCalled()
  })

  it('bucketlistan är de två buckets som finns i prod (2026-09-08)', () => {
    expect([...USER_OWNED_BUCKETS]).toEqual(['profile-documents', 'profile-images'])
  })
})

describe('describeCleanup', () => {
  it('skriver FAILED synligt så loggen inte kan läsas som lyckad', () => {
    expect(
      describeCleanup([
        { bucket: 'profile-documents', deleted: 3 },
        { bucket: 'profile-images', deleted: 0, error: 'boom' },
      ]),
    ).toBe('profile-documents: deleted 3; profile-images: FAILED (boom)')
  })
})
