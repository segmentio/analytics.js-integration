
describe('integration', function () {

  var assert = require('assert');
  var equal = require('equals');
  var createIntegration = require('integration');
  var sinon = require('sinon');
  var tick = require('next-tick');

  var Integration, integration;

  beforeEach(function () {
    Integration = createIntegration('Name');
    integration = new Integration();
  });

  describe('factory', function () {
    it('should expose a factory', function () {
      assert('function' === typeof createIntegration);
    });

    it('should return an integration constructor', function () {
      assert('function' === typeof createIntegration('Name'));
    });

    it('should have empty #defaults', function () {
      assert(equal({}, Integration.prototype.defaults));
    });

    it('should have empty #globals', function () {
      assert(equal([], Integration.prototype.globals));
    });

    it('should copy over its #name', function () {
      assert('Name' === Integration.prototype.name);
    });

    it('should copy static methods', function () {
      assert('function' === typeof Integration.option);
    });

    it('should copy prototype methods', function () {
      assert('function' === typeof Integration.prototype.initialize);
    });
  });

  describe('Integration', function () {
    it('should create a debug method', function () {
      assert('function' === typeof integration.debug);
    });

    it('should set #options with defaults', function () {
      Integration.option('one', false);
      integration = new Integration({ two: true });
      assert(equal(integration.options, { one: false, two: true }));
    });

    it('should create a _queue', function () {
      assert(integration._queue instanceof Array);
    });

    it('should wrap #initialize', function () {
      var initialize = Integration.prototype.initialize;
      integration = new Integration();
      assert(initialize !== integration.initialize);
    });

    it('should wrap #load', function () {
      var load = Integration.prototype.load;
      integration = new Integration();
      assert(load !== integration.load);
    });

    it('should wrap #page', function () {
      var page = Integration.prototype.page;
      integration = new Integration();
      assert(page !== integration.page);
    });

    it('should call #flush when ready', function () {
      var flush = sinon.spy(Integration.prototype, 'flush');
      integration = new Integration();
      integration.emit('ready');
      assert(flush.called);
    });

    it('should emit `construct` before wrapping', function () {
      var load, initialize, instance;
      Integration.on('construct', function (integration) {
        instance = integration;
        load = integration.load;
        initialize = integration.initialize;
      });
      var integration = new Integration();
      assert(instance === integration);
      assert(load !== integration.load);
      assert(initialize !== integration.initialize);
    });
  });

  describe('.option', function () {
    it('should add to #defaults', function () {
      assert(equal({}, Integration.prototype.defaults));
      Integration = createIntegration('Name').option('key', 'value');
      assert(equal({ key: 'value' }, Integration.prototype.defaults));
    });
  });

  describe('.global', function () {
    it('should register a global key', function () {
      Integration.global('key').global('quee');
      assert('key' === Integration.prototype.globals[0]);
      assert('quee' === Integration.prototype.globals[1]);
    });
  });

  describe('.assumesPageview', function () {
    it('should set #_assumesPageview', function () {
      Integration.assumesPageview();
      assert(true === Integration.prototype._assumesPageview);
    });
  });

  describe('.readyOnLoad', function () {
    it('should set #_readyOnLoad', function () {
      Integration.readyOnLoad();
      assert(true === Integration.prototype._readyOnLoad);
    });
  });

  describe('.readyOnInitialize', function () {
    it('should set #_readyOnInitialize', function () {
      Integration.readyOnInitialize();
      assert(true === Integration.prototype._readyOnInitialize);
    });
  });

  describe('#emit', function () {
    it('should be mixed in', function () {
      assert(Integration.prototype.emit);
    });
  });

  describe('#on', function () {
    it('should be mixed in', function () {
      assert(Integration.prototype.on);
    });
  });

  describe('#once', function () {
    it('should be mixed in', function () {
      assert(Integration.prototype.once);
    });
  });

  describe('#off', function () {
    it('should be mixed in', function () {
      assert(Integration.prototype.off);
    });
  });

  describe('#loaded', function () {
    it('should return false by default', function () {
      assert(!integration.loaded());
    });
  });

  describe('#initialize', function () {
    beforeEach(function () {
      Integration.readyOnInitialize();
      integration = new Integration();
      integration.load = sinon.spy();
    });

    it('should set _initialized', function () {
      assert(!integration._initialized);
      integration.initialize();
      assert(integration._initialized);
    });

    it('should call #load by default', function () {
      integration.initialize();
      assert(integration.load.called);
    });

    it('should emit ready if ready on initialize', function (done) {
      integration.once('ready', function () {
        assert(integration.load.called);
        done();
      });
      integration.initialize();
    });

    it('should be a noop the first time if the integration assumes a pageview', function () {
      var initialize = Integration.prototype.initialize = sinon.spy();
      Integration.assumesPageview();
      var integration = new Integration();
      integration.initialize();
      assert(!initialize.called);
      integration.initialize();
      assert(initialize.called);
    });
  });

  describe('#load', function () {
    beforeEach(function () {
      Integration.readyOnLoad();
      integration = new Integration();
    });

    it('should return early if the integration is already loaded', function (done) {
      integration.loaded = function () { return true; };
      integration.once('ready', function () {
        assert(!integration.load.called);
        done();
      });
      integration.load();
    });

    it('should callback', function (done) {
      integration.load(done);
    });

    it('should emit load', function (done) {
      integration.once('load', done);
      integration.load();
    });

    it('should emit ready if ready on load', function (done) {
      integration.once('ready', done);
      integration.load();
    });
  });

  describe('#invoke', function () {
    beforeEach(function () {
      integration.track = sinon.spy();
      integration.queue = sinon.spy();
      integration.page = function () { throw new Error(); };
    });

    it('should do nothing if the method does not exist', function () {
      integration.invoke('identify', 'id');
      assert(!integration.queue.called);
      assert(!integration.track.called);
    });

    it('should call #queue if the integration is not ready', function () {
      integration.invoke('track', 'event');
      assert(integration.queue.calledWith('track', ['event']));
    });

    it('should call the method if the integration is ready', function () {
      integration.emit('ready');
      integration.invoke('track', 'event');
      assert(integration.track.calledWith('event'));
    });

    it('should catch errors when it calls', function () {
      integration.initialize();
      integration.invoke('page', 'name');
    });
  });

  describe('#queue', function () {
    beforeEach(function () {
      Integration.assumesPageview();
      integration = new Integration();
      integration.initialize = sinon.spy();
    });

    it('should transform #page to #initialize when a pageview is assumed', function () {
      integration.queue('page', ['Name', { property: true }, { option: true}]);
      assert(integration.initialize.calledWith({
        name: 'Name',
        properties: { property: true },
        options: { option: true }
      }));
    });

    it('should push the method and args onto the queue', function () {
      integration.queue('track', ['event']);
      assert(equal(integration._queue, [{ method: 'track', args: ['event'] }]));
    });
  });

  describe('#flush', function () {
    it('should flush the queue', function () {
      var track = integration.track = sinon.spy();
      integration._queue = [{ method: 'track', args: ['event'] }];
      integration.flush();
      assert(track.calledWith('event'));
    });
  });

  describe('#page', function () {
    it('should call initialize the first time when a page view is assumed', function () {
      Integration.assumesPageview();
      integration = new Integration();
      integration.initialize = sinon.spy();
      integration.page('name', { property: true });
      assert(integration.initialize.calledWith({
        name: 'name',
        properties: { property: true },
        options: undefined
      }));
    });
  });

  describe('#reset', function () {
    it('should remove a global', function () {
      Integration.global('one').global('two');
      integration = new Integration();
      window.one = [];
      window.two = {};
      integration.reset();
      assert(undefined === window.one);
      assert(undefined === window.two);
    });
  });

});