import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { getCategoriesByType } from '@/lib/categories';
import { autoDetectCategory } from '@/lib/analytics';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Wand2 } from 'lucide-react';

const LAST_PREFS_KEY = 'moneyflow_last_prefs';

function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(LAST_PREFS_KEY) || '{}'); } catch { return {}; }
}
function savePrefs(prefs) {
  try { localStorage.setItem(LAST_PREFS_KEY, JSON.stringify(prefs)); } catch {}
}

export default function AddTransactionDialog({ open, onOpenChange }) {
  const prefs = loadPrefs();
  const [type, setType] = useState(prefs.type || 'expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(prefs.category || '');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [autoCategory, setAutoCategory] = useState(null);
  const amountRef = useRef(null);

  const queryClient = useQueryClient();
  const categories = getCategoriesByType(type);

  // Auto-focus amount on open
  useEffect(() => {
    if (open) setTimeout(() => amountRef.current?.focus(), 50);
  }, [open]);

  // Auto-categorize from description
  useEffect(() => {
    if (!description) { setAutoCategory(null); return; }
    const detected = autoDetectCategory(description, type);
    if (detected && detected !== category) setAutoCategory(detected);
    else setAutoCategory(null);
  }, [description, type]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Transaction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      savePrefs({ type, category });
      resetForm();
      onOpenChange(false);
    }
  });

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setAutoCategory(null);
  };

  const handleTypeChange = (v) => {
    setType(v);
    setCategory('');
    setAutoCategory(null);
  };

  const applyAutoCategory = () => {
    setCategory(autoCategory);
    setAutoCategory(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ type, amount: parseFloat(amount), category, description, date });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={type} onValueChange={handleTypeChange}>
            <TabsList className="w-full">
              <TabsTrigger value="expense" className="flex-1">Expense</TabsTrigger>
              <TabsTrigger value="income" className="flex-1">Income</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-1.5">
            <Label>Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
              <Input
                ref={amountRef}
                type="number" step="0.01" min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7 text-lg font-semibold"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Note <span className="text-muted-foreground text-xs">(auto-categorizes)</span></Label>
            <Textarea
              placeholder='e.g. "Uber 14$", "Netflix subscription"…'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
            {autoCategory && (
              <div className="flex items-center gap-2 mt-1">
                <Wand2 className="w-3 h-3 text-primary" />
                <span className="text-xs text-muted-foreground">Detected:</span>
                <Badge
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors border-primary/40"
                  onClick={applyAutoCategory}
                >
                  {autoCategory.replace(/_/g, ' ')} — tap to apply
                </Badge>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createMutation.isPending || !amount || !category}
          >
            {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Add {type === 'income' ? 'Income' : 'Expense'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}