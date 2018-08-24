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

export function init() {
    console.log("Init main");

    viz = document.querySelector("#viz");
    graph = document.querySelector("#graph");
    
    const accelx = addBubble(1, 1, 0.9, '#ff0000');
    const accely = addBubble(1, 1, -1, '#00ff00');
    const accelz = addBubble(-1, 1, 0.9, '#0000ff');

    addGuide('zero_guide', {min:0,name:"ZERO"});
    addPen('x', {color:'#ff0000', name:'x', lineWidth:3});
    addPen('y', {color:'#00ff00', name:'y', lineWidth:3});
    addPen('z', {color:'#0000ff', name:'z', lineWidth:3});

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

            addValue('x', data.value.x);
            addValue('y', data.value.y);
            addValue('z', data.value.z);
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
    bubble.setAttribute('radius','0.5');
    bubble.setAttribute('color',color);
    bubble.setAttribute('transparent','true');
    bubble.setAttribute('opacity','0.6');
    
    viz.appendChild(bubble);

    return bubble;
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