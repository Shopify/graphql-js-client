import assert from 'assert';

import join from '../src/join';

suite('Unit | join', () => {
  test('it joins fields with a single comma followed by a space', () => {

    assert.equal(join('query1', 'query2'), 'query1, query2');
  });
});
