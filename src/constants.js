// mapping for soundless keys
export const NO_AUDIO = {
  0: 'PRTSCR',
  8: 'BACKSPACE',
  9: 'TAB',
  16: 'SHIFT',
  17: 'CTRL',
  18: 'ALT',
  20: 'CAPSLOCK',
  27: 'ESC',
  32: 'SPACE',
  33: 'PGUP',
  34: 'PGDN',
  35: 'END',
  36: 'HOME',
  37: 'LEFT',
  38: 'UP',
  39: 'RIGHT',
  40: 'DOWN',
  45: 'INSERT',
  46: 'DEL',
  115: 'F4',
  117: 'F6',
  119: 'F8',
  120: 'F9',
  121: 'F10',
  123: 'F12'
}

export const IS_IOS = navigator.userAgent.match(/(iPad|iPhone|iPod)/g)
export const DEVICE_PIXEL_RATIO = window.devicePixelRatio || 1
export const TEXT_COLOR = '#150904'
export const CURSOR_COLOR = '#4787ea'
export const GLOBAL_ALPHA = 0.72
export const ALPHA_MARGIN = 0.06
export const ROTATE_MARGIN = 0.05
export const TRANSLATE_MARGIN = 0.2
