import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { getCategoryLabel, getCategoryIcon } from '@/lib/categories';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

export default function TransactionList({ transactions }) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Transaction.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] })
  });

  if (!transactions.length) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-base font-medium">No transactions found</p>
        <p className="text-sm mt-1">Try adjusting your filters or add a new transaction</p>
      </div>
    );
  }

  // Group by date
  const grouped = transactions.reduce((acc, tx) => {
    const dateKey = tx.date;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(tx);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {Object.entries(grouped)
          .sort(([a], [b]) => new Date(b) - new Date(a))
          .map(([dateKey, txs]) => (
            <motion.div
              key={dateKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-1"
            >
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                {format(new Date(dateKey), 'EEEE, MMM d, yyyy')}
              </p>
              {txs.map((tx) => {
                const IconComp = getCategoryIcon(tx.category);
                return (
                  <motion.div
                    key={tx.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
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
                        {getCategoryLabel(tx.category)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1">
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteMutation.mutate(tx.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
}