import SelectionSet from './selection-set';
import join from './join';

function parseArgs(nameAndCallback) {
  let name;
  let variables;
  let selectionSetCallback;

  if (nameAndCallback.length === 3) {
    [name, variables, selectionSetCallback] = nameAndCallback;
  } else if (nameAndCallback.length === 2) {
    if (Object.prototype.toString.call(nameAndCallback[0]) === '[object String]') {
      name = nameAndCallback[0];
      variables = null;
    } else if (Array.isArray(nameAndCallback[0])) {
      variables = nameAndCallback[0];
      name = null;
    }

    selectionSetCallback = nameAndCallback[1];
  } else {
    selectionSetCallback = nameAndCallback[0];
    name = null;
  }

  return {name, variables, selectionSetCallback};
}

class VariableDefinitions {
  constructor(variableDefinitions) {
    this.variableDefinitions = variableDefinitions || [];
  }

  toString() {
    if (this.variableDefinitions.length === 0) {
      return '';
    }

    const variableDefinitionsStrings = this.variableDefinitions.map((variableDefinition) => {
      return variableDefinition.toVariableDefinitionString();
    });

    return ` (${join(variableDefinitionsStrings)}) `;
  }
}

export default class Query {
  constructor(typeBundle, ...nameAndCallback) {
    const {name, variables, selectionSetCallback} = parseArgs(nameAndCallback);

    this.typeBundle = typeBundle;
    this.selectionSet = new SelectionSet(typeBundle, 'QueryRoot');
    this.name = name;
    this.variableDefinitions = new VariableDefinitions(variables);
    selectionSetCallback(this.selectionSet);
  }

  get isAnonymous() {
    return !this.name;
  }

  toString() {
    const nameString = (this.name) ? ` ${this.name}` : '';

    return `query${nameString}${this.variableDefinitions.toString()}${this.selectionSet.toString()}`;
  }
}
