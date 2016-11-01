import {Enum} from './enum';

export default (value, expectedType) => {
  if (Enum.prototype.isPrototypeOf(value)) {
    return expectedType === Enum;
  }

  switch (typeof value) {
    case 'string':
      return expectedType === String;
    case 'number':
      return expectedType === Number;
    case 'boolean':
      return expectedType === Boolean;
    default:
      if (Array.isArray(value)) {
        return expectedType === Array;
      }

      return expectedType === Object;
  }
};
