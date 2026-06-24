/**
 * قراردادِ adapterِ استریم — برای جداکردنِ منطقِ پخش از provider.
 * MockStreamAdapter (internal_mock_stream) پیش‌فرض است؛ RTMP/HLS بعداً جایگزین می‌شود.
 */
export interface StreamProvisionInput {
  tournamentId: string;
  matchId: string;
}
export interface StreamProvision {
  ingestUrl: string;
  playbackUrl: string;
  streamKey: string;
}
export interface StreamHealth {
  status: 'starting' | 'live' | 'degraded' | 'ended' | 'offline';
  viewers: number;
  bitrate: number;
  latency: number;
  dropped: number;
}

export interface StreamAdapter {
  readonly id: string;
  provision(input: StreamProvisionInput): Promise<StreamProvision>;
  start(input: StreamProvisionInput): Promise<StreamHealth>;
  stop(input: StreamProvisionInput): Promise<void>;
  health(input: StreamProvisionInput): Promise<StreamHealth>;
}

/** adapterِ آزمایشیِ داخلی — بدونِ سرورِ واقعی؛ سلامتِ شبیه‌سازی‌شده تولید می‌کند. */
export class MockStreamAdapter implements StreamAdapter {
  readonly id = 'internal_mock_stream';

  async provision({ tournamentId, matchId }: StreamProvisionInput): Promise<StreamProvision> {
    return {
      ingestUrl: 'rtmp://ingest.shelter.gg/live',
      playbackUrl: `https://shelter.gg/tournaments/${tournamentId}/live/${matchId}`,
      streamKey: `sk_${tournamentId}_${matchId}`,
    };
  }
  async start({ matchId }: StreamProvisionInput): Promise<StreamHealth> {
    // مقادیرِ قطعی (بدونِ Math.random) برای پایداریِ تست
    const seed = matchId.length;
    return { status: 'live', viewers: 800 + seed * 40, bitrate: 6000, latency: 2.1, dropped: 3 };
  }
  async stop(): Promise<void> {
    /* mock: چیزی برای teardown نیست */
  }
  async health({ matchId }: StreamProvisionInput): Promise<StreamHealth> {
    const seed = matchId.length;
    return { status: 'live', viewers: 800 + seed * 40, bitrate: 6000, latency: 2.1, dropped: 3 };
  }
}

export const STREAM_ADAPTER = 'STREAM_ADAPTER';
