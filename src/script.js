/*
*
* Inspired by a girl, Ms. Jayme Bergman
*
*/

var options = (function () {
        function Options () {
            /*
            todo: build a GUI for these options
            */
            this.play_audio = true;
            this.font_size = 26;
            this.line_height = null;
        }

        return new Options();
    })(),  
    container = document.getElementById('container'),
    container_origin = new Vector(0,0),
    container_scale = 1,
    container_offset = new Vector(0,0),
    canvas_offset = new Vector(0, 0),
    textCanvas = document.getElementById('text-canvas'),
    textCtx = textCanvas.getContext('2d', {alpha:true}),
    cursorCanvas = document.getElementById('cursor-canvas'),
    cursorCtx = cursorCanvas.getContext('2d'),
    cursorInput = document.getElementById('cursor-input'),
    keypress_audio = window.keypress_audio || new makeMultiAudio('/assets/keypress.mp3', 5),
    newline_audio = window.newline_audio || new makeMultiAudio('/assets/return.mp3', 2),
    IS_IOS = navigator.userAgent.match(/(iPad|iPhone|iPod)/g),
    DEVICE_PIXEL_RATIO = window.devicePixelRatio || 1,
    TEXT_COLOR = '#150904',
    CURSOR_COLOR = '#4787ea',
    GLOBAL_ALPHA = 0.72,
    ALPHA_MARGIN = 0.06,
    ROTATE_MARGIN = 0.05,
    TRANSLATE_MARGIN = 0.2,
    chars = [],
    letter_size = parseInt(Math.min(options.font_size, window.innerWidth / 17)),
    letter_width = letter_size * 12 / 20,
    line_height = (options.line_height === null) ? letter_size + 8 : options.line_height,
    padding_vec = (function () {
        var _x = Math.min(100, window.innerWidth / 8),
            _y = Math.min(_x, window.innerHeight / 8);
        return new Vector(_x, _y);
    })(),
    pos_vec = padding_vec,
    stamp_key = 'tws_stamp',
    events_key = 'tws_event',
    stamp = (function () {
        var i = 0;
        return function stamp (obj) {
            if (!obj[stamp_key]) {
                obj[stamp_key] = ++i;
            }
            return obj[stamp_key];
        };
    })(),
    DOMEvent = (function () {
        function DOMEvent () {
            // Inspired by LeafletJS
            // todo: better backwards compatibility

            this.getId = function (obj, type, fn, context) {
                return type + stamp(fn) + (context ? '_' + stamp(context) : '');
            };

            this.on = function (obj, type, fn, context) {
                var id = this.getId.apply(this, arguments),
                    handler = function (e) {
                        return fn.call(context || obj, e || window.event);
                    };

                if (!obj) return;

                if ('addEventListener' in obj) {
                    obj.addEventListener(type, handler);
                } else if ('attachEvent' in obj) {
                    obj.attachEvent('on' + type, handler);
                }

                obj[events_key] = obj[events_key] || {};
                obj[events_key][id] = handler;
            };

            this.off = function (obj, type, fn, context) {
                var id = this.getId.apply(this, [obj, type, fn, context]),
                    handler = obj[events_key] && obj[events_key][id];

                if (!obj) return;

                if ('removeEventListener' in obj) {
                    obj.removeEventListener(type, handler);
                } else if ('detachEvent' in obj) {
                    obj.detachEvent('on' + type, handler);
                }

                obj[events_key][id] = null;
            };
        }
        return new DOMEvent();
    })(),
    Cursor = (function () {
        function Cursor () {
            /*
            Cursor singleton for controlling cursor 
            position and visibility
            */
            var _cursor_timeout,
                _raf,
                _time,
                _opacity;

            this.clear = function () {
                var _pos = pos_vec.subtract(1).divideBy(container_scale);

                cursorCtx.clearRect(_pos.x, _pos.y, letter_width + 2, line_height + 2);
            };

            this.update = function (vec) {
                this.clear();
                
                pos_vec = vec;
                cursorInput.style.left = Math.min(vec.x, window.innerWidth) + 'px';
                cursorInput.style.top = Math.min(vec.y, window.innerHeight) + 'px';
                this.draw();
            };

            this._draw = function () {
                var _pos = pos_vec.divideBy(container_scale);

                cursorCtx.fillRect(_pos.x, _pos.y, letter_width, line_height);
            };

            this.draw = function () {
                this._draw();
                
                window.clearTimeout(_cursor_timeout);
                if (_raf) {
                    window.cancelAnimationFrame(_raf);
                }
                _opacity = GLOBAL_ALPHA;
                _cursor_timeout = window.setTimeout(this.fadeOut.bind(this), 2200);
            };

            this.nudge = function (vec) {
                this.update( pos_vec.add(vec.multiplyBy(container_scale)) );
            };

            this.moveleft = function () {
                this.nudge(new Vector(-letter_width, 0));
            };
            this.moveright = function () {
                this.nudge(new Vector(letter_width, 0));
            };
            this.moveup = function () {
                this.nudge(new Vector(0, -line_height));
            };
            this.movedown = function () {
                this.nudge(new Vector(0, line_height));
            };
            this.addtab = function () {
                this.nudge(new Vector(letter_width * 4, 0));
            };
            
            this.newline = function () {
                /*
                todo: newline might be better off
                moving to x = previous click location
                instead of paddingx
                */
                this.update(new Vector(padding_vec.x, pos_vec.y + line_height));
            };

            this.fadeOut = function () {
                _time = new Date();
                _raf = window.requestAnimationFrame( this._fadeanim.bind(this) );
            };

            this._fadeanim = function () {
                var dt = new Date() - _time,
                    new_opacity = _opacity - 0.1 * dt / 300;

                if (new_opacity <= 0) {
                    this.clear();
                } else {
                    cursorCtx.save();
                    this.clear();
                    _opacity = new_opacity;
                    cursorCtx.globalAlpha = _opacity;
                    this._draw();
                    cursorCtx.restore();
                    _raf = window.requestAnimationFrame( this._fadeanim.bind(this) );
                }
            };
        }

        return new Cursor();
    })(),
    // mapping for keys that move cursor 
    NAV_BUTTONS = {
        8: Cursor.moveleft.bind( Cursor ),
        9: Cursor.addtab.bind( Cursor ),
        37: Cursor.moveleft.bind( Cursor ),
        38: Cursor.moveup.bind( Cursor ),
        39: Cursor.moveright.bind( Cursor ),
        40: Cursor.movedown.bind( Cursor ),
        13: Cursor.newline.bind( Cursor ),
    },
    // mapping for soundless keys
    NO_AUDIO = {
        0 : 'PRTSCR',
        8 : 'BACKSPACE',
        9 : 'TAB',
        16 : 'SHIFT',
        17 : 'CTRL',
        18 : 'ALT',
        20 : 'CAPSLOCK',
        27 : 'ESC',
        32 : 'SPACE',
        33 : 'PGUP',
        34 : 'PGDN',
        35 : 'END',
        36 : 'HOME',
        37 : 'LEFT',
        38 : 'UP',
        39 : 'RIGHT',
        40 : 'DOWN',
        45 : 'INSERT',
        46 : 'DEL',
        115 : 'F4',
        117 : 'F6',
        119 : 'F8',
        120 : 'F9',
        121 : 'F10',
        123 : 'F12'
    },
    ENTER = 13,
    TypeWriter = (function () {
        function TypeWriter () {
            /*
            TypeWriter singleton for handling characters
            and global positioning system (GPS, ya know)
            */
            this.addCharacter = function (char_str, _x, _y) {
                if (_x && _y) {
                    Cursor.update( new Vector(_x, _y));
                }
                for (var i = 0, len = char_str.length; i < len; i++) {
                    var char = char_str[i];
                   
                    chars.push( new Character( char ) );
                    Cursor.moveright();
                }
            };

            this.redraw = function () {
                /*
                pure redraw (no resetting/clearing)
                */
                asyncForLoop(chars, process_fn);

                function process_fn (char) {
                    char.draw();
                }
            };

            this.resetCanvases = function () {
                [textCtx, cursorCtx].forEach(function (ctx) {
                    var canvas = ctx.canvas;

                    ctx.setTransform(1,0,0,1,0,0);

                    canvas.width = window.innerWidth * DEVICE_PIXEL_RATIO;
                    canvas.height = window.innerHeight * DEVICE_PIXEL_RATIO;
                    canvas.style.width = window.innerWidth + 'px';
                    canvas.style.height = window.innerHeight + 'px';

                    ctx.scale(DEVICE_PIXEL_RATIO, DEVICE_PIXEL_RATIO);

                    ctx.globalAlpha = GLOBAL_ALPHA;
                });

                // reset contexts, because resizing wipes them
                textCtx.font = letter_size + "px Special Elite, serif";
                textCtx.textBaseline = "top";
                textCtx.fillStyle = TEXT_COLOR;

                cursorCtx.fillStyle = CURSOR_COLOR;
                cursorCtx.scale(container_scale, container_scale);
            };

            this.reposition = function (vec) {
                /*
                offset characters for given x/y
                useful for moving/dragging
                useful for redrawing (b/c needs resetting)
                */
                canvas_offset._add( vec || new Vector(0, 0) );

                container.style.left = '0px';
                container.style.top = '0px';

                this.resetCanvases();
                this.redraw();
            };

            this.reset = function () {
                /*
                back to original blank canvas
                */
                chars = [];
                pos_vec = padding_vec;
                canvas_offset = new Vector(0, 0);
                container_origin = new Vector(0, 0);
                container_scale = 1;
                container.setAttribute('style', '');

                this.reposition();
                Cursor.draw();
                cursorInput.focus();
            };
        }

        return new TypeWriter();
    })(),
    App = (function () {
        function App () {
            var mouseuptimeout, mousemovedelay,
                mousedowntime, clickdelay,
                original_pos, zoom_distance,
                zoom_scale, zoom_center_diff,
                splash_elem = document.getElementById('splash'),
                display_val = splash_elem.style.display;

            this.running = false;

            this.reset = function () {
                mouseuptimeout = 0;
                mousemovedelay = 150;
                mousedowntime = 0;
                clickdelay = 150;
                original_pos = 0;
                zoom_distance = 0;
                zoom_scale = 0;
                zoom_center_diff = 0;
            };

            this.start = function () {

                if (this.running) return;
                
                this.running = true;
                this.reset();
                TypeWriter.reset();
                this.events('on');
                cursorInput.focus();
                forceSpace.call(cursorInput);
                Cursor.draw();

                splash_elem.style.display = 'none';
            };

            this.stop = function () {
                this.splash();
                if (!this.running) return;
                this.running = false;
                
                // kill events
                this.events('off');
                removeMoveEvent();
            };

            this.splash_events = [];

            this.splash = function () {
                splash_elem.style.display = display_val;

                // some functions below 
                // should push to this array
                // to describe tear down events
                for (var i = 0, len = this.splash_events.length; i < len; i++) {
                    var fnc = this.splash_events[i];
                    fnc();
                }
            };

            this.events = function (_onoff) {
                var onoff = _onoff || 'on',
                    document_events = {
                        mouseup : mouseup,
                        touchend : touchend,
                        mousedown : mousedown,
                        touchstart : touchstart
                    },
                    cursor_events = {
                        keydown : keydown,
                        keyup : keyup,
                        focus : focus
                    },
                    key, fnc;

                for (key in document_events) {
                    fnc = document_events[key];
                    DOMEvent[onoff](document, key, fnc);
                }

                for (key in cursor_events) {
                    fnc = cursor_events[key];
                    DOMEvent[onoff](cursorInput, key, fnc);
                }

                if (IS_IOS) {
                    DOMEvent[onoff](document, 'touchstart', iosTouchStart);
                }
            };

            function keydown (e) {
                /*
                keydown handles audio
                */
                var no_audio = NO_AUDIO[ e.which ];

                if (!no_audio && options.play_audio) {
                    if (e.which === ENTER) {
                        newline_audio.play();
                    } else {
                        keypress_audio.play();
                    }
                    return true;
                }
                
                if (no_audio === 'TAB') {
                    /* todo : add 2 or 4 spaces */

                    // refocus
                    window.setTimeout(function () {
                        cursorInput.focus();
                    }, 10);
                    e.preventDefault();
                }
            }

            function keyup (e) {
                /*
                keyup handles character input and navigation
                */
                var nav = NAV_BUTTONS[ e.which ],
                    value = this.value.substr(1);

                if (!value && !nav) return;

                if (nav) {
                    nav();
                } else {
                    TypeWriter.addCharacter( value );
                }
                forceSpace.call(this);
            }

            function focus () {
                forceSpace.call(this);
            }

            function mouseup (e) {
                removeMoveEvent();

                if (original_pos) {
                    var _position = getPositionFromEvent(e);
                    
                    _position._subtract( original_pos );

                    TypeWriter.reposition( _position );
                    original_pos = null;
                } else if (new Date() - mousedowntime <= clickdelay &&
                    !IS_IOS) {
                    // click
                    updateCursor(e);
                }
            }

            function touchend (e) {
                if (!e.touches.length) {
                    if (e.changedTouches.length) {
                        e.clientX = e.changedTouches[0].clientX;
                        e.clientY = e.changedTouches[0].clientY;
                    } else {
                        removeMoveEvent();
                        return;
                    }
                }

                return mouseup(e);
            }

            function mousedown (e) {
                // ignore right click
                if (e.button === 2) return;

                // single finger or mouse
                mousedowntime = new Date();

                mouseuptimeout = window.setTimeout(function () {
                    
                    original_pos = original_pos || getPositionFromEvent(e);

                    DOMEvent.on(document, 'mousemove', mousemove);
                    DOMEvent.on(document, 'touchmove', mousemove);
                    DOMEvent.on(document, 'mouseup', removeMoveEvent);
                    
                }, mousemovedelay);
            }

            function touchstart (e) {
                if (e.touches && e.touches.length === 2) {
                    // todo: work on zooming
                    e.preventDefault();
                    return false;
                } else {
                    return mousedown(e);
                }
            }

            function iosTouchStart (e) {
                return updateCursor(e);
            }

            function mousemove (e) {
                if (!original_pos) return; 
                // move holder
                var _position = getPositionFromEvent(e);

                _position._subtract( original_pos );

                container.style.left = _position.x + 'px';
                container.style.top = _position.y + 'px';
                Cursor.clear();
            }

            function updateCursor (e) {
                var _position = getPositionFromEvent(e),
                    letter_offset = new Vector(letter_width/2, line_height/2),
                    _newpos = _position.subtract(letter_offset);
                Cursor.update( _newpos );
                cursorInput.focus();
            }

            function removeMoveEvent () {
                window.clearTimeout( mouseuptimeout );
                DOMEvent.off(document, 'mousemove', mousemove);
                DOMEvent.off(document, 'touchmove', mousemove);
                DOMEvent.off(document, 'mouseup', removeMoveEvent);
            }
            /*function getFingerPositions (e) {
                var touches = e.touches,
                    touch1 = touches[0],
                    touch2 = touches[1];

                return [ 
                    new Vector(touch1.clientX, touch1.clientY),
                    new Vector(touch2.clientX, touch2.clientY)
                ];
            }*/

            /*
            extremely experimental zooming 
            */

            /*function zoomStart (e) {
                var positions = getFingerPositions(e),
                    f1 = positions[0],
                    f2 = positions[1];
                
                zoom_distance = f1.distanceTo( f2 );
                container_origin._add(f1)._add(f2)._divideBy(2);

                container.style.transformOrigin = container_origin.x + 'px ' + container_origin.y + 'px';

                DOMEvent.on(document, 'touchmove', zoomMove);
                DOMEvent.on(document, 'touchend', zoomEnd);
            }

            function removeZoomEvent () {
                DOMEvent.off(document, 'touchmove', zoomMove);
                DOMEvent.off(document, 'touchend', zoomEnd);
            }

            function zoomMove (e) {
                // css resize
                var positions = getFingerPositions(e),
                    f1 = positions[0],
                    f2 = positions[1],
                    zc = f1.add(f2).divideBy(2);

                zoom_center_diff = zc.subtract(container_origin);
                
                zoom_scale = f1.distanceTo(f2) / zoom_distance;

                // scale (impacted by origin in zoomStart)
                container.style.transform = 'scale(' + zoom_scale + ')';

                // translate
                container.style.left = zoom_center_diff.x + 'px';
                container.style.top = zoom_center_diff.y + 'px';
               
                e.preventDefault();
            }

            function zoomEnd () {

                // get new offset for canvas to figure out
                container_scale *= zoom_scale;
                container_offset = container_origin.multiplyBy(1 - container_scale);

                container.setAttribute('style', '');

                // reposition by zoom_center_diff
                TypeWriter.reposition( zoom_center_diff );

                removeZoomEvent();
            }*/
        }

        return new App();
    })();

