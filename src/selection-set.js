import deepFreezeCopyExcept from './deep-freeze-copy-except';
import join from './join';
import schemaForType from './schema-for-type';
import formatArgs from './format-args';
import noop from './noop';
import {isVariable} from './variable';
import Profiler from './profile-schema-usage';

const {trackTypeDependency, trackFieldDependency} = Profiler;

function parseFieldCreationArgs(creationArgs) {
  let callback = noop;
  let options = {};
  let selectionSet = null;

  if (creationArgs.length === 2) {
    if (typeof creationArgs[1] === 'function') {
      [options, callback] = creationArgs;
    } else {
      [options, selectionSet] = creationArgs;
    }
  } else if (creationArgs.length === 1) {
    // SelectionSet is defined before this function is called since it's
    // called by SelectionSet
    // eslint-disable-next-line no-use-before-define
    if (SelectionSet.prototype.isPrototypeOf(creationArgs[0])) {
      selectionSet = creationArgs[0];
    } else if (typeof creationArgs[0] === 'function') {
      callback = creationArgs[0];
    } else {
      options = creationArgs[0];
    }
  }

  return {options, selectionSet, callback};
}

const emptyArgs = Object.freeze({});

export class Field {

  /**
   * This constructor should not be invoked directly.
   * Fields are added to a selection by {@link SelectionSetBuilder#add}, {@link SelectionSetBuilder#addConnection}
   * and {@link SelectionSetBuilder#addInlineFragmentOn}.
   *
   * @param {String} name The name of the field.
   * @param {Object} [options] An options object containing:
   *   @param {Object} [options.args] Arguments for the field.
   *   @param {String} [options.alias] An alias for the field.
   * @param {SelectionSet} selectionSet The selection set on the field.
   */
  constructor(name, options, selectionSet) {
    this.name = name;
    this.alias = options.alias || null;
    this.responseKey = this.alias || this.name;
    this.args = (options.args ? deepFreezeCopyExcept(isVariable, options.args) : emptyArgs);
    this.selectionSet = selectionSet;
    Object.freeze(this);
  }

  /**
   * Returns the GraphQL query string for the Field (e.g. `catAlias: cat(size: 'small') { name }` or `name`).
   *
   * @return {String} The GraphQL query string for the Field.
   */
  toString() {
    const aliasPrefix = this.alias ? `${this.alias}: ` : '';

    return `${aliasPrefix}${this.name}${formatArgs(this.args)}${this.selectionSet}`;
  }
}

// This is an interface that defines a usage, and simplifies type checking
export class Spread {}

export class InlineFragment extends Spread {

  /**
   * This constructor should not be invoked directly.
   * Use the factory function {@link SelectionSetBuilder#addInlineFragmentOn} to create an InlineFragment.
   *
   * @param {String} typeName The type of the fragment.
   * @param {SelectionSet} selectionSet The selection set on the fragment.
   */
  constructor(typeName, selectionSet) {
    super();
    this.typeName = typeName;
    this.selectionSet = selectionSet;
    Object.freeze(this);
  }

  /**
   * Returns the GraphQL query string for the InlineFragment (e.g. `... on Cat { name }`).
   *
   * @return {String} The GraphQL query string for the InlineFragment.
   */
  toString() {
    return `... on ${this.typeName}${this.selectionSet}`;
  }
}

export class FragmentSpread extends Spread {

  /**
   * This constructor should not be invoked directly.
   * Use the factory function {@link Document#defineFragment} to create a FragmentSpread.
   *
   * @param {FragmentDefinition} fragmentDefinition The corresponding fragment definition.
   */
  constructor(fragmentDefinition) {
    super();
    this.name = fragmentDefinition.name;
    this.selectionSet = fragmentDefinition.selectionSet;
    Object.freeze(this);
  }

  /**
   * Returns the GraphQL query string for the FragmentSpread (e.g. `...catName`).
   *
   * @return {String} The GraphQL query string for the FragmentSpread.
   */
  toString() {
    return `...${this.name}`;
  }

