/* ══════════════════════════════════════════════════════════════
   azentio — selfie liveness capture
   ──────────────────────────────────────────────────────────────
   The step walks through states rather than showing one button:

     idle → starting → aligning → holding → countdown → captured

   It uses the real camera where the browser allows it. Where it
   does not — permission denied, no device, or an embedded preview
   with no camera access — the same flow runs without a video feed
   and the upload route is offered instead, so the screen is never
   a dead end.
   ══════════════════════════════════════════════════════════════ */
'use strict';

var OB_SELFIE = {
  stream: null,
  state: 'idle',
  timer: null,
  shot: false,
  hasCamera: null
};

function obSelfieEl(id) { return document.getElementById(id); }

function obSelfieStatus(text, tone, pulse) {
  var el = obSelfieEl('liveStatus');
  if (!el) return;
  el.className = 'ob-live-status' + (tone ? ' ' + tone : '');
  el.innerHTML = (pulse ? '<span class="ob-dot" aria-hidden="true"></span>' :
      '<span class="material-icons" aria-hidden="true">' + (tone === 'ok' ? 'check_circle' : tone === 'warn' ? 'error_outline' : 'info') + '</span>') +
    '<span>' + text + '</span>';
}

function obSelfieChecks(flags) {
  ['chkLight', 'chkFrame', 'chkFace'].forEach(function (id, i) {
    var el = obSelfieEl(id);
    if (!el) return;
    var pass = !!flags[i];
    el.classList.toggle('pass', pass);
    el.querySelector('.material-icons').textContent = pass ? 'check_circle' : 'radio_button_unchecked';
  });
}

function obSelfieActions(html) {
  var el = obSelfieEl('liveActions');
  if (el) el.innerHTML = html;
}

/* ── Start ── */
async function obSelfieStart() {
  var stage = obSelfieEl('selfieStage');
  if (!stage) return;
  OB_SELFIE.state = 'starting';
  obSelfieStatus('Starting camera…', '', true);
  obSelfieActions('');

  var video = document.createElement('video');
  video.setAttribute('playsinline', '');
  video.setAttribute('muted', '');
  video.autoplay = true;

  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('unsupported');
    OB_SELFIE.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } }, audio: false
    });
    OB_SELFIE.hasCamera = true;
    video.srcObject = OB_SELFIE.stream;
    stage.innerHTML = '';
    stage.appendChild(video);
    stage.insertAdjacentHTML('beforeend', '<span class="ob-guide" aria-hidden="true"></span><span class="ob-flash" id="liveFlash" aria-hidden="true"></span>');
    obSelfieAlign();
  } catch (err) {
    OB_SELFIE.hasCamera = false;
    obSelfieNoCamera(err && err.name === 'NotAllowedError');
  }
}

/* Camera unavailable — keep the step usable rather than blocking it. */
function obSelfieNoCamera(denied) {
  var stage = obSelfieEl('selfieStage');
  stage.classList.remove('is-aligned');
  stage.innerHTML =
    '<div class="ob-stage-idle">' +
      '<span class="material-icons" aria-hidden="true">no_photography</span>' +
      '<span>' + (denied ? 'Camera permission was declined.' : 'No camera available on this device.') + '</span>' +
    '</div>' +
    '<span class="ob-guide" aria-hidden="true"></span>';
  obSelfieStatus(denied ? 'Allow camera access, or upload a photo instead.' : 'Upload a photo instead.', 'warn');
  obSelfieActions(
    '<button type="button" class="btn-action btn-submit" onclick="obSelfieStart()">Try camera again</button>' +
    '<button type="button" class="gao-locate-btn" onclick="document.getElementById(\'selfieFile\').click()">' +
      '<span class="material-icons" aria-hidden="true">upload</span> Upload a photo</button>');
  obSelfieChecks([false, false, false]);
}

/* ── Aligning ──
   A real liveness check would score the frame; this prototype moves
   through the same states on a timer so the interaction reads true
   without pretending to analyse the image. */
function obSelfieAlign() {
  var stage = obSelfieEl('selfieStage');
  OB_SELFIE.state = 'aligning';
  obSelfieStatus('Position your face inside the circle', '', true);
  obSelfieChecks([true, false, false]);
  obSelfieActions('');

  clearTimeout(OB_SELFIE.timer);
  OB_SELFIE.timer = setTimeout(function () {
    stage.classList.add('is-aligned');
    obSelfieStatus('Face detected — hold still', 'ok', true);
    obSelfieChecks([true, true, true]);
    OB_SELFIE.state = 'holding';
    obSelfieActions('<button type="button" class="btn-action btn-submit" onclick="obSelfieCountdown()">Capture</button>' +
      '<button type="button" class="btn-action btn-cancel" onclick="obSelfieStop()">Cancel</button>');
    OB_SELFIE.timer = setTimeout(obSelfieCountdown, 1200);
  }, 1600);
}

