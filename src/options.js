const FONT_SIZE = 26;
const letter_size = parseInt(Math.min(FONT_SIZE, window.innerWidth / 17))

const letter_width = letter_size * 12 / 20

const line_height = letter_size + 8;

export default {
  line_height,
  letter_width,
  play_audio: true,
}