
var after = require('after');
var callback = require('callback');
var Emitter = require('emitter');
var tick = require('next-tick');
var events = require('./events');


/**
 * Mixin emitter.
 */

Emitter(exports);

/**
 * Initialize.
 */

exports.initialize = function () {
  this.load();
};


/**
 * Loaded?
 *
 * @return {Boolean}
 * @api private
 */

exports.loaded = function () {
  return false;
};


/**
 * Load.
 *
 * @param {Function} cb
 */

exports.load = function (cb) {
  callback.async(cb);
};


/**
 * Page.
 *
 * @param {Page} page
 */

exports.page = function(page){};

/**
 * Track.
 *
 * @param {Track} track
 */

exports.track = function(track){};

/**
 * Invoke a `method` that may or may not exist on the prototype with `args`,
 * queueing or not depending on whether the integration is "ready". Don't
 * trust the method call, since it contains integration party code.
 *
 * @param {String} method
 * @param {Mixed} args...
 * @api private
 */

exports.invoke = function (method) {
  if (!this[method]) return;
  var args = [].slice.call(arguments, 1);
  if (!this._ready) return this.queue(method, args);
  var ret;

  try {
    this.debug('%s with %o', method, args);
    ret = this[method].apply(this, args);
  } catch (e) {
    this.debug('error %o calling %s with %o', e, method, args);
  }

  return ret;
};


/**
 * Queue a `method` with `args`. If the integration assumes an initial
 * pageview, then let the first call to `page` pass through.
 *
 * @param {String} method
 * @param {Array} args
 * @api private
 */

exports.queue = function (method, args) {
  if ('page' == method && this._assumesPageview && !this._initialized) {
    return this.page.apply(this, args);
  }

  this._queue.push({ method: method, args: args });
};


/**
 * Flush the internal queue.
 *
 * @api private
 */

exports.flush = function () {
  this._ready = true;
  var call;
  while (call = this._queue.shift()) this[call.method].apply(this, call.args);
};


/**
 * Reset the integration, removing its global variables.
 *
 * @api private
 */

exports.reset = function () {
  for (var i = 0, key; key = this.globals[i]; i++) window[key] = undefined;
};


/**
 * Wrap the initialize method in an exists check, so we don't have to do it for
 * every single integration.
 *
 * @api private
 */

exports._wrapInitialize = function () {
  var initialize = this.initialize;
  this.initialize = function () {
    this.debug('initialize');
    this._initialized = true;
    var ret = initialize.apply(this, arguments);
    this.emit('initialize');

    var self = this;
    if (this._readyOnInitialize) {
      tick(function () {
        self.emit('ready');
      });
    }
    
    return ret;
  };

  if (this._assumesPageview) this.initialize = after(2, this.initialize);
};


/**
 * Wrap the load method in `debug` calls, so every integration gets them
 * automatically.
 *
 * @api private
 */

exports._wrapLoad = function () {
  var load = this.load;
  this.load = function (callback) {
    var self = this;
    this.debug('loading');

    if (this.loaded()) {
      this.debug('already loaded');
      tick(function () {
        if (self._readyOnLoad) self.emit('ready');
        callback && callback();
      });
      return;
    }

    return load.call(this, function (err, e) {
      self.debug('loaded');
      self.emit('load');
      if (self._readyOnLoad) self.emit('ready');
      callback && callback(err, e);
    });
  };
};


/**
 * Wrap the page method to call `initialize` instead if the integration assumes
 * a pageview.
 *
 * @api private
 */

exports._wrapPage = function () {
  var page = this.page;
  this.page = function () {
    if (this._assumesPageview && !this._initialized) {
      return this.initialize.apply(this, arguments);
    }
    
    return page.apply(this, arguments);
  };
};

/**
 * Wrap the track method to call other ecommerce methods if
 * available depending on the `track.event()`.
 *
 * @api private
 */

exports._wrapTrack = function(){
  var t = this.track;
  this.track = function(track){
    var event = track.event();
    var called;
    var ret;

    for (var method in events) {
      var regexp = events[method];
      if (!this[method]) continue;
      if (!regexp.test(event)) continue;
      ret = this[method].apply(this, arguments);
      called = true;
      break;
    }

    if (!called) ret = t.apply(this, arguments);
    return ret;
  };
};
