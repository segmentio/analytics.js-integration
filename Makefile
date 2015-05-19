#
# Binaries.
#

DUO = node_modules/.bin/duo
DUOT = node_modules/.bin/duo-test
ESLINT = node_modules/.bin/eslint

#
# Files.
#

SRCS_DIR = lib
SRCS = $(shell find lib -type f -name "*.js")
TESTS_DIR = test
TESTS = test/index.js

#
# Task arguments.
#

browser ?= chrome

#
# Chore tasks.
#

# Install node dependencies.
node_modules: package.json $(wildcard node_modules/*/package.json)
	@npm install

# Create the build directory.
build:
	@mkdir -p build

# Remove temporary files and build artifacts.
clean:
	@rm -rf *.log build
.PHONY: clean

# Remove temporary files, build artifacts, and vendor dependencies.
distclean:
	@rm -rf components node_modules
.PHONY: distclean

#
# Build tasks.
#

# Build all integrations, tests, and dependencies together for testing.
build/build.js: node_modules component.json $(SRCS) $(TESTS) | build
	@$(DUO) --development test/index.js > $@
.DEFAULT_GOAL = build/build.js

#
# Test tasks.
#

# Lint JavaScript source.
lint: node_modules
	@$(ESLINT) $(wildcard lib/*.js test/index.js)

# Test locally in PhantomJS.
test: node_modules lint build/build.js
	@$(DUOT) phantomjs
.PHONY: test

# Test locally in the browser.
test-browser: node_modules lint build/build.js
	@$(DUOT) browser --commands "make build/build.js"
.PHONY: test-browser

# Test in Sauce Labs. Note that you must set the SAUCE_USERNAME and
# SAUCE_ACCESS_KEY environment variables using your Sauce Labs credentials.
test-sauce: node_modules build/build.js
	@$(DUOT) saucelabs -b $(browser)
.PHONY: test-sauce
