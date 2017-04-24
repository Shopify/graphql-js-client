import GraphModel from './graph-model';

/**
 * A registry of classes used to serialize the response data. Uses {@link GraphModel} by default.
 */
export default class ClassRegistry {
  constructor() {
    this.classStore = {};
  }

  /**
   * Registers a class for a GraphQL type in the registry.
   *
   * @param {Class} constructor The constructor of the class.
   * @param {String} type The GraphQL type of the object to serialize into the class.
   */
  registerClassForType(constructor, type) {
    this.classStore[type] = constructor;
  }

  /**
   * Unregisters a class for a GraphQL type in the registry.
   *
   * @param {String} type The GraphQL type to unregister.
   */
  unregisterClassForType(type) {
    delete this.classStore[type];
  }

  /**
   * Returns the class for the given GraphQL type.
   *
   * @param {String} type The GraphQL type to look up.
   * @return {Class|GraphModel} The class for the given GraphQL type. Defaults to {@link GraphModel} if no class is registered for the GraphQL type.
   */
  classForType(type) {
    return this.classStore[type] || GraphModel;
  }
}
