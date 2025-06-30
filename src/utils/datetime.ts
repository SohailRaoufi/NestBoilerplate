/**
 * Convert a given date to minutes
 * @param date
 * @returns
 */
export function calculateExpiryInMinutes(date: Date) {
  const min = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60)); // Convert expiry to minutes
  return min;
}

/**
 * returns a new future date using minutes
 * @param min
 * @returns date
 */
export function getAheadDateByMin(min: number) {
  return new Date(Date.now() + 60 * 1000 * min);
}
