import {
  Banknote, Briefcase, TrendingUp, Gift, Coins,
  UtensilsCrossed, Car, Home, Zap, Gamepad2,
  ShoppingBag, Heart, GraduationCap, Repeat, Plane, MoreHorizontal
} from 'lucide-react';

const categoryConfig = {
  salary: { label: 'Salary', icon: Banknote, type: 'income' },
  freelance: { label: 'Freelance', icon: Briefcase, type: 'income' },
  investment: { label: 'Investment', icon: TrendingUp, type: 'income' },
  gift: { label: 'Gift', icon: Gift, type: 'income' },
  other_income: { label: 'Other Income', icon: Coins, type: 'income' },
  food: { label: 'Food & Dining', icon: UtensilsCrossed, type: 'expense' },
  transport: { label: 'Transport', icon: Car, type: 'expense' },
  housing: { label: 'Housing', icon: Home, type: 'expense' },
  utilities: { label: 'Utilities', icon: Zap, type: 'expense' },
  entertainment: { label: 'Entertainment', icon: Gamepad2, type: 'expense' },
  shopping: { label: 'Shopping', icon: ShoppingBag, type: 'expense' },
  health: { label: 'Health', icon: Heart, type: 'expense' },
  education: { label: 'Education', icon: GraduationCap, type: 'expense' },
  subscriptions: { label: 'Subscriptions', icon: Repeat, type: 'expense' },
  travel: { label: 'Travel', icon: Plane, type: 'expense' },
  other_expense: { label: 'Other', icon: MoreHorizontal, type: 'expense' },
};

export function getCategoryLabel(category) {
  return categoryConfig[category]?.label || category;
}

export function getCategoryIcon(category) {
  return categoryConfig[category]?.icon || MoreHorizontal;
}

export function getCategoriesByType(type) {
  return Object.entries(categoryConfig)
    .filter(([, config]) => config.type === type)
    .map(([value, config]) => ({ value, label: config.label, icon: config.icon }));
}

export default categoryConfig;