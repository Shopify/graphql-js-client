export default class Variable {
  constructor(name, type) {
    this.name = name;
    this.type = type;
  }

  get nameFormatted() {
    return `$${this.name}`;
  }

  toString() {
    return `${this.nameFormatted}:${this.type}`;
  }
}
