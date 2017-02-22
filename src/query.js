import Operation from './operation';

export default class Query extends Operation {
  constructor(typeBundle, ...args) {
    super(typeBundle, 'query', ...args);
  }
}
