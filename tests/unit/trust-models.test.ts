import { describe, expect, it } from 'vitest';
import { reconcileSourceValues } from '../../src/legal/reconciliation.js';
import { selectSafeSnapshot } from '../../src/legal/timeline.js';

describe('official-source reconciliation', () => {
  it('reports agreement, conflicts, partial fields, and secondary outage', () => {
    expect(
      reconcileSourceValues({ celex: 'A', date: '2020-01-01' }, { celex: 'A', date: '2020-01-01' })
    ).toMatchObject({ status: 'verified_cross_system', discrepancies: [] });
    expect(reconcileSourceValues({ celex: 'A' }, { celex: 'B' })).toMatchObject({
      status: 'conflict',
      discrepancies: [{ field: 'celex', primary_value: 'A', secondary_value: 'B' }]
    });
    expect(
      reconcileSourceValues({ celex: 'A' }, { celex: 'A', ecli: 'ECLI:X' }).checks
    ).toContainEqual({
      field: 'ecli',
      status: 'secondary_only',
      secondary_value: 'ECLI:X'
    });
    expect(reconcileSourceValues({ celex: 'A' })).toMatchObject({
      status: 'primary_only',
      discrepancies: []
    });
  });
});

describe('safe temporal selection', () => {
  const snapshots = [
    { type: 'original' as const, snapshot_date: '2020-01-01', language_available: true },
    { type: 'consolidated' as const, snapshot_date: '2020-06-01', language_available: true },
    { type: 'consolidated' as const, snapshot_date: '2021-01-01', language_available: false }
  ];

  it('selects exact dates and safe intervals', () => {
    expect(selectSafeSnapshot(snapshots, [], '2020-06-01').snapshot_date).toBe('2020-06-01');
    expect(selectSafeSnapshot(snapshots, [], '2020-12-31').snapshot_date).toBe('2020-06-01');
  });

  it('rejects pre-publication, intervening, undated, and missing-language cases', () => {
    expect(() => selectSafeSnapshot(snapshots, [], '2019-12-31')).toThrowError(
      expect.objectContaining({ code: 'VERSION_NOT_FOUND' })
    );
    expect(() =>
      selectSafeSnapshot(
        snapshots,
        [{ event_type: 'amending_act', date: '2020-09-01' }],
        '2020-12-31'
      )
    ).toThrowError(expect.objectContaining({ code: 'VERSION_NOT_FOUND' }));
    expect(() =>
      selectSafeSnapshot(snapshots, [{ event_type: 'corrigendum' }], '2020-12-31')
    ).toThrowError(expect.objectContaining({ code: 'VERSION_NOT_FOUND' }));
    expect(() =>
      selectSafeSnapshot(
        snapshots.map((snapshot) => ({ ...snapshot, language_available: false })),
        [],
        '2020-12-31'
      )
    ).toThrowError(expect.objectContaining({ code: 'VERSION_NOT_FOUND' }));
  });
});
