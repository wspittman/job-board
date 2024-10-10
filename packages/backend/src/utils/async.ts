export async function batchRun<T>(
  values: T[],
  func: (value: T) => Promise<void>,
  size: number = 5
) {
  for (let i = 0; i < values.length; i += size) {
    const batch = values.slice(i, i + size);
    const result = await Promise.allSettled(batch.map(func));

    result.forEach((r, index) => {
      if (r.status === "rejected") {
        console.error(
          `batchRun: Error at values[${i + index}]="${batch[index]}": ${
            r.reason
          }`
        );
      }
    });
  }
}

export async function logWrap(msg: string, func: () => Promise<void>) {
  try {
    console.log(`${msg}: Start`);
    await func();
    console.log(`${msg}: End`);
  } catch (error) {
    console.error(`${msg}: Error ${error}`);
  }
}
