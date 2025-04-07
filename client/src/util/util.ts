export const util = {
  wait: (millis: number) =>
    new Promise((resolve) => setTimeout(resolve, millis)),
};
