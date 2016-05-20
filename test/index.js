
/**
 * Module dependencies.
 */

var createIntegration = require('../lib');
var assert = require('assert');
var spy = require('spy');
var stub = require('stub');
var Facade = require('facade');
var Track = Facade.Track;

/**
 * Tests.
 */

describe('integration', function(){
  var Integration;
  var integration;

  beforeEach(function(){
    Integration = createIntegration('Name');
    integration = new Integration();
  });

  describe('factory', function(){
    it('should expose a factory', function(){
      assert(typeof createIntegration === 'function');
    });

    it('should return an integration constructor', function(){
      assert(typeof createIntegration('Name') === 'function');
    });

    it('should have empty #defaults', function(){
      assert.deepEqual(Integration.prototype.defaults, {});
    });

    it('should have empty #globals', function(){
      assert.deepEqual(Integration.prototype.globals, []);
    });

    it('should copy over its #name', function(){
      assert(Integration.prototype.name === 'Name');
    });

    it('should copy static methods', function(){
      assert(typeof Integration.option === 'function');
    });

    it('should copy prototype methods', function(){
      assert(typeof Integration.prototype.initialize === 'function');
    });
  });

  describe('Integration', function(){
    it('should create a debug method', function(){
      assert(typeof integration.debug === 'function');
    });

    it('should set #options with defaults', function(){
      Integration.option('one', false);
      integration = new Integration({ two: true });
      assert.deepEqual(integration.options, { one: false, two: true });
    });

    it('should create a _queue', function(){
      assert(integration._queue instanceof Array);
    });

    it('should wrap #initialize', function(){
      var initialize = Integration.prototype.initialize;
      integration = new Integration();
      assert(initialize !== integration.initialize);
    });

    it('should wrap #page', function(){
      integration = new Integration();
      assert(integration.page !== Integration.prototype.page);
    });

    it('should wrap #track', function(){
      integration = new Integration();
      assert(integration.track !== Integration.prototype.track);
    });

    it('should call #flush when ready', function(){
      var flush = stub(Integration.prototype, 'flush');
      integration = new Integration();
      integration.emit('ready');
      assert(flush.calledOnce);
    });

    it('should emit `construct` before wrapping', function(){
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

  describe('.option', function(){
    it('should add to #defaults', function(){
      assert.deepEqual(Integration.prototype.defaults, {});
      Integration = createIntegration('Name').option('key', 'value');
      assert.deepEqual(Integration.prototype.defaults, { key: 'value' });
    });
  });

  describe('.global', function(){
    it('should register a global key', function(){
      Integration.global('key').global('quee');
      assert(Integration.prototype.globals[0] === 'key');
      assert(Integration.prototype.globals[1] === 'quee');
    });
  });

  describe('.assumesPageview', function(){
    it('should set #_assumesPageview', function(){
      Integration.assumesPageview();
      assert(Integration.prototype._assumesPageview === true);
    });
  });

  describe('.readyOnLoad', function(){
    it('should set #_readyOnLoad', function(){
      Integration.readyOnLoad();
      assert(Integration.prototype._readyOnLoad === true);
    });
  });

  describe('.readyOnInitialize', function(){
    it('should set #_readyOnInitialize', function(){
      Integration.readyOnInitialize();
      assert(Integration.prototype._readyOnInitialize === true);
    });
  });

  describe('.mapping', function(){
    it('should create a mapping method', function(){
      Integration.mapping('events');
      var integration = new Integration();
      integration.options.events = { a: 'b' };
      assert.deepEqual(integration.events('a'), ['b']);
    });

    it('should set an option to `[]`', function(){
      Integration.mapping('events');
      var integration = new Integration();
      assert.deepEqual(integration.options.events, []);
    });

    it('should return `Integration`', function(){
      assert(Integration.mapping('events') === Integration);
    });
  });

  describe('#emit', function(){
    it('should be mixed in', function(){
      assert(typeof Integration.prototype.emit === 'function');
    });
  });

  describe('#on', function(){
    it('should be mixed in', function(){
      assert(typeof Integration.prototype.on === 'function');
    });
  });

  describe('#once', function(){
    it('should be mixed in', function(){
      assert(typeof Integration.prototype.once === 'function');
    });
  });

  describe('#off', function(){
    it('should be mixed in', function(){
      assert(typeof Integration.prototype.off === 'function');
    });
  });

  describe('#loaded', function(){
    it('should return false by default', function(){
      assert(integration.loaded() === false);
    });
  });

  describe('#initialize', function(){
    beforeEach(function(){
      Integration.readyOnInitialize();
      integration = new Integration();
      integration.load = spy();
    });

    it('should set _initialized', function(){
      // TODO: We should explicitly set this to `false`
      assert(integration._initialized === undefined);
      integration.initialize();
      assert(integration._initialized === true);
    });

    it('should be a noop the first time if the integration assumes a pageview', function(){
      var initialize = Integration.prototype.initialize = spy();
      Integration.assumesPageview();
      var integration = new Integration();
      integration.initialize();
      assert(!initialize.called);
      integration.initialize();
      assert(initialize.called);
    });
  });

  describe('#load', function(){
    beforeEach(function(){
      Integration.tag('example-img', '<img src="/{{name}}.png">');
      Integration.tag('example-script', '<script src="https://ajax.googleapis.com/ajax/libs/jquery/{{version}}/jquery.min.js"></script>');
      Integration.tag('404', '<script src="https://ajax.googleapis.com/ajax/libs/jquery/0/jquery.min.js"></script>');
      Integration.tag('example-iframe', '<iframe src="https://jump.omnitarget.com"></iframe>');
      integration = new Integration();
      spy(integration, 'load');
    });

    it('should load img', function(done) {
      integration.load('example-img', { name: 'example' }, function(){
        var img = integration.load.returns[0];
        var proto = window.location.protocol;
        var host = window.location.hostname;
        var port = window.location.port;
        if (port) host += ':' + port;
        assert.equal(proto + '//' + host + '/example.png', img.src);
        done();
      });
    });

    it('should not callback on error', function(done){
      integration.debug = function(){
        var args = [].slice.call(arguments);
        var msg = args.shift().replace(/%s/g, function(){ return args.shift(); });
        assert.equal(msg, 'error loading "Name" error="Error: script error "https://ajax.googleapis.com/ajax/libs/jquery/0/jquery.min.js""');
        done();
      };
      integration.load('404', function(){
        done(new Error('shouldnt callback on error'));
      });
    });

    it('should load script', function(done){
      integration.load('example-script', { version: '1.11.1' }, function(){
        var script = integration.load.returns[0];
        assert.equal('https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js', script.src);
        done();
      });
    });

    it('should load iframe', function(done){
      integration.load('example-iframe', function(){
        var iframe = integration.load.returns[0];
        assert.equal('https://jump.omnitarget.com/', iframe.src);
        done();
      });
    });
  });

  describe('#invoke', function(){
    beforeEach(function(){
      integration.track = spy();
      integration.queue = spy();
      integration.page = function(){ throw new Error(); };
    });

    it('should do nothing if the method does not exist', function(){
      integration.invoke('identify', 'id');
      assert(!integration.queue.called);
      assert(!integration.track.called);
    });

    it('should call #queue if the integration is not ready', function(){
      integration.invoke('track', 'event');
      assert(integration.queue.calledWith('track', ['event']));
    });

    it('should call the method if the integration is ready', function(){
      integration.emit('ready');
      integration.invoke('track', 'event');
      assert(integration.track.calledWith('event'));
    });

    it('should catch errors when it calls', function(){
      integration.initialize();
      integration.invoke('page', 'name');
    });

    it('should return the returned value', function(done){
      Integration.prototype.page = function(){ return 1; };
      var integration = new Integration();
      integration.on('ready', function(){
        assert(integration.invoke('page', 'name') === 1);
        done();
      });
      integration.emit('ready');
    });
  });

  describe('#queue', function(){
    beforeEach(function(){
      Integration.assumesPageview();
      integration = new Integration();
      integration.initialize = spy();
    });

    it('should transform #page to #initialize when a pageview is assumed', function(){
      integration.queue('page', [{ name: 'page' }]);
      assert(integration.initialize.calledWith({ name: 'page' }));
    });

    it('should push the method and args onto the queue', function(){
      integration.queue('track', ['event']);
      assert.deepEqual(integration._queue, [{ method: 'track', args: ['event'] }]);
    });
  });

  describe('#flush', function(){
    it('should flush the queue', function(){
      var track = integration.track = spy();
      integration._queue = [{ method: 'track', args: ['event'] }];
      integration.flush();
      assert(track.calledWith('event'));
    });
  });

  describe('#page', function(){
    it('should call initialize the first time when a page view is assumed', function(){
      Integration.assumesPageview();
      integration = new Integration();
      integration.initialize = spy();
      integration.page({ name: 'page name' });
      assert(integration.initialize.calledWith({ name: 'page name' }));
    });

    it('should return the value', function(){
      Integration.prototype.page = function(){ return 1; };
      assert.equal(new Integration().page(), 1);
    });
  });

  describe('#map', function(){
    describe('when the mapped option is type "map"', function(){
      it('should return an empty array on mismatch', function(){
        var option = { a: '4be41523', b: 12345 };
        assert.deepEqual(integration.map(option, 'c'), []);
      });

      it('should return an array with the value on match', function(){
        var option = { a: 12345, b: '48dc32b2' };
        assert.deepEqual(integration.map(option, 'b'), ['48dc32b2']);
      });

      it('should use to-no-case to match keys', function(){
        var option = { 'My Event': '7b4fe803', 'other event': 12345 };
        assert.deepEqual(integration.map(option, 'my_event'), ['7b4fe803']);
      });
    });

    describe('when the mapped option is type "array"', function(){
      it('should map value when present in option array', function(){
        var option = ['one', 'two'];
        assert.deepEqual(integration.map(option, 'one'), ['one']);
      });

      it('should return an empty array when option array is empty', function(){
        var option = [];
        assert.deepEqual(integration.map(option, 'wee'), []);
      });
    });

    describe('when the mapped option is type "mixed"', function(){
      it('should return an empty array on mismatch', function(){
        var option = [{ key: 'my event', value: 12345 }];
        assert.deepEqual([], integration.map(option, 'event'));
      });

      it('should return single matched values', function(){
        var option = [{ key: 'bar', value: '4cff6219' }, { key: 'baz', value: '4426d54'} ];
        assert.deepEqual(['4426d54'], integration.map(option, 'baz'));
      });

      it('should return multiple matched values', function(){
        var option = [{ key: 'baz', value: '4cff6219' }, { key: 'baz', value: '4426d54'} ];
        assert.deepEqual(['4cff6219', '4426d54'], integration.map(option, 'baz'));
      });

      it('should use to-no-case to match keys', function(){
        var obj = [{ key: 'My Event', value: 'a35bd696' }];
        assert.deepEqual(['a35bd696'], integration.map(obj, 'my_event'));
      });

      it('should return matched value of type object', function(){
        var events = [
          { key: 'testEvent', value: { event: 'testEvent', mtAdId: 'mt-ad-id', mtId: 'mt-id' } },
          { key: 'testEvent2', value: { event: 'testEvent2', mtAdId: 'mt-ad-id', mtId: 'mt-id' } }
        ];
        assert.deepEqual(integration.map(events, 'testEvent'), [{ event: 'testEvent', mtAdId: 'mt-ad-id', mtId: 'mt-id' }]);
      });
    });
  });

  describe('#track', function(){
    var track;

    beforeEach(function(){
      Integration.readyOnInitialize();
      track = Integration.prototype.track = spy();
      integration = new Integration();
      integration.viewedProduct = spy();
      integration.viewedProductCategory = spy();
      integration.addedProduct = spy();
      integration.removedProduct = spy();
      integration.completedOrder = spy();
    });

    it('should call #viewedProductCategory when the event is /viewed[ _]?product[ _]?category/i', function(){
      integration.track(new Track({ event: 'viewed product category' }));
      integration.track(new Track({ event: 'Viewed Product Category' }));
      integration.track(new Track({ event: 'viewedProductCategory' }));
      integration.track(new Track({ event: 'viewed_product_category' }));
      var args = integration.viewedProductCategory.args;
      assert(args.length === 4);
      assert(args[0][0].event() === 'viewed product category');
      assert(args[1][0].event() === 'Viewed Product Category');
      assert(args[2][0].event() === 'viewedProductCategory');
      assert(args[3][0].event() === 'viewed_product_category');
      assert(!track.called);
    });

    it('should call #viewedProduct when the event is /viewed[ _]?product/i', function(){
      integration.track(new Track({ event: 'viewed product' }));
      integration.track(new Track({ event: 'Viewed Product' }));
      integration.track(new Track({ event: 'viewedProduct' }));
      integration.track(new Track({ event: 'viewed_product' }));
      var args = integration.viewedProduct.args;
      assert(args.length === 4);
      assert(args[0][0].event() === 'viewed product');
      assert(args[1][0].event() === 'Viewed Product');
      assert(args[2][0].event() === 'viewedProduct');
      assert(args[3][0].event() === 'viewed_product');
      assert(!track.called);
    });

    it('should call #addedProduct when the event is /added[ _]?product/i', function(){
      integration.track(new Track({ event: 'added product' }));
      integration.track(new Track({ event: 'Added Product' }));
      integration.track(new Track({ event: 'addedProduct' }));
      integration.track(new Track({ event: 'added_product' }));
      var args = integration.addedProduct.args;
      assert(args.length === 4);
      assert(args[0][0].event() === 'added product');
      assert(args[1][0].event() === 'Added Product');
      assert(args[2][0].event() === 'addedProduct');
      assert(args[3][0].event() === 'added_product');
      assert(!track.called);
    });

    it('should call #removedProduct when the event is /removed[ _]?product/i', function(){
      integration.track(new Track({ event: 'removed product' }));
      integration.track(new Track({ event: 'Removed Product' }));
      integration.track(new Track({ event: 'removedProduct' }));
      integration.track(new Track({ event: 'removed_product' }));
      var args = integration.removedProduct.args;
      assert(args.length === 4);
      assert(args[0][0].event() === 'removed product');
      assert(args[1][0].event() === 'Removed Product');
      assert(args[2][0].event() === 'removedProduct');
      assert(args[3][0].event() === 'removed_product');
      assert(!track.called);
    });

    it('should call #completedOrder when the event is /completed[ _]?order/i', function(){
      integration.track(new Track({ event: 'completed order' }));
      integration.track(new Track({ event: 'Completed Order' }));
      integration.track(new Track({ event: 'completedOrder' }));
      integration.track(new Track({ event: 'completed_order' }));
      var args = integration.completedOrder.args;
      assert(args.length === 4);
      assert(args[0][0].event() === 'completed order');
      assert(args[1][0].event() === 'Completed Order');
      assert(args[2][0].event() === 'completedOrder');
      assert(args[3][0].event() === 'completed_order');
      assert(!track.called);
    });

    it('should apply arguments to methods', function(){
      var facade = new Track({ event: 'removed product' });
      integration.track(facade, 1, 2, 3);
      var args = integration.removedProduct.args[0];
      assert(args[0] === facade);
      assert(args.length === 4);
      assert(args.pop() === 3);
      facade = new Track({ event: 'some-event' });
      integration.track(facade, 1, 2, 3);
      assert(track.args[0][0] === facade);
      assert(track.args[0].length === 4);
      assert(track.args[0].pop() === 3);
    });

    it('should not error if a method is not implemented and fallback to track', function(){
      integration.completedOrder = null;
      integration.track(new Track({ event: 'completed order' }));
      assert(track.called);
    });

    it('should return the value', function(){
      Integration.prototype.track = function(){ return 1; };
      Integration.prototype.completedOrder = function(){ return 1; };
      var a = new Track({ event: 'event' });
      var b = new Track({ event: 'completed order' });
      assert(new Integration().track(a) === 1);
      assert(new Integration().track(b) === 1);
    });
  });

  describe('#reset', function(){
    it('should remove a global', function(){
      Integration.global('one').global('two');
      integration = new Integration();
      window.one = [];
      window.two = {};
      integration.reset();
      assert(window.one === undefined);
      assert(window.two === undefined);
    });

    it('should reset window defaults', function(){
      integration = new Integration();

      var noop = function(){};
      var setTimeout = window.setTimeout;
      var setInterval = window.setInterval;
      var onerror = window.onerror;
      window.setTimeout = noop;
      window.setInterval = noop;
      window.onerror = noop;
      window.onload = noop;

      integration.reset();

      assert(window.setTimeout === setTimeout);
      assert(window.setInterval === setInterval);
      assert(window.onerror === onerror);
      assert(window.onload === onload);
    });
  });
});
