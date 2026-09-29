/** ৳1,800 · ৳1,25,000 (Bangladeshi digit grouping) */
export function money(amount: number, currency = '৳'): string {
  return currency + amount.toLocaleString('en-IN');
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}
