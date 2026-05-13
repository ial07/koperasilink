export const TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['in_transit', 'cancelled'],
  in_transit: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export function isValidTransition(from: string, to: string): boolean {
  return TRANSITIONS[from]?.includes(to) || false;
}

export function getNextStatus(from: string): string[] {
  return TRANSITIONS[from] || [];
}
