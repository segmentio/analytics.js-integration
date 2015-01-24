
# analytics.js-integration [![build status](https://travis-ci.org/segmentio/analytics.js-integration.png?branch=master)](https://travis-ci.org/segmentio/analytics.js-integration)

  The base integration factory used to create custom analytics integrations for [Analytics.js](https://github.com/segmentio/analytics.js).

  The factory returns a barebones integration that has no logic, so that we can share common pieces of logic—like queueing before an integration is ready, providing a way to default options, etc—in one place.

## Integrating with Segment

Interested in integrating your service with us? Check out our [Partners page](https://segment.com/partners/) for more details.

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

## Facade

  This library relies on [`segmentio/facade`](https://github.com/segmentio/facade) which is a helper that makes working with the input to [Analytics.js](https://github.com/segmentio/analytics.js) easier, by handling lots of common cases in one place.

## API

### integration(name)
  
  Create a new `Integration` constructor with the given integration `name`. `name` is the key with which users can `initialize` the integration.

### .option(key, default)

  Register a new option for the integration by `key`, with a `default` value.

### .mapping(key)

  Add a new mapping option by `key`. The option will be an array that the user can pass in of `key -> value` mappings. This will also generated a `#KEY` method on the integration's prototype for easily accessing the mapping.

  For example if your integration only supports a handful of events like `Signed Up` and `Completed Order`, you might create an mapping option called `events` that the user would pass in, like so:

```js
var MyIntegration = Integration('MyIntegration')
  .mapping('events');
```

  Which means that when the integration is initialized, it would be passed a mapping of `events` to use, like so:

```js
new MyIntegration({
  events: [
    { key: 'Signed Up', value: 'Register' }, 
    { key: 'Completed Order', value: 'Purchase' }
  ]
});
```

  Then later on, you can easily get all of the entries with a specific key, by calling `this.events(key)`. For example:

```js
MyIntegration.prototype.track = function(track){
  var matches = this.events(track.event());
  each(matches, function(value){
    window._myglobal.push(value);
  });
};
```

### .global(key)
  
  Register a new global variable `key` that the Integration uses. If this key already exists on `window` when `initialize` is called, it will return early, thus ensuring that setup logic and libraries aren't loaded twice.

### .assumesPageview()
  
  Mark the `Integration` as assuming an initial pageview has happened when its Javascript library loads. This is important for integrations whose libraries assume a "pageview" in their interface as soon as the library loads, instead of exposing a `.page()` method or similar to call via Javascript. 

  This option changes the integration so that the very first call to `page` actually initializes the integration, ensuring that the pageviews aren't accidentally duplicated.

### .readyOnInitialize()
  
  Mark the `Integration` as being ready to accept data after `initialize` is called. This is true of integrations that create queues in their snippets so that they can record data before their library has been downloaded.

### .readyOnLoad()

  Mark the `Integration` as being ready to accept data after `load` is called. This is true for integrations that need to wait for their library to load on the page to start recording data.

### #initialize([page])
  
  Initialize the integration. This is where the typical 3rd-party Javascript snippet logic should be. If the integration assumes an initial pageview, `initialize` will be called with the `page` method's arguments.

### #load([callback])
  
  Load the integration's 3rd-party Javascript library, and `callback(err, e)`. The loading logic should be pulled out of the snippet from `initialize` and placed here.

### #identify(facade)
  
  Identify the current user for the integration given an `Identify` [`facade`](https://github.com/segmentio/facade). See the [`identify` method docs](https://segment.io/docs/tracking-api/identify/) for more information.

### #group(facade)
  
  Group the current account/organization/group/etc for the integration given an `Group` [`facade`](https://github.com/segmentio/facade). See the [`group` method docs](https://segment.io/docs/tracking-api/group/) for more information.

### #page(facade)
  
  Transform a `Page` [`facade`](https://github.com/segmentio/facade) into a page view for the integration. See the [`page` method docs](https://segment.io/docs/tracking-api/page-and-screen/) for more information.
  
  [Identify a user.](https://segment.io/docs/tracking-api/identify)

### #track(facade)

  Track an event with the integration, given a `Track` [`facade`](https://github.com/segmentio/facade). See the [`track` method docs](https://segment.io/docs/tracking-api/track/) for more information.

### #alias(facade)
  
  Alias two user identities given an `Alias` `facade`. See the [`alias` method docs](https://segment.io/docs/tracking-api/alias/) for more information.

## License

  MIT
