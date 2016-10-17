import assert from 'assert';
import ClassTwo from '../src/class-two';

suite('This is a different test', () => {
  test('It should do something', () => {
    assert.ok(ClassTwo, "It's good");
  });
});
