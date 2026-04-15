import { Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function PersonalizationTip({ profile }) {
  if (!profile) return null;
  return (
    <Card className="rounded-2xl border bg-primary/5 border-primary/20">
      <CardContent className="p-4 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold">{profile.label} Profile</p>
          <ul className="mt-1.5 space-y-1">
            {profile.tips.map((tip, i) => (
              <li key={i} className="text-xs text-muted-foreground">• {tip}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}