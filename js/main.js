(function () {
  // スカイラインの描画：シード固定の乱数で毎回同じ街並みを描き、窓の明かりがゆっくり入れ替わる
  var canvas = document.getElementById('skyline');
  var ctx = canvas.getContext('2d');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var windows = [];
  var colors = {};

  function rng(seed) {
    return function () {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
  }

  function readColors() {
    var s = getComputedStyle(document.documentElement);
    colors.tower = s.getPropertyValue('--tower').trim();
    colors.glow = s.getPropertyValue('--glow').trim();
    colors.off = s.getPropertyValue('--window-off').trim();
  }

  function draw() {
    readColors();
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    windows = [];

    var r = rng(38);
    var x = -10;
    var tallest = { h: 0 };
    while (x < w) {
      var bw = 34 + Math.floor(r() * 66);
      var bh = Math.floor(h * (0.28 + r() * 0.62));
      var top = h - bh;
      ctx.fillStyle = colors.tower;
      ctx.fillRect(x, top, bw, bh);
      if (bh > tallest.h) tallest = { x: x, w: bw, h: bh };

      for (var wy = top + 10; wy < h - 8; wy += 11) {
        for (var wx = x + 7; wx < x + bw - 9; wx += 9) {
          var lit = r() < 0.22;
          windows.push({ x: wx, y: wy, lit: lit });
          ctx.fillStyle = lit ? colors.glow : colors.off;
          ctx.fillRect(wx, wy, 4, 6);
        }
      }
      x += bw + 2 + Math.floor(r() * 6);
    }
    // 最も高いビルにアンテナを立てる
    var ax = tallest.x + tallest.w / 2;
    ctx.fillStyle = colors.tower;
    ctx.fillRect(ax - 1, h - tallest.h - 26, 2, 26);
    ctx.fillStyle = colors.glow;
    ctx.beginPath();
    ctx.arc(ax, h - tallest.h - 27, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function twinkle() {
    if (!windows.length) return;
    var win = windows[Math.floor(Math.random() * windows.length)];
    win.lit = !win.lit;
    ctx.fillStyle = win.lit ? colors.glow : colors.off;
    ctx.fillRect(win.x, win.y, 4, 6);
  }

  draw();
  if ('ResizeObserver' in window) {
    var lastW = 0;
    new ResizeObserver(function () {
      if (canvas.clientWidth !== lastW) { lastW = canvas.clientWidth; draw(); }
    }).observe(canvas);
  }
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', draw);
  new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  if (!reduceMotion) setInterval(twinkle, 700);

  // お問い合わせフォーム：デモのため送信はせず、入力チェックのみ行う
  var form = document.getElementById('contact-form');
  var status = document.getElementById('form-status');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var missing = [];
    if (!form.name.value.trim()) missing.push('お名前');
    var email = form.email.value.trim();
    if (!email) missing.push('メールアドレス');
    if (!form.message.value.trim()) missing.push('お問い合わせ内容');
    if (missing.length) {
      status.textContent = missing.join('、') + 'を入力してください。';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      status.textContent = 'メールアドレスの形式を確認してください（例：taro@example.com）。';
      return;
    }
    status.textContent = '入力内容を確認しました。このサイトはデモのため、実際には送信されません。';
    form.reset();
  });

  // 採用の応募ボタン：ご用件を「採用について」にし、職種名を内容欄に入れておく
  var applyLinks = document.querySelectorAll('[data-apply]');
  for (var i = 0; i < applyLinks.length; i++) {
    applyLinks[i].addEventListener('click', function () {
      form.topic.value = '採用について';
      var msg = form.message.value;
      if (!msg.trim() || msg.charAt(0) === '【') {
        form.message.value = '【' + this.getAttribute('data-apply') + '】\n';
      }
      status.textContent = '';
    });
  }
})();
