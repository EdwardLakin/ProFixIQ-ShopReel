export function normalizeDurationSeconds(
  value: number | string | null | undefined
): 4 | 8 | 12 {
  const parsed =
    typeof value === "string" ? Number.parseInt(value, 10) : value ?? 8;

  if (parsed === 4 || parsed === 8 || parsed === 12) {
    return parsed;
  }

  return 8;
}
