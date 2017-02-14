import Operation from './operation';

export default class Mutation extends Operation {
  constructor(typeBundle, ...args) {
    super(typeBundle, 'mutation', ...args);
  }
}
