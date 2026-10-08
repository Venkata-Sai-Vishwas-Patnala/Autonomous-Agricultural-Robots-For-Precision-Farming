import {
  Activity,
  BarChart3,
  Compass,
  LayoutDashboard,
  Map,
  Sprout,
  type LucideIcon,
} from 'lucide-react'

export type PageKey = 'overview' | 'field-map' | 'fleet' | 'missions' | 'scouting' | 'research'

export type NavigationItem = {
  key: PageKey
  label: string
  icon: LucideIcon
}

export const navigationGroups: { label: string; items: NavigationItem[] }[] = [
  {
    label: 'Workspace',
    items: [{ key: 'overview', label: 'Overview', icon: LayoutDashboard }],
  },
  {
    label: 'Field operations',
    items: [
      { key: 'field-map', label: 'Field map', icon: Map },
      { key: 'fleet', label: 'Robot fleet', icon: Activity },
      { key: 'missions', label: 'Missions', icon: Compass },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { key: 'scouting', label: 'Crop analysis', icon: Sprout },
      { key: 'research', label: 'Research data', icon: BarChart3 },
    ],
  },
]