import { randMargin } from './utils'
import {
  canvas_offset,
  container_scale,
  container_offset,
  textCtx
} from './canvas'
import {
  position
} from './Cursor'
import {
  TRANSLATE_MARGIN,
  ROTATE_MARGIN,
  GLOBAL_ALPHA,
  ALPHA_MARGIN
} from './constants'
import Vector from './Vector'

/**
 * Character class for drawing characters on TypeWriter singleton
 */
function Character(char_str, _x, _y) {
  const x = randMargin(_x || position.get().x, TRANSLATE_MARGIN)
  const y = randMargin(_y || position.get().y, TRANSLATE_MARGIN)

  // eslint-disable-next-line no-console
  console.log('character')

  this.str = char_str
  this.rotate = randMargin(0, ROTATE_MARGIN)
  this.alpha = randMargin(GLOBAL_ALPHA, ALPHA_MARGIN)

  // save vector position
  Vector.call(this, x, y)

  // save inverse of current typewriter offsets
  // useful for applying future changing offsets
  // in redraw functions
  this._subtract(canvas_offset.multiplyBy(container_scale.get()))._subtract(
    container_offset
  )

  this.draw()
}

Character.prototype = Object.create(Vector.prototype)

Character.prototype.draw = function() {
  // apply current typewriter offsets
  const vec = this.add(canvas_offset.divideBy(container_scale.get()))

  textCtx.save()
  if (container_scale.get() !== 1) {
    textCtx.translate(container_offset.x, container_offset.y)
    textCtx.scale(container_scale.get(), container_scale.get())
  }
  textCtx.translate(vec.x, vec.y)
  textCtx.rotate(this.rotate)
  textCtx.globalAlpha = this.alpha
  textCtx.fillText(this.str, 0, 0)
  textCtx.restore()
}

export default Character
