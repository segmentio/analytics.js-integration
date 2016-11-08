'use strict';

/**
 * Module dependencies.
 */

var Track = require('segmentio-facade').Track;
var assert = require('proclaim');
var createIntegration = require('../lib');
var fmt = require('@segment/fmt');
var spy = require('sinon').spy;
var stub = require('sinon').stub;

// XXX(ndhoule): Skip legacy environments (IE7/8); remove when dropping support
// for those browsers
var es5OnlyIt = 'map' in Array.prototype ? it : xit;

/**
 * Tests.
 */

describe('integration', function() {
  var Integration;
  var integration;

  beforeEach(function() {
    Integration = createIntegration('Name');
    integration = new Integration();
  });

  describe('factory', function() {
    it('should expose a factory', function() {
      assert(typeof createIntegration === 'function');
    });

    it('should return an integration constructor', function() {
      assert(typeof createIntegration('Name') === 'function');
    });

    it('should have empty #defaults', function() {
      assert.deepEqual(Integration.prototype.defaults, {});
    });

    it('should have empty #globals', function() {
      assert.deepEqual(Integration.prototype.globals, []);
    });

    it('should copy over its #name', function() {
      assert(Integration.prototype.name === 'Name');
    });

    it('should copy static methods', function() {
      assert(typeof Integration.option === 'function');
    });

    it('should copy prototype methods', function() {
      assert(typeof Integration.prototype.initialize === 'function');
    });
  });

  describe('Integration', function() {
    it('should create a debug method', function() {
      assert(typeof integration.debug === 'function');
    });

    it('should set #options with defaults', function() {
      Integration.option('one', false);
      integration = new Integration({ two: true });
      assert.deepEqual(integration.options, { one: false, two: true });
    });

    it('should create a _queue', function() {
      assert(integration._queue instanceof Array);
    });

    it('should wrap #initialize', function() {
      var initialize = Integration.prototype.initialize;
      integration = new Integration();
      assert(initialize !== integration.initialize);
    });

    it('should wrap #track', function() {
      integration = new Integration();
      assert(integration.track !== Integration.prototype.track);
    });

    it('should call #flush when ready', function() {
      var flush = stub(Integration.prototype, 'flush');
      integration = new Integration();
      integration.emit('ready');
      assert(flush.calledOnce);
    });

    it('should emit `construct` before wrapping', function() {
      var initialize;
      var instance;
      Integration.on('construct', function(integration) {
        instance = integration;
        initialize = integration.initialize;
      });
      var integration = new Integration();
      assert(integration === instance);
      assert(integration.initialize !== initialize);
    });
  });

  describe('.option', function() {
    it('should add to #defaults', function() {
      assert.deepEqual(Integration.prototype.defaults, {});
      Integration = createIntegration('Name').option('key', 'value');
      assert.deepEqual(Integration.prototype.defaults, { key: 'value' });
    });
  });

  describe('.global', function() {
    it('should register a global key', function() {
      Integration.global('key').global('quee');
      assert(Integration.prototype.globals[0] === 'key');
      assert(Integration.prototype.globals[1] === 'quee');
    });
  });

  describe('.assumesPageview', function() {
    it('should set #_assumesPageview', function() {
      Integration.assumesPageview();
      assert(Integration.prototype._assumesPageview === true);
    });
  });

  describe('.readyOnLoad', function() {
    it('should set #_readyOnLoad', function() {
      Integration.readyOnLoad();
      assert(Integration.prototype._readyOnLoad === true);
    });
  });

  describe('.readyOnInitialize', function() {
    it('should set #_readyOnInitialize', function() {
      Integration.readyOnInitialize();
      assert(Integration.prototype._readyOnInitialize === true);
    });
  });

  describe('.mapping', function() {
    it('should create a mapping method', function() {
      Integration.mapping('events');
      var integration = new Integration();
      integration.options.events = { a: 'b' };
      assert.deepEqual(integration.events('a'), ['b']);
    });

    it('should set an option to `[]`', function() {
      Integration.mapping('events');
      var integration = new Integration();
      assert.deepEqual(integration.options.events, []);
    });

    it('should return `Integration`', function() {
      assert(Integration.mapping('events') === Integration);
    });
  });

  describe('#emit', function() {
    it('should be mixed in', function() {
      assert(typeof Integration.prototype.emit === 'function');
    });
  });

  describe('#on', function() {
    it('should be mixed in', function() {
      assert(typeof Integration.prototype.on === 'function');
    });
  });

  describe('#once', function() {
    it('should be mixed in', function() {
      assert(typeof Integration.prototype.once === 'function');
    });
  });

  describe('#off', function() {
    it('should be mixed in', function() {
      assert(typeof Integration.prototype.off === 'function');
    });
  });

  describe('#loaded', function() {
    it('should return false by default', function() {
      assert(integration.loaded() === false);
    });
  });

  describe('#initialize', function() {
    beforeEach(function() {
      Integration.readyOnInitialize();
      integration = new Integration();
      integration.load = spy();
    });

    it('should set _initialized', function() {
      // TODO: We should explicitly set this to `false`
      assert(integration._initialized === undefined);
      integration.initialize();
      assert(integration._initialized === true);
    });

    it('should still initialize if the integration assumes a pageview', function() {
      var initialize = Integration.prototype.initialize = spy();
      Integration.assumesPageview();
      var integration = new Integration();
      integration.initialize();
      assert(initialize.called);
    });
  });

  describe('#load', function() {
    var protocol = document.location.protocol;
    var hostname = document.location.hostname;
    var port = document.location.port;
    var supportBaseURL = fmt('%s//%s:%s/base/test/support', protocol, hostname, port);

    beforeEach(function() {
      Integration.tag('example-img', '<img src="/base/test/support/{{name}}.png">');
      Integration.tag('example-script', fmt('<script src="%s/{{name}}.js"></script>', supportBaseURL));
      Integration.tag('404', fmt('<script src="%s/nonexistent.js"></script>', supportBaseURL));
      Integration.tag('example-iframe', fmt('<iframe src="%s/iframe.html"></iframe>', supportBaseURL));
      integration = new Integration();
      spy(integration, 'load');
    });

    it('should load img', function(done) {
      integration.load('example-img', { name: 'example' }, function() {
        var img = integration.load.returnValues[0];
        assert.equal(img.src, fmt('%s/example.png', supportBaseURL));
        done();
      });
    });

    it('should load script', function(done) {
      integration.load('example-script', { name: 'example-script' }, function() {
        var script = integration.load.returnValues[0];
        assert.equal(script.src, fmt('%s/example-script.js', supportBaseURL));
        done();
      });
    });

    it('should load iframe', function(done) {
      integration.load('example-iframe', function() {
        var iframe = integration.load.returnValues[0];
        assert.equal(iframe.src, fmt('%s/iframe.html', supportBaseURL));
        done();
      });
    });

    es5OnlyIt('should not callback on error', function(done) {
      integration.debug = function() {
        var args = Array.prototype.slice.call(arguments);
        var msg = args.shift().replace(/%s/g, function() { return args.shift(); });
        assert.equal(
          msg,
          fmt('error loading "Name" error="Error: script error "%s/nonexistent.js""', supportBaseURL)
        );
        done();
      };
      integration.load('404', function() {
        done(new Error('shouldnt callback on error'));
      });
    });
  });

  describe('#invoke', function() {
    beforeEach(function() {
      integration.track = spy();
      integration.queue = spy();
      integration.page = function() { throw new Error(); };
    });

    it('should do nothing if the method does not exist', function() {
      integration.invoke('identify', 'id');
      assert(!integration.queue.called);
      assert(!integration.track.called);
    });

    it('should call #queue if the integration is not ready', function() {
      integration.invoke('track', 'event');
      assert(integration.queue.calledWith('track', ['event']));
    });

    it('should call the method if the integration is ready', function() {
      integration.emit('ready');
      integration.invoke('track', 'event');
      assert(integration.track.calledWith('event'));
    });

    it('should catch errors when it calls', function() {
      integration.initialize();
      integration.invoke('page', 'name');
    });

    it('should return the returned value', function(done) {
      Integration.prototype.page = function() { return 1; };
      var integration = new Integration();
      integration.on('ready', function() {
        assert(integration.invoke('page', 'name') === 1);
        done();
      });
      integration.emit('ready');
    });
  });

  describe('#queue', function() {
    beforeEach(function() {
      Integration.assumesPageview();
      integration = new Integration();
      integration.initialize = spy();
    });

    it('should not transform #page to #initialize when a pageview is assumed', function() {
      integration.queue('page', [{ name: 'page' }]);
      assert(!integration.initialize.calledWith({ name: 'page' }));
    });

    it('should push the method and args onto the queue', function() {
      integration.queue('track', ['event']);
      assert.deepEqual(integration._queue, [{ method: 'track', args: ['event'] }]);
    });
  });

  describe('#flush', function() {
    it('should flush the queue', function() {
      var track = integration.track = spy();
      integration._queue = [{ method: 'track', args: ['event'] }];
      integration.flush();
      assert(track.calledWith('event'));
    });
  });

  describe('#page', function() {
    it('should not call initialize the first time when a page view is assumed', function() {
      Integration.assumesPageview();
      integration = new Integration();
      var initialize = integration.initialize = spy();
      integration.page({ name: 'page name' });
      assert(initialize.neverCalledWith({ name: 'page name' }));
    });

    it('should noop the first page call if assumepageview is enabled', function() {
      Integration.assumesPageview();
      var page = Integration.prototype.page = spy();
      integration = new Integration();
      integration.page({ name: 'hello' });
      assert(page.neverCalledWith({ name: 'hello' }));
    });

    it('should return the value', function() {
      Integration.prototype.page = function() { return 1; };
      assert.equal(new Integration().page(), 1);
    });
  });

  describe('#map', function() {
    describe('when the mapped option is type "map"', function() {
      it('should return an empty array on mismatch', function() {
        var option = { a: '4be41523', b: 12345 };
        assert.deepEqual(integration.map(option, 'c'), []);
      });

      it('should return an array with the value on match', function() {
        var option = { a: 12345, b: '48dc32b2' };
        assert.deepEqual(integration.map(option, 'b'), ['48dc32b2']);
      });

      it('should use to-no-case to match keys', function() {
        var option = { 'My Event': '7b4fe803', 'other event': 12345 };
        assert.deepEqual(integration.map(option, 'my_event'), ['7b4fe803']);
      });
    });

    describe('when the mapped option is type "array"', function() {
      it('should map value when present in option array', function() {
        var option = ['one', 'two'];
        assert.deepEqual(integration.map(option, 'one'), ['one']);
      });

      it('should return an empty array when option array is empty', function() {
        var option = [];
        assert.deepEqual(integration.map(option, 'wee'), []);
      });
    });

    describe('when the mapped option is type "mixed"', function() {
      it('should return an empty array on mismatch', function() {
        var option = [{ key: 'my event', value: 12345 }];
        assert.deepEqual([], integration.map(option, 'event'));
      });

      it('should return single matched values', function() {
        var option = [{ key: 'bar', value: '4cff6219' }, { key: 'baz', value: '4426d54' } ];
        assert.deepEqual(['4426d54'], integration.map(option, 'baz'));
      });

      it('should return multiple matched values', function() {
        var option = [{ key: 'baz', value: '4cff6219' }, { key: 'baz', value: '4426d54' } ];
        assert.deepEqual(['4cff6219', '4426d54'], integration.map(option, 'baz'));
      });

      it('should use to-no-case to match keys', function() {
        var obj = [{ key: 'My Event', value: 'a35bd696' }];
        assert.deepEqual(['a35bd696'], integration.map(obj, 'my_event'));
      });

      it('should return matched value of type object', function() {
        var events = [
          { key: 'testEvent', value: { event: 'testEvent', mtAdId: 'mt-ad-id', mtId: 'mt-id' } },
          { key: 'testEvent2', value: { event: 'testEvent2', mtAdId: 'mt-ad-id', mtId: 'mt-id' } }
        ];
        assert.deepEqual(integration.map(events, 'testEvent'), [{ event: 'testEvent', mtAdId: 'mt-ad-id', mtId: 'mt-id' }]);
      });
    });
  });

  describe('#track', function() {
    var track;

    beforeEach(function() {
      Integration.readyOnInitialize();
      track = Integration.prototype.track = spy();
      integration = new Integration();
      integration.productViewed = spy();
      integration.productListViewed = spy();
      integration.productAdded = spy();
      integration.productRemoved = spy();
      integration.orderCompleted = spy();
    });

    it('should call #productListViewed when the event is /viewed[ _]?product[ _]?category/i', function() {
      integration.track(new Track({ event: 'viewed product category' }));
      integration.track(new Track({ event: 'Viewed Product Category' }));
      integration.track(new Track({ event: 'viewedProductCategory' }));
      integration.track(new Track({ event: 'viewed_product_category' }));
      var args = integration.productListViewed.args;
      assert(args.length === 4);
      assert(args[0][0].event() === 'viewed product category');
      assert(args[1][0].event() === 'Viewed Product Category');
      assert(args[2][0].event() === 'viewedProductCategory');
      assert(args[3][0].event() === 'viewed_product_category');
      assert(!track.called);
    });

    it('should call #productListViewed when the event is /product[ _]?list[ _]?viewed/i', function() {
      integration.track(new Track({ event: 'product list viewed' }));
      integration.track(new Track({ event: 'Product List Viewed' }));
      integration.track(new Track({ event: 'productListViewed' }));
      integration.track(new Track({ event: 'product_list_viewed' }));
      var args = integration.productListViewed.args;
      assert(args.length === 4);
      assert(args[0][0].event() === 'product list viewed');
      assert(args[1][0].event() === 'Product List Viewed');
      assert(args[2][0].event() === 'productListViewed');
      assert(args[3][0].event() === 'product_list_viewed');
      assert(!track.called);
    });

    it('should call #productViewed when the event is /viewed[ _]?product/i', function() {
      integration.track(new Track({ event: 'viewed product' }));
      integration.track(new Track({ event: 'Viewed Product' }));
      integration.track(new Track({ event: 'viewedProduct' }));
      integration.track(new Track({ event: 'viewed_product' }));
      var args = integration.productViewed.args;
      assert(args.length === 4);
      assert(args[0][0].event() === 'viewed product');
      assert(args[1][0].event() === 'Viewed Product');
      assert(args[2][0].event() === 'viewedProduct');
      assert(args[3][0].event() === 'viewed_product');
      assert(!track.called);
    });

    it('should call #productViewed when the event is /product[ _]?viewed/i', function() {
      integration.track(new Track({ event: 'product viewed' }));
      integration.track(new Track({ event: 'Product Viewed' }));
      integration.track(new Track({ event: 'productViewed' }));
      integration.track(new Track({ event: 'product_viewed' }));
      var args = integration.productViewed.args;
      assert(args.length === 4);
      assert(args[0][0].event() === 'product viewed');
      assert(args[1][0].event() === 'Product Viewed');
      assert(args[2][0].event() === 'productViewed');
      assert(args[3][0].event() === 'product_viewed');
      assert(!track.called);
    });

    it('should call #productAdded when the event is /added[ _]?product/i', function() {
      integration.track(new Track({ event: 'added product' }));
      integration.track(new Track({ event: 'Added Product' }));
      integration.track(new Track({ event: 'addedProduct' }));
      integration.track(new Track({ event: 'added_product' }));
      var args = integration.productAdded.args;
      assert(args.length === 4);
      assert(args[0][0].event() === 'added product');
      assert(args[1][0].event() === 'Added Product');
      assert(args[2][0].event() === 'addedProduct');
      assert(args[3][0].event() === 'added_product');
      assert(!track.called);
    });

    it('should call #productAdded when the event is /product[ _]?added/i', function() {
      integration.track(new Track({ event: 'product added' }));
      integration.track(new Track({ event: 'Product Added' }));
      integration.track(new Track({ event: 'productAdded' }));
      integration.track(new Track({ event: 'product_added' }));
      var args = integration.productAdded.args;
      assert(args.length === 4);
      assert(args[0][0].event() === 'product added');
      assert(args[1][0].event() === 'Product Added');
      assert(args[2][0].event() === 'productAdded');
      assert(args[3][0].event() === 'product_added');
      assert(!track.called);
    });

    it('should call #productRemoved when the event is /removed[ _]?product/i', function() {
      integration.track(new Track({ event: 'removed product' }));
      integration.track(new Track({ event: 'Removed Product' }));
      integration.track(new Track({ event: 'removedProduct' }));
      integration.track(new Track({ event: 'removed_product' }));
      var args = integration.productRemoved.args;
      assert(args.length === 4);
      assert(args[0][0].event() === 'removed product');
      assert(args[1][0].event() === 'Removed Product');
      assert(args[2][0].event() === 'removedProduct');
      assert(args[3][0].event() === 'removed_product');
      assert(!track.called);
    });

    it('should call #productRemoved when the event is /product[ _]?removed/i', function() {
      integration.track(new Track({ event: 'product removed' }));
      integration.track(new Track({ event: 'Product Removed' }));
      integration.track(new Track({ event: 'productRemoved' }));
      integration.track(new Track({ event: 'product_removed' }));
      var args = integration.productRemoved.args;
      assert(args.length === 4);
      assert(args[0][0].event() === 'product removed');
      assert(args[1][0].event() === 'Product Removed');
      assert(args[2][0].event() === 'productRemoved');
      assert(args[3][0].event() === 'product_removed');
      assert(!track.called);
    });

    it('should call #orderCompleted when the event is /completed[ _]?order/i', function() {
      integration.track(new Track({ event: 'completed order' }));
      integration.track(new Track({ event: 'Completed Order' }));
      integration.track(new Track({ event: 'completedOrder' }));
      integration.track(new Track({ event: 'completed_order' }));
      var args = integration.orderCompleted.args;
      assert(args.length === 4);
      assert(args[0][0].event() === 'completed order');
      assert(args[1][0].event() === 'Completed Order');
      assert(args[2][0].event() === 'completedOrder');
      assert(args[3][0].event() === 'completed_order');
      assert(!track.called);
    });

    it('should call #orderCompleted when the event is /order[ _]?completed/i', function() {
      integration.track(new Track({ event: 'order completed' }));
      integration.track(new Track({ event: 'Order Completed' }));
      integration.track(new Track({ event: 'orderCompleted' }));
      integration.track(new Track({ event: 'order_completed' }));
      var args = integration.orderCompleted.args;
      assert(args.length === 4);
      assert(args[0][0].event() === 'order completed');
      assert(args[1][0].event() === 'Order Completed');
      assert(args[2][0].event() === 'orderCompleted');
      assert(args[3][0].event() === 'order_completed');
      assert(!track.called);
    });

    it('should apply arguments to methods', function() {
      var facade = new Track({ event: 'removed product' });
      integration.track(facade, 1, 2, 3);
      var args = integration.productRemoved.args[0];
      assert(args[0] === facade);
      assert(args.length === 4);
      assert(args.pop() === 3);
      facade = new Track({ event: 'some-event' });
      integration.track(facade, 1, 2, 3);
      assert(track.args[0][0] === facade);
      assert(track.args[0].length === 4);
      assert(track.args[0].pop() === 3);
    });

    it('should not error if a method is not implemented and fallback to track', function() {
      integration.orderCompleted = null;
      integration.track(new Track({ event: 'completed order' }));
      assert(track.called);
    });

    it('should return the value', function() {
      Integration.prototype.track = function() { return 1; };
      Integration.prototype.orderCompleted = function() { return 1; };
      var a = new Track({ event: 'event' });
      var b = new Track({ event: 'completed order' });
      var c = new Track({ event: 'order completed' });
      assert(new Integration().track(a) === 1);
      assert(new Integration().track(b) === 1);
      assert(new Integration().track(c) === 1);
    });
  });

  describe('#reset', function() {
    it('should remove a global', function() {
      Integration.global('one').global('two');
      integration = new Integration();
      window.one = [];
      window.two = {};
      integration.reset();
      assert(window.one === undefined);
      assert(window.two === undefined);
    });

    it('should reset window defaults', function() {
      integration = new Integration();

      var noop = function() {};
      var onerror = window.onerror;
      window.onerror = noop;
      window.onload = noop;

      integration.reset();

      assert(window.onerror === onerror);
      assert(window.onload === onload);
    });
  });
});
