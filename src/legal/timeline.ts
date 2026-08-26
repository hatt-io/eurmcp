import { EuLawError } from '../errors/errors.js';

export type OfficialSnapshot = {
  type: 'original' | 'consolidated';
  snapshot_date?: string;
  language_available: boolean;
};

export type ModificationEvent = { event_type: string; date?: string };

export function selectSafeSnapshot<T extends OfficialSnapshot>(
  snapshots: readonly T[],
  events: readonly ModificationEvent[],
  requestedDate: string,
  context: Record<string, unknown> = {}
): T {
  const selected = snapshots
    .filter((snapshot) => snapshot.language_available)
    .filter((snapshot) => snapshot.snapshot_date && snapshot.snapshot_date <= requestedDate)
    .sort((left, right) => right.snapshot_date!.localeCompare(left.snapshot_date!))[0];
  if (!selected) {
    throw new EuLawError('VERSION_NOT_FOUND', 'No official snapshot supports the requested date', {
      ...context,
      requested_date: requestedDate
    });
  }
  const blockingEvents = events.filter(
    (event) =>
      ['amending_act', 'corrigendum'].includes(event.event_type) &&
      (!event.date || (event.date > selected.snapshot_date! && event.date <= requestedDate))
  );
  if (blockingEvents.length) {
    throw new EuLawError(
      'VERSION_NOT_FOUND',
      'A known intervening modification makes the selected snapshot unreliable',
      {
        ...context,
        requested_date: requestedDate,
        selected_snapshot_date: selected.snapshot_date,
        blocking_events: blockingEvents
      }
    );
  }
  return selected;
}
