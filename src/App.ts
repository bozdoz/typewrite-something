import MultiAudio from './utils/MultiAudio';
import NO_AUDIO from './helpers/NO_AUDIO';
import { TypeWriter } from './Typewriter';
import { container, textInput, cursorCanvas } from './helpers/getElements';
import positionElem from './utils/positionElem';
import getPositionFromEvent from './utils/getPositionFromEvent';
import Vector from './utils/Vector';

const keypressAudio = new MultiAudio('/static/audio/keypress.mp3', 5);
const newlineAudio = new MultiAudio('/static/audio/return.mp3', 2);
const eventTarget = cursorCanvas;

class App {
  mousemovedelay = 150;

  running = false;

  typewriter = new TypeWriter();

  start() {
    if (this.running) return;

    this.running = true;
    this.typewriter.reset();
    this.events('on');
    this.emptyText();
    this.focusText();
    this.typewriter.cursor.draw();
  }

  stop() {
    if (!this.running) return;
    this.running = false;

    // kill events
    this.events('off');
    this.removeMoveEvent();
  }

  events = (onoff = 'on') => {
    const documentEvents = {
      mousedown: this.handleMouseDown,
      touchstart: this.handleTouchStart,
      mouseup: this.handleMouseUp,
      touchend: this.handleMouseUp,
    } as any;
    const cursorEvents = {
      keydown: this.handleKeyDown,
      keyup: this.handleKeyUp,
      focus: this.focus,
      keypress: this.handleKeyPress,
    } as any;

    let key;
    let fnc;
    const method = onoff === 'on' ? 'addEventListener' : 'removeEventListener';

    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (key in documentEvents) {
      fnc = documentEvents[key];
      eventTarget[method](key, fnc);
    }

    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (key in cursorEvents) {
      fnc = cursorEvents[key];
      textInput[method](key, fnc);
    }
  };

  pressedKeys: Record<string, boolean> = {};

  keyDownCount = 0;

  /**
   * keydown handles audio
   * @param {KeyboardEvent} e
   */
  handleKeyDown = (e: KeyboardEvent) => {
    const isMeta = e.altKey || e.ctrlKey || e.metaKey;
    const noAudio = (NO_AUDIO as any)[e.which] || isMeta;
    const isPressed = this.pressedKeys[e.code];

    if (isPressed) {
      return;
    }

    if (!noAudio) {
      this.pressedKeys[e.code] = true;
      this.keyDownCount += 1;

      if (e.key === 'Enter') {
        newlineAudio.play();
      } else {
        keypressAudio.play();
      }
      return;
    }

    if (noAudio === 'TAB') {
      // refocus
      window.setTimeout(() => {
        textInput.focus();
      }, 10);
      e.preventDefault();
    }
  };

  handleKeyPress = (e: KeyboardEvent) => {
    const isMeta = e.altKey || e.ctrlKey || e.metaKey;
    const disable = e.key === 'Tab' || e.key === 'Enter';

    if (disable || isMeta) {
      e.preventDefault();
    }

    return !disable;
  };

  /**
   * keyup handles character input and navigation
   * @param {KeyboardEvent} e
   */
  handleKeyUp = (e: KeyboardEvent) => {
    const { typewriter } = this;
    const { cursor } = typewriter;
    const isMeta = e.altKey || e.ctrlKey || e.metaKey;
    const { key, code } = e;
    const nav = cursor.navButtons[key];
    const ignoreKey = key === 'Shift';
    // TODO: add test for first character being space
    // ignores first character, which should always be a space
    const letters = textInput.value.substr(1);

    if (this.pressedKeys[code]) {
      delete this.pressedKeys[code];
      this.keyDownCount -= 1;
    }

    if (isMeta) {
      // ignore if user is refreshing or navigating or something
      this.emptyText();

      return;
    }

    if (ignoreKey) {
      return;
    }

    if (nav) {
      nav();
    } else if (letters) {
      typewriter.addCharacter(letters);
    }

    this.emptyText();
    this.focusText();
  };

  focus = () => {
    this.focusText();
  };

  mouseuptimeout?: number;

  mouseDownStartPos: Vector | null = null;

  /**
   * handleMouseDown
   * @param {MouseEvent} e
   */
  handleMouseDown = (e: MouseEvent | TouchEvent) => {
    // TODO: add menu somehow somewhere
    // ignore right click
    if ('button' in e && e.button === 2) return;

    // mousemove would be expensive, so we add it only after the mouse is down
    this.mouseuptimeout = window.setTimeout(() => {
      this.mouseDownStartPos = getPositionFromEvent(e);

      eventTarget.addEventListener('touchmove', this.handleMouseMove);
      eventTarget.addEventListener('mousemove', this.handleMouseMove);
    }, this.mousemovedelay);
  };

  /**
   * handleTouchStart
   * @param {TouchEvent} e
   */
  handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.touches && e.touches.length === 2) {
      // todo: work on zooming
      // (https://codepen.io/bozdoz/pen/xxEmJyx?editors=0011)

      return true;
    }

    return this.handleMouseDown(e);
  };

  /**
   * handleMouseMove
   * @param {MouseEvent} e
   */
  handleMouseMove = (e: MouseEvent | TouchEvent) => {
    // probably prevents browser zoom
    e.preventDefault();
    e.stopPropagation();

    if (!this.mouseDownStartPos) {
      return;
    }

    const _position = getPositionFromEvent(e)._subtract(this.mouseDownStartPos);

    // fake canvas moving by cheaply altering css
    positionElem(container, _position);

    this.typewriter.cursor.clear();
  };

  /**
   * handleMouseUp
   * @param {MouseEvent} e
   */
  handleMouseUp = (e: MouseEvent | TouchEvent) => {
    const rightClick = 'button' in e && e.button === 2;
    const stillTouches = 'touches' in e && e.touches.length > 0;

    if (rightClick || stillTouches) return;

    this.removeMoveEvent();

    const position = getPositionFromEvent(e);

    if (this.mouseDownStartPos) {
      // reposition canvas if mouse moved
      position._subtract(this.mouseDownStartPos);

      this.typewriter.reposition(position);
      this.mouseDownStartPos = null;
    } else {
      // act as if it were just a click handler
      this.updateCursor(position);
    }
  };

  /**
   * Updates cursor to a given position
   * @param {Vector} position
   */
  updateCursor = (position: Vector) => {
    this.typewriter.cursor.moveToClick(position);
    this.focusText();
  };

  removeMoveEvent = () => {
    window.clearTimeout(this.mouseuptimeout);
    eventTarget.removeEventListener('touchmove', this.handleMouseMove);
    eventTarget.removeEventListener('mousemove', this.handleMouseMove);
  };

  emptyText = () => {
    // leaves a space to disable automatic ProperCase in mobile
    textInput.value = '-';
  };

  focusText = () => {
    textInput.focus();
  };
}

export default App;