/*
*
* Vector class for handling positions
*
*/

function Vector (x, y) {
    this.x = x;
    this.y = y;
}

Vector.prototype.get = function (axis) {
    return this[axis];
};

Vector.prototype.add = function (vector) {
    if (typeof(vector) === 'number') {
        return new Vector(this.x + vector, this.y + vector);
    }
    return new Vector(this.x + vector.x, this.y + vector.y);
};

Vector.prototype._add = function (vector) {
    this.x += (vector.x === undefined) ? vector : vector.x;
    this.y += (vector.y === undefined) ? vector : vector.y;
    return this;
};

Vector.prototype.subtract = function (vector) {
    if (typeof(vector) === 'number') {
        return new Vector(this.x - vector, this.y - vector);
    }
    return new Vector(this.x - vector.x, this.y - vector.y);
};

Vector.prototype._subtract = function (vector) {
    this.x -= (vector.x === undefined) ? vector : vector.x;
    this.y -= (vector.y === undefined) ? vector : vector.y;
    return this;
};

Vector.prototype.divideBy = function (num) {
    return new Vector(this.x / num, this.y / num);
};

Vector.prototype._divideBy = function (num) {
    this.x /= num;
    this.y /= num;
    return this;
};

Vector.prototype.multiplyBy = function (num) {
    return new Vector(this.x * num, this.y * num);
};

