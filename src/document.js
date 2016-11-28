import Query from './query';
import Mutation from './mutation';
import join from './join';

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

function extractMutation(typeBundle, ...args) {
  if (Mutation.prototype.isPrototypeOf(args[0])) {
    return args[0];
  }

  return new Mutation(typeBundle, ...args);
}

function isInvalidQueryCombination(queries) {
  if (queries.length === 1) {
    return false;
  }

  return hasAnonymousQueries(queries) || hasDuplicateQueryNames(queries);
}

function validateQueries(queries) {
  if (isInvalidQueryCombination(queries)) {
    throw new Error('All queries must be named with unique names in a multi-query document');
  }
}

export default class Document {
  constructor(typeBundle) {
    this.typeBundle = typeBundle;
    this.queries = [];
  }

  toString() {
    return join(this.queries.map((query) => query.toString()));
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

    validateQueries(this.queries.concat(query));

    this.queries.push(query);
  }

  addMutation(...args) {
    const query = extractMutation(this.typeBundle, ...args);

    validateQueries(this.queries.concat(query));

    this.queries.push(query);
  }
}
