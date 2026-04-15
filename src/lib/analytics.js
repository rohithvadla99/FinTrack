import { subDays, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO, differenceInDays, getDay, getHours, format } from 'date-fns';

// ── Helpers ──────────────────────────────────────────────────────────────────

export function parseDate(d) {
  return typeof d === 'string' ? parseISO(d) : d;
}

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function stddev(arr, avg) {
  if (arr.length < 2) return 0;
  const m = avg ?? mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + Math.pow(v - m, 2), 0) / arr.length);
}

// ── Money Health Score (0-100) ────────────────────────────────────────────────

export function computeHealthScore(transactions) {
  if (!transactions.length) return { score: 0, breakdown: [] };

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  // 1. Savings rate (40 pts)
  const savingsRate = income > 0 ? Math.max(0, (income - expenses) / income) : 0;
  const savingsScore = Math.min(40, savingsRate * 100);

  // 2. Spending consistency (30 pts) — lower std dev in monthly expenses = better
  const last3Months = [0, 1, 2].map(i => {
    const d = subMonths(new Date(), i);
    return transactions
      .filter(t => t.type === 'expense' && isWithinInterval(parseDate(t.date), { start: startOfMonth(d), end: endOfMonth(d) }))
      .reduce((s, t) => s + t.amount, 0);
  });
  const avgMonthly = mean(last3Months);
  const cv = avgMonthly > 0 ? stddev(last3Months, avgMonthly) / avgMonthly : 1;
  const consistencyScore = Math.min(30, Math.max(0, 30 * (1 - cv)));

  // 3. Expense ratio (30 pts) — expenses < 80% of income
  const ratio = income > 0 ? expenses / income : 1;
  const ratioScore = Math.min(30, Math.max(0, 30 * (1 - ratio)));

  const score = Math.round(savingsScore + consistencyScore + ratioScore);

  return {
    score: Math.min(100, score),
    breakdown: [
      { label: 'Savings Rate', value: Math.round(savingsScore), max: 40, detail: `${(savingsRate * 100).toFixed(1)}% saved` },
      { label: 'Consistency', value: Math.round(consistencyScore), max: 30, detail: cv < 0.2 ? 'Very consistent' : cv < 0.5 ? 'Somewhat consistent' : 'Irregular' },
      { label: 'Expense Ratio', value: Math.round(ratioScore), max: 30, detail: `${(ratio * 100).toFixed(0)}% of income spent` },
    ]
  };
}

// ── Recurring Detection ───────────────────────────────────────────────────────

export function detectRecurring(transactions) {
  const expenses = transactions.filter(t => t.type === 'expense');
  const groups = {};

  expenses.forEach(t => {
    const key = t.category + '|' + Math.round(t.amount);
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });

  const recurring = [];
  Object.entries(groups).forEach(([key, txs]) => {
    if (txs.length < 2) return;
    const sorted = [...txs].sort((a, b) => parseDate(a.date) - parseDate(b.date));
    const gaps = [];
    for (let i = 1; i < sorted.length; i++) {
      gaps.push(differenceInDays(parseDate(sorted[i].date), parseDate(sorted[i - 1].date)));
    }
    const avgGap = mean(gaps);
    const gapStd = stddev(gaps, avgGap);

    let period = null;
    if (avgGap >= 6 && avgGap <= 8 && gapStd < 3) period = 'weekly';
    else if (avgGap >= 28 && avgGap <= 35 && gapStd < 5) period = 'monthly';
    else if (avgGap >= 13 && avgGap <= 16 && gapStd < 3) period = 'bi-weekly';

    if (period) {
      const last = sorted[sorted.length - 1];
      const nextDate = new Date(parseDate(last.date));
      nextDate.setDate(nextDate.getDate() + Math.round(avgGap));
      recurring.push({
        category: last.category,
        description: last.description || last.category,
        amount: last.amount,
        period,
        nextDate,
        confidence: gapStd < 2 ? 'high' : 'medium',
      });
    }
  });

  return recurring;
}

// ── Projected Balance (30 days) ───────────────────────────────────────────────

