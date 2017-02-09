import Query from './query';
import join from './join';
import SelectionSet, {FragmentDefinition} from './selection-set';

function isAnonymous(query) {
  return query.isAnonymous;
}

function hasAnonymousQueries(queries) {
  return queries.some(isAnonymous);
}

function hasDuplicateQueryNames(queries) {
  const names = queries.map((query) => query.name.toString());

  return names.reduce((hasDuplicates, name, index) => {
    return hasDuplicates || names.indexOf(name) !== index;
  }, false);
}

function extractQuery(typeBundle, ...args) {
  if (Query.prototype.isPrototypeOf(args[0])) {
    return args[0];
  }

  return new Query(typeBundle, ...args);
}

function isInvalidQueryCombination(queries) {
  if (queries.length === 1) {
    return false;
  }

  return hasAnonymousQueries(queries) || hasDuplicateQueryNames(queries);
}

function fragmentNameIsNotUnique(existingDefinitions, name) {
  return existingDefinitions.some((definition) => (definition.name === name));
}

export default class Document {
  constructor(typeBundle) {
    this.typeBundle = typeBundle;
    this.definitions = [];
  }

  toString() {
    return join(this.definitions.map((definition) => definition.toString()));
  }

  /**
   * will add a query to the document
   *
   * @param {TypeBundle} typeBundle The bundle of all supported types.
   * @param {Query|String} [query|queryName] Either an instance of a query
   * object, or the name of a query. Both are optional.
   * @param {Function} [callback] The query builder callback. If a query
   * instance is passed, this callback will be ignored.
   */
  addQuery(...args) {
    const query = extractQuery(this.typeBundle, ...args);

    if (isInvalidQueryCombination(this.queries.concat(query))) {
      throw new Error('All queries must be named on a multi-query document');
    }

    this.definitions.push(query);
  }

  defineFragment(name, onType, builderFunction) {
    if (fragmentNameIsNotUnique(this.fragmentDefinitions, name)) {
      throw new Error('All queries must be named on a multi-query document');
    }

    const selectionSet = new SelectionSet(this.typeBundle, onType, builderFunction);
    const fragment = new FragmentDefinition(name, onType, selectionSet);

    this.definitions.push(fragment);

    return fragment.spread;
  }

  get queries() {
    return this.definitions.filter((definition) => Query.prototype.isPrototypeOf(definition));
  }

  get fragmentDefinitions() {
    return this.definitions.filter((definition) => FragmentDefinition.prototype.isPrototypeOf(definition));
  }
}
