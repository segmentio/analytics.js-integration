
test = http://localhost:4201
component = node_modules/component/bin/component
phantom = node_modules/.bin/mocha-phantomjs --setting web-security=false --setting local-to-remote-url-access=true

build: node_modules components $(shell find lib)
	@$(component) build --dev

clean:
	@rm -rf build components

distclean:
	@rm -rf node_modules

components: component.json
	@$(component) install --dev

kill:
	@test ! -s test/pid.txt || kill `cat test/pid.txt`
	@rm -f test/pid.txt

node_modules: package.json
	@npm install

server: node_modules kill
	@node test/server &

test: build server
	@sleep 1
	-@$(phantom) $(test)
	@make kill

test-browser: node_modules build server
	@sleep 1
	@open $(test)

.PHONY: clean server test test-browser
