import Query from './query';
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

function isInvalidQueryCombination(queries) {
  if (queries.length === 1) {
    return false;
  }

  return hasAnonymousQueries(queries) || hasDuplicateQueryNames(queries);
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
   * @param {...2} args Receives either a query instance, or a query callback or
   *                    a name and query callback.
   */
  addQuery(...args) {
    const query = extractQuery(this.typeBundle, ...args);

    if (isInvalidQueryCombination(this.queries.concat(query))) {
      throw new Error('All queries must be named on a multi-query document');
    }

    this.queries.push(query);
  }
}
