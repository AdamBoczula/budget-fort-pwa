// spec: docs/specs/budget/planowanie-budzetu.md

export function getPreviousMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 1, 1);
}

export function isInMonth(dateString: string, year: number, month: number): boolean {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {return false;}
  return date.getFullYear() === year && date.getMonth() === month;
}
