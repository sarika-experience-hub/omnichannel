/* ══════════════════════════════════════════════════════════════
   azentio — attachment control
   ──────────────────────────────────────────────────────────────
   Validates type and size, then shows the file as a chip with its
   name and size, or a red chip stating exactly why it was
   refused. Drag-and-drop is wired on any .attach-zone found.

   Pairs with css/attachment.css. Shared by the onboarding ID
   upload and the QR payment attachment.
   ══════════════════════════════════════════════════════════════ */
'use strict';

var OB_OK_EXT = ['jpg', 'jpeg', 'png', 'pdf'];
var OB_MAX_BYTES = 10 * 1024 * 1024;

function obFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}
function obUploadChip(html) {
  var wrap = document.getElementById('fileChipWrap');
  if (wrap) wrap.innerHTML = html;
}
function obUploadError(msg) {
  obUploadChip('<div class="ob-file-chip ob-file-chip-err">' +
    '<span class="material-icons ob-chip-ico" aria-hidden="true">error_outline</span>' +
    '<span class="ob-file-chip-name">' + msg + '</span>' +
    '<span class="material-icons ob-file-chip-rm" role="button" tabindex="0" aria-label="Dismiss" onclick="obUploadChip(\'\')">close</span>' +
    '</div>');
}

/* Several files are listed together; each is judged on its own so
   one oversized item does not discard the rest. */
function obHandleFile(files) {
  if (!files || !files.length) return;
  var html = '';
  [].slice.call(files).forEach(function (f) {
    var ext = (f.name.split('.').pop() || '').toLowerCase();
    if (OB_OK_EXT.indexOf(ext) === -1) {
      html += '<div class="ob-file-chip ob-file-chip-err">' +
        '<span class="material-icons ob-chip-ico" aria-hidden="true">error_outline</span>' +
        '<span class="ob-file-chip-name">' + f.name + ' &mdash; unsupported type, use JPEG, PNG or PDF</span></div>';
      return;
    }
    if (f.size > OB_MAX_BYTES) {
      html += '<div class="ob-file-chip ob-file-chip-err">' +
        '<span class="material-icons ob-chip-ico" aria-hidden="true">error_outline</span>' +
        '<span class="ob-file-chip-name">' + f.name + ' is ' + obFileSize(f.size) + ' &mdash; the limit is 10 MB</span></div>';
      return;
    }
    html += '<div class="ob-file-chip">' +
      '<span class="material-icons ob-chip-ico" aria-hidden="true">description</span>' +
      '<span class="ob-file-chip-name">' + f.name + '</span>' +
      '<span class="ob-file-chip-size">' + obFileSize(f.size) + '</span>' +
      '<span class="material-icons ob-file-chip-rm" role="button" tabindex="0" aria-label="Remove file" onclick="this.closest(\'.ob-file-chip\').remove()">close</span>' +
      '</div>';
  });
  obUploadChip(html);
}
function obRemoveFile() {
  var inp = document.getElementById('fileInp');
  if (inp) inp.value = '';
  obUploadChip('');
}

/* Drag and drop, wired to whatever attach zones the page has. */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.attach-zone').forEach(function (zone) {
    ['dragenter', 'dragover'].forEach(function (evt) {
      zone.addEventListener(evt, function (e) { e.preventDefault(); zone.classList.add('is-dragover'); });
    });
    ['dragleave', 'drop'].forEach(function (evt) {
      zone.addEventListener(evt, function (e) { e.preventDefault(); zone.classList.remove('is-dragover'); });
    });
    zone.addEventListener('drop', function (e) {
      if (e.dataTransfer && e.dataTransfer.files) obHandleFile(e.dataTransfer.files);
    });
  });
});
