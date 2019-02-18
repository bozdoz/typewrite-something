export function sendEvent() {
  var args = Array.prototype.slice.call( arguments );

  // send to Google
  window.ga.apply(this, ['send','event'].concat( args ));
}