import { asyncForLoop } from './utils'
import {
  textCtx,
  cursorCtx,
  container_scale,
  container,
  canvas_offset,
  cursorInput,
  // eslint-disable-next-line no-unused-vars
  container_origin,
} from './canvas'
import { DEVICE_PIXEL_RATIO, GLOBAL_ALPHA, TEXT_COLOR, CURSOR_COLOR } from './constants'
import options from './options'
import DOMEvent from './events'
import Character from './Character'
import Cursor, {
  // eslint-disable-next-line no-unused-vars
  pos_vec, 
  padding_vec,
} from './Cursor'
import Vector from './Vector'

let chars = []

function TypeWriter() {

  this.cursor = new Cursor();
  
  /**
   * TypeWriter singleton for handling characters
   * and global positioning system (GPS, ya know)
   */
  this.addCharacter = function(char_str, _x, _y) {
    if (_x && _y) {
      Cursor.update(new Vector(_x, _y))
    }
    for (var i = 0, len = char_str.length; i < len; i++) {
      var char = char_str[i]

      chars.push(new Character(char))
      Cursor.moveright()
    }
  }

  this.redraw = function() {
    /**
     * pure redraw (no resetting/clearing)
     */
    asyncForLoop(chars, process_fn)

    function process_fn(char) {
      char.draw()
    }
  }

  this.resetCanvases = function() {
    [textCtx, cursorCtx].forEach(function(ctx) {
      var canvas = ctx.canvas

      ctx.setTransform(1, 0, 0, 1, 0, 0)

      canvas.width = window.innerWidth * DEVICE_PIXEL_RATIO
      canvas.height = window.innerHeight * DEVICE_PIXEL_RATIO
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'

      ctx.scale(DEVICE_PIXEL_RATIO, DEVICE_PIXEL_RATIO)

      ctx.globalAlpha = GLOBAL_ALPHA
    })

    // reset contexts, because resizing wipes them
    textCtx.font = options.letter_size + 'px Special Elite, serif'
    textCtx.textBaseline = 'top'
    textCtx.fillStyle = TEXT_COLOR

    cursorCtx.fillStyle = CURSOR_COLOR
    cursorCtx.scale(container_scale, container_scale)
  }

  this.reposition = function(vec) {
    /**
     * offset characters for given x/y
     * useful for moving/dragging
     * useful for redrawing (b/c needs resetting)
     */
    canvas_offset._add(vec || new Vector(0, 0))

    container.style.left = '0px'
    container.style.top = '0px'

    this.resetCanvases()
    this.redraw()
  }

  this.reset = function() {
    // back to original blank canvas
    chars = []
    pos_vec = padding_vec
    canvas_offset = new Vector(0, 0)
    container_origin = new Vector(0, 0)
    container_scale = 1
    container.setAttribute('style', '')

    this.reposition()
    Cursor.draw()
    cursorInput.focus()
  }

  DOMEvent.on(window, 'resize', function() {
    this.reposition()
  })
}

export default TypeWriter
