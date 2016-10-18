
const Product = {
  "name": "Product",
  "kind": "OBJECT",
  "scalars": {
    "createdAt": {
      "type": "DateTime",
      "kind": "SCALAR",
      "isList": false,
      "args": []
    },
    "handle": {
      "type": "String",
      "kind": "SCALAR",
      "isList": false,
      "args": []
    },
    "id": {
      "type": "ID",
      "kind": "SCALAR",
      "isList": false,
      "args": []
    },
    "productType": {
      "type": "String",
      "kind": "SCALAR",
      "isList": false,
      "args": []
    },
    "publishedAt": {
      "type": "DateTime",
      "kind": "SCALAR",
      "isList": false,
      "args": []
    },
    "tags": {
      "type": "String",
      "kind": "SCALAR",
      "isList": true,
      "args": []
    },
    "title": {
      "type": "String",
      "kind": "SCALAR",
      "isList": false,
      "args": []
    },
    "updatedAt": {
      "type": "DateTime",
      "kind": "SCALAR",
      "isList": false,
      "args": []
    },
    "vendor": {
      "type": "String",
      "kind": "SCALAR",
      "isList": false,
      "args": []
    }
  },
  "objects": {
    "options": {
      "type": "ProductOption",
      "kind": "OBJECT",
      "isList": true,
      "args": ["first"]
    }
  },
  "connections": {
    "collections": {
      "type": "CollectionConnection",
      "kind": "OBJECT",
      "isList": false,
      "args": ["first", "after", "reverse"]
    },
    "images": {
      "type": "ImageConnection",
      "kind": "OBJECT",
      "isList": false,
      "args": ["first", "after", "reverse", "maxWidth", "maxHeight", "crop", "scale"]
    },
    "variants": {
      "type": "ProductVariantConnection",
      "kind": "OBJECT",
      "isList": false,
      "args": ["first", "after", "reverse"]
    }
  },
  "implementsNode": true
};
export default Object.freeze(Product);