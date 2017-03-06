export default function isValue(arg) {
  return Object.prototype.toString.call(arg) !== '[object Null]' && Object.prototype.toString.call(arg) !== '[object Undefined]';
}
