
var after = require('after');
var callback = require('callback');
var Emitter = require('emitter');


/**
 * Mixin emitter.
 */

Emitter(exports);


/**
 * Exists.
 *
 * @api private
 */

exports.exists = function () {
  return false;
};

/**
 * Initialize.
 */

exports.initialize = function () {
  this.load();
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
 * @param {String} name (optional)
 * @param {Object} properties (optional)
 * @param {Object} options (optional)
 */

exports.page = function (name, properties, options) {};

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

  try {
    this.debug('%s with %o', method, args);
    this[method].apply(this, args);
  } catch (e) {
    this.debug('error %o calling %s with %o', e, method, args);
  }
};

/**
 * Queue a `method` with `args`. If the integration assumes an initial
 * pageview, then let the first call to `page` pass through to `initialize`.
 *
 * @param {String} method
 * @param {Array} args
 * @api private
 */

exports.queue = function (method, args) {
  if ('page' == method && this._assumesPageview && !this._initialized) {
    this._initialized = true;
    return this.initialize();
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
 * Reset the integration, removing its global variable.
 *
 * @api private
 */

exports.reset = function () {
  if (this._global) window[this._global] = undefined;
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
    if (this.exists()) {
      this.debug('already exists');
      this.emit('ready');
      return;
    }

    this.debug('initialize');
    initialize.call(this);
    if (this._readyOnInitialize) this.emit('ready');
  };
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
    load.call(this, function (err, e) {
      self.debug('loaded');
      self.emit('load');
      if (self._readyOnLoad) self.emit('ready');
      callback && callback(err, e);
    });
  };
};


/**
 * BACKWARDS COMPATIBILITY: Wrap the page method if the old `initialPageview`
 * option was set to `false`.
 *
 * @api private
 */

exports._wrapPage = function () {
  if (this.options.initialPageview === false) {
    this.page = after(2, this.page);
  }
};