
# analytics.js-integration

  The base integration factory used to create custom analytics integrations for [analytics.js](https://github.com/segmentio/analytics.js).

  [![build status](https://travis-ci.org/segmentio/analytics.js-integration.png?branch=master)](https://travis-ci.org/segmentio/analytics.js-integration)

## Example

```js
var integration = require('integration');

var Custom = integration('Custom Analytics')
  .global('_custom')
  .assumesPageview()
  .readyOnInitialize();

Custom.prototype.track = function (event, properties) {
  window._custom.push(['track', event, properties]);
};
```

## API

### integration(name)
  
  Create a new `Integration` constructor with the given integration `name`. `name` is the key with which users can `initialize` the integration.

### .global(key)
  
  Set the `Integration`'s global `key`. If this key already exists on `window` when `initialize` is called, it will return early, ensuring that setup logic and libraries aren't loaded twice.

### .assumesPageview()
  
  Mark the `Integration` as assuming an initial pageview has happened when its Javascript library loads. This way the very first call to `page` actually initializes the integration, ensuring that the first page isn't counted twice.

### .readyOnInitialize()
  
  Mark the `Integration` as being ready after `initialize` is called. This is true of integrations that create queues in their snippets so that they can record data before their library has been downloaded.

### .readyOnLoad()

  Mark the `Integration` as being ready after `load` is called. This is true for integrations that need to wait for their library to load to record data.

### #initialize()
  
  Initialize the integration. This is where the typical 3rd-party Javascript snippet logic should be.

### #load([callback])
  
  Load the integration's 3rd-party Javascript library, and `callback(err, e)`. The loading logic should be pulled out of the snippet from `initialize` and placed here.

### #page([name], [properties], [options])
  
  Label a page with an optional `name` and `properties`.

### #identify([id], [traits], [options])
  
  Identify a user by an optional `id` with optional `traits`.

### #group([id], [properties], [options])

  Identify a group of users, like an "account" or "organization" or "team" by an optional `id` with optional `properties`.

### #track(event, [properties], [options])

  Track an `event` triggered by the user with optional `properties`.

### #alias([old], new, [options])
  
  Alias a user's identify from an `old` ID to a `new` one. The `old` ID is optional and defaults to the user's current automatically generated distinct ID.

## License

  MIT