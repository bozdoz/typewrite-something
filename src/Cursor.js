import { cursorCtx, container_scale, cursorInput } from './canvas'
import {GLOBAL_ALPHA} from './constants'
import options from './options'
import Vector from './Vector'

export let padding_vec = (function() {
  var _x = Math.min(100, window.innerWidth / 8),
    _y = Math.min(_x, window.innerHeight / 8)
  return new Vector(_x, _y)
})()
export const position = {
  _value: padding_vec,
  get: function () { return this._value },
  set: function (value) { this._value = value },
}

/**
 * Cursor singleton for controlling cursor
 * position and visibility
 */
function Cursor() {
  var _cursor_timeout, _raf, _time, _opacity

  // eslint-disable-next-line no-console
  console.log('cursor')

  this.clear = function() {
    var _pos = position.get().subtract(1).divideBy(container_scale.get())

    cursorCtx.clearRect(_pos.x, _pos.y, options.letter_width + 2, options.line_height + 2)
  }

  this.update = function(vec) {
    this.clear()

    position.set(vec)
    cursorInput.style.left = Math.min(vec.x, window.innerWidth) + 'px'
    cursorInput.style.top = Math.min(vec.y, window.innerHeight) + 'px'
    this.draw()
  }

  this._draw = function() {
    var _pos = position.get().divideBy(container_scale.get())

    cursorCtx.fillRect(_pos.x, _pos.y, options.letter_width, options.line_height)
  }

  this.draw = function() {
    this._draw()

    window.clearTimeout(_cursor_timeout)
    if (_raf) {
      window.cancelAnimationFrame(_raf)
    }
    _opacity = GLOBAL_ALPHA
    _cursor_timeout = window.setTimeout(this.fadeOut.bind(this), 2200)
  }

  this.nudge = function(vec) {
    this.update(position.get().add(vec.multiplyBy(container_scale.get())))
  }

  this.moveleft = function() {
    this.nudge(new Vector(-options.letter_width, 0))
  }
  this.moveright = function() {
    this.nudge(new Vector(options.letter_width, 0))
  }
  this.moveup = function() {
    this.nudge(new Vector(0, -options.line_height))
  }
  this.movedown = function() {
    this.nudge(new Vector(0, options.line_height))
  }
  this.addtab = function() {
    this.nudge(new Vector(options.letter_width * 4, 0))
  }

  this.newline = function() {
    /*
                todo: newline might be better off
                moving to x = previous click location
                instead of paddingx
                */
    this.update(new Vector(padding_vec.x, position.get().y + options.line_height))
  }

  this.fadeOut = function() {
    _time = new Date()
    _raf = window.requestAnimationFrame(this._fadeanim.bind(this))
  }

  this._fadeanim = function() {
    var dt = new Date().valueOf() - _time,
      new_opacity = _opacity - (0.1 * dt) / 300

    if (new_opacity <= 0) {
      this.clear()
    } else {
      cursorCtx.save()
      this.clear()
      _opacity = new_opacity
      cursorCtx.globalAlpha = _opacity
      this._draw()
      cursorCtx.restore()
      _raf = window.requestAnimationFrame(this._fadeanim.bind(this))
    }
  }

  // mapping for keys that move cursor
  this.nav = {
    8: this.moveleft,
    9: this.addtab,
    37: this.moveleft,
    38: this.moveup,
    39: this.moveright,
    40: this.movedown,
    13: this.newline
  }
}

export default Cursor
