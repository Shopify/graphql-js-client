import join from './join';

export default class VariableDefinitions {
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
