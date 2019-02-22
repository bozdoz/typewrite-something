import { NO_AUDIO, IS_IOS } from './constants'
import options from './options'
import { makeMultiAudio } from './utils'
import { cursorInput, container } from './canvas'
import DOMEvent from './events'
import { position } from './Cursor'
import TypeWriter from './TypeWriter'
import Vector from './Vector'

const ENTER = 13

const keypress_audio =
  window.keypress_audio || new makeMultiAudio('/assets/sounds/keypress.mp3', 5)
const newline_audio =
  window.newline_audio || new makeMultiAudio('/assets/sounds/return.mp3', 2)

function App() {
  let mouseuptimeout
  let mousemovedelay
  let mousedowntime
  let clickdelay
  let original_pos
  // let zoom_distance;
  // let zoom_scale;
  // let zoom_center_diff;
  const typewriter = new TypeWriter()

  // eslint-disable-next-line no-console
  console.log('app')

  this.running = true

  this.reset = function() {
    mouseuptimeout = 0
    mousemovedelay = 150
    mousedowntime = 0
    clickdelay = 150
    original_pos = 0
    // zoom_distance = 0
    // zoom_scale = 0
    // zoom_center_diff = 0
  }

  this.start = function() {
    this.reset()
    typewriter.reset()
    this.events('on')
    cursorInput.focus()
    forceSpace.call(cursorInput)
    typewriter.cursor.draw()
  }

  this.events = function(_onoff) {
    console.log('this.events')
    const onoff = _onoff || 'on';
    const document_events = {
        mouseup,
        touchend,
        mousedown,
        touchstart,
      };
    const cursor_events = {
        keydown,
        keyup,
        focus,
      };
    let key;
    let fnc;

    for (key in document_events) {
      fnc = document_events[key]
      DOMEvent[onoff](document, key, fnc)
    }

    for (key in cursor_events) {
      fnc = cursor_events[key]
      DOMEvent[onoff](cursorInput, key, fnc)
    }

    if (IS_IOS) {
      DOMEvent[onoff](document, 'touchstart', iosTouchStart)
    }
  }

  this.start()

  /**
   * keydown handles audio
   */
  function keydown(e) {
    var no_audio = NO_AUDIO[e.which]

    if (!no_audio && options.play_audio) {
      if (e.which === ENTER) {
        newline_audio.play()
      } else {
        keypress_audio.play()
      }
      return true
    }

    if (no_audio === 'TAB') {
      // TODO : add 2 or 4 spaces

      // refocus
      window.setTimeout(function() {
        cursorInput.focus()
      }, 10)
      e.preventDefault()
    }
  }

  function keyup(e) {
    /**
     * keyup handles character input and navigation
     */
    var nav = typewriter.cursor.nav[e.which],
      value = this.value.substr(1)

    console.log('keyup')

    if (!value && !nav) return

    if (nav) {
      nav()
    } else {
      typewriter.addCharacter(value)
    }
    forceSpace.call(this)
  }

  function focus() {
    forceSpace.call(this)
  }

  function mouseup(e) {
    removeMoveEvent()

    if (original_pos) {
      var _position = getPositionFromEvent(e)

      _position._subtract(original_pos)

      typewriter.reposition(_position)
      original_pos = null
    } else if (new Date().valueOf() - mousedowntime <= clickdelay && !IS_IOS) {
      // click
      updateCursor(e)
    }
  }

  function touchend(e) {
    if (!e.touches.length) {
      if (e.changedTouches.length) {
        e.clientX = e.changedTouches[0].clientX
        e.clientY = e.changedTouches[0].clientY
      } else {
        removeMoveEvent()
        return
      }
    }

    return mouseup(e)
  }

  function mousedown(e) {
    // ignore right click
    if (e.button === 2) return

    // single finger or mouse
    mousedowntime = new Date()

    mouseuptimeout = window.setTimeout(function() {
      original_pos = original_pos || getPositionFromEvent(e)

      DOMEvent.on(document, 'mousemove', mousemove)
      DOMEvent.on(document, 'touchmove', mousemove)
      DOMEvent.on(document, 'mouseup', removeMoveEvent)
    }, mousemovedelay)
  }

  function touchstart(e) {
    if (e.touches && e.touches.length === 2) {
      // todo: work on zooming
      e.preventDefault()
      return false
    } else {
      return mousedown(e)
    }
  }

  function iosTouchStart(e) {
    return updateCursor(e)
  }

  function mousemove(e) {
    if (!original_pos) return
    // move holder
    var _position = getPositionFromEvent(e)

    _position._subtract(original_pos)

    container.style.left = _position.x + 'px'
    container.style.top = _position.y + 'px'
    typewriter.cursor.clear()
  }

  function updateCursor(e) {
    var _position = getPositionFromEvent(e),
      letter_offset = new Vector(options.letter_width / 2, options.line_height / 2),
      _newpos = _position.subtract(letter_offset)
    typewriter.cursor.update(_newpos)
    cursorInput.focus()
  }

  function removeMoveEvent() {
    window.clearTimeout(mouseuptimeout)
    DOMEvent.off(document, 'mousemove', mousemove)
    DOMEvent.off(document, 'touchmove', mousemove)
    DOMEvent.off(document, 'mouseup', removeMoveEvent)
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

  /**
   * mobile app listener
   */
  DOMEvent.on(
    document,
    'deviceready',
    function() {
      // vibrate gives option to clear typewriter
      window.shake.startWatch(function() {
        if (!this.running) return
        navigator.notification.confirm(
          'Do you want to clear the canvas?',
          function(button) {
            if (button === 1) {
              typewriter.reset()
            }
          }
        )
      })
    },
    false
  )
}

/**
 * basic app handlers
 */
function forceSpace() {
  // firefox allows navigation within input
  // this forces cursor to the end
  this.value = ''
  this.value = ' '
}

function getPositionFromEvent(e) {
  var touch = (e.touches && e.touches[0]) || {},
    _x = e.clientX || touch.clientX || position.get().x,
    _y = e.clientY || touch.clientY || position.get().y
  return new Vector(_x, _y)
}

export default App
