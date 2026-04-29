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

const FriendlyReminderEmail = ({ name, profile_link }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Complete your profile to start getting hired on {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={brand}>{SITE_NAME}</Heading>
        </Section>
        <Section style={card}>
          <Heading style={h1}>
            {name ? `Hi ${name}, welcome aboard! 👋` : 'Welcome aboard! 👋'}
          </Heading>
          <Text style={text}>
            Thanks for joining {SITE_NAME}. You're just a couple of steps away from
            appearing in search and getting your first hire.
          </Text>
          <Text style={text}>
            To show up in search, please add your <strong>skills</strong> and your <strong>city</strong>.
            It only takes 2 minutes.
          </Text>
          <Text style={tipText}>
            💡 Tip: Helpers who also add their <strong>years of experience</strong> and a short
            <strong> About Me</strong> get up to 3x more views from families.
          </Text>
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button href={profile_link || '#'} style={button}>
              Complete my profile
            </Button>
          </Section>
          <Text style={footer}>
            We're rooting for you,<br />The {SITE_NAME} Team
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: FriendlyReminderEmail,
  subject: 'Complete your profile and start getting hired',
  displayName: 'Helper reminder 1 — Friendly',
  previewData: { name: 'Thandi', profile_link: 'https://lookforhelper.co.za/dashboard' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '24px 20px' }
const header = { padding: '8px 0 16px', textAlign: 'center' as const }
const brand = { fontSize: '20px', fontWeight: 700, color: '#0F766E', margin: 0, letterSpacing: '-0.01em' }
const card = { backgroundColor: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '14px', padding: '32px 28px' }
const h1 = { fontSize: '22px', fontWeight: 700, color: '#0B1F3A', margin: '0 0 16px', lineHeight: '1.3' }
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 14px' }
const tipText = { fontSize: '14px', color: '#0B1F3A', lineHeight: '1.6', margin: '14px 0', backgroundColor: '#FEF3C7', padding: '12px 14px', borderRadius: '10px', borderLeft: '3px solid #F59E0B' }
const button = { backgroundColor: '#0F766E', color: '#ffffff', padding: '13px 28px', borderRadius: '10px', fontSize: '15px', fontWeight: 600, textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '13px', color: '#6B7280', margin: '24px 0 0', lineHeight: '1.5' }
