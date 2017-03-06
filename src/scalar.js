export default class Scalar {
  constructor(value) {
    this.value = value;
  }

  toString() {
    return this.value.toString();
  }

  valueOf() {
    return this.value ? this.value.valueOf() : this.value;
  }

  get unwrapped() {
    return this.value;
  }
}
