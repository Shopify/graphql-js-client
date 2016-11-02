function check(value, expect) {
  return Object.prototype.toString.call(value) === expect;
}

export default {
  is: (value, classType) => {
    return classType.prototype.isPrototypeOf(value);
  },

  isString: (value) => {
    return check(value, '[object String]');
  },

  isBoolean: (value) => {
    return check(value, '[object Boolean]');
  },

  isNumber: (value) => {
    return check(value, '[object Number]');
  },

  isArray: (value) => {
    return check(value, '[object Array]');
  },

  isObject: (value) => {
    return check(value, '[object Object]');
  },

  isNull: (value) => {
    return value === null;
  },

  isUndefined: (value) => {
    // eslint-disable-next-line no-undefined
    return value === undefined;
  }
};
