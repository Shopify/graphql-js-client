import assert from 'assert';

import ClassRegistry from '../src/class-registry';
import GraphModel from '../src/graph-model';

suite('Unit | GraphHelpers | ClassRegistry', () => {
  test('it returns the defined constructor fot the type', () => {

    const registry = new ClassRegistry();

    function MyClass(``) {}

    registry.registerClassForType(MyClass, 'SomeType');

    assert.equal(registry.classForType('SomeType'), MyClass);
  });

  test('it falls back to the GraphModel type when no types are available', () => {

    const registry = new ClassRegistry();

    assert.equal(registry.classForType('SomeType'), GraphModel);
  });

  test('it can unregister a class for a type', () => {

    const registry = new ClassRegistry();

    function MyClass() {}

    registry.registerClassForType(MyClass, 'SomeType');

    assert.equal(registry.classForType('SomeType'), MyClass);

    registry.unregisterClassForType('SomeType');

    assert.equal(registry.classForType('SomeType'), GraphModel);
  });
});
