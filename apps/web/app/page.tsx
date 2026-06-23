import { PublicNavbar } from '@/components/PublicNavbar';
import { PublicFooter } from '@/components/PublicFooter';
import { CinematicHero } from '@/components/CinematicHero';
import { ArenaPreviewPanel } from '@/components/ArenaPreviewPanel';
import { OfficialTournamentsShowcase } from '@/components/OfficialTournamentsShowcase';
import { PlayerJourneySection } from '@/components/PlayerJourneySection';
import { BracketExperienceSection } from '@/components/BracketExperienceSection';
import { PrizeEscrowSection } from '@/components/PrizeEscrowSection';
import { OrganizerPartnershipSection } from '@/components/OrganizerPartnershipSection';
import { FinalCtaSection } from '@/components/FinalCtaSection';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <PublicNavbar />
      <CinematicHero />
      <main className="space-y-24 pb-24 md:space-y-32">
        <ArenaPreviewPanel />
        <OfficialTournamentsShowcase />
        <PlayerJourneySection />
        <BracketExperienceSection />
        <PrizeEscrowSection />
        <OrganizerPartnershipSection />
        <FinalCtaSection />
      </main>
      <PublicFooter />
    </div>
  );
}
