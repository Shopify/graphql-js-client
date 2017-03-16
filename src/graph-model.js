export default class GraphModel {
  constructor(attrs) {
    this.attrs = attrs;

    Object.keys(this.attrs).filter((key) => {
      return !(key in this);
    }).forEach((key) => {
      let descriptor;

      if (attrs[key] === null) {
        descriptor = {
          get() {
            return null;
          }
        };
      } else {
        descriptor = {
          get() {
            return this.attrs[key].valueOf();
          }
        };
      }
      Object.defineProperty(this, key, descriptor);
    });
  }
}
