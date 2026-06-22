import { TournamentCard } from './TournamentCard';
import type { TournamentRow } from '@/lib/tournaments';

export function TournamentGrid({ items, guest }: { items: TournamentRow[]; guest?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((t) => (
        <TournamentCard key={t.id} t={t} guest={guest} />
      ))}
    </div>
  );
}