  toDefinition() {
    // eslint-disable-next-line no-use-before-define
    return new FragmentDefinition(this.name, this.selectionSet.typeSchema.name, this.selectionSet);
  }
}

export class FragmentDefinition {

  /**
   * This constructor should not be invoked directly.
   * Use the factory function {@link Document#defineFragment} to create a FragmentDefinition on a {@link Document}.
   *
   * @param {String} name The name of the fragment definition.
   * @param {String} typeName The type of the fragment.
   */
  constructor(name, typeName, selectionSet) {
    this.name = name;
    this.typeName = typeName;
    this.selectionSet = selectionSet;
    this.spread = new FragmentSpread(this);
    Object.freeze(this);
  }

  /**
   * Returns the GraphQL query string for the FragmentDefinition (e.g. `fragment catName on Cat { name }`).
   *
   * @return {String} The GraphQL query string for the FragmentDefinition.
   */
  toString() {
    return `fragment ${this.name} on ${this.typeName} ${this.selectionSet}`;
  }
}

function selectionsHaveIdField(selections) {
  return selections.some((fieldOrFragment) => {
    if (Field.prototype.isPrototypeOf(fieldOrFragment)) {
      return fieldOrFragment.name === 'id';
    } else if (Spread.prototype.isPrototypeOf(fieldOrFragment) && fieldOrFragment.selectionSet.typeSchema.implementsNode) {
      return selectionsHaveIdField(fieldOrFragment.selectionSet.selections);
    }

    return false;
  });
}

function selectionsHaveTypenameField(selections) {
  return selections.some((fieldOrFragment) => {
    if (Field.prototype.isPrototypeOf(fieldOrFragment)) {
      return fieldOrFragment.name === '__typename';
    } else if (Spread.prototype.isPrototypeOf(fieldOrFragment) && fieldOrFragment.selectionSet.typeSchema.implementsNode) {
      return selectionsHaveTypenameField(fieldOrFragment.selectionSet.selections);
    }

    return false;
  });
}

function indexSelectionsByResponseKey(selections) {
  function assignOrPush(obj, key, value) {
    if (Array.isArray(obj[key])) {
      obj[key].push(value);
    } else {
      obj[key] = [value];
    }
  }
  const unfrozenObject = selections.reduce((acc, selection) => {
    if (selection.responseKey) {
      assignOrPush(acc, selection.responseKey, selection);
    } else {
      const responseKeys = Object.keys(selection.selectionSet.selectionsByResponseKey);

      responseKeys.forEach((responseKey) => {
        assignOrPush(acc, responseKey, selection);
      });
    }

    return acc;
  }, {});

  Object.keys(unfrozenObject).forEach((key) => {
    Object.freeze(unfrozenObject[key]);
  });

  return Object.freeze(unfrozenObject);
}

/**
 * Class that specifies the full selection of data to query.
 */
export default class SelectionSet {

  /**
   * This constructor should not be invoked directly. SelectionSets are created when building queries/mutations.
   *
   * @param {Object} typeBundle A set of ES6 modules generated by {@link https://github.com/Shopify/graphql-js-schema|graphql-js-schema}.
   * @param {(Object|String)} type The type of the current selection.
   * @param {Function} builderFunction Callback function used to build the SelectionSet.
   *   The callback takes a {@link SelectionSetBuilder} as its argument.
   */
  constructor(typeBundle, type, builderFunction) {

    if (typeof type === 'string') {
      this.typeSchema = schemaForType(typeBundle, type);
    } else {
      this.typeSchema = type;
    }

    trackTypeDependency(this.typeSchema.name);

    this.typeBundle = typeBundle;
    this.selections = [];
    if (builderFunction) {
      // eslint-disable-next-line no-use-before-define
      builderFunction(new SelectionSetBuilder(this.typeBundle, this.typeSchema, this.selections));
    }

    if (this.typeSchema.implementsNode || this.typeSchema.name === 'Node') {
      if (!selectionsHaveIdField(this.selections)) {
        this.selections.unshift(new Field('id', {}, new SelectionSet(typeBundle, 'ID')));
      }
    }

    if (this.typeSchema.kind === 'INTERFACE') {
      if (!selectionsHaveTypenameField(this.selections)) {
        this.selections.unshift(new Field('__typename', {}, new SelectionSet(typeBundle, 'String')));
      }
    }

    this.selectionsByResponseKey = indexSelectionsByResponseKey(this.selections);
    Object.freeze(this.selections);
    Object.freeze(this);
  }

