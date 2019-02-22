casper.test.begin('Page loads without error', 10, function suite(test) {

    casper.on('page.initialized', function() {
        this.evaluate(function() {
            var isFunction = function(o) {
                return typeof o == 'function';
            };

            var bind,
                slice = [].slice,
                proto = Function.prototype,
                featureMap;

            featureMap = {
                'function-bind': 'bind'
            };

            function has(feature) {
                var prop = featureMap[feature];
                return isFunction(proto[prop]);
            }

            // check for missing features
            if (!has('function-bind')) {
                // adapted from Mozilla Developer Network example at
                // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
                bind = function bind(obj) {
                    var args = slice.call(arguments, 1),
                        self = this,
                        nop = function() {},
                        bound = function() {
                            return self.apply(this instanceof nop ? this : (obj || {}), args.concat(slice.call(arguments)));
                        };
                    nop.prototype = this.prototype || {}; // Firefox cries sometimes if prototype is undefined
                    bound.prototype = new nop();
                    return bound;
                };
                proto.bind = bind;
            }
        });
    });

    casper.start('./index.html', function() {
        /* 1 */
        test.assertTitle('Typewrite Something', 'title is correct');
        /* 2 */
        test.assertVisible('#splash', 'splash is visible');
        /* 3 */
        test.assertExists('#text-canvas', 'text-canvas exists');
        /* 4 */
        test.assertExists('#cursor-input', 'cursor-input exists');

        casper.then(function() {
            this.click("#splash-section-2 a[href='#typing']");
        });

        /* 5 & 6 */
        casper.then(function () {
            test.assertEvalEquals(function () {
                return location.hash;
            }, '#typing', 'Typing mode engaged');
            
            test.assertNotVisible('#splash', 'splash is not visible');
        })

        /* 7 */
        casper.then(function() {
            this.mouse.click(268,159);
            test.assertEvalEquals(function () {
                // setup
                var position = new Vector(268,159),
                    letter_offset = new Vector(letter_width/2, line_height/2),
                    output = position.get().add(letter_offset);

                return [output.x, output.y];
            }, [268,159], 'Cursor and click positions match : 268, 159');
        });

        /* 8 */
        casper.then(function() {
            test.assertEvalEquals(function () {
                TypeWriter.addCharacter('ABC');
                return chars[1].str;
            }, 'B', 'Typed and retrieved letter B');
        });
        
        casper.then(function () {
            this.back();
        });

        /* 9 & 10 */
        casper.then(function () {
            test.assertEval(function () {
                return !location.hash;
            }, 'Back button wipes hash');

            test.assertVisible('#splash', 'Splash is visible again');
        });
    });

    casper.on("page.error", function(msg, trace) {
        /*if (msg.match(/Can't find variable: Audio/)) {
            return;
        }*/
        this.echo("Error: " + msg, "ERROR");
    });

    casper.test.on("fail", function(failure) {
        failure.message = "Message : " + failure.message + "\nLine : " + failure.line + "\nCode : " + failure.lineContents;
    });

    casper.run(function() {
        test.done();
    });
});