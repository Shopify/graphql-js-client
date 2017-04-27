import Query from './query';
import Mutation from './mutation';
import Operation from './operation';
import join from './join';
import SelectionSet, {FragmentDefinition} from './selection-set';

function isAnonymous(operation) {
  return operation.isAnonymous;
}

function hasAnonymousOperations(operations) {
  return operations.some(isAnonymous);
}

function hasDuplicateOperationNames(operations) {
  const names = operations.map((operation) => operation.name);

  return names.reduce((hasDuplicates, name, index) => {
    return hasDuplicates || names.indexOf(name) !== index;
  }, false);
}

function extractOperation(typeBundle, operationType, ...args) {
  if (Operation.prototype.isPrototypeOf(args[0])) {
    return args[0];
  }

  if (operationType === 'query') {
    return new Query(typeBundle, ...args);
  } else {
    return new Mutation(typeBundle, ...args);
  }
}

function isInvalidOperationCombination(operations) {
  if (operations.length === 1) {
    return false;
  }

  return hasAnonymousOperations(operations) || hasDuplicateOperationNames(operations);
}

function fragmentNameIsNotUnique(existingDefinitions, name) {
  return existingDefinitions.some((definition) => (definition.name === name));
}

export default class Document {
  constructor(typeBundle) {
    this.typeBundle = typeBundle;
    this.definitions = [];
  }

  toString() {
    return join(this.definitions);
  }

  addOperation(operationType, ...args) {
    const operation = extractOperation(this.typeBundle, operationType, ...args);

    if (isInvalidOperationCombination(this.operations.concat(operation))) {
      throw new Error('All operations must be uniquely named on a multi-operation document');
    }

    this.definitions.push(operation);
  }

  /**
   * will add a query to the document
   *
   * @param {Query|String} [query|queryName] Either an instance of a query
   * object, or the name of a query. Both are optional.
   * @param {Function} [callback] The query builder callback. If a query
   * instance is passed, this callback will be ignored.
   */
  addQuery(...args) {
    this.addOperation('query', ...args);
  }

  /**
   * will add a mutation to the document
   *
   * @param {Mutation|String} [mutation|mutationName] Either an instance of a mutation
   * object, or the name of a mutation. Both are optional.
   * @param {Function} [callback] The mutation builder callback. If a mutation
   * instance is passed, this callback will be ignored.
   */
  addMutation(...args) {
    this.addOperation('mutation', ...args);
  }

  defineFragment(name, onType, builderFunction) {
    if (fragmentNameIsNotUnique(this.fragmentDefinitions, name)) {
      throw new Error('All fragments must be uniquely named on a multi-fragment document');
    }

    const selectionSet = new SelectionSet(this.typeBundle, onType, builderFunction);
    const fragment = new FragmentDefinition(name, onType, selectionSet);

    this.definitions.push(fragment);

    return fragment.spread;
  }

  get operations() {
    return this.definitions.filter((definition) => Operation.prototype.isPrototypeOf(definition));
  }

  get fragmentDefinitions() {
    return this.definitions.filter((definition) => FragmentDefinition.prototype.isPrototypeOf(definition));
  }
}
