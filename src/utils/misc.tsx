import { ISmartSize } from "../types";

const getSmartSize = (size: number): ISmartSize => {
  let finalSize: number = size;
  let factor: number = 0;
  while (finalSize >= 1024) {
    finalSize /= 1024;
    factor++;
  }
  return {
    size: Math.round(finalSize * 100) / 100,
    label: ["B", "K", "M", "G"][factor],
  };
};

export default getSmartSize;
