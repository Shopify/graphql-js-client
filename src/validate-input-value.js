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

        return valueString.includes('.') || valueString.includes('e');
      }

      const graphTypeToJSType = {
        String,
        Boolean,
        Int: Number,
        Float: Number
      };

      if (type[type.length - 1] === '!') {
        throw new Error('You cannot use a default value when using a non-null type');
      }

      if (graphTypeToJSType[type]) {
        if (!validateType(value, graphTypeToJSType[type])) {
          throwTypeMismatch(type);
        } else if (type === 'Int' && isFloat(value)) {
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
