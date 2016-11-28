import join from './join';

export default class QueryVariables {
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
