'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiGet, isLoggedIn } from '@/lib/api';
import type { AdminTournament } from '@/lib/admin';
import type { AdminRole } from '@/lib/admin/ops';
import { useAdminRole, useEnsureAdminRole, useTournament } from '@/lib/admin/store';
import { useControlRoom } from '@/lib/admin/useControlRoom';
import type { ActionQueueItem } from '@/lib/admin/controlRoom';
import { ControlRoomHeader } from '@/components/admin/cr/ControlRoomHeader';
import { OperationRoadmap } from '@/components/admin/cr/OperationRoadmap';
import { ActionQueuePanel } from '@/components/admin/cr/ActionQueuePanel';
import { LiveMatchCenter } from '@/components/admin/cr/LiveMatchCenter';
import { ProgressView } from '@/components/admin/cr/ProgressView';
import { ParticipantsPanel } from '@/components/admin/cr/ParticipantsPanel';
import { ChatAnnouncementsPanel } from '@/components/admin/cr/ChatAnnouncementsPanel';
import { DisputesPanel } from '@/components/admin/cr/DisputesPanel';
import { ActivityLog } from '@/components/admin/cr/ActivityLog';
import { RoundControlPanel } from '@/components/admin/cr/RoundControlPanel';
import { OutcomeSummary } from '@/components/admin/cr/OutcomeSummary';
import { MatchDetailDrawer } from '@/components/admin/cr/MatchDetailDrawer';
import { PlayerProfileDrawer } from '@/components/admin/cr/PlayerProfileDrawer';
import { DisputeDrawer } from '@/components/admin/cr/DisputeDrawer';

function Cockpit({ t, role, actorName }: { t: AdminTournament; role: AdminRole; actorName: string }) {
  const cr = useControlRoom(t, role, actorName);

  function handleAct(item: ActionQueueItem) {
    switch (item.action) {
      case 'resolve_dispute':
        if (item.disputeId) cr.openDispute(item.disputeId);
        break;
      case 'approve_result':
        if (item.matchId) cr.run('approve_result', { matchId: item.matchId });
        break;
      case 'mark_no_show':
        cr.run('mark_no_show', { matchId: item.matchId, participantId: item.participantId });
        break;
      case 'generate_next_round':
        cr.run('generate_next_round');
        break;
      case 'release_prize':
        cr.run('release_prize');
        break;
      case 'open_match':
      case 'review_evidence':
        if (item.matchId) cr.openMatch(item.matchId);
        break;
    }
  }

  return (
    <div className="space-y-4">
      <ControlRoomHeader cr={cr.cr} />
      <OperationRoadmap cr={cr.cr} />

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <div className="space-y-4">
          <LiveMatchCenter cr={cr.cr} onOpenMatch={cr.openMatch} onRun={cr.run} />
          <ProgressView cr={cr.cr} onOpenMatch={cr.openMatch} />
          <ChatAnnouncementsPanel cr={cr.cr} onRun={cr.run} />
        </div>

        <div className="space-y-4">
          <ActionQueuePanel cr={cr.cr} onAct={handleAct} />
          <RoundControlPanel cr={cr.cr} onGenerateNext={() => cr.run('generate_next_round')} />
          <OutcomeSummary cr={cr.cr} />
          <DisputesPanel cr={cr.cr} onOpenDispute={cr.openDispute} />
          <ParticipantsPanel cr={cr.cr} onOpenParticipant={cr.openParticipant} />
          <ActivityLog cr={cr.cr} />
        </div>
      </div>

      <MatchDetailDrawer cr={cr.cr} matchId={cr.matchId} onClose={cr.closeDrawers} onRun={cr.run} onOpenParticipant={cr.openParticipant} />
      <PlayerProfileDrawer cr={cr.cr} participantId={cr.participantId} onClose={cr.closeDrawers} onRun={cr.run} onOpenMatch={cr.openMatch} />
      <DisputeDrawer cr={cr.cr} disputeId={cr.disputeId} onClose={cr.closeDrawers} onRun={cr.run} onOpenParticipant={cr.openParticipant} />
    </div>
  );
}

export default function ControlRoomPage() {
  useEnsureAdminRole();
  const role = useAdminRole();
  const params = useParams();
  const t = useTournament(String(params.id));
  const [actorName, setActorName] = useState('مدیر سیستم');

  useEffect(() => {
    if (isLoggedIn()) apiGet<{ displayName: string }>('/users/me').then((m) => m.displayName && setActorName(m.displayName)).catch(() => {});
  }, []);

  if (!t) return null;
  return <Cockpit t={t} role={role} actorName={actorName} />;
}
