/* 우리의 담벼락 — 글은 선생님 구글 시트에 쌓이고, 이 스크립트가 읽어 와 펼친다.
   WALL_URL에 Apps Script 웹 앱 주소를 넣으면 열린다. */
(function () {
  var WALL_URL = 'https://script.google.com/macros/s/AKfycbyOsoWYiMhpz8cIar1kIbiDyodU4x7Z_QI26ivwYjZKdASAE0IzmTCB8EYf4y_Jz6z4/exec';

  function el(t, c, txt) { var e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; }
  function safeUrl(s) { try { var u = new URL(String(s).trim()); return /^https?:$/.test(u.protocol) ? u : null; } catch (e) { return null; } }
  function frame(src) { var f = el('iframe'); f.src = src; f.loading = 'lazy'; f.allowFullscreen = true; f.referrerPolicy = 'no-referrer'; f.setAttribute('allow', 'fullscreen'); return f; }
  function media(u) {
    var h = u.hostname.replace(/^www\./, ''), m;
    if (h === 'youtu.be') return frame('https://www.youtube.com/embed/' + encodeURIComponent(u.pathname.slice(1)));
    if (/(^|\.)youtube\.com$/.test(h)) {
      if (u.searchParams.get('v')) return frame('https://www.youtube.com/embed/' + encodeURIComponent(u.searchParams.get('v')));
      if ((m = u.pathname.match(/^\/shorts\/([\w-]+)/))) return frame('https://www.youtube.com/embed/' + m[1]);
    }
    if (h === 'docs.google.com' && (m = u.pathname.match(/^\/(document|presentation|spreadsheets|drawings)\/d\/([\w-]+)/))) return frame('https://docs.google.com/' + m[1] + '/d/' + m[2] + '/preview');
    if (h === 'drive.google.com' && (m = u.pathname.match(/\/file\/d\/([\w-]+)/))) return frame('https://drive.google.com/file/d/' + m[1] + '/preview');
    if (/(^|\.)canva\.com$/.test(h) && (m = u.pathname.match(/^\/design\/([\w-]+)(\/[\w-]+)?/))) return frame('https://www.canva.com/design/' + m[1] + (m[2] && !/edit|view|watch/.test(m[2]) ? m[2] : '') + '/view?embed');
    if (/\.(png|jpe?g|gif|webp)$/i.test(u.pathname)) { var i = el('img'); i.src = u.href; i.alt = ''; i.loading = 'lazy'; return i; }
    return null;
  }
  function when(t) { var d = new Date(t); if (isNaN(d)) return ''; return (d.getMonth() + 1) + '.' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function card(p, i) {
    var c = el('article', 'card');
    var top = el('div', 'ctop');
    top.appendChild(el('span', 'who', p.name || '이름 없음'));
    top.appendChild(el('span', 'when lbl', when(p.t)));
    c.appendChild(top);
    if (p.text) c.appendChild(el('p', 'txt', p.text));
    var u = p.link && safeUrl(p.link);
    if (u) {
      var m = media(u); if (m) c.appendChild(m);
      var a = el('a', 'lnk lbl'); a.href = u.href; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.appendChild(el('span', null, u.hostname.replace(/^www\./, ''))); a.appendChild(el('span', null, 'Open ↗'));
      c.appendChild(a);
    }
    return c;
  }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; }
  function constellation(cv, posts) {
    var r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1; cv.width = r.width * dpr; cv.height = r.height * dpr;
    var g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, r.width, r.height);
    var cs = getComputedStyle(document.documentElement), fg = cs.getPropertyValue('--bandfg').trim(), dim = cs.getPropertyValue('--banddim').trim(), red = cs.getPropertyValue('--red').trim();
    for (var k = 0; k < 140; k++) { g.fillStyle = dim; g.globalAlpha = .35; g.fillRect(hash('bg' + k) * r.width, hash('y' + k) * r.height, 1, 1); }
    g.globalAlpha = 1;
    if (!posts.length) { g.fillStyle = dim; g.font = '13px "Noto Sans KR",sans-serif'; g.textAlign = 'center'; g.fillText('첫 번째 별이 되어 주세요. 별이 둘이 되면 선이 생깁니다.', r.width / 2, r.height / 2); return; }
    var pad = 30, pts = posts.map(function (p) { var s = (p.name || '') + '|' + p.t; return { x: pad + hash(s) * (r.width - pad * 2), y: pad + hash(s + '*') * (r.height - pad * 2), n: p.name || '' }; });
    g.strokeStyle = dim; g.lineWidth = 1;
    g.beginPath(); pts.forEach(function (p, i) { i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y); }); g.stroke();
    pts.forEach(function (p, i) {
      var last = i === pts.length - 1;
      g.fillStyle = last ? red : fg; g.beginPath(); g.arc(p.x, p.y, last ? 4 : 2.6, 0, 7); g.fill();
      g.font = '11px "Noto Sans KR",sans-serif'; g.fillStyle = dim; g.textAlign = 'left'; g.fillText(p.n, p.x + 7, p.y - 6);
    });
  }
  function mount(root) {
    var room = root.getAttribute('data-wall'), list = root.querySelector('.cards'), form = root.querySelector('form'),
      status = root.querySelector('.wstatus'), count = root.querySelector('.wcount'), cv = root.querySelector('canvas.cons'), last = [];
    var nameIn = form.querySelector('[name=name]');
    try { nameIn.value = localStorage.getItem('wall-name') || ''; } catch (e) {}
    function draw() { if (cv) constellation(cv, last); }
    window.addEventListener('resize', draw);
    if (!WALL_URL) {
      Array.prototype.forEach.call(form.querySelectorAll('input,textarea,button'), function (x) { x.disabled = true; });
      status.textContent = '담벼락이 아직 연결되지 않았어요. 선생님이 연결하면 바로 열립니다.';
      draw(); return;
    }
    function render(posts) {
      last = posts.slice();
      Array.prototype.forEach.call(list.querySelectorAll('.card:not(.prompt)'), function (n) { n.remove(); });
      posts.slice().reverse().forEach(function (p, i) { list.appendChild(card(p, i)); });
      if (count) count.textContent = posts.length + (cv ? ' stars' : ' posts');
      draw();
    }
    function load() {
      return fetch(WALL_URL + '?room=' + encodeURIComponent(room)).then(function (r) { return r.json(); })
        .then(function (d) { render(Array.isArray(d) ? d : []); if (status.dataset.err) { status.textContent = ''; delete status.dataset.err; } })
        .catch(function () { status.dataset.err = 1; status.textContent = '담벼락을 불러오지 못했어요. 잠시 뒤 새로고침해 주세요.'; });
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form), data = { room: room, name: String(fd.get('name') || '').trim(), text: String(fd.get('text') || '').trim(), link: String(fd.get('link') || '').trim() };
      if (!data.name) { status.textContent = '이름(또는 별명)을 적어 주세요.'; nameIn.focus(); return; }
      if (!data.text && !data.link) { status.textContent = '생각이나 링크 중 하나는 적어 주세요.'; return; }
      if (data.link && !safeUrl(data.link)) { status.textContent = '링크는 https:// 로 시작하는 주소를 붙여 주세요.'; return; }
      var btn = form.querySelector('button'); btn.disabled = true; status.textContent = '붙이는 중…';
      try { localStorage.setItem('wall-name', data.name); } catch (e2) {}
      fetch(WALL_URL, { method: 'POST', body: JSON.stringify(data) }).then(function (r) { return r.json(); })
        .then(function (res) {
          if (res && res.ok) { form.querySelector('[name=text]').value = ''; form.querySelector('[name=link]').value = ''; status.textContent = '담벼락에 붙였어요.'; return load(); }
          status.textContent = (res && res.msg) || '올리지 못했어요. 다시 시도해 주세요.';
        })
        .catch(function () { status.textContent = '올리지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.'; })
        .then(function () { btn.disabled = false; });
    });
    load(); setInterval(load, 30000);
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-wall]'), mount);
})();
