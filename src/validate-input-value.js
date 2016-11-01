import validateType from './validate-type';


function throwTypeMismatch(expectedType) {
  throw new Error(`The default value is not of type ${expectedType}`);
}

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

export default (type, value) => {
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
};
