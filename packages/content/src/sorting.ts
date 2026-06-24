export function byOrder<T extends { data: { order: number } }>(a: T, b: T) {
  return a.data.order - b.data.order;
}

export function byDateDesc<T extends { data: { date: Date } }>(a: T, b: T) {
  return b.data.date.valueOf() - a.data.date.valueOf();
}

export function byDateAsc<T extends { data: { date: Date } }>(a: T, b: T) {
  return a.data.date.valueOf() - b.data.date.valueOf();
}
