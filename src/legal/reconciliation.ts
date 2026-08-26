export type ConsistencyStatus =
  'verified_cross_system' | 'verified_same_system' | 'primary_only' | 'conflict';

export type FieldCheck = {
  field: string;
  status: 'match' | 'conflict' | 'primary_only' | 'secondary_only';
  primary_value?: string;
  secondary_value?: string;
};

export type SourceDiscrepancy = {
  field: string;
  primary_value?: string;
  secondary_value?: string;
};

export function reconcileSourceValues(
  primary: Readonly<Record<string, string | undefined>>,
  secondary?: Readonly<Record<string, string | undefined>>
): { status: ConsistencyStatus; checks: FieldCheck[]; discrepancies: SourceDiscrepancy[] } {
  const fields = [...new Set([...Object.keys(primary), ...Object.keys(secondary ?? {})])].sort();
  const checks = fields.map((field): FieldCheck => {
    const primaryValue = primary[field];
    const secondaryValue = secondary?.[field];
    const status =
      primaryValue && secondaryValue
        ? primaryValue === secondaryValue
          ? 'match'
          : 'conflict'
        : primaryValue
          ? 'primary_only'
          : 'secondary_only';
    return {
      field,
      status,
      ...(primaryValue ? { primary_value: primaryValue } : {}),
      ...(secondaryValue ? { secondary_value: secondaryValue } : {})
    };
  });
  const discrepancies = checks
    .filter((check) => check.status === 'conflict')
    .map((check) => ({
      field: check.field,
      ...(check.primary_value ? { primary_value: check.primary_value } : {}),
      ...(check.secondary_value ? { secondary_value: check.secondary_value } : {})
    }));
  return {
    status: discrepancies.length
      ? 'conflict'
      : secondary
        ? 'verified_cross_system'
        : 'primary_only',
    checks,
    discrepancies
  };
}
