const objectToString = Object.prototype.toString;

export default function isObject(value) {
  return objectToString.call(value) === '[object Object]';
}
