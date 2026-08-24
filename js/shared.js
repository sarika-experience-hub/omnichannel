/* ============================================================
   Azentio – Create Online Account  |  Shared JavaScript
   ============================================================ */

(function () {
  'use strict';

  /* ── Sidebar collapse toggle ── */
  document.querySelectorAll('.az-sidebar-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.az-sidebar').classList.toggle('collapsed');
    });
  });

  /* ── Section accordion (main form) ── */
  document.querySelectorAll('.az-section-header').forEach(header => {
    header.addEventListener('click', () => {
      header.closest('.az-section').classList.toggle('collapsed');
    });
  });

  /* ── Subsection accordion ── */
  document.querySelectorAll('.az-subsection-title').forEach(title => {
    const chevron = title.querySelector('.chevron-sm');
    if (!chevron) return;
    chevron.addEventListener('click', e => {
      e.stopPropagation();
      title.closest('.az-subsection').classList.toggle('collapsed');
    });
  });

  /* ── Summary panel accordion ── */
  document.querySelectorAll('.az-summary-header').forEach(header => {
    header.addEventListener('click', () => {
      header.closest('.az-summary-section').classList.toggle('collapsed');
    });
  });

  /* ── Password visibility toggle ── */
  document.querySelectorAll('.az-pwd-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const wrap = btn.closest('.az-pwd-wrap');
      const input = wrap.querySelector('input');
      const isText = input.type === 'text';
      input.type = isText ? 'password' : 'text';
      btn.querySelector('.icon-eye').style.display = isText ? 'block' : 'none';
      btn.querySelector('.icon-eye-off').style.display = isText ? 'none' : 'block';
    });
  });

  /* ── Modal helpers ── */
  window.openModal = function (id) {
    document.getElementById(id).classList.add('open');
  };
  window.closeModal = function (id) {
    document.getElementById(id).classList.remove('open');
  };

  /* Close modal on overlay click */
  document.querySelectorAll('.az-modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });

  /* ── Username validation (page 2) ── */
  const usernameInput = document.getElementById('username');
  if (usernameInput) {
    const takenNames = ['shadabpervaiz', 'admin', 'user123'];
    const errorEl = document.getElementById('username-error');
    usernameInput.addEventListener('blur', () => {
      const val = usernameInput.value.trim().toLowerCase();
      if (takenNames.includes(val)) {
        usernameInput.classList.add('error');
        errorEl.style.display = 'flex';
      } else {
        usernameInput.classList.remove('error');
        errorEl.style.display = 'none';
      }
    });
    usernameInput.addEventListener('input', () => {
      usernameInput.classList.remove('error');
      errorEl.style.display = 'none';
    });
  }

  /* ── Password match validation (page 2) ── */
  const confirmPwd = document.getElementById('confirm-password');
  if (confirmPwd) {
    const confirmError = document.getElementById('confirm-password-error');
    confirmPwd.addEventListener('blur', () => {
      const pwd = document.getElementById('password').value;
      if (confirmPwd.value && confirmPwd.value !== pwd) {
        confirmPwd.classList.add('error');
        if (confirmError) confirmError.style.display = 'flex';
      } else {
        confirmPwd.classList.remove('error');
        if (confirmError) confirmError.style.display = 'none';
      }
    });
  }

  /* ── Navigation buttons ── */
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.nav;
      if (target) window.location.href = target;
    });
  });

  /* ── Submit (page 3) ── */
  const submitBtn = document.getElementById('submit-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      openModal('success-modal');
    });
  }
  const successOk = document.getElementById('success-ok');
  if (successOk) {
    successOk.addEventListener('click', () => {
      closeModal('success-modal');
      window.location.href = 'page1_identification_details.html';
    });
  }

  /* ── T&C checkbox gating ── */
  const tcCheck = document.getElementById('tc-checkbox');
  if (tcCheck && submitBtn) {
    const updateSubmit = () => { submitBtn.disabled = !tcCheck.checked; };
    tcCheck.addEventListener('change', updateSubmit);
    updateSubmit();
  }

  /* ── Font size controls ── */
  let currentScale = 1;
  document.querySelectorAll('.az-font-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.scale;
      if (action === 'up')   currentScale = Math.min(currentScale + 0.1, 1.4);
      if (action === 'down') currentScale = Math.max(currentScale - 0.1, 0.8);
      if (action === 'reset') currentScale = 1;
      document.documentElement.style.fontSize = (currentScale * 14) + 'px';
    });
  });

})();

/* ── Sidebar search ── */
function sbFilter(val) {
  var q = val.trim().toLowerCase();
  var clear = document.getElementById('sbSearchClear');
  if (clear) clear.style.display = q ? 'flex' : 'none';

  if (!q) {
    document.querySelectorAll('.sb-item').forEach(function(el) { el.style.display = ''; });
    document.querySelectorAll('.sb-sub, .sb-sub3').forEach(function(el) {
      var orig = el.getAttribute('data-sb-orig');
      el.style.display = orig !== null ? orig : 'none';
      el.removeAttribute('data-sb-orig');
    });
    document.querySelectorAll('.sb-sub-item, .sb-sub2-hdr, .sb-sub3-item').forEach(function(el) {
      el.style.display = '';
    });
    return;
  }

  document.querySelectorAll('.sb-sub, .sb-sub3').forEach(function(el) {
    if (!el.hasAttribute('data-sb-orig')) {
      el.setAttribute('data-sb-orig', el.style.display || 'none');
    }
  });

  document.querySelectorAll('.sb-item').forEach(function(btn) {
    var label = (btn.dataset.label || btn.textContent).trim().toLowerCase();
    var parentMatch = label.includes(q);
    var oc = btn.getAttribute('onclick') || '';
    var m = oc.match(/toggleSub\(['"](\w+)['"]/);
    var sub = m ? document.getElementById(m[1]) : null;

    if (parentMatch) {
      btn.style.display = '';
      if (sub) {
        sub.style.display = '';
        sub.querySelectorAll('.sb-sub-item, .sb-sub2-hdr, .sb-sub3-item').forEach(function(si) { si.style.display = ''; });
        sub.querySelectorAll('.sb-sub3').forEach(function(s3) { s3.style.display = ''; });
      }
    } else {
      var anySubMatch = false;
      if (sub) {
        sub.querySelectorAll('.sb-sub-item').forEach(function(si) {
          var match = si.textContent.trim().toLowerCase().includes(q);
          si.style.display = match ? '' : 'none';
          if (match) anySubMatch = true;
        });
        sub.querySelectorAll('.sb-sub2-hdr').forEach(function(hdr) {
          var s3 = hdr.nextElementSibling;
          if (!s3) return;
          var s3Match = false;
          s3.querySelectorAll('.sb-sub3-item').forEach(function(si) {
            var match = si.textContent.trim().toLowerCase().includes(q);
            si.style.display = match ? '' : 'none';
            if (match) s3Match = true;
          });
          hdr.style.display = s3Match ? '' : 'none';
          s3.style.display = s3Match ? '' : 'none';
          if (s3Match) anySubMatch = true;
        });
      }
      btn.style.display = anySubMatch ? '' : 'none';
      if (sub) sub.style.display = anySubMatch ? '' : 'none';
    }
  });
}

function sbClearSearch() {
  var inp = document.getElementById('sbSearch');
  if (inp) { inp.value = ''; sbFilter(''); inp.focus(); }
}
