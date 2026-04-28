import { useCallback, useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useSupabase'
import { supabase } from '@/lib/supabase'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { mergeLayouts } from '@/components/widgets/mergeLayouts'
import { getDefaultLayout } from '@/components/widgets/defaultLayouts'
import type { WidgetLayoutItem } from '@/components/widgets/types'
import type { HubId } from '@/components/widgets/types'

/** Stable query key factory — exported so tests and DevTools can target it. */
export const USER_WIDGET_LAYOUTS_KEY = (
  userId: string,
  hubId: HubId,
  breakpoint: 'desktop' | 'mobile'
) => ['user-widget-layouts', userId, hubId, breakpoint] as const

interface LayoutCache {
  widgets: WidgetLayoutItem[]
  updated_at: string | null
}

/**
 * React Query hook for per-hub, per-breakpoint widget layout persistence.
 *
 * Features:
 * - staleTime: Infinity (layout only changes on user action)
 * - Optimistic update with snapshot rollback on error (Pitfall 5)
 * - 1000ms debounce to batch rapid size/visibility changes (Pitfall 5)
 * - beforeunload flush to prevent lost saves on tab close (Pitfall 5)
 * - Per-breakpoint query key so mobile and desktop never clobber each other (Pitfall 6)
 * - mergeLayouts reconciliation in queryFn (Pitfall 7)
 */
export function useWidgetLayout(hubId: HubId) {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const breakpoint = useBreakpoint()
  const queryClient = useQueryClient()
  const queryKey = USER_WIDGET_LAYOUTS_KEY(userId, hubId, breakpoint)

  const query = useQuery<LayoutCache>({
    queryKey,
    enabled: !!userId,
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_widget_layouts')
        .select('widgets, updated_at')
        .eq('user_id', userId)
        .eq('hub_id', hubId)
        .eq('breakpoint', breakpoint)
        .maybeSingle()
      if (error) throw error
      const persisted = (data?.widgets as WidgetLayoutItem[] | null) ?? []
      const defaults = getDefaultLayout(hubId, breakpoint)
      return {
        widgets: mergeLayouts(persisted, defaults),
        updated_at: data?.updated_at ?? null,
      }
    },
  })

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingPayloadRef = useRef<WidgetLayoutItem[] | null>(null)

  const mutation = useMutation({
    mutationFn: async (widgets: WidgetLayoutItem[]) => {
      const { error } = await supabase
        .from('user_widget_layouts')
        .upsert(
          { user_id: userId, hub_id: hubId, breakpoint, widgets },
          { onConflict: 'user_id,hub_id,breakpoint' }
        )
      if (error) throw error
    },
    onMutate: async (newWidgets) => {
      await queryClient.cancelQueries({ queryKey })
      const snapshot = queryClient.getQueryData<LayoutCache>(queryKey)
      queryClient.setQueryData<LayoutCache>(queryKey, (old) =>
        old ? { ...old, widgets: newWidgets } : { widgets: newWidgets, updated_at: null }
      )
      return { snapshot }
    },
    onError: (_err, _vars, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(queryKey, context.snapshot)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const flushNow = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    if (pendingPayloadRef.current) {
      mutation.mutate(pendingPayloadRef.current)
      pendingPayloadRef.current = null
    }
  }, [mutation])

  const saveDebounced = useCallback(
    (widgets: WidgetLayoutItem[]) => {
      pendingPayloadRef.current = widgets
      // Immediate optimistic cache write for instant UI feedback
      queryClient.setQueryData<LayoutCache>(queryKey, (old) =>
        old ? { ...old, widgets } : { widgets, updated_at: null }
      )
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        const payload = pendingPayloadRef.current
        if (payload) {
          mutation.mutate(payload)
          pendingPayloadRef.current = null
        }
        debounceRef.current = null
      }, 1000)
    },
    [mutation, queryClient, queryKey]
  )

  // Pitfall 5 — flush pending save when tab is closing
  useEffect(() => {
    const handler = () => flushNow()
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [flushNow])

  return {
    layout: query.data?.widgets ?? [],
    isLoading: query.isLoading,
    saveDebounced,
    flushNow,
    /** Direct mutation for non-debounced operations (e.g. reset to default) */
    save: mutation.mutate,
  }
}
