import checkJSType from './check-js-type';

function isFloat(floatValue) {
  const valueString = floatValue.toString().toLowerCase();

  return valueString.includes('.') || valueString.includes('e');
}

export default {
  isString: (value) => {
    return checkJSType.isString(value);
  },

  isBoolean: (value) => {
    return checkJSType.isBoolean(value);
  },

  isInt: (value) => {
    return checkJSType.isNumber(value) && !isFloat(value);
  },

  isFloat: (value) => {
    return checkJSType.isNumber(value);
  }
};
