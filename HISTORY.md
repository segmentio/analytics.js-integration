3.2.0 / 2016-11-07
==================

  * Fix a bug that prevented `.ready()` callback from being invoked
  * Updated `.assumePageview` to let integrations initialize while nooping first `.page()` call

3.1.0 / 2016-06-13
==================

  * Release [30210c26af1f878c1ae961407fe07181c927fb6d](https://github.com/segmentio/analytics.js-integration/commit/30210c26af1f878c1ae961407fe07181c927fb6d) on mainline branch

3.0.0 / 2016-06-06
==================

  * Update to new major analytics-events to support spec v2

2.1.0 / 2016-06-13
==================

  * Remove window.setTimeout,setInterval restoration to prevent interference with timer mocking

2.0.1 / 2016-05-25
==================

  * Add missing dependency to package.json dependencies field

2.0.0 / 2016-05-25
==================

  * Remove Duo support, add Browserify support
  * Switch from Travis CI to Circle CI
  * Modernize test harness
  * Various reorganizations/cleanups

1.1.1 / 2016-05-23
==================

  * Fix bad dependency pinning

1.1.0 / 2016-05-07
==================

  * Update Facade dependency to 2.x, fix it to be a dev dependency

1.0.1 / 2015-06-24
==================

  * Fix prototype#map regression

1.0.0 / 2015-06-24
==================

  * Release as 1.0.0 (note: this change does not introduce any breaking changes, just for semver purposes)

0.4.0 / 2015-06-24
==================

  * Add support for array data type in `#events` call

0.3.12 / 2015-05-22
===================

  * Fix Integration.prototype.map regression and add test

0.3.11 / 2015-05-22
===================

  * Add ESLint to test harness
  * Refactor existing code for sanity, ESLint compliance

0.3.10 / 2015-02-13
===================

  * Added loadIframe method

0.3.9 / 2015-01-08
==================

  * make: test-browser re-build on refresh
  * deps: pin them all
  * fix: ignore attributes that are not explicitly included

0.3.8 / 2014-10-17
==================

 * Merge pull request #33 from segmentio/noop
 * .load(): default fn to noop

0.3.7 / 2014-10-17
==================

 * deps: upgrade analytics-events
 * tests: fix typo

0.3.6 / 2014-10-16
==================

 * .load(): respect errors

0.3.5 / 2014-10-07
==================

 * remove assert
 * ocd: remove .load() dupe
 * reset(): restore onerror
 * travis typo

0.3.4 / 2014-09-26
==================

 * deps: pin fmt to catch JSON fix for ie7
 * travis: add sauce creds
 * package.json: rm .script
 * travis: browser matrix
 * tests: append port
 * tests: ie8..10
 * tests: support ie*

0.3.3 / 2014-09-23
==================

 * pin component deps

0.3.2 / 2014-09-04
==================

* updating analytics-events and the makefile

0.3.1 / 2014-07-11
==================

 * emit ready on next frame

0.3.0 / 2014-07-11
==================

 * ready on initialize by default
 * duo creds
 * use duo-test
 * make: remove server
 * bump node version to 0.11
 * make new `load` method load tags (script/img/iframe). so, you don't need to implement `.load` when building a new integration.
 * add `.tag` to the DSL, where you define script/img/iframe tags, instead of loading them manually. they use mustache-like templates, getting the options and whatever other "locals" you send to the `.load` method
 * remove old `load` method

0.2.4 / 2014-07-08
==================

 * port to duo
 * swap callback and ready event

0.2.3 / 2014-07-02
==================

 * reset window defaults
 * update readme
 * version component

0.2.2 / 2014-05-16
==================

 * allow camelCase and snake_case names

0.2.1 / 2014-04-29
==================

 * .mapping(): make sure it returns the integration for chaining
 * make: move rm node_modules to distclean target, for speed
 * add .mapping(name)

0.2.0 / 2014-04-26
==================

 * add #events method to find events.
 * component: add githubusercontent to remotes

0.1.9 / 2014-04-16
==================

 * make sure initialize is called with page

0.1.8 / 2014-04-15
==================

 * make sure all methods return the real values

0.1.7 / 2014-01-30
==================

 * pass all arguments to track()
 * dont wait until "ready" event to call track() directly

0.1.6 / 2014-01-30
==================

 * add eCommerce api

0.1.5 - November 26, 2013
-------------------------
* adding `readyOnLoad` fix to still call `load` callback

0.1.4 - November 12, 2013
-------------------------
* debug: upgrade to 0.7.3

0.1.2 - November 11, 2013
-------------------------
* rename `section` argument to `category`

0.1.1 - November 11, 2013
-------------------------
* add `section` argument to `page` method signature

0.1.0 - November 10, 2013
-------------------------
* change `exists` to `loaded` and check in `load`

0.0.7 - November 10, 2013
-------------------------
* add `construct` event to integration

0.0.6 - November 6, 2013
------------------------
* fix `ready` to always be emitted asynchronously

0.0.5 - November 6, 2013
------------------------
* add `exists` check for globals

0.0.4 - November 5, 2013
------------------------
* move `initialize` on `page` logic into `page`
* move `initialized` state into `initialize`
* remove handling of `initialPageview` option

0.0.3 - October 29, 2013
------------------------
* change initialize to be called with `page` args

0.0.2 - October 29, 2013
------------------------
* change globals to be an array of keys

0.0.1 - October 29, 2013
------------------------
:sparkles:
