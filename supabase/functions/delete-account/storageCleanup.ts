/**
 * SD3 (projektgenomgången 2026-09-07): radera användarens filer i Supabase
 * Storage innan auth-kontot tas bort.
 *
 * Varför det behövs: FK-kaskaden från profiles når inte storage.objects, och
 * auth.users → storage.objects.owner är ON DELETE SET NULL, inte CASCADE. Utan
 * det här steget ligger uppladdade CV:n och intyg (bucketen profile-documents,
 * privat) kvar för alltid efter en art. 17-radering — ägarlösa, osynliga för
 * alla utom service role, och ingenting larmar. 0 objekt i prod 2026-09-08,
 * så ändringen är strukturellt riskfri; klassen är ändå densamma som
 * Vercel Blob-städningen i index.ts, som redan finns.
 *
 * Sökvägsmönstret är verifierat mot båda uppladdningsvägarna OCH mot
 * bucketpolicyerna i prod (storage.objects, pg_policies 2026-09-08):
 *   profileEnhancementsApi.uploadDocument → `${user.id}/${ts}_${namn}`
 *   cvApi.cvFilerApi.upload               → `${user.id}/cv/${ts}_${namn}`
 *   policyer: (storage.foldername(name))[1] = auth.uid()::text
 * Alltså: allt som tillhör användaren ligger under prefixet `<uid>/`, och
 * ingenting annat kan ligga där (INSERT-policyn kräver det). Det finns
 * undermappar (`cv/`), så listningen måste vara REKURSIV — storage.list()
 * är det inte: den ger en mapp tillbaka som en post med `id: null`.
 *
 * Modulen är medvetet fri från Deno- och URL-importer så att den kan
 * enhetstestas med vitest (storageCleanup.test.ts) — index.ts kan inte köras
 * utanför Deno.
 */

export interface StorageEntry {
  name: string
  /** null = mapp-platshållare i storage.list(); en riktig fil har alltid id. */
  id: string | null
}

export interface StorageBucketClient {
  list(
    path: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ data: StorageEntry[] | null; error: { message: string } | null }>
  remove(paths: string[]): Promise<{ data: unknown; error: { message: string } | null }>
}

export interface StorageClient {
  from(bucket: string): StorageBucketClient
}

/** Buckets där en användares filer ligger under `<uid>/` — samma villkor som RLS-policyerna. */
export const USER_OWNED_BUCKETS = ['profile-documents', 'profile-images'] as const

export interface BucketCleanupResult {
  bucket: string
  /** Antal filer som faktiskt togs bort. */
  deleted: number
  /** Satt om något steg misslyckades — filer kan då finnas kvar. */
  error?: string
}

const PAGE = 100

/**
 * Listar alla filer (inte mappar) under `prefix` rekursivt. Kastar vid
 * listningsfel — att svälja felet hade sett ut som "inga filer", vilket är
 * precis den lögn som gör kvarglömda personuppgifter osynliga.
 */
export async function listAllFiles(bucket: StorageBucketClient, prefix: string): Promise<string[]> {
  const files: string[] = []
  const folders: string[] = [prefix]

  while (folders.length > 0) {
    const folder = folders.pop() as string
    let offset = 0
    for (;;) {
      const { data, error } = await bucket.list(folder, { limit: PAGE, offset })
      if (error) throw new Error(`list(${folder}) misslyckades: ${error.message}`)
      const entries = data ?? []
      for (const entry of entries) {
        const path = `${folder}/${entry.name}`
        if (entry.id === null) folders.push(path)
        else files.push(path)
      }
      if (entries.length < PAGE) break
      offset += PAGE
    }
  }
  return files
}

/**
 * Raderar allt under `<userId>/` i varje användarägd bucket. Returnerar ett
 * resultat per bucket och kastar aldrig: anroparen (index.ts) avgör vad ett
 * fel ska betyda för resten av raderingen, och måste kunna rapportera det.
 */
export async function cleanupUserStorage(
  storage: StorageClient,
  userId: string,
  buckets: readonly string[] = USER_OWNED_BUCKETS,
): Promise<BucketCleanupResult[]> {
  const results: BucketCleanupResult[] = []
  for (const bucketName of buckets) {
    const bucket = storage.from(bucketName)
    try {
      const files = await listAllFiles(bucket, userId)
      if (files.length === 0) {
        results.push({ bucket: bucketName, deleted: 0 })
        continue
      }
      const { error } = await bucket.remove(files)
      if (error) throw new Error(`remove() misslyckades: ${error.message}`)
      results.push({ bucket: bucketName, deleted: files.length })
    } catch (err) {
      results.push({
        bucket: bucketName,
        deleted: 0,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }
  return results
}

/** Kort statusrad för loggen och svaret, samma stil som blobCleanupStatus. */
export function describeCleanup(results: BucketCleanupResult[]): string {
  return results
    .map((r) => (r.error ? `${r.bucket}: FAILED (${r.error})` : `${r.bucket}: deleted ${r.deleted}`))
    .join('; ')
}
