
#
# Helpers to test only a specific `integration` or `browser`, or on a `port`.
#

integration ?= *
browser ?= ie10

#
# Binaries.
#

duo = node_modules/.bin/duo
duo-test = node_modules/.bin/duo-test

#
# Commands.
#

default: build/build.js

test: node_modules build/build.js
	@$(duo-test) phantomjs

test-browser: build/build.js
	@$(duo-test) browser

test-sauce: node_modules build/build.js
	@$(duo-test) saucelabs -b $(browser)

clean:
	@rm -rf build components

#
# Targets.
#

build/build.js: node_modules component.json $(wildcard lib/*/*.js test/*.js)
	@$(duo) --development test/index.js build/build.js

node_modules: package.json
	@npm install

#
# Phonies.
#

.PHONY: clean
.PHONY: test
.PHONY: test-browser
.PHONY: test-sauce
