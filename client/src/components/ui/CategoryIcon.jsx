import {
  Utensils,
  Car,
  ShoppingBag,
  House,
  Receipt,
  GraduationCap,
  Clapperboard,
  HeartPulse,
  Plane,
  Repeat,
  CircleDashed,
  Banknote,
  Laptop,
  Users,
  Undo2,
  Gift,
} from 'lucide-react';

/**
 * Icons available to categories.
 *
 * Deliberately an explicit map rather than `import * as icons from
 * 'lucide-react'`. The namespace import pulls the library's ~1,500 icons into
 * the bundle, because a dynamic lookup like icons[name] gives the bundler no
 * way to know which ones are actually reachable. Naming them costs a few lines
 * and keeps the bundle to the icons we really use.
 *
 * Keys match the `icon` values in shared/constants.js.
 */
const ICONS = {
  utensils: Utensils,
  car: Car,
  'shopping-bag': ShoppingBag,
  home: House,
  receipt: Receipt,
  'graduation-cap': GraduationCap,
  clapperboard: Clapperboard,
  'heart-pulse': HeartPulse,
  plane: Plane,
  repeat: Repeat,
  'circle-dashed': CircleDashed,
  banknote: Banknote,
  laptop: Laptop,
  users: Users,
  'undo-2': Undo2,
  gift: Gift,
};

/**
 * A category's icon, tinted with the category's own colour.
 *
 * The colour lives on the category record so a category looks identical in the
 * chart, the list and the form (ARCHITECTURE.md §2.2).
 */
export default function CategoryIcon({ category, size = 'md' }) {
  const Icon = ICONS[category?.icon] ?? CircleDashed;
  const dimensions = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const color = category?.color ?? '#64748B';

  return (
    <span
      className={`grid ${dimensions} shrink-0 place-items-center rounded-full`}
      // Inline style because the colour is data, not a design token — Tailwind
      // cannot generate a class for a value that only exists at runtime.
      style={{ backgroundColor: `${color}1A`, color }}
      aria-hidden="true"
    >
      <Icon className={iconSize} />
    </span>
  );
}
