export class VariableDefinition {
  constructor(name, type) {
    this.name = name;
    this.type = type;
  }

  toInputValueString() {
    return `$${this.name}`;
  }

  toVariableDefinitionString() {
    return `$${this.name}:${this.type}`;
  }
}

export default function variable(name, type) {
  return new VariableDefinition(name, type);
}
