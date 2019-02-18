import Vector from './Vector'

export const container = document.getElementById('container');
export const container_origin = new Vector(0,0);
export const container_scale = 1;
export const container_offset = new Vector(0,0);
export const canvas_offset = new Vector(0, 0);
export const textCanvas = document.getElementById('text-canvas');
export const textCtx = textCanvas.getContext('2d', {alpha:true});
export const cursorCanvas = document.getElementById('cursor-canvas');
export const cursorCtx = cursorCanvas.getContext('2d');
export const cursorInput = document.getElementById('cursor-input');