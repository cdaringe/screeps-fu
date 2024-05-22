export const partitionByRatio = <T, R extends Record<string, number>>(
  ratios: R,
  arr: T[],
) => {
  const result = Object.entries(ratios).reduce(
    (acc, [key, per]) => {
      let numToTake = Math.ceil(per * arr.length);
      acc.perSum += per;
      const items: T[] = [];
      acc.acc[key as keyof R] = items;
      while (numToTake && acc.remaining.length) {
        const item = acc.remaining.shift();
        items.push(item!);
        --numToTake;
      }
      return acc;
    },
    {
      perSum: 0,
      acc: {} as Record<keyof R, T[]>,
      remaining: arr,
    },
  );
  if (result.perSum !== 1) throw new Error(`ratios do not sum to 1`);
  return result.acc;
};

export const sum = (arr: number[]) => arr.reduce((acc, n) => acc + n, 0);
