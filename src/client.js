import Document from './document';
import Query from './query';
import deserializeObject from './deserialize-object';

export default class Client {
  static defaultFetcher(url) {
    return function fetcher(graphQLParams) {
      return fetch(url, { // eslint-disable-line no-undef
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(graphQLParams)
      }).then((response) => response.json());
    };
  }

  constructor(typeBundle, urlOrFetcherFunction) {
    this.typeBundle = typeBundle;
    if (Object.prototype.toString.call(urlOrFetcherFunction) === '[object Function]') {
      this.fetcher = urlOrFetcherFunction;
    } else {
      this.fetcher = this.constructor.defaultFetcher(urlOrFetcherFunction);
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

    return this.fetcher(graphQLParams).then((response) => {
      if (response.data) {
        response.model = deserializeObject(this.typeBundle, response.data, 'QueryRoot');
      }

      return response;
    });
  }
}
