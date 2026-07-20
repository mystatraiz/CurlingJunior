import {
  BarChart3,
  CalendarDays,
  History,
  LayoutDashboard,
  Medal,
  Settings,
  Swords,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Affiché dans la barre d'onglets mobile. */
  mobile?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, mobile: true },
  { href: '/players', label: 'Joueurs', icon: Users, mobile: true },
  { href: '/trainings', label: 'Entraînements', icon: CalendarDays, mobile: true },
  { href: '/matches', label: 'Matchs', icon: Swords },
  { href: '/rankings', label: 'Classements', icon: Medal, mobile: true },
  { href: '/progression', label: 'Progression', icon: TrendingUp },
  { href: '/history', label: 'Historique', icon: History },
  { href: '/settings', label: 'Paramètres', icon: Settings },
];

export const MOBILE_MORE: NavItem = {
  href: '/more',
  label: 'Plus',
  icon: BarChart3,
};