  /**
   * Returns the GraphQL query string for the SelectionSet (e.g. `{ cat { name } }`).
   *
   * @return {String} The GraphQL query string for the SelectionSet.
   */
  toString() {
    if (this.typeSchema.kind === 'SCALAR' || this.typeSchema.kind === 'ENUM') {
      return '';
    } else {
      return ` { ${join(this.selections)} }`;
    }
  }
}

/**
 * Class used to help build a {@link SelectionSet}.
 */
class SelectionSetBuilder {

  /**
   * This constructor should not be invoked directly. SelectionSetBuilders are created when building queries/mutations.
   *
   * @param {Object} typeBundle A set of ES6 modules generated by {@link https://github.com/Shopify/graphql-js-schema|graphql-js-schema}.
   * @param {Object} typeSchema The schema object for the type of the current selection.
   * @param {Field[]} selections The fields on the current selection.
   */
  constructor(typeBundle, typeSchema, selections) {
    this.typeBundle = typeBundle;
    this.typeSchema = typeSchema;
    this.selections = selections;
  }

  hasSelectionWithResponseKey(responseKey) {
    return this.selections.some((field) => {
      return field.responseKey === responseKey;
    });
  }

  /**
   * Adds a field to be queried on the current selection.
   *
   * @example
   * client.query((root) => {
   *   root.add('cat', {args: {id: '123456'}, alias: 'meow'}, (cat) => {
   *     cat.add('name');
   *   });
   * });
   *
   * @param {SelectionSet|String} selectionOrFieldName The selection or name of the field to add.
   * @param {Object} [options] Options on the query including:
   *   @param {Object} [options.args] Arguments on the query (e.g. `{id: '123456'}`).
   *   @param {String} [options.alias] Alias for the field being added.
   * @param {Function|SelectionSet} [callbackOrSelectionSet] Either a callback which will be used to create a new {@link SelectionSet}, or an existing {@link SelectionSet}.
   */
  add(selectionOrFieldName, ...rest) {
    let selection;

    if (Object.prototype.toString.call(selectionOrFieldName) === '[object String]') {
      trackFieldDependency(this.typeSchema.name, selectionOrFieldName);

      selection = this.field(selectionOrFieldName, ...rest);
    } else {
      if (Field.prototype.isPrototypeOf(selectionOrFieldName)) {
        trackFieldDependency(this.typeSchema.name, selectionOrFieldName.name);
      }

      selection = selectionOrFieldName;
    }

    if (selection.responseKey && this.hasSelectionWithResponseKey(selection.responseKey)) {
      throw new Error(`The field name or alias '${selection.responseKey}' has already been added.`);
    }
    this.selections.push(selection);
  }

  field(name, ...creationArgs) {
    const parsedArgs = parseFieldCreationArgs(creationArgs);
    const {options, callback} = parsedArgs;
    let {selectionSet} = parsedArgs;

    if (!selectionSet) {
      if (!this.typeSchema.fieldBaseTypes[name]) {
        throw new Error(`No field of name "${name}" found on type "${this.typeSchema.name}" in schema`);
      }

      const fieldBaseType = schemaForType(this.typeBundle, this.typeSchema.fieldBaseTypes[name]);

      selectionSet = new SelectionSet(this.typeBundle, fieldBaseType, callback);
    }

    return new Field(name, options, selectionSet);
  }

