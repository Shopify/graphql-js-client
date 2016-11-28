import Document from './document';
import Query from './query';
import deserializeObject from './deserialize-object';

export default class Client {
  static defaultFetcher(url, fetchOptionOverrides = null) {
    return function fetcher(graphQLParams) {
      return fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify(graphQLParams),
        ...fetchOptionOverrides
      }).then((response) => response.json());
    };
  }

  constructor(typeBundle, urlOrFetcherFunction, ...rest) {
    this.typeBundle = typeBundle;
    if (Object.prototype.toString.call(urlOrFetcherFunction) === '[object Function]') {
      this.fetcher = urlOrFetcherFunction;
    } else {
      this.fetcher = this.constructor.defaultFetcher(urlOrFetcherFunction, ...rest);
    }
  }

  document(...args) {
    return new Document(this.typeBundle, ...args);
  }

  query(...args) {
    return new Query(this.typeBundle, ...args);
  }

  send(query, variableValues = null, otherProperties = null) {
    const graphQLParams = {query: query.toString()};

    if (variableValues) {
      graphQLParams.variables = variableValues;
    }
    Object.assign(graphQLParams, otherProperties);

    return this.fetcher(graphQLParams).then((response) => {
      if (response.data) {
        response.model = deserializeObject(response.data, query.selectionSet);
      }

      return response;
    });
  }
}