export function projectBalance(transactions, recurring) {
  const currentBalance = transactions.reduce((s, t) =>
    t.type === 'income' ? s + t.amount : s - t.amount, 0
  );

  const now = new Date();
  const in30 = new Date(); in30.setDate(in30.getDate() + 30);

  let projected = currentBalance;
  recurring.forEach(r => {
    let next = new Date(r.nextDate);
    while (next <= in30) {
      projected -= r.amount;
      next.setDate(next.getDate() + (r.period === 'weekly' ? 7 : r.period === 'bi-weekly' ? 14 : 30));
    }
  });

  // Add expected monthly income (average of last 3 months)
  const monthlyIncome = [0, 1, 2].map(i => {
    const d = subMonths(now, i);
    return transactions
      .filter(t => t.type === 'income' && isWithinInterval(parseDate(t.date), { start: startOfMonth(d), end: endOfMonth(d) }))
      .reduce((s, t) => s + t.amount, 0);
  });
  const avgMonthlyIncome = mean(monthlyIncome);
  projected += avgMonthlyIncome;

  return { current: currentBalance, projected, change: projected - currentBalance };
}

// ── Anomaly Detection ─────────────────────────────────────────────────────────

export function detectAnomalies(transactions) {
  const anomalies = [];
  const categories = [...new Set(transactions.filter(t => t.type === 'expense').map(t => t.category))];

  categories.forEach(cat => {
    const catTxs = transactions.filter(t => t.type === 'expense' && t.category === cat);
    if (catTxs.length < 3) return;

    // Group by week
    const weeklyTotals = {};
    catTxs.forEach(t => {
      const d = parseDate(t.date);
      const weekKey = format(d, 'YYYY-ww').replace('YYYY', d.getFullYear());
      if (!weeklyTotals[weekKey]) weeklyTotals[weekKey] = 0;
      weeklyTotals[weekKey] += t.amount;
    });

    const totals = Object.values(weeklyTotals);
    if (totals.length < 2) return;
    const avg = mean(totals);
    const sd = stddev(totals, avg);
    const latest = totals[totals.length - 1];

    const zScore = sd > 0 ? (latest - avg) / sd : 0;
    if (zScore > 1.5 && latest > avg * 1.5) {
      anomalies.push({
        category: cat,
        current: latest,
        average: avg,
        multiplier: (latest / avg).toFixed(1),
        severity: zScore > 2.5 ? 'high' : 'medium',
      });
    }
  });

  return anomalies;
}

// ── Explainable Insights ──────────────────────────────────────────────────────

export function generateInsights(transactions) {
  const insights = [];
  const now = new Date();
  const thisMonth = transactions.filter(t =>
    t.type === 'expense' && isWithinInterval(parseDate(t.date), { start: startOfMonth(now), end: endOfMonth(now) })
  );
  const lastMonth = transactions.filter(t =>
    t.type === 'expense' && isWithinInterval(parseDate(t.date), { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) })
  );

  // Compare categories month over month
  const cats = [...new Set([...thisMonth, ...lastMonth].map(t => t.category))];
  cats.forEach(cat => {
    const curr = thisMonth.filter(t => t.category === cat).reduce((s, t) => s + t.amount, 0);
    const prev = lastMonth.filter(t => t.category === cat).reduce((s, t) => s + t.amount, 0);
    if (prev > 0 && curr > prev * 1.3 && curr - prev > 20) {
      const cnt = thisMonth.filter(t => t.category === cat).length;
      insights.push({
        type: 'increase',
        category: cat,
        message: `Your ${cat.replace(/_/g, ' ')} spending is up ${Math.round(((curr - prev) / prev) * 100)}% vs last month (${cnt} transaction${cnt !== 1 ? 's' : ''} totaling $${curr.toFixed(2)})`,
        amount: curr - prev,
      });
    }
    if (prev > 0 && curr < prev * 0.7 && prev - curr > 20) {
      insights.push({
        type: 'decrease',
        category: cat,
        message: `Great job! You spent $${(prev - curr).toFixed(2)} less on ${cat.replace(/_/g, ' ')} vs last month`,
        amount: prev - curr,
      });
    }
  });

  return insights.slice(0, 5);
}

// ── Spending Heatmap ──────────────────────────────────────────────────────────

export function buildHeatmap(transactions) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const data = days.map(day => ({ day, total: 0, count: 0 }));

  transactions.filter(t => t.type === 'expense').forEach(t => {
    const d = parseDate(t.date);
    const dayIdx = getDay(d);
    data[dayIdx].total += t.amount;
    data[dayIdx].count += 1;
  });

  const max = Math.max(...data.map(d => d.total), 1);
  return data.map(d => ({ ...d, intensity: d.total / max }));
}

