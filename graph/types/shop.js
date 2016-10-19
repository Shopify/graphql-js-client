
const Shop = {
  "name": "Shop",
  "kind": "OBJECT",
  "scalars": {
    "description": {
      "type": "String",
      "kind": "SCALAR",
      "isList": false,
      "args": []
    },
    "moneyFormat": {
      "type": "String",
      "kind": "SCALAR",
      "isList": false,
      "args": []
    },
    "name": {
      "type": "String",
      "kind": "SCALAR",
      "isList": false,
      "args": []
    }
  },
  "objects": {
    "billingAddress": {
      "type": "Address",
      "kind": "OBJECT",
      "isList": false,
      "args": []
    },
    "primaryDomain": {
      "type": "Domain",
      "kind": "OBJECT",
      "isList": false,
      "args": []
    }
  },
  "connections": {
    "collections": {
      "type": "CollectionConnection",
      "kind": "OBJECT",
      "isList": false,
      "args": ["first", "after", "sortKey", "reverse", "query"]
    },
    "products": {
      "type": "ProductConnection",
      "kind": "OBJECT",
      "isList": false,
      "args": ["first", "after", "sortKey", "reverse", "query"]
    }
  },
  "implementsNode": false
};
export default Object.freeze(Shop);