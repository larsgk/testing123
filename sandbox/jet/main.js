// @ts-check
import {Thingy52Control} from './thingy52control.js';

const thingy52 = new Thingy52Control();

let viz = null;
let graph = null;

const drawdata = {
    pens: [],
    guides: [],
    min: -10,
    max: 10,
    topmargin: 8,
    bottommargin: 8,
    resolution: 50,
    running: true
};

const accu = {
    x: 0,
    y: 0,
    z: 0
}

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

export function init() {
    console.log("Init main");

    viz = document.querySelector("#viz");
    graph = document.querySelector("#graph");
    
    // const accelx = addBubble(1, -0.8, -1.3, '#00ff00');
    // const accely = addBubble(0, -0.8, -1.3, '#00ff00');
    // const accelz = addBubble(-1, -0.8, -1.3, '#00ff00');

    addGuide('zero_guide', {min:0,name:"ZERO"});
    addPen('x', {color:'#ff0000', name:'x', lineWidth:3});
    addPen('y', {color:'#00ff00', name:'y', lineWidth:3});
    addPen('z', {color:'#0000ff', name:'z', lineWidth:3});

    addPen('accux', {color:'#ff8080', name:'accux', lineWidth:1});
    addPen('accuy', {color:'#80ff80', name:'accuy', lineWidth:1});
    addPen('accuz', {color:'#8080ff', name:'accuz', lineWidth:1});

    const scanbtn = document.querySelector("#scanbtn");
    console.log(scanbtn, thingy52);
    scanbtn.addEventListener('click', () => thingy52.scan());

    const fullscreenbtn = document.querySelector("#fullscreenbtn");
    fullscreenbtn.addEventListener('click', () => { toggleFullScreen(); });
    
    let oldx=0,oldy=0,oldz=0;

    thingy52.addEventListener('data', e => {
        const data = e.detail.data;

        if(!data) return;

        if(data.type === 'temperature') {
            document.querySelector("#temperaturelbl").setAttribute('value',`${data.value.toFixed(1)} C`);
        } else if(data.type === 'acceleration') {
            addValue('x', data.value.x);
            addValue('y', data.value.y);
            addValue('z', data.value.z);

            accu.x += Math.abs(data.value.x-oldx);
            accu.y += Math.abs(data.value.y-oldy);
            accu.z += Math.abs(data.value.z-oldz);

            if(accu.x > 20) accu.x = 20;
            if(accu.y > 20) accu.y = 20;
            if(accu.z > 20) accu.z = 20;

            oldx = data.value.x;
            oldy = data.value.y;
            oldz = data.value.z;
            
            accu.x *= 0.9;
            accu.y *= 0.9;
            accu.z *= 0.9;

            addValue('accux', accu.x);
            addValue('accuy', accu.y);
            addValue('accuz', accu.z);

            updateBubble(accelx, accu.x);
            updateBubble(accely, accu.y);
            updateBubble(accelz, accu.z);

        }
    });

    const ro = new ResizeObserver( entries => {
        for (let entry of entries) {
            const cr = entry.contentRect;
            // console.log('Element:', entry.target);
            // console.log(`Element size: ${cr.width}px x ${cr.height}px`);
            // console.log(`Element padding: ${cr.top}px ; ${cr.left}px`);
            graph._width = Math.ceil(cr.width);
            graph._height = Math.ceil(cr.height);
            graph.setAttribute('width',graph._width);
            graph.setAttribute('height',graph._height);
            _recalcFactors();
        }
    });
    
    // Observe one or multiple elements
    ro.observe(graph);


    _recalcFactors();
    requestAnimationFrame(_gameLoop);

}

function addBubble(x,y,z,color) {
    if(!viz)return;
    
    let bubble = document.createElement('a-sphere');
    bubble.setAttribute('position', `${x} ${y} ${z}`);
    bubble.setAttribute('radius','0.2');
    bubble.setAttribute('color',color);
    bubble.setAttribute('transparent','true');
    bubble.setAttribute('opacity','0.6');
    
    viz.appendChild(bubble);

    return bubble;
}

