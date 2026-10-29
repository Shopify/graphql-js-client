// GraphQL `Name` grammar, which every enum value must match:
// https://spec.graphql.org/October2021/#Name
const GRAPHQL_NAME = /^[_A-Za-z][_0-9A-Za-z]*$/;

export class Enum {

  /**
   * This constructor should not be invoked directly.
   * Use the factory function {@link Client#enum} to create an Enum.
   *
   * @param {String} key The key of the enum. Must be a valid GraphQL name, since it is
   *   written into the query document unquoted.
   * @throws {Error} If `key` is not a valid GraphQL name.
   */
  constructor(key) {
    if (!GRAPHQL_NAME.test(String(key))) {
      throw new Error(`Invalid enum key: ${JSON.stringify(key)}. Enum keys must match ${GRAPHQL_NAME}.`);
    }
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
