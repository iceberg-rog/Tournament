'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiGet, isLoggedIn } from '@/lib/api';
import type { AdminTournament } from '@/lib/admin';
import type { AdminRole } from '@/lib/admin/ops';
import { useAdminRole, useEnsureAdminRole, useTournament } from '@/lib/admin/store';
import { useControlRoom } from '@/lib/admin/useControlRoom';
import type { ActionQueueItem } from '@/lib/admin/controlRoom';
import { AuditLogList } from '@/components/admin/AuditLogList';
import { CompactStatusBar } from '@/components/admin/cr/CompactStatusBar';
import { OperationStatusStrip } from '@/components/admin/cr/OperationStatusStrip';
import { OperationRoadmap } from '@/components/admin/cr/OperationRoadmap';
import { CriticalBlockerCard } from '@/components/admin/cr/CriticalBlockerCard';
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

type TabKey = 'participants' | 'chat' | 'disputes' | 'activity' | 'audit';

function Cockpit({ t, role, actorName }: { t: AdminTournament; role: AdminRole; actorName: string }) {
  const cr = useControlRoom(t, role, actorName);
  const [tab, setTab] = useState<TabKey>('participants');
  const unread = cr.cr.matches.reduce((s, m) => s + m.chatUnread, 0);

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

  const openChat = () => setTab('chat');

  const TABS: { key: TabKey; label: string; badge?: number; tone?: string }[] = [
    { key: 'participants', label: 'شرکت‌کننده‌ها', badge: cr.cr.totalCount },
    { key: 'chat', label: 'گفت‌وگو', badge: unread, tone: 'text-gold' },
    { key: 'disputes', label: 'اختلاف‌ها', badge: cr.cr.openDisputes, tone: 'text-[#fca5a5]' },
    { key: 'activity', label: 'فعالیت' },
    { key: 'audit', label: 'گزارشِ ممیزی' },
  ];

  return (
    <div className="space-y-6">
      <CompactStatusBar cr={cr.cr} onRun={cr.run} onOpenChat={openChat} />
      <OperationStatusStrip cr={cr.cr} />
      <OperationRoadmap cr={cr.cr} />

      {/* ناحیه‌ی اصلیِ عملیات */}
      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="space-y-6">
          <LiveMatchCenter cr={cr.cr} onOpenMatch={cr.openMatch} onRun={cr.run} />
          <ProgressView cr={cr.cr} onOpenMatch={cr.openMatch} />
        </div>

        <div className="space-y-6">
          <CriticalBlockerCard cr={cr.cr} onResolve={cr.openDispute} onOpenChat={openChat} />
          <ActionQueuePanel cr={cr.cr} onAct={handleAct} />
          <RoundControlPanel cr={cr.cr} onGenerateNext={() => cr.run('generate_next_round')} />
          <OutcomeSummary cr={cr.cr} />
        </div>
      </div>

      {/* پنل‌های ثانویه — تب‌دار (هم‌زمان فقط یکی باز) */}
      <div className="space-y-3">
        <div className="hscroll flex gap-1 rounded-2xl border border-line bg-tile p-1">
          {TABS.map((tb) => {
            const active = tab === tb.key;
            return (
              <button
                key={tb.key}
                onClick={() => setTab(tb.key)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-[13px] font-medium transition ${active ? 'bg-accent/15 text-white shadow-[inset_0_0_0_1px_rgba(45,212,191,.3)]' : 'text-muted hover:bg-white/[.04] hover:text-white'}`}
              >
                {tb.label}
                {tb.badge ? <span className={`tnum rounded-full bg-tile2 px-1.5 text-[10px] ${tb.tone ?? 'text-faint'}`}>{tb.badge.toLocaleString('fa-IR')}</span> : null}
              </button>
            );
          })}
        </div>

        {tab === 'participants' && <ParticipantsPanel cr={cr.cr} onOpenParticipant={cr.openParticipant} />}
        {tab === 'chat' && <ChatAnnouncementsPanel cr={cr.cr} onRun={cr.run} />}
        {tab === 'disputes' && <DisputesPanel cr={cr.cr} onOpenDispute={cr.openDispute} />}
        {tab === 'activity' && <ActivityLog cr={cr.cr} />}
        {tab === 'audit' && (
          <section className="rounded-2xl border border-line bg-tile p-5">
            <h2 className="mb-3 font-display text-base font-bold">گزارشِ ممیزی</h2>
            <AuditLogList limit={50} />
          </section>
        )}
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
