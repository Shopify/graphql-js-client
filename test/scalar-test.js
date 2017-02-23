import assert from 'assert';
import Scalar from '../src/scalar';

suite('scalar-test', () => {
  test('numbers behave like numbers', () => {
    const number = new Scalar(1);

    assert.equal(number, 1);
    assert.equal(number + 1, 2);
    assert.equal(number / 2, 0.5);
    assert.equal(`number: ${number}`, 'number: 1');
  });

  test('strings behave like strings', () => {
    const string = new Scalar('hello');

    assert.equal(string, 'hello');
    assert.ok(isNaN(string / 1));
    assert(`${string} world`, 'hello world');
  });

  test('values can be unwrapped', () => {
    const string = new Scalar('hello');
    const number = new Scalar(1);

    assert.strictEqual(string.unwrapped, 'hello');
    assert.strictEqual(number.unwrapped, 1);
  });
});