Vector.prototype._multiplyBy = function (num) {
    this.x *= num;
    this.y *= num;
    return this;
};

Vector.prototype.distanceTo = function (vector) {
    var diff = vector.subtract(this),
        x = diff.x,
        y = diff.y;
    return Math.sqrt(x * x + y * y);
};

/*
*
* Character class for drawing characters on TypeWriter singleton
*
*/
function Character (char_str, _x, _y) {
    var x = randMargin(_x || pos_vec.x, TRANSLATE_MARGIN),
        y = randMargin(_y || pos_vec.y, TRANSLATE_MARGIN);

    this.str = char_str;
    this.rotate = randMargin(0, ROTATE_MARGIN);
    this.alpha = randMargin(GLOBAL_ALPHA, ALPHA_MARGIN);
    
    // save vector position
    Vector.call(this, x, y);

    // save inverse of current typewriter offsets
    // useful for applying future changing offsets
    // in redraw functions
    this._subtract( canvas_offset.multiplyBy( container_scale ) )
        ._subtract( container_offset );

    this.draw();
}

Character.prototype = Object.create( Vector.prototype );

Character.prototype.draw = function () {
    // apply current typewriter offsets
    var vec = this.add( canvas_offset.divideBy(container_scale) );

    textCtx.save();
    if (container_scale !== 1) {
        textCtx.translate(container_offset.x, container_offset.y);
        textCtx.scale(container_scale, container_scale);
    }
    textCtx.translate(vec.x, vec.y);
    textCtx.rotate( this.rotate );
    textCtx.globalAlpha = this.alpha;
    textCtx.fillText(this.str, 0, 0);
    textCtx.restore();
};

