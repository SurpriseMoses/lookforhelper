// Admin tool: list incomplete helpers (don't appear in search) and bulk-send
// the next reminder step. Bypasses time-delay gating but respects the 3-email
// cap, completion status, and unsubscribe flag.

import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SITE_URL = 'https://lookforhelper.co.za'
const PROFILE_LINK = `${SITE_URL}/dashboard`

const STEP_TEMPLATES: Record<number, string> = {
  1: 'helper-reminder-1-friendly',
  2: 'helper-reminder-2-urgency',
  3: 'helper-reminder-3-final',
}

function isComplete(d: { skills: string[] | null; city: string | null }) {
  return Array.isArray(d.skills) && d.skills.length > 0 && !!d.city && d.city.trim().length > 0
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData.user) return json({ error: 'Unauthorized' }, 401)

    const admin = createClient(supabaseUrl, serviceKey)
    const { data: roleRow } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('role', 'admin')
      .maybeSingle()
    if (!roleRow) return json({ error: 'Forbidden' }, 403)

    const body = await req.json().catch(() => ({}))
    const action = body.action as string

    // Build the incomplete-helpers list once (used by both actions)
    const { data: helpers, error: hErr } = await admin
      .from('user_roles')
      .select('user_id, created_at')
      .eq('role', 'helper')
    if (hErr) return json({ error: hErr.message }, 500)

    const userIds = (helpers ?? []).map((h: any) => h.user_id)
    if (userIds.length === 0) return json({ helpers: [], sent: 0, errors: [] })

    const [{ data: details }, { data: profiles }, { data: tracking }] = await Promise.all([
      admin.from('helper_details').select('user_id, skills, city, created_at').in('user_id', userIds),
      admin.from('profiles').select('user_id, full_name').in('user_id', userIds),
      admin.from('helper_reminder_tracking').select('*').in('user_id', userIds),
    ])

    const detailsMap = new Map((details ?? []).map((d: any) => [d.user_id, d]))
    const profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]))
    const trackMap = new Map((tracking ?? []).map((t: any) => [t.user_id, t]))

    // Fetch emails in batches
    const incompleteList: Array<{
      user_id: string
      email: string
      full_name: string
      first_name: string
      city: string | null
      skills_count: number
      current_step: number
      next_step: number | null
      last_reminder_sent_at: string | null
      unsubscribed: boolean
      signup_at: string | null
      missing: string[]
    }> = []

    for (const helper of helpers ?? []) {
      const userId = helper.user_id
      const det = detailsMap.get(userId)
      if (!det) continue
      if (isComplete(det)) continue

      const track: any = trackMap.get(userId) || {}
      const profile: any = profileMap.get(userId) || {}
      const currentStep = track.email_step ?? 0
      const nextStep = currentStep >= 3 ? null : currentStep + 1

      const missing: string[] = []
      if (!Array.isArray(det.skills) || det.skills.length === 0) missing.push('skills')
      if (!det.city || !det.city.trim()) missing.push('city')

      // Lookup email
      const { data: userResp } = await admin.auth.admin.getUserById(userId)
      const email = userResp?.user?.email
      if (!email) continue

      const fullName = profile.full_name || ''
      incompleteList.push({
        user_id: userId,
        email,
        full_name: fullName,
        first_name: fullName.split(' ')[0] || '',
        city: det.city,
        skills_count: Array.isArray(det.skills) ? det.skills.length : 0,
        current_step: currentStep,
        next_step: nextStep,
        last_reminder_sent_at: track.last_reminder_sent_at ?? null,
        unsubscribed: !!track.unsubscribed,
        signup_at: det.created_at || helper.created_at || null,
        missing,
      })
    }

    if (action === 'list') {
      return json({ helpers: incompleteList })
    }

    if (action === 'send') {
      const targetIds: string[] = Array.isArray(body.user_ids) ? body.user_ids : []
      if (targetIds.length === 0) return json({ error: 'No user_ids provided' }, 400)

      const targetSet = new Set(targetIds)
      const errors: string[] = []
      let sent = 0
      let skipped = 0
      const results: Array<{ user_id: string; status: string; step?: number; error?: string }> = []

      for (const h of incompleteList) {
        if (!targetSet.has(h.user_id)) continue
        if (h.unsubscribed) {
          results.push({ user_id: h.user_id, status: 'skipped_unsubscribed' })
          skipped++
          continue
        }
        if (h.next_step === null) {
          results.push({ user_id: h.user_id, status: 'skipped_max_reached' })
          skipped++
          continue
        }

        try {
          const { error: sendErr } = await admin.functions.invoke('send-transactional-email', {
            body: {
              templateName: STEP_TEMPLATES[h.next_step],
              recipientEmail: h.email,
              idempotencyKey: `helper-reminder-${h.user_id}-step-${h.next_step}`,
              templateData: {
                name: h.first_name,
                profile_link: PROFILE_LINK,
              },
            },
          })
          if (sendErr) throw new Error(sendErr.message)

          await admin.from('helper_reminder_tracking').upsert({
            user_id: h.user_id,
            email_step: h.next_step,
            last_reminder_sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })

          sent++
          results.push({ user_id: h.user_id, status: 'sent', step: h.next_step })
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          errors.push(`${h.user_id}: ${msg}`)
          results.push({ user_id: h.user_id, status: 'error', error: msg })
        }
      }

      return json({ sent, skipped, errors: errors.slice(0, 50), results })
    }

    return json({ error: 'Unknown action. Use "list" or "send".' }, 400)
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500)
  }
})
