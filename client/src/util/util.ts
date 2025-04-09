export const util = {
  wait: (millis: number) =>
    new Promise((resolve) => setTimeout(resolve, millis)),

  borderColor: "#29292d",
  scrollbarColor: "grey #1a1a1e",
};
