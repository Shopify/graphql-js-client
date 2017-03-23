import Document from './document';
import Query from './query';
import Mutation from './mutation';
import Operation from './operation';
import decode from './decode';
import ClassRegistry from './class-registry';
import httpFetcher from './http-fetcher';

export {default as GraphModel} from './graph-model';
export {ClassRegistry};
export {default as _enum} from './enum';
export {default as decode} from './decode';

function hasNextPage(paginatedModels) {
  return paginatedModels && paginatedModels.length && paginatedModels[paginatedModels.length - 1].hasNextPage;
}

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

  mutation(...args) {
    return new Mutation(this.typeBundle, ...args);
  }

  send(operationOrDocument, variableValues = null, otherProperties = null) {
    const graphQLParams = {query: operationOrDocument.toString()};

    if (variableValues) {
      graphQLParams.variables = variableValues;
    }

    Object.assign(graphQLParams, otherProperties);

    let operation;

    if (Operation.prototype.isPrototypeOf(operationOrDocument)) {
      operation = operationOrDocument;
    } else {
      const document = operationOrDocument;

      if (document.operations.length === 1) {
        operation = document.operations[0];
      } else if (otherProperties.operationName) {
        operation = document.operations.find((documentOperation) => documentOperation.name === otherProperties.operationName);
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

  fetchNextPage(nodeOrNodes, options) {
    let node;

    if (Array.isArray(nodeOrNodes)) {
      node = nodeOrNodes[nodeOrNodes.length - 1];
    } else {
      node = nodeOrNodes;
    }

    const [query, path] = node.nextPageQueryAndPath();

    return this.send(query, options).then((response) => {
      response.model = path.reduce((object, key) => {
        return object[key];
      }, response.model);

      return response;
    });
  }

  fetchAllPages(paginatedModels, {pageSize}) {
    if (hasNextPage(paginatedModels)) {
      return this.fetchNextPage(paginatedModels, {first: pageSize}).then(({model}) => {
        const pages = paginatedModels.concat(model);

        return this.fetchAllPages(pages, {pageSize});
      });
    }

    return Promise.resolve(paginatedModels);
  }
}
