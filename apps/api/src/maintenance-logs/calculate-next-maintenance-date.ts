export function calculateNextMaintenanceDate(logDate: Date, careFrequencyDays: number): Date {
  const next = new Date(logDate);
  next.setDate(next.getDate() + careFrequencyDays);
  return next;
}
