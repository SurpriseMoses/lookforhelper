import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Look For Helper'

interface Props {
  name?: string
  profile_link?: string
}

const FinalReminderEmail = ({ name, profile_link }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Last reminder — finish your profile in 2 minutes</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={brand}>{SITE_NAME}</Heading>
        </Section>
        <Section style={card}>
          <Heading style={h1}>
            {name ? `${name}, this is our last nudge 💛` : 'This is our last nudge 💛'}
          </Heading>
          <Text style={text}>
            We don't want to keep filling your inbox — so this is the final reminder.
          </Text>
          <Text style={text}>
            Your profile on {SITE_NAME} is still hidden from search because it's missing your
            <strong> skills</strong> or <strong>city</strong>. Adding them takes less than 2 minutes
            and unlocks every family looking for help in your area.
          </Text>
          <Text style={tipText}>
            ⭐ Stand-out tip: Add your <strong>years of experience</strong> and a friendly
            <strong> About Me</strong>. It's the difference between being seen and being hired.
          </Text>
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button href={profile_link || '#'} style={button}>
              Finish my profile
            </Button>
          </Section>
          <Text style={text}>
            If now isn't the right time, no worries — we won't email you about this again.
          </Text>
          <Text style={footer}>
            Wishing you the best,<br />The {SITE_NAME} Team
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: FinalReminderEmail,
  subject: 'Last reminder — finish your profile in 2 minutes',
  displayName: 'Helper reminder 3 — Final',
  previewData: { name: 'Thandi', profile_link: 'https://lookforhelper.co.za/dashboard' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '24px 20px' }
const header = { padding: '8px 0 16px', textAlign: 'center' as const }
const brand = { fontSize: '20px', fontWeight: 700, color: '#0F766E', margin: 0 }
const card = { backgroundColor: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '14px', padding: '32px 28px' }
const h1 = { fontSize: '22px', fontWeight: 700, color: '#0B1F3A', margin: '0 0 16px', lineHeight: '1.3' }
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 14px' }
const tipText = { fontSize: '14px', color: '#0B1F3A', lineHeight: '1.6', margin: '14px 0', backgroundColor: '#FEF3C7', padding: '12px 14px', borderRadius: '10px', borderLeft: '3px solid #F59E0B' }
const button = { backgroundColor: '#F59E0B', color: '#0B1F3A', padding: '13px 28px', borderRadius: '10px', fontSize: '15px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '13px', color: '#6B7280', margin: '24px 0 0', lineHeight: '1.5' }
