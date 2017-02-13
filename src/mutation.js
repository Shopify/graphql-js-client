import SelectionSet from './selection-set';
import VariableDefinitions from './variable-definitions';
import parseArgs from './parse-args';

export default class Mutation {
  constructor(typeBundle, ...args) {
    const {name, variables, selectionSetCallback} = parseArgs(args);

    this.typeBundle = typeBundle;
    this.typeSchema = typeBundle.Mutation;
    this.name = name;
    this.variableDefinitions = new VariableDefinitions(variables);
    this.selectionSet = new SelectionSet(typeBundle, 'Mutation', selectionSetCallback);
    Object.freeze(this);
  }

  get isAnonymous() {
    return !this.name;
  }

  toString() {
    const nameString = (this.name) ? ` ${this.name}` : '';

    return `mutation${nameString}${this.variableDefinitions.toString()}${this.selectionSet.toString()}`;
  }
}
