import Document from './document';
import Query from './query';
import decode from './decode';
import ClassRegistry from './class-registry';
import httpFetcher from './http-fetcher';

export {default as GraphModel} from './graph-model';
export {ClassRegistry};

export default class Client {
  constructor(typeBundle, {url, fetcherOptions, fetcher, registry = new ClassRegistry()}) {
    this.typeBundle = typeBundle;
    this.classRegistry = registry;

    if (url && fetcher) {
      throw new Error('Arguments not supported: supply either `url` and optional `fetcherOptions` OR use a `fetcher` function for further customization.');
    }

    if (url) {
      this.fetcher = httpFetcher(url, fetcherOptions);
    } else if (fetcher) {
      if (fetcherOptions) {
        throw new Error('Arguments not supported: when specifying your own `fetcher`, set options through it and not with `fetcherOptions`');
      }

      this.fetcher = fetcher;
    } else {
      throw new Error('Invalid arguments: one of `url` or `fetcher` is needed.');
    }
  }

  document(...args) {
    return new Document(this.typeBundle, ...args);
  }

  query(...args) {
    return new Query(this.typeBundle, ...args);
  }

  send(queryOrDocument, variableValues = null, otherProperties = null) {
    const graphQLParams = {query: queryOrDocument.toString()};

    if (variableValues) {
      graphQLParams.variables = variableValues;
    }

    Object.assign(graphQLParams, otherProperties);

    let operation;

    if (Query.prototype.isPrototypeOf(queryOrDocument)) {
      operation = queryOrDocument;
    } else {
      const document = queryOrDocument;

      if (document.queries.length === 1) {
        operation = document.queries[0];
      } else if (otherProperties.operationName) {
        // Note: We only support query operations, so that's what
        // we're searching for until there are other operations.
        operation = document.queries.find((query) => query.name === otherProperties.operationName);
      } else {
        throw new Error(`
          A document must contain exactly one operation, or an operationName
          must be specified. Example:

            client.send(document, null, {operationName: 'myFancyQuery'});
        `);
      }
    }

    return this.fetcher(graphQLParams).then((response) => {
      if (response.data) {
        response.model = decode(operation, response.data, {classRegistry: this.classRegistry});
      }

      return response;
    });
  }
}
