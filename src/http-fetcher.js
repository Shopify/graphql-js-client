export default function httpFetcher(url, options = {}) {
  return function fetcher(graphQLParams) {
    return fetch(url, {
      body: JSON.stringify(graphQLParams),
      method: 'POST',
      mode: 'cors',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers
      }
    }).then((response) => response.json());
  };
}
