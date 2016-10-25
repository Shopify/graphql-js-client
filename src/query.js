import SelectionSet from './selection-set';

export default class Query {
  constructor(typeBundle, selectionSetCallback) {
    this.typeBundle = typeBundle;
    this.selectionSet = new SelectionSet(typeBundle, 'QueryRoot');
    selectionSetCallback(this.selectionSet);
  }

  toString() {
    return `query${this.selectionSet.toString()}`;
  }
}
