/** File de promesses : une sauvegarde à la fois, dans l'ordre. */
export function createSerialQueue() {
  let chain: Promise<void> = Promise.resolve();

  return function enqueue(task: () => Promise<void>): Promise<void> {
    const run = chain.then(task, task);
    chain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  };
}
