# Zspack

Live demo: https://zipack.github.io/#demo

Zspack = zipack + [scsu](https://en.wikipedia.org/wiki/Standard_Compression_Scheme_for_Unicode) , hack for Zipack.js

Zipack.js is an official encoder/decoder of [Zipack](https://zipack.github.io/) format using JavaScript with no dependencies.

## Install

```shell
npm install zspack
```

Use ES module in browser or Node.JS:

```JavaScript
import * as zspack from from 'zspack'
```

Prototype:

```
zspack {
    dump(Object)  // code
    load(Buffer)      // decode
}
```

## Default JS Objects

the types zspack support by default:

- number
- string
- boolean
- Array
- plain Object
- ArrayBuffer
- null

## Example

```javascript
let obj = {
    number: 123,
    float: 3.14,
    string: 'hello world',
    boolean: true,
    null: null,
    list: [1, 2, 3],
    map: {negative: -123},
    buffer: (new Uint8Array([1,2,3])).buffer
}

// JS Object ---> Uint8Array
let buffer = zspack.dump(obj)

// Uint8Array ---> JS Object
obj = zspack.load(buffer)
```

## [Object].prototype.zspack

like toJSON() in JavaScript, define zspack() for specific Objects, which outputs the types zspack support. For example, Date could be stored as number:

- function：zspack
- input：none
- output：default types or Uint8Array

```javascript
Date.prototype.zspack = function () {
  return this.getTime();
};
```

## Extension (experimental)

Register callback(params: Uint8Array) to load zspack, meanwhile, define zspack() returning Uint8Array to dump. See [extend-demo.js](./extend_demo.js).

## License

Apache 2.0
