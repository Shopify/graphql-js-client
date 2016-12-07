export class VariableDefinition {
  constructor(name, type) {
    this.name = name;
    this.type = type;
    Object.freeze(this);
  }

  toInputValueString() {
    return `$${this.name}`;
  }

  toVariableDefinitionString() {
    return `$${this.name}:${this.type}`;
  }
}

export function isVariable(value) {
  return value instanceof VariableDefinition;
}

export default function variable(name, type) {
  return new VariableDefinition(name, type);
}
