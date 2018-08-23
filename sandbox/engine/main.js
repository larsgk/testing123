// @ts-check
import {Thingy52Control} from './thingy52control.js';

const thingy52 = new Thingy52Control();

let viz = null;

export function init() {
    console.log("Init main");

    viz = document.querySelector("#viz");
    
//    const temperature = addBar(1, 1, '#ff0000');
    const accelx = addBubble(1, 1, 0.9, '#ff0000');
    const accely = addBubble(1, 1, -1, '#00ff00');
    const accelz = addBubble(-1, 1, 0.9, '#0000ff');

    const scanbtn = document.querySelector("#scanbtn");
    console.log(scanbtn, thingy52);
    scanbtn.addEventListener('click', () => thingy52.scan());

    thingy52.addEventListener('data', e => {
        const data = e.detail.data;

        if(!data) return;

        if(data.type === 'temperature') {
            // updateBar(temperature, data.value);
        } else if(data.type === 'acceleration') {
            accelx.setAttribute('radius',`${Math.abs(data.value.x/20)}`);
            accely.setAttribute('radius',`${Math.abs(data.value.y/20)}`);
            accelz.setAttribute('radius',`${Math.abs(data.value.z/20)}`);
        }
    });
}

function addBubble(x,y,z,color) {
    if(!viz)return;
    
    
    let bubble = document.createElement('a-sphere');
    bubble.setAttribute('position', `${x} ${y} ${z}`);
    bubble.setAttribute('radius','0.5');
    bubble.setAttribute('color',color);
    bubble.setAttribute('transparent','true');
    bubble.setAttribute('opacity','0.6');
    
    viz.appendChild(bubble);

    return bubble;
}
