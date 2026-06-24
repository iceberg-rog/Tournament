'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiGet, isLoggedIn } from '@/lib/api';
import type { AdminTournament } from '@/lib/admin';
import type { AdminRole } from '@/lib/admin/ops';
import { useAdminRole, useEnsureAdminRole, useTournament } from '@/lib/admin/store';
import { useControlRoom } from '@/lib/admin/useControlRoom';
import { noShowPolicyFor, type ActionQueueItem, type RoadmapStep } from '@/lib/admin/controlRoom';
import { useOpsSlice } from '@/lib/admin/opsStore';
import { AuditConsole } from '@/components/admin/cr/AuditConsole';
import { NoShowSettings } from '@/components/admin/cr/NoShowSettings';
import { CompactStatusBar } from '@/components/admin/cr/CompactStatusBar';
import { OperationRoadmap } from '@/components/admin/cr/OperationRoadmap';
import { CriticalBlockerCard } from '@/components/admin/cr/CriticalBlockerCard';
import { LiveNowSummary } from '@/components/admin/cr/LiveNowSummary';
import { StepPanel } from '@/components/admin/cr/StepPanel';
import { ActionQueuePanel } from '@/components/admin/cr/ActionQueuePanel';
import { LiveMatchCenter } from '@/components/admin/cr/LiveMatchCenter';
import { ProgressView } from '@/components/admin/cr/ProgressView';
import { ParticipantsPanel } from '@/components/admin/cr/ParticipantsPanel';
import { ChatAnnouncementsPanel } from '@/components/admin/cr/ChatAnnouncementsPanel';
import { DisputesPanel } from '@/components/admin/cr/DisputesPanel';
import { ActivityLog } from '@/components/admin/cr/ActivityLog';
import { MatchDetailDrawer } from '@/components/admin/cr/MatchDetailDrawer';
import { PlayerProfileDrawer } from '@/components/admin/cr/PlayerProfileDrawer';
import { DisputeDrawer } from '@/components/admin/cr/DisputeDrawer';

type TabKey = 'actions' | 'matches' | 'participants' | 'chat' | 'disputes' | 'activity' | 'audit';

function Cockpit({ t, role, actorName }: { t: AdminTournament; role: AdminRole; actorName: string }) {
  const cr = useControlRoom(t, role, actorName);
  const [tab, setTab] = useState<TabKey>('actions');
  const [step, setStep] = useState<RoadmapStep | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [policy, setPolicy] = useOpsSlice(t.id, 'noshow-policy', noShowPolicyFor(t.id));
  const unread = cr.cr.matches.reduce((s, m) => s + m.chatUnread, 0);

  // صفِ اقدامات: حذفِ موارد «رد شده» + (اگر سیاست تأییدِ مدیر را لازم نداند) حذفِ غیبت‌های دستی
  const actionsCr = {
    ...cr.cr,
    actionQueue: cr.cr.actionQueue.filter(
      (i) => !dismissed.has(i.id) && (policy.requireAdminApprovalForNoShow || !i.id.startsWith('aq-nsp-')),
    ),
  };

  function handleSecondary(item: ActionQueueItem, kind: 'message' | 'open' | 'dismiss') {
    if (kind === 'message') cr.run('message', { participantId: item.participantId });
    else if (kind === 'open') {
      if (item.matchId) cr.openMatch(item.matchId);
      else if (item.participantId) cr.openParticipant(item.participantId);
    } else if (kind === 'dismiss') {
      setDismissed((s) => new Set(s).add(item.id));
    }
  }

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

  // پل از StepPanel به تب‌ها/drawerها
  function stepTab(to: 'participants' | 'bracket' | 'disputes' | 'actions') {
    setStep(null);
    setTab(to === 'bracket' ? 'matches' : to);
  }
  const openChat = () => setTab('chat');

  const TABS: { key: TabKey; label: string; badge?: number; tone?: string }[] = [
    { key: 'actions', label: 'اقدامات', badge: cr.cr.actionQueue.length, tone: cr.cr.openDisputes ? 'text-[#fca5a5]' : 'text-gold' },
    { key: 'matches', label: 'براکت و مسابقات' },
    { key: 'participants', label: 'شرکت‌کننده‌ها', badge: cr.cr.totalCount },
    { key: 'chat', label: 'گفت‌وگو', badge: unread, tone: 'text-gold' },
    { key: 'disputes', label: 'اختلاف‌ها', badge: cr.cr.openDisputes, tone: 'text-[#fca5a5]' },
    { key: 'activity', label: 'فعالیت' },
    { key: 'audit', label: 'گزارشِ ممیزی' },
  ];

  return (
    <div className="space-y-6">
      {/* سطح ۱ — همیشه visible */}
      <CompactStatusBar cr={cr.cr} onRun={cr.run} onOpenChat={openChat} onReset={cr.reset} />
      <OperationRoadmap cr={cr.cr} activeKey={step?.key} onSelect={setStep} />

      {(() => {
        const hasBlocker = cr.cr.disputes.some((d) => d.status === 'open' || d.status === 'under_review');
        return (
          <div className={hasBlocker ? 'grid gap-6 lg:grid-cols-2' : ''}>
            {hasBlocker && <CriticalBlockerCard cr={cr.cr} onResolve={cr.openDispute} onOpenChat={openChat} />}
            <LiveNowSummary cr={cr.cr} onOpenMatch={cr.openMatch} onViewAll={() => setTab('matches')} />
          </div>
        );
      })()}

      {/* سطح ۲ — تب‌های ثانویه (هم‌زمان فقط یکی) */}
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

        {tab === 'actions' && (
          <div className="space-y-3">
            <ActionQueuePanel cr={actionsCr} onAct={handleAct} onSecondary={handleSecondary} />
            <NoShowSettings policy={policy} onChange={setPolicy} />
          </div>
        )}
        {tab === 'matches' && (
          <div className="space-y-6">
            <ProgressView cr={cr.cr} onOpenMatch={cr.openMatch} />
            <LiveMatchCenter cr={cr.cr} onOpenMatch={cr.openMatch} onRun={cr.run} />
          </div>
        )}
        {tab === 'participants' && <ParticipantsPanel cr={cr.cr} onOpenParticipant={cr.openParticipant} />}
        {tab === 'chat' && <ChatAnnouncementsPanel cr={cr.cr} onRun={cr.run} />}
        {tab === 'disputes' && <DisputesPanel cr={cr.cr} onOpenDispute={cr.openDispute} />}
        {tab === 'activity' && <ActivityLog cr={cr.cr} />}
        {tab === 'audit' && <AuditConsole cr={cr.cr} />}
      </div>

      {/* سطح ۲ — Glass panel هر مرحله */}
      <StepPanel
        cr={cr.cr}
        step={step}
        onClose={() => setStep(null)}
        onRun={cr.run}
        onOpenMatch={cr.openMatch}
        onOpenDispute={cr.openDispute}
        onOpenParticipant={cr.openParticipant}
        onOpenChat={openChat}
        onOpenTab={stepTab}
      />

      {/* سطح ۳ — drawerها */}
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
