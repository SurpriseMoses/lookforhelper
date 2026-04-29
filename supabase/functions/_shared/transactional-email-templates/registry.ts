/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as helperReminder1 } from './helper-reminder-1-friendly.tsx'
import { template as helperReminder2 } from './helper-reminder-2-urgency.tsx'
import { template as helperReminder3 } from './helper-reminder-3-final.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'helper-reminder-1-friendly': helperReminder1,
  'helper-reminder-2-urgency': helperReminder2,
  'helper-reminder-3-final': helperReminder3,
}
