import join from './join';
import schemaForType from './schema-for-type';
import formatArgs from './format-args';
import noop from './noop';

function getArgsAndCallback(paramArgsCallback) {
  let callback = noop;
  let args = {};

  if (paramArgsCallback.length === 1) {
    if (typeof paramArgsCallback[0] === 'function') {
      callback = paramArgsCallback[0];
    } else {
      args = paramArgsCallback[0];
    }
  } else if (paramArgsCallback.length === 2) {
    [args, callback] = paramArgsCallback;
  }

  return {args, callback};
}

class Field {
  constructor(name, args, selectionSet) {
    this.name = name;
    this.args = args;
    this.selectionSet = selectionSet;
  }
  toString() {
    return `${this.name}${formatArgs(this.args)}${this.selectionSet.toString()}`;
  }
}

class InlineFragment {
  constructor(typeName, selectionSet) {
    this.typeName = typeName;
    this.selectionSet = selectionSet;
  }
  toString() {
    return `... on ${this.typeName}${this.selectionSet.toString()}`;
  }
}


export default class SelectionSet {
  constructor(typeBundle, type) {
    if (typeof type === 'string') {
      this.typeSchema = schemaForType(typeBundle, type);
    } else {
      this.typeSchema = type;
    }
    this.typeBundle = typeBundle;
    this.selections = [];
  }

  hasSelectionWithName(name) {
    return this.selections.some((field) => {
      return field.name === name;
    });
  }

  toString() {
    if (this.typeSchema.kind === 'SCALAR') {
      return '';
    } else {
      const commaDelimitedSelections = join(this.selections.map((selection) => {
        return selection.toString();
      }));

      return ` { ${commaDelimitedSelections} }`;
    }
  }

  /**
   * will add a field to be queried based on a SelectionSet
   *
   * @param {String}    name The name of the field to add to the query
   * @param {Object}    [args] Arguments for the field to query
   * @param {SelectionSet} [selectionSet] [description]
   */
  addFieldFromSelectionSet(name, ...parameters) {
    let args;
    let selectionSet;

    if (parameters.length === 1) {
      selectionSet = parameters[0];
      args = {};
    } else {
      [args, selectionSet] = parameters;
    }

    if (!(selectionSet instanceof SelectionSet)) {
      throw new Error('You must pass in a SelectionSet');
    }

    const field = new Field(name, args, selectionSet);

    this.selections.push(field);
  }

  /**
   * will add a field to be queried to the current query node.
   *
   * @param {String}    name The name of the field to add to the query
   * @param {Object}    [args] Arguments for the field to query
   * @param {Function}  [callback] Callback which will return a new query node for the field added
   */
  addField(name, ...paramArgsCallback) {
    if (this.hasSelectionWithName(name)) {
      throw new Error(`The field '${name}' has already been added`);
    }

    const {args, callback} = getArgsAndCallback(paramArgsCallback);

    const fieldBaseType = schemaForType(this.typeBundle, this.typeSchema.fieldBaseTypes[name]);
    const selectionSet = new SelectionSet(this.typeBundle, fieldBaseType);

    callback(selectionSet);

    this.selections.push(new Field(name, args, selectionSet));
  }

  /**
   * will add a connection to be queried to the current query node.
   *
   * @param {String}    name The name of the connection to add to the query
   * @param {Object}    [args] Arguments for the connection query eg. { first: 10 }
   * @param {Function}  [callback] Callback which will return a new query node for the connection added
   */
  addConnection(name, ...paramArgsCallback) {
    const {args, callback} = getArgsAndCallback(paramArgsCallback);

    this.addField(name, args, (connection) => {
      connection.addField('pageInfo', {}, (pageInfo) => {
        pageInfo.addField('hasNextPage');
        pageInfo.addField('hasPreviousPage');
      });
      connection.addField('edges', {}, (edges) => {
        edges.addField('cursor');
        edges.addField('node', {}, callback);
      });
    });
  }

  addInlineFragmentOn(typeName, fieldTypeCb = noop) {
    const selectionSet = new SelectionSet(this.typeBundle, schemaForType(this.typeBundle, typeName));

    fieldTypeCb(selectionSet);
    this.selections.push(new InlineFragment(typeName, selectionSet));
  }
}
