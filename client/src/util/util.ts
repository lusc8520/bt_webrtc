import { getRandomInt } from "../types.ts";

export const util = {
  wait: (millis: number) =>
    new Promise((resolve) => setTimeout(resolve, millis)),

  borderColor: "#29292d",
  scrollbarColor: "grey #1a1a1e",

  // https://stackoverflow.com/a/11410079/25311842
  clamp: (num: number, min: number, max: number) => {
    return num <= min ? min : num >= max ? max : num;
  },

  getRandomVector2: (max: number) => {
    return {
      x: getRandomInt(max),
      y: getRandomInt(max),
    };
  },
};
