import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { getCategoryLabel, getCategoryIcon } from '@/lib/categories';

export default function RecentTransactions({ transactions }) {
  if (!transactions.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No transactions yet</p>
        <p className="text-xs mt-1">Add your first transaction to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {transactions.slice(0, 8).map((tx, i) => {
        const IconComp = getCategoryIcon(tx.category);
        return (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              tx.type === 'income' ? "bg-primary/10" : "bg-destructive/10"
            )}>
              <IconComp className={cn(
                "w-4 h-4",
                tx.type === 'income' ? "text-primary" : "text-destructive"
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {tx.description || getCategoryLabel(tx.category)}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(tx.date), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {tx.type === 'income' ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-primary" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-destructive" />
              )}
              <span className={cn(
                "text-sm font-semibold tabular-nums",
                tx.type === 'income' ? "text-primary" : "text-destructive"
              )}>
                ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}