/**
 * aktivitetskatalogApi — kommunens utbud av gruppaktiviteter (KM8).
 *
 * Tabell: activity_catalog_items (migration 20260911200000). En post är en
 * återkommande aktivitet med plats och (valfritt) dag/tid — det schemamallarna
 * hämtar rader ur. `org_id` NULL = konsulentens egen, personliga katalog.
 *
 * Vem får vad (RLS): ägaren allt på sina poster; medlemmar läser
 * organisationens; chef/admin skriver i organisationens; superadmin allt.
 *
 * Mönster som övriga services: kastar vid fel, sväljer aldrig till [].
 * Ingen AI.
 */

import { supabase } from '@/lib/supabase'
import type { ActivityType, TemplateItem } from './aktivitetSchema'

export interface CatalogItem {
  id: string
  org_id: string | null
  owner_id: string
  title: string
  activity_type: ActivityType
  description: string | null
  location: string | null
  /** ISO-veckodag 1–7, eller null om aktiviteten inte har fast dag. */
  weekday: number | null
  /** `HH:MM` eller null. */
  start_time: string | null
  end_time: string | null
  capacity: number | null
  contact: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CatalogItemInput {
  /** null = personlig post. Ett org-id kräver chef/admin i organisationen. */
  org_id?: string | null
  title: string
  activity_type: ActivityType
  description?: string | null
  location?: string | null
  weekday?: number | null
  start_time?: string | null
  end_time?: string | null
  capacity?: number | null
  contact?: string | null
  is_active?: boolean
}

async function requireUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!user) throw new Error('Inte inloggad')
  return user
}

/** Postgres `time` kommer som `HH:MM:SS`; UI:t använder `HH:MM`. */
function kortTid(t: string | null): string | null {
  if (!t) return null
  return t.length > 5 ? t.slice(0, 5) : t
}

function mapRow(row: Record<string, unknown>): CatalogItem {
  return {
    ...(row as unknown as CatalogItem),
    start_time: kortTid(row.start_time as string | null),
    end_time: kortTid(row.end_time as string | null),
  }
}

function tomtTillNull(v: string | null | undefined): string | null {
  const s = v?.trim()
  return s ? s : null
}

function tillRad(input: CatalogItemInput) {
  return {
    org_id: input.org_id ?? null,
    title: input.title.trim(),
    activity_type: input.activity_type,
    description: tomtTillNull(input.description),
    location: tomtTillNull(input.location),
    weekday: input.weekday ?? null,
    start_time: tomtTillNull(input.start_time),
    end_time: tomtTillNull(input.end_time),
    capacity: input.capacity ?? null,
    contact: tomtTillNull(input.contact),
    is_active: input.is_active ?? true,
  }
}

/**
 * En katalogpost som mallrad. Saknar posten dag eller tid fylls måndag
 * 09:00–12:00 i — konsulenten justerar i dialogen. Rubrik, typ och plats
 * följer alltid med.
 */
export function katalogpostTillMallrad(post: CatalogItem): TemplateItem {
  return {
    weekday: post.weekday ?? 1,
    start_time: post.start_time ?? '09:00',
    end_time: post.end_time ?? '12:00',
    title: post.title,
    activity_type: post.activity_type,
    location: post.location ?? '',
    notes: '',
  }
}

export const aktivitetskatalogApi = {
  /** Egna + organisationens poster (RLS avgör), aktiva först, sedan titel. */
  async list(): Promise<CatalogItem[]> {
    await requireUser()
    const { data, error } = await supabase
      .from('activity_catalog_items')
      .select('*')
      .order('is_active', { ascending: false })
      .order('title', { ascending: true })
    if (error) throw error
    return (data ?? []).map((r) => mapRow(r as Record<string, unknown>))
  },

  async create(input: CatalogItemInput): Promise<CatalogItem> {
    const user = await requireUser()
    const { data, error } = await supabase
      .from('activity_catalog_items')
      .insert({ ...tillRad(input), owner_id: user.id })
      .select('*')
      .single()
    if (error) throw error
    return mapRow(data as Record<string, unknown>)
  },

  async update(id: string, input: CatalogItemInput): Promise<CatalogItem> {
    await requireUser()
    const { data, error } = await supabase
      .from('activity_catalog_items')
      .update(tillRad(input))
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return mapRow(data as Record<string, unknown>)
  },

  async setActive(id: string, isActive: boolean): Promise<CatalogItem> {
    await requireUser()
    const { data, error } = await supabase
      .from('activity_catalog_items')
      .update({ is_active: isActive })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return mapRow(data as Record<string, unknown>)
  },

  async remove(id: string): Promise<void> {
    await requireUser()
    const { error } = await supabase.from('activity_catalog_items').delete().eq('id', id)
    if (error) throw error
  },
}
