
#
# Helpers to test only a specific `integration` or `browser`, or on a `port`.
#

integration ?= *
browser ?= ie10
port ?= 4201

#
# Binaries.
#

duo = node_modules/.bin/duo
phantomjs = node_modules/.bin/mocha-phantomjs \
	--setting local-to-remote-url-access=true \
	--setting web-security=false \
	--path node_modules/.bin/phantomjs

#
# Commands.
#

default: build/build.js

test: node_modules build/build.js
	@$(phantomjs) http://localhost:$(port)

test-browser: build/build.js
	@open http://localhost:$(port)

test-coverage: build/build.js
	@open http://localhost:$(port)/coverage

test-sauce: node_modules build/build.js
	@node bin/gravy --url http://localhost:$(port)

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
.PHONY: test-coverage
.PHONY: test-sauce
