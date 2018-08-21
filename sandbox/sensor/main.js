// @ts-check
import {Thingy52Control} from './thingy52control.js';

const thingy52 = new Thingy52Control();

let plant = null;

export function init() {
    console.log("Init main");

    plant = document.querySelector("#plant");
    
    const temperature = addBar(1, 1, '#ff0000');
    const accelx = addBar(-1, 1, '#ffff00');
    const accely = addBar(1, -1, '#00dd00');
    const accelz = addBar(-1, -1, '#eeeeee');

    const scanbtn = document.querySelector("#scanbtn");
    console.log(scanbtn, thingy52);
    scanbtn.addEventListener('click', () => thingy52.scan());

    thingy52.addEventListener('data', e => {
        const data = e.detail.data;

        if(!data) return;

        if(data.type === 'temperature') {
            updateBar(temperature, data.value);
        } else if(data.type === 'acceleration') {
            updateBar(accelx, data.value.x);
            updateBar(accely, data.value.y);
            updateBar(accelz, data.value.z);
        }
    });
}

function addBar(x,z,color) {
    if(!plant)return;
    
    
    let bar = document.createElement('a-cylinder');
    bar.setAttribute('position', `${x} -0.1 ${z}`);
    bar.setAttribute('radius','0.2');
    bar.setAttribute('color',color);
    bar.setAttribute('transparent','true');
    bar.setAttribute('opacity','0.6');
    bar.setAttribute("height", '0.2');
    
    let barlbl = document.createElement('a-text');
    barlbl.setAttribute('position', `${x+0.25} 0.2 ${z}`);
    barlbl.setAttribute('value', 'N/A');
    
    plant.appendChild(bar);
    plant.appendChild(barlbl);

    return {bar:bar,label:barlbl, x:x, z:z};
}

function updateBar(bar, value) {
    bar.bar.setAttribute("height", Math.abs(value)/20);
    bar.bar.setAttribute("position", `${bar.x} ${value/40} ${bar.z}`);    
    bar.label.setAttribute("value", value.toFixed(1));
}
