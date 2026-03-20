/**
 * Discussion Service - Forum functionality
 */

import { supabase } from '@/lib/supabase'
import type {
  DiscussionCategory,
  DiscussionTopic,
  DiscussionReply,
  CreateTopicData,
  CreateReplyData,
  UserInfo
} from '@/types/community.types'

// ============================================
// CATEGORIES
// ============================================

export async function getCategories(): Promise<DiscussionCategory[]> {
  const { data, error } = await supabase
    .from('community_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return (data || []).map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    icon: c.icon,
    color: c.color,
    sortOrder: c.sort_order
  }))
}

// ============================================
// TOPICS
// ============================================

export async function getTopics(
  categorySlug?: string,
  limit = 20,
  offset = 0
): Promise<DiscussionTopic[]> {
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('community_topics')
    .select(`
      *,
      author:author_id (id, first_name, last_name, avatar_url),
      category:category_id (id, name, slug, icon, color)
    `)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (categorySlug) {
    // Get category ID first
    const { data: cat } = await supabase
      .from('community_categories')
      .select('id')
      .eq('slug', categorySlug)
      .single()

    if (cat) {
      query = query.eq('category_id', cat.id)
    }
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching topics:', error)
    return []
  }

  // Get user's likes
  let userLikes: string[] = []
  if (user) {
    const { data: likes } = await supabase
      .from('community_likes')
      .select('topic_id')
      .eq('user_id', user.id)
      .not('topic_id', 'is', null)

    userLikes = (likes || []).map(l => l.topic_id).filter(Boolean)
  }

  return (data || []).map(t => ({
    id: t.id,
    categoryId: t.category_id,
    authorId: t.author_id,
    title: t.title,
    content: t.content,
    replyCount: t.reply_count,
    viewCount: t.view_count,
    likeCount: t.like_count,
    isPinned: t.is_pinned,
    isSolved: t.is_solved,
    isLocked: t.is_locked,
    lastReplyAt: t.last_reply_at,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    author: t.author ? {
      id: t.author.id,
      firstName: t.author.first_name || 'Anonym',
      lastName: t.author.last_name || '',
      avatarUrl: t.author.avatar_url
    } : undefined,
    category: t.category ? {
      id: t.category.id,
      name: t.category.name,
      slug: t.category.slug,
      icon: t.category.icon,
      color: t.category.color,
      sortOrder: 0
    } : undefined,
    hasLiked: userLikes.includes(t.id)
  }))
}

export async function getTopic(topicId: string): Promise<DiscussionTopic | null> {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('community_topics')
    .select(`
      *,
      author:author_id (id, first_name, last_name, avatar_url),
      category:category_id (id, name, slug, icon, color)
    `)
    .eq('id', topicId)
    .single()

  if (error || !data) {
    console.error('Error fetching topic:', error)
    return null
  }

  // Increment view count
  await supabase
    .from('community_topics')
    .update({ view_count: data.view_count + 1 })
    .eq('id', topicId)

  // Check if user has liked
  let hasLiked = false
  if (user) {
    const { data: like } = await supabase
      .from('community_likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('topic_id', topicId)
      .maybeSingle()
    hasLiked = !!like
  }

  return {
    id: data.id,
    categoryId: data.category_id,
    authorId: data.author_id,
    title: data.title,
    content: data.content,
    replyCount: data.reply_count,
    viewCount: data.view_count + 1,
    likeCount: data.like_count,
    isPinned: data.is_pinned,
    isSolved: data.is_solved,
    isLocked: data.is_locked,
    lastReplyAt: data.last_reply_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    author: data.author ? {
      id: data.author.id,
      firstName: data.author.first_name || 'Anonym',
      lastName: data.author.last_name || '',
      avatarUrl: data.author.avatar_url
    } : undefined,
    category: data.category ? {
      id: data.category.id,
      name: data.category.name,
      slug: data.category.slug,
      icon: data.category.icon,
      color: data.category.color,
      sortOrder: 0
    } : undefined,
    hasLiked
  }
}

export async function createTopic(data: CreateTopicData): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: topic, error } = await supabase
    .from('community_topics')
    .insert({
      category_id: data.categoryId,
      author_id: user.id,
      title: data.title,
      content: data.content
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating topic:', error)
    return null
  }

  return topic.id
}

export async function likeTopic(topicId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  // Check if already liked
  const { data: existing } = await supabase
    .from('community_likes')
    .select('id')
    .eq('user_id', user.id)
    .eq('topic_id', topicId)
    .maybeSingle()

  if (existing) {
    // Unlike
    await supabase.from('community_likes').delete().eq('id', existing.id)
    await supabase.rpc('decrement_topic_likes', { p_topic_id: topicId })
  } else {
    // Like
    await supabase.from('community_likes').insert({ user_id: user.id, topic_id: topicId })
    // Update like count
    await supabase
      .from('community_topics')
      .update({ like_count: supabase.sql`like_count + 1` })
      .eq('id', topicId)
  }

  return true
}

// ============================================
// REPLIES
// ============================================

export async function getReplies(topicId: string): Promise<DiscussionReply[]> {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('community_replies')
    .select(`
      *,
      author:author_id (id, first_name, last_name, avatar_url)
    `)
    .eq('topic_id', topicId)
    .order('is_accepted', { ascending: false })
    .order('created_at')

  if (error) {
    console.error('Error fetching replies:', error)
    return []
  }

  // Get user's likes
  let userLikes: string[] = []
  if (user) {
    const { data: likes } = await supabase
      .from('community_likes')
      .select('reply_id')
      .eq('user_id', user.id)
      .not('reply_id', 'is', null)

    userLikes = (likes || []).map(l => l.reply_id).filter(Boolean)
  }

  return (data || []).map(r => ({
    id: r.id,
    topicId: r.topic_id,
    authorId: r.author_id,
    parentReplyId: r.parent_reply_id,
    content: r.content,
    likeCount: r.like_count,
    isAccepted: r.is_accepted,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    author: r.author ? {
      id: r.author.id,
      firstName: r.author.first_name || 'Anonym',
      lastName: r.author.last_name || '',
      avatarUrl: r.author.avatar_url
    } : undefined,
    hasLiked: userLikes.includes(r.id)
  }))
}

export async function createReply(data: CreateReplyData): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: reply, error } = await supabase
    .from('community_replies')
    .insert({
      topic_id: data.topicId,
      author_id: user.id,
      content: data.content,
      parent_reply_id: data.parentReplyId
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating reply:', error)
    return null
  }

  return reply.id
}

export async function markAsAccepted(replyId: string, topicId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  // Check if user owns the topic
  const { data: topic } = await supabase
    .from('community_topics')
    .select('author_id')
    .eq('id', topicId)
    .single()

  if (!topic || topic.author_id !== user.id) return false

  // Unmark all other replies
  await supabase
    .from('community_replies')
    .update({ is_accepted: false })
    .eq('topic_id', topicId)

  // Mark this reply
  await supabase
    .from('community_replies')
    .update({ is_accepted: true })
    .eq('id', replyId)

  // Mark topic as solved
  await supabase
    .from('community_topics')
    .update({ is_solved: true })
    .eq('id', topicId)

  return true
}
