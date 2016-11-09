import SelectionSet from './selection-set';
import QueryVariables from './query-variables';
import parseConstructorArgs from './query-parse-constructor-args';

export default class Mutation {
  constructor(typeBundle, ...args) {
    const {name, variables, selectionSetCallback} = parseConstructorArgs(args);

    this.typeBundle = typeBundle;
    this.selectionSet = new SelectionSet(typeBundle, 'Mutation');
    this.name = name;
    this.queryVariables = new QueryVariables(variables);
    selectionSetCallback(this.selectionSet);
  }

  get isAnonymous() {
    return !this.name;
  }

  toString() {
    const nameString = (this.name) ? ` ${this.name}` : '';

    return `mutation${nameString}${this.queryVariables.toString()}${this.selectionSet.toString()}`;
  }
}