// ── Auto-Categorization ───────────────────────────────────────────────────────

const KEYWORD_MAP = {
  food: ['food', 'restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'lunch', 'dinner', 'breakfast', 'grocery', 'groceries', 'eat', 'meal', 'snack', 'sushi', 'mcdonalds', 'starbucks', 'doordash', 'uber eats'],
  transport: ['uber', 'lyft', 'taxi', 'gas', 'fuel', 'bus', 'metro', 'train', 'parking', 'transit', 'car', 'petrol', 'toll'],
  housing: ['rent', 'mortgage', 'lease', 'apartment', 'house'],
  utilities: ['electric', 'electricity', 'water', 'internet', 'wifi', 'phone', 'bill', 'utility', 'gas bill', 'heating'],
  entertainment: ['movie', 'cinema', 'concert', 'game', 'sport', 'ticket', 'bar', 'club', 'netflix', 'spotify'],
  shopping: ['amazon', 'clothes', 'shoes', 'store', 'mall', 'shop', 'purchase', 'buy', 'order'],
  health: ['doctor', 'pharmacy', 'medicine', 'gym', 'fitness', 'dental', 'medical', 'hospital', 'clinic'],
  education: ['course', 'book', 'school', 'university', 'tuition', 'class', 'learning', 'udemy', 'coursera'],
  subscriptions: ['subscription', 'monthly', 'annual', 'plan', 'membership', 'premium'],
  travel: ['flight', 'hotel', 'airbnb', 'vacation', 'trip', 'travel', 'airline', 'booking'],
  salary: ['salary', 'paycheck', 'pay', 'wage', 'payroll'],
  freelance: ['freelance', 'invoice', 'client', 'project', 'consulting'],
  investment: ['dividend', 'stock', 'crypto', 'investment', 'return', 'profit'],
};

export function autoDetectCategory(text, type = 'expense') {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(KEYWORD_MAP)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return cat;
    }
  }
  return null;
}

// ── Subscription Leak Detection ───────────────────────────────────────────────

export function detectSubscriptionLeaks(transactions) {
  const recurring = detectRecurring(transactions);
  const subscriptionCats = ['subscriptions', 'entertainment'];
  return recurring.filter(r =>
    subscriptionCats.includes(r.category) || (r.description && r.description.toLowerCase().includes('subscription'))
  );
}

// ── What-If Simulator ─────────────────────────────────────────────────────────

export function simulateWhatIf(transactions, adjustments) {
  // adjustments: { category: percentage_change } e.g. { food: -20 }
  const baseline30 = transactions
    .filter(t => t.type === 'expense' && isWithinInterval(parseDate(t.date), { start: subDays(new Date(), 30), end: new Date() }))
    .reduce((s, t) => s + t.amount, 0);

  const byCategory = {};
  transactions
    .filter(t => t.type === 'expense' && isWithinInterval(parseDate(t.date), { start: subDays(new Date(), 30), end: new Date() }))
    .forEach(t => { byCategory[t.category] = (byCategory[t.category] || 0) + t.amount; });

  let simulated = baseline30;
  const savings = {};

  Object.entries(adjustments).forEach(([cat, pct]) => {
    const base = byCategory[cat] || 0;
    const change = base * (pct / 100);
    simulated += change;
    savings[cat] = -change;
  });

  return {
    baseline: baseline30,
    simulated,
    totalSavings: baseline30 - simulated,
    monthlySavings: (baseline30 - simulated),
    annualSavings: (baseline30 - simulated) * 12,
    byCategory: savings,
  };
}

// ── Personalization ───────────────────────────────────────────────────────────

export function getPersonalizationProfile(transactions) {
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savingsRate = income > 0 ? (income - expenses) / income : 0;

  if (savingsRate < 0.1) return { profile: 'high_spender', label: 'High Spender', tips: ['Set a monthly budget limit', 'Review recurring charges', 'Try the What-If simulator to find cuts'] };
  if (savingsRate > 0.3) return { profile: 'saver', label: 'Strong Saver', tips: ['Consider investing your surplus', 'Your savings rate is excellent', 'Look into index funds or ETFs'] };
  return { profile: 'balanced', label: 'Balanced', tips: ['You\'re on track', 'Small reductions in food/entertainment could boost savings', 'Consider automating savings'] };
}