function updateBubble(bubble, value) {
    if(value < 0.5) {
        bubble.setAttribute('radius', '0.2');
        bubble.setAttribute('color', '#00ff00');
    } else if(value < 2) {
        bubble.setAttribute('radius', '0.3');
        bubble.setAttribute('color', '#ffff00');
    } else {
        bubble.setAttribute('radius', '0.5');
        bubble.setAttribute('color', '#ff0000');
    }
}


// drawing funcs
function addPen(id, options)  {
    if(drawdata.pens[id]) {
      console.log("Pen already added: ", id);
    }

    drawdata.pens[id] = {
      color:options.color ? options.color : '#000',
      name:options.name ? options.name : "",
      line:!options.dotsOnly,
      lineWidth:options.lineWidth ? options.lineWidth : 1,
      data:[]
    };
}

function addGuide(id, options)  {
    if(drawdata.guides[id]) {
      console.log("Guide already added: ", id);
      return;
    }

    if(!options || options.min === undefined) {
      console.log("Guide needs at least a 'min' value defined");
      return;
    }

    drawdata.guides[id] = {
      color:options.color ? options.color : '#888',
      name:options.name ? options.name : "",
      min:options.min,
      height:options.height
    };
}

function addValue(id, value, timestamp) {
    var pen = drawdata.pens[id];
    if(!pen)
      return;

    if(!timestamp) timestamp = Date.now(); // Maybe: performance.timing.navigationStart + performance.now();

    // time must go forward
    if(pen.data.length > 0 && pen.data[pen.data.length-1].t >= timestamp)
      return;

    pen.data.push({v:value, t:timestamp});
}


function _recalcFactors() {
    drawdata._ya = -(graph.height - drawdata.bottommargin - drawdata.topmargin) / (drawdata.max - drawdata.min);
    drawdata._yb = drawdata.topmargin - drawdata._ya * drawdata.max;
}

function _calcY(val) {
    return drawdata._ya * val + drawdata._yb
}

function _calcPos(point, pos, now) {
    pos.x = graph.width - 5 - (now - point.t) * 0.001 * drawdata.resolution;
    pos.y = drawdata._ya * point.v + drawdata._yb;
}

function _gameLoop(ts) {
    _repaint(Date.now()); // Maybe: performance.timing.navigationStart + ts
    if(drawdata.running)
        requestAnimationFrame(_gameLoop);
}

function _repaint(now) {
    var ctx = graph.getContext('2d');

    ctx.clearRect(0,0,graph.width, graph.height);

    var id, pen, guide, ptr, point, pos = {}, dots = [];

    // Draw guides
    for(id in drawdata.guides) {
      guide = drawdata.guides[id];
      if(guide.height !== undefined) {
        ctx.fillStyle = guide.color;
        ctx.fillRect(0,_calcY(guide.min),graph.width,drawdata._ya * guide.height);
      } else {
        ctx.beginPath();
        ctx.strokeStyle = guide.color;
        ctx.moveTo(0, _calcY(guide.min));
        ctx.lineTo(graph.width, _calcY(guide.min));
        ctx.stroke();
      }
    }

    // Draw pens
    for(id in drawdata.pens) {
      pen = drawdata.pens[id];
      if(pen.data && pen.data.length > 1) {
        ctx.beginPath();
        ctx.lineWidth = pen.lineWidth;
        ptr = pen.data.length-1;
        _calcPos(pen.data[ptr], pos, now);
        if(pen.line) {
          ctx.strokeStyle = pen.color;
          ctx.moveTo(pos.x, pos.y);
          // if(now - pos.t < 100) {
            dots.push({x:graph.width-5,y:pos.y,color:pen.color});
          // }
        } else {
          ctx.fillStyle = pen.color;
        }
        while(ptr >= 0 && pos.x > 0) {
          _calcPos(pen.data[ptr], pos, now);
          if(pen.line)
            ctx.lineTo(pos.x, pos.y);
          else {
            ctx.beginPath();
            ctx.arc(pos.x,pos.y,4,0,Math.PI*2,false);
            ctx.fill();
          }
          ptr--;
        }
       if(pen.line)
          ctx.stroke();
      }
    }

    ctx.lineWidth = 1.0;

    dots.forEach(function(dot) {
      ctx.beginPath();
      ctx.arc(dot.x,dot.y,4,0,Math.PI*2,false);
      ctx.fillStyle = dot.color;
      ctx.fill();
    })
}