function throwTypeMismatch(expectedType) {
  throw new Error(`The default value is not of type ${expectedType}`);
}

function isFloat(floatValue) {
  const valueString = floatValue.toString().toLowerCase();

  return valueString.includes('.') || valueString.includes('e');
}

export default (type, value) => {
  if (type[type.length - 1] === '!') {
    throw new Error('You cannot use a default value when using a non-null type');
  }

  switch (type) {
    case 'String':
      if (typeof value !== 'string') {
        throwTypeMismatch(type);
      }
      break;

    case 'Boolean':
      if (typeof value !== 'boolean') {
        throwTypeMismatch(type);
      }
      break;

    case 'Int':
      if (typeof value !== 'number' || isFloat(value)) {
        throwTypeMismatch(type);
      }
      break;

    case 'Float':
      if (typeof value !== 'number') {
        throwTypeMismatch(type);
      }
      break;
  }
};
