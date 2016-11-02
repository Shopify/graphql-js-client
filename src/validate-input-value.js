import checkGraphType from './check-graph-type';

export default (type, value) => {
  if (type[type.length - 1] === '!') {
    throw new Error('You cannot use a default value when using a non-null type');
  }

  if (!checkGraphType(value, type)) {
    throw new Error(`The default value is not of type ${type}`);
  }
};
