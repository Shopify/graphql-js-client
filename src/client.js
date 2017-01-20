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

  send(query, variableValues = null, otherProperties = null) {
    const graphQLParams = {query: query.toString()};

    if (variableValues) {
      graphQLParams.variables = variableValues;
    }

    Object.assign(graphQLParams, otherProperties);

    return this.fetcher(graphQLParams).then((response) => {
      if (response.data) {
        response.model = decode(query, response.data, {classRegistry: this.classRegistry});
      }

      return response;
    });
  }
}
