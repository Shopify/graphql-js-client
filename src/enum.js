export class Enum {

  /**
   * This constructor should not be invoked directly.
   * Use the factory function {@link Client#enum} to create an Enum.
   *
   * @param {String} key The key of the enum.
   */
  constructor(key) {
    this.key = key;
  }

  /**
   * Returns the GraphQL query string for the enum (e.g. `enumKey`).
   *
   * @return {String} The GraphQL query string for the enum.
   */
  toString() {
    return this.key;
  }

  valueOf() {
    return this.key.valueOf();
  }
}

export default (key) => {
  return new Enum(key);
};
