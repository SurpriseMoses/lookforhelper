import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { TEMPLATES } from '../_shared/transactional-email-templates/registry.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData.user) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const adminClient = createClient(supabaseUrl, serviceKey)
    const { data: roleRow } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleRow) {
      return json({ error: 'Forbidden' }, 403)
    }

    const body = await req.json().catch(() => ({}))

    // Action: sendTest — invoke send-transactional-email for a single template/recipient
    if (body.action === 'sendTest') {
      const templateName = String(body.templateName || '')
      const recipientEmail = String(body.recipientEmail || '')
      const templateData: Record<string, any> = body.templateData || {}
      if (!templateName || !TEMPLATES[templateName]) {
        return json({ error: 'Unknown template' }, 400)
      }
      if (!recipientEmail || !/^\S+@\S+\.\S+$/.test(recipientEmail)) {
        return json({ error: 'Invalid recipient email' }, 400)
      }
      const idempotencyKey = `admin-test-${templateName}-${userData.user.id}-${Date.now()}`
      const { data: sendData, error: sendErr } = await adminClient.functions.invoke(
        'send-transactional-email',
        {
          body: {
            templateName,
            recipientEmail,
            idempotencyKey,
            templateData: { ...(TEMPLATES[templateName].previewData || {}), ...templateData },
          },
        }
      )
      if (sendErr) {
        return json({ error: sendErr.message || 'Failed to send' }, 500)
      }
      return json({ ok: true, result: sendData }, 200)
    }

    const requested: string[] = Array.isArray(body.templateNames) && body.templateNames.length
      ? body.templateNames
      : Object.keys(TEMPLATES)
    const data: Record<string, any> = body.templateData || {}

    const results = []
    for (const name of requested) {
      const entry = TEMPLATES[name]
      if (!entry) {
        results.push({ templateName: name, status: 'not_found', html: '', subject: '' })
        continue
      }
      const props = { ...(entry.previewData || {}), ...data }
      try {
        const html = await renderAsync(React.createElement(entry.component, props))
        const subject = typeof entry.subject === 'function' ? entry.subject(props) : entry.subject
        results.push({
          templateName: name,
          displayName: entry.displayName || name,
          subject,
          html,
          status: 'ready',
        })
      } catch (err) {
        results.push({
          templateName: name,
          displayName: entry.displayName || name,
          subject: '',
          html: '',
          status: 'render_failed',
          errorMessage: err instanceof Error ? err.message : String(err),
        })
      }
    }

    return json({ templates: results }, 200)
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
