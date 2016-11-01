import validateType from './validate-type';

export default (type, value) => {
  try {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-inner-declarations
      function throwTypeMismatch(expectedType) {
        throw new Error(`The default value is not of type ${expectedType}`);
      }

      // eslint-disable-next-line no-inner-declarations
      function isFloat(floatValue) {
        const valueString = floatValue.toString().toLowerCase();

        return valueString.indexOf('.') > -1 || valueString.indexOf('e') > -1;
      }

      const graphTypeToJSType = {
        String,
        Boolean,
        Object,
        Int: Number,
        Float: Number,
        List: Array
      };

      if (type[type.length - 1] === '!') {
        throw new Error('You cannot use a default value when using a non-null type');
      }

      const typeWithoutNull = type.split('!').join('');

      if (graphTypeToJSType[typeWithoutNull]) {
        if (!validateType(value, graphTypeToJSType[typeWithoutNull])) {
          throwTypeMismatch(type);
        } else if (typeWithoutNull === 'Int' && isFloat(value)) {
          throwTypeMismatch(type);
        }
      }
    }
  } catch (error) {
    if (error.message !== 'process is not defined') {
      throw error;
    }
  }
};
