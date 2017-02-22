import join from './join';
import SelectionSet from './selection-set';
import schemaForType from './schema-for-type';

function parseArgs(args) {
  let name;
  let variables;
  let selectionSetCallback;

  if (args.length === 3) {
    [name, variables, selectionSetCallback] = args;
  } else if (args.length === 2) {
    if (Object.prototype.toString.call(args[0]) === '[object String]') {
      name = args[0];
      variables = null;
    } else if (Array.isArray(args[0])) {
      variables = args[0];
      name = null;
    }

    selectionSetCallback = args[1];
  } else {
    selectionSetCallback = args[0];
    name = null;
  }

  return {name, variables, selectionSetCallback};
}

class VariableDefinitions {
  constructor(variableDefinitions) {
    this.variableDefinitions = variableDefinitions ? [...variableDefinitions] : [];
    Object.freeze(this.variableDefinitions);
    Object.freeze(this);
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

export default class Operation {
  constructor(typeBundle, operationType, ...args) {
    const {name, variables, selectionSetCallback} = parseArgs(args);

    this.typeBundle = typeBundle;
    this.name = name;
    this.variableDefinitions = new VariableDefinitions(variables);
    this.operationType = operationType;
    if (operationType === 'query') {
      this.selectionSet = new SelectionSet(typeBundle, typeBundle.queryType, selectionSetCallback);
      this.typeSchema = schemaForType(typeBundle, typeBundle.queryType);
    } else {
      this.selectionSet = new SelectionSet(typeBundle, typeBundle.mutationType, selectionSetCallback);
      this.typeSchema = schemaForType(typeBundle, typeBundle.mutationType);
    }
    Object.freeze(this);
  }

  get isAnonymous() {
    return !this.name;
  }

  toString() {
    const nameString = (this.name) ? ` ${this.name}` : '';

    return `${this.operationType}${nameString}${this.variableDefinitions.toString()}${this.selectionSet.toString()}`;
  }
}
