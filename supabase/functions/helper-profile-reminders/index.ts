// Daily scheduler that sends helper profile completion reminders.
// Cadence: step 1 at >=24h after signup, step 2 at >=3 days after step 1,
// step 3 at >=5 days after step 2. Max 3 emails. Stops if profile complete.
// "Complete enough for search" = has skills (>=1) AND non-empty city.

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE_URL = 'https://lookforhelper.co.za'
const PROFILE_LINK = `${SITE_URL}/dashboard`

const STEP_TEMPLATES: Record<number, string> = {
  1: 'helper-reminder-1-friendly',
  2: 'helper-reminder-2-urgency',
  3: 'helper-reminder-3-final',
}

// Minimum hours that must have elapsed before sending the next step.
const STEP_DELAY_HOURS: Record<number, number> = {
  1: 24,        // 24h after signup
  2: 24 * 3,    // +3 days after step 1
  3: 24 * 5,    // +5 days after step 2
}

function isComplete(d: { skills: string[] | null; city: string | null }) {
  return Array.isArray(d.skills) && d.skills.length > 0 && !!d.city && d.city.trim().length > 0
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  // Honor admin toggle — skip entirely if disabled
  const { data: settings } = await supabase
    .from('admin_settings')
    .select('helper_reminders_enabled')
    .eq('id', 1)
    .maybeSingle()
  if (settings && settings.helper_reminders_enabled === false) {
    return new Response(JSON.stringify({ skipped: true, reason: 'automation_disabled' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Pull all helpers with their details
  const { data: helpers, error: hErr } = await supabase
    .from('user_roles')
    .select('user_id, created_at')
    .eq('role', 'helper')

  if (hErr) {
    return new Response(JSON.stringify({ error: hErr.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const userIds = (helpers ?? []).map((h: any) => h.user_id)
  if (userIds.length === 0) {
    return new Response(JSON.stringify({ processed: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const [{ data: details }, { data: profiles }, { data: tracking }] = await Promise.all([
    supabase.from('helper_details').select('user_id, skills, city, created_at').in('user_id', userIds),
    supabase.from('profiles').select('user_id, full_name').in('user_id', userIds),
    supabase.from('helper_reminder_tracking').select('*').in('user_id', userIds),
  ])

  const detailsMap = new Map((details ?? []).map((d: any) => [d.user_id, d]))
  const profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]))
  const trackMap = new Map((tracking ?? []).map((t: any) => [t.user_id, t]))

  const now = Date.now()
  let sent = 0
  let skipped = 0
  const errors: string[] = []

  for (const helper of helpers ?? []) {
    const userId = helper.user_id
    const det = detailsMap.get(userId)
    const profile = profileMap.get(userId) || {}
    const track = trackMap.get(userId) || { email_step: 0, last_reminder_sent_at: null, completed_at: null, unsubscribed: false }

    // Skip if no helper_details row yet
    if (!det) { skipped++; continue }

    // Skip if profile is complete
    if (isComplete(det)) {
      if (!track.completed_at) {
        await supabase.from('helper_reminder_tracking').upsert({
          user_id: userId,
          email_step: track.email_step ?? 0,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
      }
      skipped++
      continue
    }

    if (track.unsubscribed) { skipped++; continue }

    const currentStep = track.email_step ?? 0
    const nextStep = currentStep + 1
    if (nextStep > 3) { skipped++; continue }

    // Determine reference time: signup time for step 1, last send for steps 2/3
    const refTime = currentStep === 0
      ? new Date(det.created_at || helper.created_at || 0).getTime()
      : new Date(track.last_reminder_sent_at || 0).getTime()

    const requiredMs = STEP_DELAY_HOURS[nextStep] * 60 * 60 * 1000
    if (now - refTime < requiredMs) { skipped++; continue }

    // Lookup email from auth
    const { data: userResp, error: uErr } = await supabase.auth.admin.getUserById(userId)
    if (uErr || !userResp?.user?.email) { skipped++; continue }
    const email = userResp.user.email

    // Send via transactional email queue
    try {
      const { error: sendErr } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: STEP_TEMPLATES[nextStep],
          recipientEmail: email,
          idempotencyKey: `helper-reminder-${userId}-step-${nextStep}`,
          templateData: {
            name: (profile as any)?.full_name?.split(' ')[0] || '',
            profile_link: PROFILE_LINK,
          },
        },
      })
      if (sendErr) throw new Error(sendErr.message)

      await supabase.from('helper_reminder_tracking').upsert({
        user_id: userId,
        email_step: nextStep,
        last_reminder_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

      sent++
    } catch (e) {
      errors.push(`${userId}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return new Response(JSON.stringify({ sent, skipped, errors: errors.slice(0, 20) }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