DOMEvent.on(window, 'resize', function () {
    TypeWriter.reposition();
});

/*
*
* mobile app listener 
*
*/

DOMEvent.on(document, 'deviceready', function(){

    // vibrate gives option to clear typewriter
    shake.startWatch(function () {

        if (!App.running) return;

        navigator.notification.confirm("Do you want to clear the canvas?", function (button) {
            if (button === 1) {
                TypeWriter.reset();
            }
        });

    });

}, false);

/*
*
* basic app handlers
*
*/
DOMEvent.on(window, 'hashchange', function () {
    var hash = window.location.hash;
    if (!hash || hash === '#') {
        // splash screen
        sendEvent('button', 'backToSplash');
        App.stop();
    } else if (hash === '#typing') {
        // start typing
        sendEvent('button', 'startTyping');
        App.start();
    } else if (hash === '#paste') {
        // paste text
        sendEvent('button', 'pasteText');
        pasteText();
    }
});

// onload wipe hash?
DOMEvent.on(window, 'load', function () {
    if (window.location.hash) {
        window.location.hash = '';
    }
});

var pasteText = (function () {
    /*

    form submit handler to start secondary 
    function of pasting text to appear simulated

    */
    var section2 = document.getElementById('splash-section-2'),
        section3 = document.getElementById('splash-section-3'),
        paste_cancel = document.getElementById('paste-cancel'),
        form = document.pastetext;

    // add event handler once
    DOMEvent.on(form, 'submit', function (e) {
        var text = form.pasted.value,
            lines = [];
        e.preventDefault();

        if (text) {
            sendEvent('action', 'Submitted text');
            // begin app
            App.start();

            // add each line
            lines = text.split(/\n/);

            for (var i = 0, len = lines.length; i < len; i++) {
                var item = lines[i];
                // paste text
                TypeWriter.addCharacter(item);
                // new line
                Cursor.newline();
            }
        }
    });

    App.splash_events.push(function () {
        // empty textarea
        form.pasted.value = '';
        // retoggle section visibility
        section2.classList.remove('hidden');
        section3.classList.add('hidden');
    });

    DOMEvent.on(paste_cancel, 'click', function () {
        App.splash();
    });

    return function pasteText () {
        // hide section 2 action buttons
        section2.classList.add('hidden');
        // show section 3 textbox
        section3.classList.remove('hidden');

        form.pasted.focus();
    };
})();

