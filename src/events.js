const stamp_key = 'tws_stamp'
const events_key = 'tws_event'
const stamp = (function() {
  var i = 0
  return function stamp(obj) {
    if (!obj[stamp_key]) {
      obj[stamp_key] = ++i
    }
    return obj[stamp_key]
  }
})()

class DOMEvent {
  // Inspired by LeafletJS
  // todo: better backwards compatibility

  getId(obj, type, fn, context) {
    return type + stamp(fn) + (context ? '_' + stamp(context) : '')
  }

  on(obj, type, fn, context) {
    var id = this.getId.apply(this, arguments),
      handler = function(e) {
        return fn.call(context || obj, e || window.event)
      }

    if (!obj) return

    if ('addEventListener' in obj) {
      obj.addEventListener(type, handler)
    } else if ('attachEvent' in obj) {
      obj.attachEvent('on' + type, handler)
    }

    obj[events_key] = obj[events_key] || {}
    obj[events_key][id] = handler
  }

  off(obj, type, fn, context) {
    var id = this.getId.apply(this, [obj, type, fn, context]),
      handler = obj[events_key] && obj[events_key][id]

    if (!obj) return

    if ('removeEventListener' in obj) {
      obj.removeEventListener(type, handler)
    } else if ('detachEvent' in obj) {
      obj.detachEvent('on' + type, handler)
    }

    obj[events_key][id] = null
  }
}

export default new DOMEvent()
