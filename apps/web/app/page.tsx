'use client';

import { useEffect, useState } from 'react';
import { publicGet } from '@/lib/api';
import { PublicNavbar } from '@/components/PublicNavbar';
import { PublicFooter } from '@/components/PublicFooter';
import { HeroSection } from '@/components/HeroSection';
import { StatPillGrid } from '@/components/StatPillGrid';
import { LiveTournamentsShowcase } from '@/components/LiveTournamentsShowcase';
import { FeatureStorySection } from '@/components/FeatureStorySection';
import { HowItWorksSection } from '@/components/HowItWorksSection';
import { OrganizerPreviewSection } from '@/components/OrganizerPreviewSection';
import { PlayerExperienceSection } from '@/components/PlayerExperienceSection';
import { FinalCTASection } from '@/components/FinalCTASection';
import type { TournamentRow } from '@/lib/tournaments';

export default function LandingPage() {
  const [featured, setFeatured] = useState<TournamentRow | undefined>(undefined);

  useEffect(() => {
    publicGet<TournamentRow[]>('/tournaments')
      .then((l) => {
        const wp = (t: TournamentRow) => (t.prizePool?.length ?? 0) > 0;
        setFeatured(
          l.find((t) => t.status === 'RUNNING' && wp(t)) ??
            l.find((t) => t.status === 'RUNNING') ??
            l.find((t) => t.status === 'DRAFT' && wp(t)) ??
            l[0],
        );
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      <PublicNavbar />
      <HeroSection featured={featured} />
      <main className="mx-auto max-w-[1280px] space-y-24 px-4 pb-24 md:space-y-32 md:px-6">
        <StatPillGrid />
        <LiveTournamentsShowcase />
        <FeatureStorySection />
        <HowItWorksSection />
        <OrganizerPreviewSection />
        <PlayerExperienceSection />
        <FinalCTASection />
      </main>
      <PublicFooter />
    </div>
  );
}
