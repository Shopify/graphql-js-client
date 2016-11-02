import checkGraphType from './check-graph-type';

export default (type, value) => {
  if (type[type.length - 1] === '!') {
    throw new Error('You cannot use a default value when using a non-null type');
  }

  let isValidType = true;

  switch (type) {
    case 'String':
      isValidType = checkGraphType.isString(value);
      break;

    case 'Boolean':
      isValidType = checkGraphType.isBoolean(value);
      break;

    case 'Int':
      isValidType = checkGraphType.isInt(value);
      break;

    case 'Float':
      isValidType = checkGraphType.isFloat(value);
      break;
  }

  if (!isValidType) {
    throw new Error(`The default value is not of type ${type}`);
  }
};
