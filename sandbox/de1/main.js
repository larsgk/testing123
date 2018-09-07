// @ts-check
import { FakeMesh } from './fake-mesh.js';

function toggleFullScreen() {
    var doc = window.document;
    var docEl = doc.documentElement;
  
    var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
  
    if(!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
      requestFullScreen.call(docEl);
    }
    else {
      cancelFullScreen.call(doc);
    }
}

let fakeMesh = new FakeMesh();

export function init() {
    console.log("Init main");

    const controls = document.querySelector('#controls');

    // create buttons for factories
    for(let type of fakeMesh.factoryTypes()) {
      const el = document.createElement('button');
      el.innerHTML = `Scan for ${type}`;
      el.addEventListener('click', () => fakeMesh.scanFor(type));
      controls.appendChild(el);
    }

    const fullscreenbtn = document.querySelector("#fullscreenbtn");
    fullscreenbtn.addEventListener('click', () => { toggleFullScreen(); });
}
