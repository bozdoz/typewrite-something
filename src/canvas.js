import Vector from './Vector'

export const container = document.getElementById('container');
export const container_origin = new Vector(0, 0);
export const container_scale = {
  _value: 1,
  get() { return this._value },
  set(value) { this._value = value },
}
export const container_offset = new Vector(0, 0);
export const canvas_offset = new Vector(0, 0);
const textCanvas = document.getElementById('text-canvas');
export const textCtx = textCanvas.getContext('2d', {alpha:true});
const cursorCanvas = document.getElementById('cursor-canvas');
export const cursorCtx = cursorCanvas.getContext('2d');
export const cursorInput = document.getElementById('cursor-input');