import { Engine, Format, Participant } from './types';
import { SingleElimEngine } from './singleElim';
import { DoubleElimEngine } from './doubleElim';
import { RoundRobinEngine } from './roundRobin';
import { SwissEngine } from './swiss';
import { FfaEngine } from './ffa';

export interface CreateOpts {
  swissRounds?: number;
  ffaRounds?: number;
}

/** factory مرکزی: فرمت → موتور متناظر. */
export function createTournament(
  format: Format,
  participants: Participant[],
  opts: CreateOpts = {},
): Engine {
  switch (format) {
    case 'SINGLE_ELIM':
      return new SingleElimEngine(participants);
    case 'DOUBLE_ELIM':
      return new DoubleElimEngine(participants);
    case 'ROUND_ROBIN':
      return new RoundRobinEngine(participants);
    case 'SWISS':
      return new SwissEngine(participants, opts.swissRounds);
    case 'FFA':
      return new FfaEngine(participants, opts.ffaRounds ?? 3);
    default:
      throw new Error(`unknown format: ${format as string}`);
  }
}
