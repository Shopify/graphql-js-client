import check from './check-js-type';
import {Enum} from './enum';

function isFloat(floatValue) {
  const valueString = floatValue.toString().toLowerCase();

  return valueString.includes('.') || valueString.includes('e');
}

export default (value, type) => {
  switch (type) {
    case 'String':
      return check.isString(value);

    case 'Boolean':
      return check.isBoolean(value);

    case 'Int':
      return check.isNumber(value) && !isFloat(value);

    case 'Float':
      return check.isNumber(value);

    default:
      // Replace with correct checking for lists
      if (type.includes('[') && type.includes(']')) {
        return check.isArray(value);
      // Replace these with comparing types from the typeBundle
      } else if (type.includes('Enum')) {
        return check.is(value, Enum);
      } else if (type === 'InputObject') {
        return true;
      }

      return false;
  }
};
