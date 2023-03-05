export const errorLogs: string[] = [];

// @ts-expect-error
console._error = console.error;

console.error = (...args) => {
  // @ts-expect-error
  console._error(...args);
  errorLogs.push(args.join(' '));
};
