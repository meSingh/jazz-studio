/** Stationery: everything she can design and print, on the shared workbench. */
import { KINDS } from '../sheets';
import { remembered } from '../ui';
import { bench, type BenchState } from './bench';

export const stationeryState = remembered<BenchState>('jazz-studio-stationery',
  { kind: 'faces', me: true, pose: 'mix', words: {} });

export function stationeryRoom (main: HTMLElement): void {
  bench(main, KINDS, stationeryState);
}
