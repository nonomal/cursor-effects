function springyEmoji(wrapperEl) {
  var nDots = 7;

  var DELTAT = 0.01;
  var SEGLEN = 10;
  var SPRINGK = 10;
  var MASS = 1;
  var GRAVITY = 50;
  var RESISTANCE = 10;
  var STOPVEL = 0.1;
  var STOPACC = 0.1;
  var DOTSIZE = 11;
  var BOUNCE = 0.7;

  var emoji = "😂";
  var width = window.innerWidth;
  var height = window.innerHeight;
  var cursor = { x: width / 2, y: width / 2 };
  var particles = [];
  var element, canvas, context;

  var emojiAsImage;

  function init(wrapperEl) {
    this.element = wrapperEl || document.body;
    canvas = document.createElement("canvas");
    context = canvas.getContext("2d");

    canvas.style.top = "0px";
    canvas.style.left = "0px";
    canvas.style.pointerEvents = "none";

    if (wrapperEl) {
      canvas.style.position = "absolute";
      wrapperEl.appendChild(canvas);
      canvas.width = wrapperEl.clientWidth;
      canvas.height = wrapperEl.clientHeight;
    } else {
      canvas.style.position = "fixed";
      document.body.appendChild(canvas);
      canvas.width = width;
      canvas.height = height;
    }

    // Save emoji as an image for performance
    context.font = "16px serif";
    context.textBaseline = "middle";
    context.textAlign = "center";

    let measurements = context.measureText(emoji);
    let bgCanvas = document.createElement("canvas");
    let bgContext = bgCanvas.getContext("2d");

    bgCanvas.width = measurements.width;
    bgCanvas.height =
      measurements.actualBoundingBoxAscent +
      measurements.actualBoundingBoxDescent;

    bgContext.textAlign = "center";
    bgContext.font = "16px serif";
    bgContext.textBaseline = "middle";
    bgContext.fillText(
      emoji,
      bgCanvas.width / 2,
      measurements.actualBoundingBoxAscent
    );

    emojiAsImage = bgCanvas;

    var i = 0;
    for (i = 0; i < nDots; i++) {
      particles[i] = new Particle(emojiAsImage);
    }

    bindEvents();
    loop();
  }

  // Bind events that are needed
  function bindEvents() {
    this.element.addEventListener("mousemove", onMouseMove);
    this.element.addEventListener("touchmove", onTouchMove);
    this.element.addEventListener("touchstart", onTouchMove);
    window.addEventListener("resize", onWindowResize);
  }

  function onWindowResize(e) {
    width = window.innerWidth;
    height = window.innerHeight;

    if (wrapperEl) {
      canvas.width = wrapperEl.clientWidth;
      canvas.height = wrapperEl.clientHeight;
    } else {
      canvas.width = width;
      canvas.height = height;
    }
  }

  function onTouchMove(e) {
    // if (e.touches.length > 0) {
    //   for (var i = 0; i < e.touches.length; i++) {
    //     addParticle(
    //       e.touches[i].clientX,
    //       e.touches[i].clientY,
    //       canvImages[Math.floor(Math.random() * canvImages.length)]
    //     );
    //   }
    // }
  }

  function onMouseMove(e) {
    if (wrapperEl) {
      const boundingRect = wrapperEl.getBoundingClientRect();
      cursor.x = e.clientX - boundingRect.left;
      cursor.y = e.clientY - boundingRect.top;
    } else {
      cursor.x = e.clientX;
      cursor.y = e.clientY;
    }
  }

  function updateParticles() {
    canvas.width = canvas.width

    // follow mouse
    particles[0].position.x = cursor.x;
    particles[0].position.y = cursor.y;

    // Start from 2nd dot
    for (i = 1; i < nDots; i++) {
      var spring = new vec(0, 0);

      if (i > 0) {
        springForce(i - 1, i, spring);
      }

      if (i < nDots - 1) {
        springForce(i + 1, i, spring);
      }

      var resist = new vec(
        -particles[i].velocity.x * RESISTANCE,
        -particles[i].velocity.y * RESISTANCE
      );

      var accel = new vec(
        (spring.X + resist.X) / MASS,
        (spring.Y + resist.Y) / MASS + GRAVITY
      );

      particles[i].velocity.x += DELTAT * accel.X;
      particles[i].velocity.y += DELTAT * accel.Y;

      if (
        Math.abs(particles[i].velocity.x) < STOPVEL &&
        Math.abs(particles[i].velocity.y) < STOPVEL &&
        Math.abs(accel.X) < STOPACC &&
        Math.abs(accel.Y) < STOPACC
      ) {
        particles[i].velocity.x = 0;
        particles[i].velocity.y = 0;
      }

      particles[i].position.x += particles[i].velocity.x;
      particles[i].position.y += particles[i].velocity.y;

      var height, width;
      height = canvas.clientHeight;
      width = canvas.clientWidth;

      if (particles[i].position.y >= height - DOTSIZE - 1) {
        if (particles[i].velocity.y > 0) {
          particles[i].velocity.y = BOUNCE * -particles[i].velocity.y;
        }
        particles[i].position.y = height - DOTSIZE - 1;
      }

      if (particles[i].position.x >= width - DOTSIZE) {
        if (particles[i].velocity.x > 0) {
          particles[i].velocity.x = BOUNCE * -particles[i].velocity.x;
        }
        particles[i].position.x = width - DOTSIZE - 1;
      }

      if (particles[i].position.x < 0) {
        if (particles[i].velocity.x < 0) {
          particles[i].velocity.x = BOUNCE * -particles[i].velocity.x;
        }
        particles[i].position.x = 0;
      }

      particles[i].draw(context);
    }
  }

  function loop() {
    updateParticles();
    requestAnimationFrame(loop);
  }

  function vec(X, Y) {
    this.X = X;
    this.Y = Y;
  }

  function springForce(i, j, spring) {
    var dx = particles[i].position.x - particles[j].position.x;
    var dy = particles[i].position.y - particles[j].position.y;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len > SEGLEN) {
      var springF = SPRINGK * (len - SEGLEN);
      spring.X += (dx / len) * springF;
      spring.Y += (dy / len) * springF;
    }
  }

  function Particle(canvasItem) {
    this.position = { x: cursor.x, y: cursor.y };
    this.velocity = {
      x: 0,
      y: 0,
    };

    this.canv = canvasItem;

    this.draw = function (context) {
      context.drawImage(
        this.canv,
        this.position.x - this.canv.width / 2,
        this.position.y - this.canv.height / 2,
        this.canv.width,
        this.canv.height
      );
    };
  }

  init(wrapperEl);
}