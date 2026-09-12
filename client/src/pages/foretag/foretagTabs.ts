/**
 * Flikarna i företagsvyn (AG6). Link-baserade som konsulentvyns —
 * rutterna ligger under /foretag/* i App.tsx.
 */

import type { Tab } from '@/components/layout/PageTabs'
import {
  Building2,
  Handshake,
  Inbox,
  Info,
  Landmark,
  LayoutDashboard,
  MessageSquare,
} from '@/components/ui/icons'

export const foretagTabs: Tab[] = [
  { id: 'oversikt', label: 'Översikt', path: '/foretag', icon: LayoutDashboard },
  { id: 'platser', label: 'Våra platser', path: '/foretag/platser', icon: Building2 },
  { id: 'forslag', label: 'Förslag', path: '/foretag/forslag', icon: Inbox },
  { id: 'pagaende', label: 'Pågående', path: '/foretag/pagaende', icon: Handshake },
  { id: 'meddelanden', label: 'Meddelanden', path: '/foretag/meddelanden', icon: MessageSquare },
  { id: 'stod', label: 'Stöd och regler', path: '/foretag/stod', icon: Landmark },
  { id: 'om', label: 'Om företaget', path: '/foretag/om', icon: Info },
]
