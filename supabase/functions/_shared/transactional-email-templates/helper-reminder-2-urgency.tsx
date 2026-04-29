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

const UrgencyReminderEmail = ({ name, profile_link }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Families are searching — but they can't see you yet</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={brand}>{SITE_NAME}</Heading>
        </Section>
        <Section style={card}>
          <Heading style={h1}>
            {name ? `${name}, families are looking right now` : 'Families are looking right now'}
          </Heading>
          <Text style={text}>
            Seekers are searching every day on {SITE_NAME} — but your profile isn't appearing
            because it's missing key details.
          </Text>
          <Section style={alertBox}>
            <Text style={alertTitle}>To appear in search, you need:</Text>
            <Text style={listItem}>✅ Your <strong>skills</strong></Text>
            <Text style={listItem}>✅ Your <strong>city</strong></Text>
          </Section>
          <Text style={text}>
            Adding your <strong>years of experience</strong> and a short <strong>About Me</strong> isn't
            required — but profiles with these get noticed first and book jobs faster.
          </Text>
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button href={profile_link || '#'} style={button}>
              Make me visible
            </Button>
          </Section>
          <Text style={footer}>
            Don't miss out,<br />The {SITE_NAME} Team
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: UrgencyReminderEmail,
  subject: "Families are searching — but they can't see you yet",
  displayName: 'Helper reminder 2 — Urgency',
  previewData: { name: 'Thandi', profile_link: 'https://lookforhelper.co.za/dashboard' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '24px 20px' }
const header = { padding: '8px 0 16px', textAlign: 'center' as const }
const brand = { fontSize: '20px', fontWeight: 700, color: '#0F766E', margin: 0 }
const card = { backgroundColor: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '14px', padding: '32px 28px' }
const h1 = { fontSize: '22px', fontWeight: 700, color: '#0B1F3A', margin: '0 0 16px', lineHeight: '1.3' }
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 14px' }
const alertBox = { backgroundColor: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: '10px', padding: '16px 18px', margin: '18px 0' }
const alertTitle = { fontSize: '14px', fontWeight: 600, color: '#0B1F3A', margin: '0 0 8px' }
const listItem = { fontSize: '15px', color: '#0B1F3A', margin: '4px 0', lineHeight: '1.5' }
const button = { backgroundColor: '#0F766E', color: '#ffffff', padding: '13px 28px', borderRadius: '10px', fontSize: '15px', fontWeight: 600, textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '13px', color: '#6B7280', margin: '24px 0 0', lineHeight: '1.5' }
