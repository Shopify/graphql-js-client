import assert from 'assert';
import fetchMock from '/isomorphic-fetch-mock'; // eslint-disable-line import/no-unresolved
import httpFetcher from '../src/http-fetcher';

suite('http-fetcher-test', () => {
  setup(() => {
    fetchMock.mock('https://graphql.example.com', {data: {}});
  });

  teardown(() => {
    fetchMock.restore();
  });

  test('it makes a post request', () => {
    const request = {
      query: '{ shop { name } }',
      variables: {}
    };

    const fetcher = httpFetcher('https://graphql.example.com');

    return fetcher(request).then((data) => {
      const [url, {body, method, mode, headers}] = fetchMock.lastCall();

      assert.deepEqual(data, {data: {}});
      assert.equal(url, 'https://graphql.example.com');
      assert.equal(method, 'POST');
      assert.equal(mode, 'cors');

      assert.deepEqual(headers, {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      });

      assert.deepEqual(body, JSON.stringify({
        query: '{ shop { name } }',
        variables: {}
      }));
    });
  });

  test('it should alter the options but not overwrite defaults', () => {
    const request = {
      query: '{ shop { name } }',
      variables: {}
    };

    const fetcher = httpFetcher('https://graphql.example.com', {method: 'GET'});

    return fetcher(request).then(() => {
      const [_url, {method, mode}] = fetchMock.lastCall();

      assert.equal(method, 'GET');
      assert.equal(mode, 'cors');
    });
  });

  test('it should allow setting custom headers', () => {
    const request = {
      query: '{ shop { name } }',
      variables: {}
    };

    const customHeaders = {'X-API-KEY': '12345'};
    const fetcher = httpFetcher('https://graphql.example.com', {headers: customHeaders});

    return fetcher(request).then(() => {
      const [_url, {headers}] = fetchMock.lastCall();

      assert.deepEqual(headers, {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-API-KEY': '12345'
      });
    });
  });

  test('it should allow setting custom headers at request time', () => {
    const request = {
      query: '{ shop { name } }',
      variables: {}
    };
    const customHeaders = {'X-API-KEY': '12345'};
    const fetcher = httpFetcher('https://graphql.example.com', {headers: customHeaders});
    const requestTimeHeaders = {Authorization: 'abcde'};

    return fetcher(request, requestTimeHeaders).then(() => {
      const [_url, {headers}] = fetchMock.lastCall();

      assert.deepEqual(headers, {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...customHeaders,
        ...requestTimeHeaders
      });
    });
  });
});
