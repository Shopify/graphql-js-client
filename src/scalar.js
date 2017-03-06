export default class Scalar {
  constructor(value) {
    this.value = value;
  }

  toString() {
    return this.value.toString();
  }

  valueOf() {
    return this.value.valueOf();
  }

  get unwrapped() {
    return this.value;
  }
}