/* ── Countdown ── */
function obSelfieCountdown() {
  if (OB_SELFIE.state === 'counting' || OB_SELFIE.state === 'captured') return;
  OB_SELFIE.state = 'counting';
  clearTimeout(OB_SELFIE.timer);
  obSelfieActions('');
  var stage = obSelfieEl('selfieStage');
  var n = 3;
  var badge = document.createElement('div');
  badge.className = 'ob-count';
  badge.id = 'liveCount';
  badge.textContent = String(n);
  stage.appendChild(badge);
  obSelfieStatus('Hold still…', 'ok');

  (function tick() {
    OB_SELFIE.timer = setTimeout(function () {
      n--;
      if (n > 0) { badge.textContent = String(n); tick(); return; }
      badge.remove();
      obSelfieShoot();
    }, 850);
  })();
}

/* ── Capture ── */
function obSelfieShoot() {
  var stage = obSelfieEl('selfieStage');
  var video = stage.querySelector('video');
  var flash = obSelfieEl('liveFlash');
  if (flash) { flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go'); }

  var c = document.createElement('canvas');
  c.className = 'ob-shot';
  var size = 480;
  c.width = size; c.height = size;
  var ctx = c.getContext('2d');

  if (video && video.videoWidth) {
    /* Square crop from the centre so the saved frame matches what
       the circular stage showed. */
    var vw = video.videoWidth, vh = video.videoHeight;
    var side = Math.min(vw, vh);
    ctx.drawImage(video, (vw - side) / 2, (vh - side) / 2, side, side, 0, 0, size, size);
  } else {
    ctx.fillStyle = '#16303d';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#8fa3a0';
    ctx.font = '500 20px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Photo captured', size / 2, size / 2);
  }

  obSelfieStop(true);
  stage.innerHTML = '';
  stage.appendChild(c);
  stage.insertAdjacentHTML('beforeend', '<span class="ob-guide" aria-hidden="true"></span>');
  stage.classList.remove('is-aligned');
  stage.classList.add('is-shot');

  OB_SELFIE.state = 'captured';
  OB_SELFIE.shot = true;
  obSelfieChecks([true, true, true]);
  obSelfieStatus('Selfie captured', 'ok');
  obSelfieActions('<button type="button" class="gao-locate-btn" onclick="obSelfieRetake()">' +
    '<span class="material-icons" aria-hidden="true">refresh</span> Retake</button>');
  if (typeof obToast === 'function') obToast('Selfie captured');
}

/* ── Stop / retake ── */
function obSelfieStop(keepState) {
  clearTimeout(OB_SELFIE.timer);
  if (OB_SELFIE.stream) {
    OB_SELFIE.stream.getTracks().forEach(function (t) { t.stop(); });
    OB_SELFIE.stream = null;
  }
  if (keepState) return;
  obSelfieReset();
}

function obSelfieReset() {
  var stage = obSelfieEl('selfieStage');
  if (!stage) return;
  OB_SELFIE.state = 'idle';
  OB_SELFIE.shot = false;
  stage.classList.remove('is-aligned', 'is-shot');
  stage.innerHTML =
    '<div class="ob-stage-idle">' +
      '<span class="material-icons" aria-hidden="true">photo_camera</span>' +
      '<span>Your camera preview appears here</span>' +
    '</div>' +
    '<span class="ob-guide" aria-hidden="true"></span>';
  obSelfieStatus('Ready when you are', '');
  obSelfieChecks([false, false, false]);
  obSelfieActions('<button type="button" class="btn-action btn-submit" onclick="obSelfieStart()">' +
    'Start camera</button>');
}

function obSelfieRetake() { obSelfieReset(); obSelfieStart(); }

/* Uploaded photo stands in for a captured one. */
function obSelfieUpload(files) {
  if (!files || !files.length) return;
  var f = files[0];
  if (!/^image\//.test(f.type)) { obSelfieStatus('That file is not an image.', 'warn'); return; }
  var stage = obSelfieEl('selfieStage');
  var url = URL.createObjectURL(f);
  var img = new Image();
  img.onload = function () {
    var c = document.createElement('canvas');
    c.className = 'ob-shot';
    c.width = c.height = 480;
    var ctx = c.getContext('2d');
    var side = Math.min(img.width, img.height);
    ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 480, 480);
    stage.innerHTML = '';
    stage.appendChild(c);
    stage.insertAdjacentHTML('beforeend', '<span class="ob-guide" aria-hidden="true"></span>');
    stage.classList.add('is-shot');
    URL.revokeObjectURL(url);
  };
  img.src = url;
  OB_SELFIE.shot = true;
  OB_SELFIE.state = 'captured';
  obSelfieChecks([true, true, true]);
  obSelfieStatus('Photo uploaded', 'ok');
  obSelfieActions('<button type="button" class="gao-locate-btn" onclick="obSelfieRetake()">' +
    '<span class="material-icons" aria-hidden="true">refresh</span> Replace</button>');
}

/* Release the camera when leaving the step. */
window.addEventListener('pagehide', function () { obSelfieStop(true); });

if (document.getElementById('selfieStage')) obSelfieReset();
