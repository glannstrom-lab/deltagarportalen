/**
 * Explicit ikon-map för dynamic name → component-uppslagning.
 *
 * E2 (2026-05-15): Tidigare gjorde contentApi.ts + Achievements.tsx
 * `import * as LucideIcons from 'lucide-react'` vilket pullade in alla
 * 1400+ ikoner i bundlen (~150KB) för att stödja `icons[iconName]`.
 *
 * Den här modulen importerar bara de ~52 ikoner som faktiskt refereras
 * från data-filerna (exercises.ts, helpContent.ts, journeyData.ts m.fl.).
 *
 * För att lägga till en ny ikon: importera från 'lucide-react' och
 * lägg till i ICON_MAP nedan.
 */

import {
  Accessibility, AlertTriangle, Award, Bell, BookOpen, Bookmark, Briefcase,
  CheckCircle, CheckSquare, Clock, Compass, Copy, Crown, Eye,
  FileCheck, FileText, Flame, FolderKanban, Footprints, GraduationCap,
  Heart, HelpCircle, Info, Languages, Library, Linkedin, Magnet,
  MessageCircle, MessageSquare, Mic, Minus, MinusCircle, Monitor, Network,
  Palette, PenLine, Phone, RefreshCw, Rocket, Route, Scale, Search,
  Send, Settings, Sparkles, Star, Target, TrendingUp, Trophy,
  UserCircle, UserPlus, Users, XCircle,
  // Wrench för Tool-alias (Tool finns inte i lucide-react)
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const ICON_MAP: Record<string, LucideIcon> = {
  Accessibility, AlertTriangle, Award, Bell, BookOpen, Bookmark, Briefcase,
  CheckCircle, CheckSquare, Clock, Compass, Copy, Crown, Eye,
  FileCheck, FileText, Flame, FolderKanban, Footprints, GraduationCap,
  Heart, HelpCircle, Info, Languages, Library, Linkedin, Magnet,
  MessageCircle, MessageSquare, Mic, Minus, MinusCircle, Monitor, Network,
  Palette, PenLine, Phone, RefreshCw, Rocket, Route, Scale, Search,
  Send, Settings, Sparkles, Star, Target, TrendingUp, Trophy,
  UserCircle, UserPlus, Users, XCircle,
  // 'Tool' alias → Wrench (tidigare lucide-react Tool deprekerades)
  Tool: Wrench,
}

/**
 * Hämta ikon-komponent från namn. Returnerar HelpCircle som fallback.
 */
export function getIcon(name: string | undefined): LucideIcon {
  if (!name) return HelpCircle
  return ICON_MAP[name] || HelpCircle
}
