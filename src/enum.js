export default (key) => {
  // eslint-disable-next-line no-new-wrappers
  const anEnum = new String(key);

  anEnum.isEnum = true;

  return anEnum;
};
