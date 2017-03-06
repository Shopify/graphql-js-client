import deepFreezeCopyExcept from './deep-freeze-copy-except';
import join from './join';
import schemaForType from './schema-for-type';
import formatArgs from './format-args';
import noop from './noop';
import {isVariable} from './variable';
import trackTypeDependency from './track-type-dependency';

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
  constructor(name, options, selectionSet) {
    this.name = name;
    this.alias = options.alias || null;
    this.responseKey = this.alias || this.name;
    this.args = (options.args ? deepFreezeCopyExcept(isVariable, options.args) : emptyArgs);
    this.selectionSet = selectionSet;
    Object.freeze(this);
  }
  toString() {
    const aliasPrefix = this.alias ? `${this.alias}: ` : '';

    return `${aliasPrefix}${this.name}${formatArgs(this.args)}${this.selectionSet}`;
  }
}

// This is an interface that defines a usage, and simplifies type checking
export class Spread {}

export class InlineFragment extends Spread {
  constructor(typeName, selectionSet) {
    super();
    this.typeName = typeName;
    this.selectionSet = selectionSet;
    Object.freeze(this);
  }
  toString() {
    return `... on ${this.typeName}${this.selectionSet}`;
  }
}

export class FragmentSpread extends Spread {
  constructor(fragmentDefinition) {
    super();
    this.name = fragmentDefinition.name;
    this.selectionSet = fragmentDefinition.selectionSet;
    Object.freeze(this);
  }

  toString() {
    return `...${this.name}`;
  }
}

export class FragmentDefinition {
  constructor(name, typeName, selectionSet) {
    this.name = name;
    this.typeName = typeName;
    this.selectionSet = selectionSet;
    this.spread = new FragmentSpread(this);
    Object.freeze(this);
  }

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

export default class SelectionSet {
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

  toString() {
    if (this.typeSchema.kind === 'SCALAR' || this.typeSchema.kind === 'ENUM') {
      return '';
    } else {
      return ` { ${join(this.selections)} }`;
    }
  }
}

class SelectionSetBuilder {
  constructor(typeBundle, typeSchema, selections) {
    this.typeBundle = typeBundle;
    this.typeSchema = typeSchema;
    this.selections = selections;
  }

  hasSelectionWithName(name) {
    return this.selections.some((field) => {
      return field.name === name;
    });
  }

  add(selectionOrFieldName, ...rest) {
    let selection;

    if (Object.prototype.toString.call(selectionOrFieldName) === '[object String]') {
      selection = this.field(selectionOrFieldName, ...rest);
    } else {
      selection = selectionOrFieldName;
    }

    if (selection.name && this.hasSelectionWithName(selection.name)) {
      throw new Error(`The field '${selection.name}' has already been added`);
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
   * will add a field to be queried to the current query node.
   *
   * @param {String}    name The name of the field to add to the query
   * @param {Object}    [args] Arguments for the field to query
   * @param {Function}  [callback] Callback which will return a new query node for the field added
   */
  addField(name, ...creationArgs) {
    this.add(name, ...creationArgs);
  }

  /**
   * will add a connection to be queried to the current query node.
   *
   * @param {String}    name The name of the connection to add to the query
   * @param {Object}    [args] Arguments for the connection query eg. { first: 10 }
   * @param {Function|SelectionSet}  [callback|selectionSet] Either pass a callback which will return a new
   *                                                         SelectionSet. Or pass an existing SelectionSet.
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

  addInlineFragmentOn(typeName, fieldTypeCb = noop) {
    this.add(this.inlineFragmentOn(typeName, fieldTypeCb));
  }

  addFragment(fragmentSpread) {
    this.add(fragmentSpread);
  }
}