/*
*
* some miscellaneous functions
*
*/

function sendEvent() {
    var args = Array.prototype.slice.call( arguments );

    console.log( args );

    // send to Google
    window.ga.apply(this, ['send','event'].concat( args ));
}

function forceSpace () {
    // firefox allows navigation within input
    // this forces cursor to the end
    this.value = '';
    this.value = ' ';
}

function getPositionFromEvent (e) {
    var touch = e.touches && e.touches[0] || {},
        _x = e.clientX || touch.clientX || pos_vec.x,
        _y = e.clientY || touch.clientY || pos_vec.y;
    return new Vector(_x, _y);
}

/*
*
* helper functions
*
*/
function makeMultiAudio (src, instances) {
    var output = [],
        current = 0,
        num = instances || 5,
        Audio = window.Audio || function () {};
    for (var i = 0; i < num; i++) {
        output.push(new Audio(src));
    }
    this.play = function () {
        var audio = output[current++ % num];
        audio.currentTime = 0;
        audio.play();
    };
}

function randRange (min, max) {
    var value = (Math.random() * (max - min)) + min;
    return value;
}

function randMargin (num, margin) {
    return randRange(num - margin, num + margin);
}

function asyncForLoop (arr, process_fn, cb_fn) {
    // Copyright 2009 Nicholas C. Zakas. All rights reserved.
    // MIT Licensed
    // http://www.nczonline.net/blog/2009/08/11/timed-array-processing-in-javascript/
    
    var i = 0,
        len = arr.length,
        loop_finished = cb_fn || function () {};

    if (!len) {
        loop_finished();
        return;
    }

    window.setTimeout(function () {
        var start = +new Date();
        do {
            process_fn.call(this, arr[i], i);
        } while (++i < len && (+new Date() - start < 50));

        if (i < len) {
            // call next item
            window.setTimeout(arguments.callee, 25);
        } else {
            loop_finished();
        }
    }, 25);
}