  /**
   * Creates an inline fragment.
   *
   * @access private
   * @param {String} typeName The type  the inline fragment.
   * @param {Function|SelectionSet}  [callbackOrSelectionSet] Either a callback which will be used to create a new {@link SelectionSet}, or an existing {@link SelectionSet}.
   * @return {InlineFragment} An inline fragment.
   */
  inlineFragmentOn(typeName, builderFunctionOrSelectionSet = noop) {
    let selectionSet;

    if (SelectionSet.prototype.isPrototypeOf(builderFunctionOrSelectionSet)) {
      selectionSet = builderFunctionOrSelectionSet;
    } else {
      selectionSet = new SelectionSet(
        this.typeBundle,
        schemaForType(this.typeBundle, typeName),
        builderFunctionOrSelectionSet
      );
    }

    return new InlineFragment(typeName, selectionSet);
  }

  /**
   * Adds a field to be queried on the current selection.
   *
   * @access private
   * @param {String}    name The name of the field to add to the query.
   * @param {Object} [options] Options on the query including:
   *   @param {Object} [options.args] Arguments on the query (e.g. `{id: '123456'}`).
   *   @param {String} [options.alias] Alias for the field being added.
   * @param {Function}  [callback] Callback which will be used to create a new {@link SelectionSet} for the field added.
   */
  addField(name, ...creationArgs) {
    this.add(name, ...creationArgs);
  }

  /**
   * Adds a connection to be queried on the current selection.
   * This adds all the fields necessary for pagination.
   *
   * @example
   * client.query((root) => {
   *   root.add('cat', (cat) => {
   *     cat.addConnection('friends', {args: {first: 10}, alias: 'coolCats'}, (friends) => {
   *       friends.add('name');
   *     });
   *   });
   * });
   *
   * @param {String}    name The name of the connection to add to the query.
   * @param {Object} [options] Options on the query including:
   *   @param {Object} [options.args] Arguments on the query (e.g. `{first: 10}`).
   *   @param {String} [options.alias] Alias for the field being added.
   * @param {Function|SelectionSet}  [callbackOrSelectionSet] Either a callback which will be used to create a new {@link SelectionSet}, or an existing {@link SelectionSet}.
   */
  addConnection(name, ...creationArgs) {
    const {options, callback, selectionSet} = parseFieldCreationArgs(creationArgs);

    this.add(name, options, (connection) => {
      connection.add('pageInfo', {}, (pageInfo) => {
        pageInfo.add('hasNextPage');
        pageInfo.add('hasPreviousPage');
      });
      connection.add('edges', {}, (edges) => {
        edges.add('cursor');
        edges.addField('node', {}, (selectionSet || callback)); // This is bad. Don't do this
      });
    });
  }

  /**
   * Adds an inline fragment on the current selection.
   *
   * @example
   * client.query((root) => {
   *   root.add('animal', (animal) => {
   *     animal.addInlineFragmentOn('cat', (cat) => {
   *       cat.add('name');
   *     });
   *   });
   * });
   *
   * @param {String} typeName The name of the type of the inline fragment.
   * @param {Function|SelectionSet}  [callbackOrSelectionSet] Either a callback which will be used to create a new {@link SelectionSet}, or an existing {@link SelectionSet}.
   */
  addInlineFragmentOn(typeName, fieldTypeCb = noop) {
    this.add(this.inlineFragmentOn(typeName, fieldTypeCb));
  }

  /**
   * Adds a fragment spread on the current selection.
   *
   * @example
   * client.query((root) => {
   *   root.addFragment(catFragmentSpread);
   * });
   *
   * @param {FragmentSpread} fragmentSpread The fragment spread to add.
   */
  addFragment(fragmentSpread) {
    this.add(fragmentSpread);
  }
}
