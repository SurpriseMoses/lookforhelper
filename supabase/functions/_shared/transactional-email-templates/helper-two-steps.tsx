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

const TwoStepsEmail = ({ name, profile_link }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Two things are missing before families can find you</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={brand}>{SITE_NAME}</Heading>
        </Section>
        <Section style={card}>
          <Heading style={h1}>
            {name ? `${name}, you're two steps away` : "You're two steps away"}
          </Heading>
          <Text style={text}>
            Good news: you no longer need to publish anything. Every helper account is
            listed automatically now.
          </Text>
          <Text style={text}>
            But families still can't find you, because two details are missing from your profile:
          </Text>
          <Section style={listBox}>
            <Text style={listItem}>1. Your <strong>city</strong></Text>
            <Text style={listItem}>2. At least one <strong>skill</strong> (cleaning, childcare, cooking, elderly care…)</Text>
          </Section>
          <Text style={text}>
            Add those two things, tap <strong>Save</strong>, and you will show up in search straight away.
            It takes about two minutes.
          </Text>
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button href={profile_link || '#'} style={button}>
              Add my city and skills
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
  component: TwoStepsEmail,
  subject: 'Two minutes to appear in search — add your city and skills',
  displayName: 'Helper — city & skills only',
  previewData: { name: 'Thandi', profile_link: 'https://lookforhelper.co.za/dashboard' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '24px 20px' }
const header = { padding: '8px 0 16px', textAlign: 'center' as const }
const brand = { fontSize: '20px', fontWeight: 700, color: '#0F766E', margin: 0, letterSpacing: '-0.01em' }
const card = { backgroundColor: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '14px', padding: '32px 28px' }
const h1 = { fontSize: '22px', fontWeight: 700, color: '#0B1F3A', margin: '0 0 16px', lineHeight: '1.3' }
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 14px' }
const listBox = { backgroundColor: '#F0FDFA', borderRadius: '10px', padding: '14px 16px', margin: '14px 0', borderLeft: '3px solid #0F766E' }
const listItem = { fontSize: '15px', color: '#0B1F3A', lineHeight: '1.6', margin: '4px 0' }
const button = { backgroundColor: '#0F766E', color: '#ffffff', padding: '13px 28px', borderRadius: '10px', fontSize: '15px', fontWeight: 600, textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '13px', color: '#6B7280', margin: '24px 0 0', lineHeight: '1.5' }
