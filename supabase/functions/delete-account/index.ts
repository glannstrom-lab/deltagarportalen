/**
 * Edge Function: Delete User Account
 * GDPR Art. 17 - Right to erasure ("right to be forgotten")
 *
 * This function deletes the user from Supabase Auth (auth.users)
 * It should be called AFTER profile data has been deleted via RPC
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { handleCorsPreflightOrNull, createCorsResponse, createErrorResponse } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreflightOrNull(req)
  if (preflightResponse) return preflightResponse

  const origin = req.headers.get('Origin')

  // Only allow POST
  if (req.method !== 'POST') {
    return createCorsResponse({ error: 'Method not allowed' }, 405, origin)
  }

  try {
    // Verify JWT token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return createCorsResponse({ error: 'Missing authorization header' }, 401, origin)
    }

    const token = authHeader.replace('Bearer ', '')

    // Create Supabase client with service role key (needed for admin operations)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Verify the user's token and get their ID
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      console.error('Auth error:', userError)
      return createCorsResponse({ error: 'Invalid or expired token' }, 401, origin)
    }

    const userId = user.id
    const userEmail = user.email

    console.log(`[delete-account] Processing deletion for user: ${userId}`)

    // Verify the profile is already deleted (safety check)
    // If profile exists, reject - must call RPC first
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (profile && !profileError) {
      console.warn(`[delete-account] Profile still exists for user ${userId}`)
      return createCorsResponse({
        error: 'Profile data must be deleted first. Call execute_account_deletion_immediate RPC before this function.',
        code: 'PROFILE_EXISTS'
      }, 400, origin)
    }

    // GDPR Art 17 — cascade radering till Vercel Blob för uppladdade filer.
    // Filer som hör till användaren är prefixade med `user-${userId}/`.
    let blobCleanupStatus = 'skipped'
    const blobToken = Deno.env.get('BLOB_READ_WRITE_TOKEN')
    if (blobToken) {
      try {
        // Lista alla blobs med användarens prefix
        const listResponse = await fetch(
          `https://blob.vercel-storage.com?prefix=user-${userId}/`,
          { headers: { 'Authorization': `Bearer ${blobToken}` } }
        )
        if (listResponse.ok) {
          const { blobs } = await listResponse.json()
          if (Array.isArray(blobs) && blobs.length > 0) {
            // Radera varje blob
            const urls = blobs.map((b: { url: string }) => b.url)
            const deleteResponse = await fetch('https://blob.vercel-storage.com/delete', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${blobToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ urls })
            })
            blobCleanupStatus = deleteResponse.ok ? `deleted ${urls.length}` : `failed (${deleteResponse.status})`
          } else {
            blobCleanupStatus = 'no blobs found'
          }
        } else {
          blobCleanupStatus = `list failed (${listResponse.status})`
        }
      } catch (err) {
        console.error(`[delete-account] Blob cleanup error:`, err)
        blobCleanupStatus = 'error'
        // Fortsätt ändå — auth-radering är viktigare för GDPR-compliance
      }
    }
    console.log(`[delete-account] Vercel Blob cleanup: ${blobCleanupStatus}`)

    // Delete from auth.users
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error(`[delete-account] Failed to delete auth user ${userId}:`, deleteError)
      return createCorsResponse({
        error: 'Failed to delete authentication account',
        details: deleteError.message
      }, 500, origin)
    }

    console.log(`[delete-account] Successfully deleted user ${userId} (${userEmail})`)

    return createCorsResponse({
      success: true,
      message: 'Account completely deleted',
      deletedAt: new Date().toISOString(),
      blobCleanup: blobCleanupStatus
    }, 200, origin)

  } catch (error) {
    console.error('[delete-account] Unexpected error:', error)
    return createErrorResponse(error, origin, 'Failed to delete account')
  }
})
