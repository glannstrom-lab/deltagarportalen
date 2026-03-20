/**
 * useDiscussions - Hook for discussion forums
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getCategories,
  getTopics,
  getTopic,
  createTopic,
  getReplies,
  createReply,
  likeTopic,
  markAsAccepted
} from '@/services/discussionService'
import type {
  DiscussionCategory,
  DiscussionTopic,
  DiscussionReply,
  CreateTopicData,
  CreateReplyData
} from '@/types/community.types'

export function useDiscussions(categorySlug?: string) {
  const [categories, setCategories] = useState<DiscussionCategory[]>([])
  const [topics, setTopics] = useState<DiscussionTopic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [cats, topicList] = await Promise.all([
        getCategories(),
        getTopics(categorySlug)
      ])

      setCategories(cats)
      setTopics(topicList)
    } catch {
      setError('Kunde inte ladda diskussioner')
    } finally {
      setIsLoading(false)
    }
  }, [categorySlug])

  useEffect(() => {
    loadData()
  }, [loadData])

  const addTopic = useCallback(async (data: CreateTopicData) => {
    const topicId = await createTopic(data)
    if (topicId) {
      await loadData()
    }
    return topicId
  }, [loadData])

  const toggleLike = useCallback(async (topicId: string) => {
    await likeTopic(topicId)
    // Optimistic update
    setTopics(prev => prev.map(t =>
      t.id === topicId
        ? {
            ...t,
            hasLiked: !t.hasLiked,
            likeCount: t.hasLiked ? t.likeCount - 1 : t.likeCount + 1
          }
        : t
    ))
  }, [])

  return {
    categories,
    topics,
    isLoading,
    error,
    refresh: loadData,
    addTopic,
    toggleLike
  }
}

export function useTopic(topicId: string) {
  const [topic, setTopic] = useState<DiscussionTopic | null>(null)
  const [replies, setReplies] = useState<DiscussionReply[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!topicId) return

    setIsLoading(true)
    setError(null)

    try {
      const [topicData, replyList] = await Promise.all([
        getTopic(topicId),
        getReplies(topicId)
      ])

      setTopic(topicData)
      setReplies(replyList)
    } catch {
      setError('Kunde inte ladda diskussionen')
    } finally {
      setIsLoading(false)
    }
  }, [topicId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const addReply = useCallback(async (data: CreateReplyData) => {
    const replyId = await createReply(data)
    if (replyId) {
      await loadData()
    }
    return replyId
  }, [loadData])

  const acceptReply = useCallback(async (replyId: string) => {
    if (!topic) return false
    const success = await markAsAccepted(replyId, topic.id)
    if (success) {
      await loadData()
    }
    return success
  }, [topic, loadData])

  return {
    topic,
    replies,
    isLoading,
    error,
    refresh: loadData,
    addReply,
    acceptReply
  }
}
