export const escapeRegex = (text: string) => {
  const result: string = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return result;
};
