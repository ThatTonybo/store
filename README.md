# 🍃 Store
Store is a simple, persistent JSON data storage model, with simple filtering and data protection

## Features
- Simple, powerful data management and filtering
- ES6 and Promises - no callbacks here
- Built-in backup and restore functionality
- Scheduled backups
- Read/write queueing to prevent data loss

## Install
Git is required to install this module.

```
npm install thattonybo/store
yarn add thattonybo/store
```

## Example

```js
const Store = require('thattonybo/store');
const store = new Store();

await store.add({
    unicorn: '🦄'
});
// => '2xuxhuoyd5h5563v'

store.find({ unicorn: '🦄' });
// => { unicorn: '🦄', _id: '2xuxhuoyd5h5563v' }

store.edit('2xuxhuoyd5h5563v', {
    unicorn: '🐷'
});
// => true

store.delete('2xuxhuoyd5h5563v');
// => true
```

This example only shows a portion of the basics that Store can do. See the documentation for more information.

## Frequently Asked Questions

### Why does this exist?

I needed a quick, effective wrapper for storing persistent data on local and testing applications, which wouldn't require as much hassle as setting up a database such as MongoDB. As such, JSON was a quick and appealing option for this.

### Can I use this in production?

You can, but I strongly suggest you choose an actual database, such as an SQL or NoSQL database. MongoDB and Postgres are great choices.

As mentioned, this is designed for development and testing work only, and not for production or long term/high use applications. Even with read write queueing and backups, there's only so far you can go to make a single file-based data storage method secure.

If you're interested in why JSON is not a good choice for production, read into race conditions [here](https://en.wikipedia.org/wiki/Race_condition) and [here](https://stackoverflow.com/questions/34510/what-is-a-race-condition).

## Documentation

Documentation is built with JSDoc.

```
yarn docs
```

## Tests

Tests are ran by Ava.

```
yarn test
```

## License
(c) 2020-present ThatTonybo. Licensed under the MIT License.