/* global AFRAME */

/**
 * Draw dynamic colorful rectangles.
 */
AFRAME.registerComponent('heat-map-a', {
    schema: {type: 'selector'},
  
    init: function () {
      var canvas = this.canvas = this.data;
      var ctx = this.ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      console.log(canvas.width, canvas.height);
    },
  
    tick: function (t) {
      var ctx = this.ctx;
      var canvas = this.canvas = this.data;
      ctx.beginPath();
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  
      const now = Date.now();

      const vals = window.realheat ? window.heatValues : window.historyValues;
  
      this.heatSpot(ctx, 100, 100, vals.x);
      this.heatSpot(ctx, 120, 250, vals.y);
      this.heatSpot(ctx, 130, 400, vals.z);
    },
  
    heatSpot: function(ctx, x, y, value) {
      ctx.beginPath();
      let gradient = ctx.createRadialGradient(x, y, 5, x, y, 10 + 60 * value);
      const colorHue = Math.min(120, Math.max(0, (1-value) * 120));
      const heatcolor = `hsl(${colorHue}, 100%, 40%)`;
      gradient.addColorStop(0, heatcolor);
      gradient.addColorStop(1, 'white');
      ctx.fillStyle = gradient;
      ctx.arc(x, y, 10 + 60 * value, 0, Math.PI*2);
      ctx.fill();
    } 
  });