import type { ComponentType } from 'react';
import type { IconProps } from 'phosphor-react-native';
import { CalendarBlank, ChartLine, Gear, Heart } from 'phosphor-react-native';
import { ICON_COLORS, ICON_SIZES } from '../constants/theme';

export type PhosphorIcon = ComponentType<IconProps>;
export type TabId = 'suivi' | 'insights' | 'corps' | 'settings';

export function TabIcon({
  icon: Icon,
  active,
  size = ICON_SIZES.tab,
}: {
  icon: PhosphorIcon;
  active: boolean;
  size?: number;
}) {
  return (
    <Icon
      size={size}
      weight={active ? 'fill' : 'regular'}
      color={active ? ICON_COLORS.active : ICON_COLORS.inactive}
    />
  );
}

export const NAV_TABS: { id: TabId; label: string; Icon: PhosphorIcon }[] = [
  { id: 'suivi', label: 'Suivi', Icon: CalendarBlank },
  { id: 'insights', label: 'Insights', Icon: ChartLine },
  { id: 'corps', label: 'Mon corps', Icon: Heart },
  { id: 'settings', label: 'Les paramètres', Icon: Gear },
];
