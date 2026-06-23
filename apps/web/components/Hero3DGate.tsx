'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { SafeCanvas } from '@/components/SafeCanvas';

const Hero3D = dynamic(() => import('@/components/Hero3D'), { ssr: false, loading: () => null });

function webglSupported(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** هسته‌ی سه‌بعدی را فقط وقتی WebGL واقعاً موجود است mount می‌کند؛ وگرنه هیچ
 *  (هیرو CSS سالم می‌ماند). در غیرِ این صورت SafeCanvas هرگونه خطا را می‌گیرد. */
export function Hero3DGate() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (webglSupported()) setOk(true);
  }, []);
  if (!ok) return null;
  return (
    <SafeCanvas>
      <Hero3D />
    </SafeCanvas>
  );
}
