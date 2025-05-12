import { RefObject, useEffect, useState } from "react";

export function useHover(ref: RefObject<HTMLElement | null>) {
  const [value, setValue] = useState(false);

  function mouseEnter() {
    setValue(true);
  }

  function mouseLeave() {
    setValue(false);
  }

  useEffect(() => {
    const element = ref.current;
    if (element === null) return;
    element.onmouseenter = mouseEnter;
    element.onmouseleave = mouseLeave;

    return () => {
      element.onmouseleave = null;
      element.onmouseleave = null;
    };
  }, []);
  return value;
}
