export default function isObject(value) {
  return Boolean(value) && Object.prototype.toString.call(value.valueOf()) === '[object Object]';
}
