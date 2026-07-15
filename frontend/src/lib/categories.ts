import {
  UtensilsCrossed,
  ShoppingCart,
  Home,
  Wallet,
  Plane,
  Car,
  Film,
  Zap,
  HeartPulse,
  GraduationCap,
  Gift,
  Receipt,
  Landmark,
  Tag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  food: UtensilsCrossed,
  groceries: ShoppingCart,
  shopping: ShoppingCart,
  rent: Home,
  housing: Home,
  salary: Wallet,
  income: Wallet,
  travel: Plane,
  transport: Car,
  uber: Car,
  entertainment: Film,
  movie: Film,
  utilities: Zap,
  health: HeartPulse,
  education: GraduationCap,
  gift: Gift,
  bills: Receipt,
  investment: Landmark,
};

// Neutral icon for a category (icons stay monochrome per the design spec).
export function categoryIcon(category: string): LucideIcon {
  return ICONS[category.trim().toLowerCase()] ?? Tag;
}

const CAT_COLORS = [
  "var(--color-cat-1)",
  "var(--color-cat-2)",
  "var(--color-cat-3)",
  "var(--color-cat-4)",
  "var(--color-cat-5)",
];

// Donut segment color: fixed-order categorical slots, "Other" is neutral gray.
export function sliceColor(index: number, category: string): string {
  if (category === "Other") return "var(--color-cat-other)";
  return CAT_COLORS[index % CAT_COLORS.length];
}
