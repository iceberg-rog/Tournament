'use client';

import { useCallback, useEffect, useState } from 'react';
import { authedGet, authedPost, authedPut, isLoggedIn } from '@/lib/api';
import { pushToast } from '@/lib/admin/store';
import { FEATURE_FLAGS, INTEGRATIONS } from '@/lib/integrations/catalog';
import { testIntegration } from '@/lib/integrations/adapters';
import type { IntegrationDef, IntegrationEnvironment, IntegrationInstance, IntegrationsState } from '@/lib/integrations/types';

function defaultInstance(def: IntegrationDef): IntegrationInstance {
  const settings: Record<string, unknown> = {};
  const secrets: Record<string, string> = {};
  const toggles: Record<string, boolean> = {};
  for (const f of def.fields) {
    if (f.secret) secrets[f.key] = '';
    else if (f.defaultValue !== undefined) settings[f.key] = f.defaultValue;
  }
  if (def.toggleList) for (const t of def.toggleList) toggles[t.key] = true;
  return { type: def.id, provider: def.mockProvider, enabled: true, mockMode: true, settings, secrets, toggles };
}

function defaultState(env: IntegrationEnvironment): IntegrationsState {
  const integrations: Record<string, IntegrationInstance> = {};
  for (const d of INTEGRATIONS) integrations[d.id] = defaultInstance(d);
  const flags: Record<string, boolean> = {};
  for (const fl of FEATURE_FLAGS) flags[fl.key] = env === 'development';
  return { environment: env, integrations, flags };
}

function merge(env: IntegrationEnvironment, remote: Partial<IntegrationsState> | null): IntegrationsState {
  const base = defaultState(env);
  if (!remote) return base;
  const integrations = { ...base.integrations };
  for (const id of Object.keys(remote.integrations ?? {})) {
    const b = base.integrations[id];
    const r = remote.integrations![id];
    if (!b) continue;
    integrations[id] = {
      ...b,
      ...r,
      settings: { ...b.settings, ...(r.settings ?? {}) },
      secrets: { ...b.secrets, ...(r.secrets ?? {}) },
      toggles: { ...(b.toggles ?? {}), ...(r.toggles ?? {}) },
    };
  }
  return { environment: env, integrations, flags: { ...base.flags, ...(remote.flags ?? {}) } };
}

export function useIntegrations(env: IntegrationEnvironment) {
  const [state, setState] = useState<IntegrationsState>(() => defaultState(env));
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [lastValidated, setLastValidated] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      if (isLoggedIn()) {
        try {
          const remote = await authedGet<Partial<IntegrationsState> | null>(`/integrations/${env}`);
          if (!cancelled) {
            setState(merge(env, remote));
            setDirty(false);
            setLoading(false);
            return;
          }
        } catch {
          /* fallback به پیش‌فرض */
        }
      }
      if (!cancelled) {
        setState(defaultState(env));
        setDirty(false);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [env]);

  const logAction = useCallback(
    (action: string, integrationId?: string, field?: string) => {
      if (isLoggedIn()) authedPost(`/integrations/${env}/audit`, { action, integrationId, field }).catch(() => {});
    },
    [env],
  );

  const update = (fn: (s: IntegrationsState) => IntegrationsState) => {
    setState(fn);
    setDirty(true);
  };
  const setInstance = (id: string, patch: Partial<IntegrationInstance>) => update((s) => ({ ...s, integrations: { ...s.integrations, [id]: { ...s.integrations[id], ...patch } } }));
  const setField = (id: string, key: string, value: unknown, secret?: boolean) =>
    update((s) => {
      const inst = s.integrations[id];
      const bag = secret ? 'secrets' : 'settings';
      return { ...s, integrations: { ...s.integrations, [id]: { ...inst, [bag]: { ...(inst[bag] as Record<string, unknown>), [key]: value } } } };
    });
  const setToggle = (id: string, key: string, value: boolean) =>
    update((s) => {
      const inst = s.integrations[id];
      return { ...s, integrations: { ...s.integrations, [id]: { ...inst, toggles: { ...(inst.toggles ?? {}), [key]: value } } } };
    });
  const setFlag = (key: string, value: boolean) => {
    update((s) => ({ ...s, flags: { ...s.flags, [key]: value } }));
    logAction('تغییرِ feature flag', undefined, `${key}=${value}`);
  };

  async function save() {
    setSaving(true);
    try {
      if (isLoggedIn()) await authedPut(`/integrations/${env}`, state);
      pushToast({ kind: 'success', msg: 'تنظیماتِ اتصال ذخیره شد' });
      setDirty(false);
    } catch {
      pushToast({ kind: 'error', msg: 'ذخیره ناموفق بود' });
    } finally {
      setSaving(false);
    }
  }

  function resetMock(id: string) {
    const def = INTEGRATIONS.find((d) => d.id === id);
    if (def) setInstance(id, defaultInstance(def));
    logAction('بازنشانی به حالتِ آزمایشی', id);
  }

  async function testOne(id: string) {
    setTesting(id);
    const res = await testIntegration(state.integrations[id]);
    setInstance(id, { lastTest: res, lastCheckedAt: res.checkedAt, lastError: res.status === 'failed' ? res.message : undefined });
    setTesting(null);
    logAction('تستِ اتصال', id);
    pushToast({ kind: res.status === 'failed' ? 'error' : 'success', msg: res.message });
    return res;
  }
  async function testAll() {
    for (const d of INTEGRATIONS) await testOne(d.id);
    setLastValidated(new Date().toISOString());
    pushToast({ kind: 'info', msg: 'همه‌ی اتصال‌ها تست شدند' });
  }

  function revealSecret(id: string, key: string) {
    logAction('نمایشِ secret', id, key);
  }
  function rotateSecret(id: string, key: string) {
    const val = 'sk_' + Math.random().toString(36).slice(2, 14);
    setField(id, key, val, true);
    logAction('چرخشِ secret', id, key);
    pushToast({ kind: 'success', msg: 'کلید چرخانده شد' });
  }

  return { state, dirty, loading, saving, testing, lastValidated, setInstance, setField, setToggle, setFlag, save, resetMock, testOne, testAll, revealSecret, rotateSecret };
}
