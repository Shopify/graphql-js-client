import SelectionSet from './selection-set';
import QueryVariables from './query-variables';
import parseConstructorArgs from './query-parse-constructor-args';

export default class Query {
  constructor(typeBundle, ...args) {
    const {name, variables, selectionSetCallback} = parseConstructorArgs(args);

    this.typeBundle = typeBundle;
    this.selectionSet = new SelectionSet(typeBundle, 'QueryRoot');
    this.name = name;
    this.queryVariables = new QueryVariables(variables);
    selectionSetCallback(this.selectionSet);
  }

  get isAnonymous() {
    return !this.name;
  }

  toString() {
    const nameString = (this.name) ? ` ${this.name}` : '';

    return `query${nameString}${this.queryVariables.toString()}${this.selectionSet.toString()}`;
  }
}
