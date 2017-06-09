/**
 * The base class used when deserializing response data.
 * Provides rich features, like functions to generate queries to refetch a node or fetch the next page.
 *
 * @class
 */
export default class GraphModel {

  /**
   * @param {Object} attrs Attributes on the GraphModel.
   */
  constructor(attrs) {
    this.attrs = attrs;

    Object.keys(this.attrs).filter((key) => {
      return !(key in this);
    }).forEach((key) => {
      let descriptor;

      if (attrs[key] === null) {
        descriptor = {
          enumerable: true,
          get() {
            return null;
          }
        };
      } else {
        descriptor = {
          enumerable: true,
          get() {
            return this.attrs[key].valueOf();
          }
        };
      }
      Object.defineProperty(this, key, descriptor);
    });
  }
}
