
var createIntegration = require('../lib');
var assert = require('assert');
var equal = require('equals');
var spy = require('spy');
var stub = require('stub');
var tick = require('next-tick');
var Facade = require('facade');
var Page = Facade.Page;
var Track = Facade.Track;

describe('integration', function(){
  var Integration, integration;

  beforeEach(function(){
    Integration = createIntegration('Name');
    integration = new Integration();
  });

  describe('factory', function(){
    it('should expose a factory', function(){
      assert('function' === typeof createIntegration);
    });

    it('should return an integration constructor', function(){
      assert('function' === typeof createIntegration('Name'));
    });

    it('should have empty #defaults', function(){
      assert(equal({}, Integration.prototype.defaults));
    });

    it('should have empty #globals', function(){
      assert(equal([], Integration.prototype.globals));
    });

    it('should copy over its #name', function(){
      assert('Name' === Integration.prototype.name);
    });

    it('should copy static methods', function(){
      assert('function' === typeof Integration.option);
    });

    it('should copy prototype methods', function(){
      assert('function' === typeof Integration.prototype.initialize);
    });
  });

  describe('Integration', function(){
    it('should create a debug method', function(){
      assert('function' === typeof integration.debug);
    });

    it('should set #options with defaults', function(){
      Integration.option('one', false);
      integration = new Integration({ two: true });
      assert(equal(integration.options, { one: false, two: true }));
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
      var page = Integration.prototype.page;
      integration = new Integration();
      assert(page !== integration.page);
    });

    it('should wrap #track', function(){
      var track = Integration.prototype.track;
      integration = new Integration();
      assert(track != integration.track);
    })

    it('should call #flush when ready', function(){
      var flush = stub(Integration.prototype, 'flush');
      integration = new Integration();
      integration.emit('ready');
      assert(flush.called);
    });

    it('should emit `construct` before wrapping', function(){
      var load, initialize, instance;
      Integration.on('construct', function (integration) {
        instance = integration;
        initialize = integration.initialize;
      });
      var integration = new Integration();
      assert(instance === integration);
      assert(initialize !== integration.initialize);
    });
  });

  describe('.option', function(){
    it('should add to #defaults', function(){
      assert(equal({}, Integration.prototype.defaults));
      Integration = createIntegration('Name').option('key', 'value');
      assert(equal({ key: 'value' }, Integration.prototype.defaults));
    });
  });

  describe('.global', function(){
    it('should register a global key', function(){
      Integration.global('key').global('quee');
      assert('key' === Integration.prototype.globals[0]);
      assert('quee' === Integration.prototype.globals[1]);
    });
  });

  describe('.assumesPageview', function(){
    it('should set #_assumesPageview', function(){
      Integration.assumesPageview();
      assert(true === Integration.prototype._assumesPageview);
    });
  });

  describe('.readyOnLoad', function(){
    it('should set #_readyOnLoad', function(){
      Integration.readyOnLoad();
      assert(true === Integration.prototype._readyOnLoad);
    });
  });

  describe('.readyOnInitialize', function(){
    it('should set #_readyOnInitialize', function(){
      Integration.readyOnInitialize();
      assert(true === Integration.prototype._readyOnInitialize);
    });
  });

  describe('.mapping', function(){
    it('should create a mapping method', function(){
      Integration.mapping('events');
      var integration = new Integration;
      integration.options.events = { a: 'b' };
      assert.deepEqual(['b'], integration.events('a'));
    })

    it('should set an option to `[]`', function(){
      Integration.mapping('events');
      var integration = new Integration;
      assert.deepEqual([], integration.options.events);
    })

    it('should return `Integration`', function(){
      assert(Integration == Integration.mapping('events'));
    })
  })

  describe('#emit', function(){
    it('should be mixed in', function(){
      assert(Integration.prototype.emit);
    });
  });

  describe('#on', function(){
    it('should be mixed in', function(){
      assert(Integration.prototype.on);
    });
  });

  describe('#once', function(){
    it('should be mixed in', function(){
      assert(Integration.prototype.once);
    });
  });

  describe('#off', function(){
    it('should be mixed in', function(){
      assert(Integration.prototype.off);
    });
  });

  describe('#loaded', function(){
    it('should return false by default', function(){
      assert(!integration.loaded());
    });
  });

  describe('#initialize', function(){
    beforeEach(function(){
      Integration.readyOnInitialize();
      integration = new Integration();
      integration.load = spy();
    });

    it('should set _initialized', function(){
      assert(!integration._initialized);
      integration.initialize();
      assert(integration._initialized);
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
      Integration.tag('example-img', '<img src="/{{name}}.png">')
      Integration.tag('example-script', '<script src="http://ajax.googleapis.com/ajax/libs/jquery/{{version}}/jquery.min.js"></script>');
      integration = new Integration();
      spy(integration, 'load');
    });

    it('should load img', function (done) {
      integration.load('example-img', { name: 'example' }, function(){
        var img = integration.load.returns[0];
        var proto = window.location.protocol;
        var host = window.location.hostname;
        assert.equal(proto + '//' + host + '/example.png', img.src);
        done();
      });
    });

    it('should load script', function (done) {
      integration.load('example-script', { version: '1.11.1' }, function(){
        var script = integration.load.returns[0];
        assert.equal('http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js', script.src);
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
        assert(1 == integration.invoke('page', 'name'));
        done();
      });
      integration.emit('ready');
    })
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
      assert(equal(integration._queue, [{ method: 'track', args: ['event'] }]));
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
      assert(1 == new Integration().page());
    })
  });

  describe('#map', function(){
    describe('when `obj` is an object', function(){
      it('should return an empty array on mismatch', function(){
        var obj = { a: '4be41523', b: 'd49ccea' };
        assert.deepEqual([], integration.map(obj, 'c'));
      })

      it('should return an array with the value on match', function(){
        var obj = { a: '48dc32b2', b: '48dc32b2' };
        assert.deepEqual(['48dc32b2'], integration.map(obj, 'b'));
      })

      it('should use to-no-case to match keys', function(){
        var obj = { 'My Event': '7b4fe803', 'other event': '2107007a' };
        assert.deepEqual(['7b4fe803'], integration.map(obj, 'my_event'));
      })
    })

    describe('when .options.events is an array', function(){
      it('should return an empty array if the array isnt a map', function(){
        var obj = ['one', 'two'];
        assert.deepEqual([], integration.map(obj, 'one'));
      })

      it('should return an empty array when the array is empty', function(){
        var obj = [];
        assert.deepEqual([], integration.map(obj, 'wee'));
      })

      it('should return an empty array on mismatch', function(){
        var obj = [{ key: 'my event', value: '1121f10f' }];
        assert([], integration.map(obj, 'event'));
      })

      it('should return all matches in the array', function(){
        var obj = [{ key: 'baz', value: '4cff6219' }, { key: 'baz', value: '4426d54'} ];
        assert(['4cff6219', '4426d54'], integration.map(obj, 'baz'));
      })

      it('should use to-no-case to match keys', function(){
        var obj = [{ key: 'My Event', value: 'a35bd696' }];
        assert(['a35bd696'], integration.map(obj, 'my_event'));
      })
    })
  })

  describe('#track', function(){
    var track;

    beforeEach(function(){
      Integration.readyOnInitialize();
      track = Integration.prototype.track = spy();
      integration = new Integration;
      integration.viewedProduct = spy();
      integration.viewedProductCategory = spy();
      integration.addedProduct = spy();
      integration.removedProduct = spy();
      integration.completedOrder = spy();
    })

    it('should call #viewedProductCategory when the event is /viewed[ _]?product[ _]?category/i', function(){
      integration.track(new Track({ event: 'viewed product category' }));
      integration.track(new Track({ event: 'Viewed Product Category' }));
      integration.track(new Track({ event: 'viewedProductCategory' }));
      integration.track(new Track({ event: 'viewed_product_category' }));
      var args = integration.viewedProductCategory.args;
      assert(4 == args.length);
      assert('viewed product category' == args[0][0].event());
      assert('Viewed Product Category' == args[1][0].event());
      assert('viewedProductCategory' == args[2][0].event());
      assert('viewed_product_category' == args[3][0].event());
      assert(!track.called);
    })

    it('should call #viewedProduct when the event is /viewed[ _]?product/i', function(){
      integration.track(new Track({ event: 'viewed product' }));
      integration.track(new Track({ event: 'Viewed Product' }));
      integration.track(new Track({ event: 'viewedProduct' }));
      integration.track(new Track({ event: 'viewed_product' }));
      var args = integration.viewedProduct.args;
      assert(4 == args.length);
      assert('viewed product' == args[0][0].event());
      assert('Viewed Product' == args[1][0].event());
      assert('viewedProduct' == args[2][0].event());
      assert('viewed_product' == args[3][0].event());
      assert(!track.called);
    })

    it('should call #addedProduct when the event is /added[ _]?product/i', function(){
      integration.track(new Track({ event: 'added product' }));
      integration.track(new Track({ event: 'Added Product' }));
      integration.track(new Track({ event: 'addedProduct' }));
      integration.track(new Track({ event: 'added_product' }));
      var args = integration.addedProduct.args;
      assert(4 == args.length);
      assert('added product' == args[0][0].event());
      assert('Added Product' == args[1][0].event());
      assert('addedProduct' == args[2][0].event());
      assert('added_product' == args[3][0].event());
      assert(!track.called);
    })

    it('should call #removedProduct when the event is /removed[ _]?product/i', function(){
      integration.track(new Track({ event: 'removed product' }));
      integration.track(new Track({ event: 'Removed Product' }));
      integration.track(new Track({ event: 'removedProduct' }));
      integration.track(new Track({ event: 'removed_product' }));
      var args = integration.removedProduct.args;
      assert(4 == args.length);
      assert('removed product' == args[0][0].event());
      assert('Removed Product' == args[1][0].event());
      assert('removedProduct' == args[2][0].event());
      assert('removed_product' == args[3][0].event());
      assert(!track.called);
    })

    it('should call #completedOrder when the event is /completed[ _]?order/i', function(){
      integration.track(new Track({ event: 'completed order' }));
      integration.track(new Track({ event: 'Completed Order' }));
      integration.track(new Track({ event: 'completedOrder' }));
      integration.track(new Track({ event: 'completed_order' }));
      var args = integration.completedOrder.args;
      assert(4 == args.length);
      assert('completed order' == args[0][0].event());
      assert('Completed Order' == args[1][0].event());
      assert('completedOrder' == args[2][0].event());
      assert('completed_order' == args[3][0].event());
      assert(!track.called);
    })

    it('should apply arguments to methods', function(){
      var facade = new Track({ event: 'removed product' });
      integration.track(facade, 1, 2 , 3);
      var args = integration.removedProduct.args[0];
      assert(facade == args[0]);
      assert(4 == args.length);
      assert(3 == args.pop());
      facade = new Track({ event: 'some-event' });
      integration.track(facade, 1, 2, 3);
      assert(facade == track.args[0][0])
      assert(4 == track.args[0].length)
      assert(3 == track.args[0].pop())
    })

    it('should not error if a method is not implemented and fallback to track', function(){
      integration.completedOrder = null;
      integration.track(new Track({ event: 'completed order' }));
      assert(track.called);
    })

    it('should return the value', function(){
      Integration.prototype.track = function(){ return 1; };
      Integration.prototype.completedOrder = function(){ return 1; };
      var a = new Track({ event: 'event' });
      var b = new Track({ event: 'completed order' });
      assert(1 == new Integration().track(a));
      assert(1 == new Integration().track(b));
    })
  })

  describe('#reset', function(){
    it('should remove a global', function(){
      Integration.global('one').global('two');
      integration = new Integration();
      window.one = [];
      window.two = {};
      integration.reset();
      assert(undefined === window.one);
      assert(undefined === window.two);
    });

    it('should reset window defaults', function(){
      var setTimeout = window.setTimeout;
      var setInterval = window.setInterval;
      integration = new Integration();
      var noop = function(){};
      window.setTimeout = noop;
      window.setInterval = noop;
      window.onerror = noop;
      window.onload = noop;
      integration.reset();
      assert(setTimeout == window.setTimeout);
      assert(setInterval == window.setInterval);
      assert(null == window.onerror);
      assert(null == window.onload);
    });
  });

});
