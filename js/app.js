/*
 * azentio – Application Logic (app.js)
 * Vanilla JS, no framework dependencies
 */
'use strict';

/* ── Sidebar collapse ────────────────────────────
   Shows only icons when collapsed.
   Arrow: ◄ = open (click to collapse) | ► = collapsed (click to expand)
   ─────────────────────────────────────────────── */
var _sbOpen = true;

function toggleSidebar() {
  _sbOpen = !_sbOpen;
  var sb   = document.getElementById('sidebar');
  var main = document.getElementById('appMain');
  var logo = document.getElementById('hdrLogo');
  var btn  = document.getElementById('collapseBtn');

  if (sb)   sb.classList.toggle('sb-collapsed',   !_sbOpen);
  if (main) main.classList.toggle('sb-collapsed', !_sbOpen);
  if (logo) logo.classList.toggle('sb-collapsed', !_sbOpen);

  if (btn) {
    btn.setAttribute('aria-expanded', String(_sbOpen));
    btn.title = _sbOpen ? 'Collapse sidebar' : 'Expand sidebar';
  }

  /* Mobile overlay dismiss */
  if (window.innerWidth <= 767) {
    if (sb) sb.classList.toggle('mobile-open', _sbOpen);
    toggleOverlay(_sbOpen);
  }
}

function toggleOverlay(show) {
  var ov = document.getElementById('sidebarOverlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'sidebarOverlay';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:1039;';
    ov.onclick = function() { _sbOpen = true; toggleSidebar(); };
    document.body.appendChild(ov);
  }
  ov.style.display = show ? 'block' : 'none';
}

/* ── Sub-menu accordion ──────────────────────── */
function toggleSub(menuId, chevId) {
  var m = document.getElementById(menuId);
  if (!m) return;
  var open = m.style.display !== 'none';
  m.style.display = open ? 'none' : 'block';
  var c = document.getElementById(chevId);
  if (c) c.classList.toggle('open', !open);
  /* Move divider to bottom of group when sub-menu is expanded */
  var prev = m.previousElementSibling;
  if (prev && prev.classList.contains('sb-divider-after')) {
    prev.classList.toggle('sb-sub-open', !open);
    m.classList.toggle('sb-sub-divider', !open);
  }
}

/* ── Context menus ───────────────────────────── */
function toggleCtx(id) {
  var m = document.getElementById(id);
  if (!m) return;
  var hidden = m.classList.contains('hidden');
  closeAllCtx();
  if (!hidden) return;

  var btn = m.previousElementSibling;
  var btnRect = btn.getBoundingClientRect();
  var openUp = !!btn.closest('.ac-card-footer');

  /* Use fixed positioning so viewport coordinates are exact */
  m.style.position = 'fixed';
  m.style.right    = (window.innerWidth - btnRect.right) + 'px';
  m.style.left     = 'auto';

  if (openUp) {
    /* Footer button — always open upward */
    m.style.top    = 'auto';
    m.style.bottom = (window.innerHeight - btnRect.top + 4) + 'px';
  } else {
    m.style.top    = (btnRect.bottom + 4) + 'px';
    m.style.bottom = 'auto';
    /* Flip upward if it overflows viewport bottom */
    m.classList.remove('hidden');
    var mRect = m.getBoundingClientRect();
    if (mRect.bottom > window.innerHeight - 8) {
      m.style.top    = 'auto';
      m.style.bottom = (window.innerHeight - btnRect.top + 4) + 'px';
    }
    m.classList.add('hidden'); /* will be removed below */
  }
  m.classList.remove('hidden');

  var card = m.closest('.acct-row');
  if (card) card.classList.add('ctx-open');
}
function closeCtx(id) {
  var m = document.getElementById(id);
  if (!m) return;
  m.classList.add('hidden');
  m.style.position = ''; m.style.top = ''; m.style.bottom = ''; m.style.left = ''; m.style.right = '';
  var card = m.closest('.acct-row');
  if (card) card.classList.remove('ctx-open');
}
function closeAllCtx() {
  document.querySelectorAll('.ctx-menu').forEach(function(m){
    m.classList.add('hidden');
    m.style.position = ''; m.style.top = ''; m.style.bottom = ''; m.style.left = ''; m.style.right = '';
    var card = m.closest('.acct-row');
    if (card) card.classList.remove('ctx-open');
  });
}
document.addEventListener('click', function(e) { if (!e.target.closest('.ctx-wrap')) closeAllCtx(); });

/* ── Modals ──────────────────────────────────── */
function openModal(id)  { var el = document.getElementById(id); if (el) el.classList.remove('hidden'); }
function closeModal(id) { var el = document.getElementById(id); if (el) el.classList.add('hidden');    }
function openQR()       { openModal('qrModal'); }
function openTransfer() { openModal('transferModal'); }
function openMap()      { openModal('mapModal'); }

/* ── External-link confirmation modal ───────────
   Intercepts every target="_blank" link and shows
   a generic confirmation dialog before opening a
   new tab. Injected once; works on all pages.
   ─────────────────────────────────────────────── */
(function () {
  var _pendingHref = null;

  function injectModal() {
    if (document.getElementById('extLinkModal')) return;
    var ov = document.createElement('div');
    ov.id        = 'extLinkModal';
    ov.className = 'modal-ov hidden';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-labelledby', 'extLinkModalTitle');
    ov.innerHTML = [
      '<div class="az-modal modal-sm" style="max-width:420px">',
        '<button class="modal-close" id="extLinkClose" aria-label="Close">&#215;</button>',
        '<div class="modal-title" id="extLinkModalTitle" style="display:flex;align-items:center;gap:.5rem">',
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;color:var(--az-green)">',
            '<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>',
            '<polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
          '</svg>',
          'Opening in a new window',
        '</div>',
        '<p style="font-size:.875rem;color:var(--az-muted);margin:.75rem 0 1.5rem;line-height:1.55">',
          'This link will open in a new window. Do you want to continue?',
        '</p>',
        '<div style="display:flex;justify-content:flex-end;gap:.75rem">',
          '<button class="btn-action btn-cancel" id="extLinkCancel">Cancel</button>',
          '<button class="btn-action btn-submit" id="extLinkConfirm">Continue</button>',
        '</div>',
      '</div>'
    ].join('');
    document.body.appendChild(ov);

    document.getElementById('extLinkClose').onclick   = closeExtModal;
    document.getElementById('extLinkCancel').onclick  = closeExtModal;
    document.getElementById('extLinkConfirm').onclick = confirmExtLink;

    ov.addEventListener('click', function (e) { if (e.target === ov) closeExtModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeExtModal(); });
  }

  function closeExtModal() {
    _pendingHref = null;
    closeModal('extLinkModal');
  }

  function confirmExtLink() {
    if (_pendingHref) window.open(_pendingHref, '_blank', 'noopener,noreferrer');
    closeExtModal();
  }

  document.addEventListener('DOMContentLoaded', function () {
    injectModal();
    document.addEventListener('click', function (e) {
      var el = e.target.closest('a[target="_blank"]');
      if (!el) return;
      e.preventDefault();
      _pendingHref = el.href;
      openModal('extLinkModal');
      setTimeout(function () { var b = document.getElementById('extLinkConfirm'); if (b) b.focus(); }, 50);
    }, true);
  });
}());

document.addEventListener('DOMContentLoaded', function() {
  /* Main app sidebar collapse button */
  var collapseBtn = document.getElementById('collapseBtn');
  if (collapseBtn) {
    var appSb = document.getElementById('sidebar');
    if (appSb) {
      collapseBtn.addEventListener('click', toggleSidebar);
    }
  }

  /* Pre-login sidebar collapse button */
  var preloginSb = document.querySelector('.prelogin-sidebar');
  if (preloginSb) {
    var plBtn = document.getElementById('collapseBtn');
    if (plBtn) {
      plBtn.addEventListener('click', function() {
        var isCollapsed = preloginSb.classList.toggle('collapsed');
        plBtn.setAttribute('aria-expanded', String(!isCollapsed));
        plBtn.title = isCollapsed ? 'Expand sidebar' : 'Collapse sidebar';
      });
    }
  }

  /* Content accordion — pre-login pages (event delegation, no inline onclick needed) */
  document.addEventListener('click', function(e) {
    var hdr = e.target.closest('.acc-hdr');
    if (!hdr) return;
    var body = hdr.nextElementSibling;
    var isOpen = body && body.classList.contains('show');
    document.querySelectorAll('.acc-body.show').forEach(function(b) {
      b.classList.remove('show');
      var h = b.previousElementSibling;
      h.classList.remove('open');
      var sv = h.querySelector('svg');
      if (sv) sv.style.transform = 'rotate(-90deg)';
    });
    if (!isOpen) {
      body.classList.add('show');
      hdr.classList.add('open');
      var sv = hdr.querySelector('svg');
      if (sv) sv.style.transform = 'rotate(0deg)';
    }
  });

  /* Apply divider to pre-expanded sub-menus on page load */
  document.querySelectorAll('.sb-item.sb-divider-after').forEach(function(item) {
    var sub = item.nextElementSibling;
    if (sub && sub.classList.contains('sb-sub') && sub.style.display !== 'none') {
      item.classList.add('sb-sub-open');
      sub.classList.add('sb-sub-divider');
    }
  });

  document.querySelectorAll('.modal-ov').forEach(function(ov) {
    ov.addEventListener('click', function(e) { if (e.target === ov) ov.classList.add('hidden'); });
  });
  /* Close ctx menus on scroll */
  window.addEventListener('scroll', closeAllCtx, { passive: true });
  /* Keyboard: Escape closes modals and ctx menus */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeAllCtx();
      document.querySelectorAll('.modal-ov:not(.hidden)').forEach(function(m){ m.classList.add('hidden'); });
    }
  });
});

function switchTxTab(t) {
  var i = document.getElementById('mTabImm');
  var s = document.getElementById('mTabSch');
  if (i) { i.classList.toggle('active', t === 'imm'); i.setAttribute('aria-selected', t === 'imm'); }
  if (s) { s.classList.toggle('active', t === 'sch'); s.setAttribute('aria-selected', t === 'sch'); }
}

/* ── Section accordion ───────────────────────── */
function toggleSec(bodyId) {
  var body = document.getElementById(bodyId);
  if (!body) return;
  var hdr  = body.previousElementSibling;
  var chev = hdr ? hdr.querySelector('.chev') : null;
  var vis  = body.style.display !== 'none';
  body.style.display = vis ? 'none' : '';
  if (chev) chev.style.transform = vis ? 'rotate(-90deg)' : 'rotate(0deg)';
  if (hdr)  hdr.setAttribute('aria-expanded', String(!vis));
}

/* ── Accounts tab / view switching ──────────── */
function switchTab(t) {
  var gen  = document.getElementById('tabGeneral');
  var term = document.getElementById('tabTerm');
  var gb   = document.getElementById('tabGenBtn');
  var tb   = document.getElementById('tabTermBtn');
  var gvt  = document.getElementById('genViewToggle');
  var tvt  = document.getElementById('termViewToggle');
  if (gen)  gen.classList.toggle('hidden',  t !== 'general');
  if (term) term.classList.toggle('hidden', t !== 'term');
  if (gb)  { gb.classList.toggle('active', t === 'general');  gb.setAttribute('aria-selected',  t === 'general'); }
  if (tb)  { tb.classList.toggle('active', t === 'term');     tb.setAttribute('aria-selected',   t === 'term'); }
  if (gvt) gvt.classList.toggle('hidden', t !== 'general');
  if (tvt) tvt.classList.toggle('hidden', t !== 'term');
}
function switchView(v) {
  var cv = document.getElementById('cardView');
  var tv = document.getElementById('tableView');
  var vc = document.getElementById('vCard');
  var vt = document.getElementById('vTable');
  if (cv) cv.classList.toggle('hidden', v === 'table');
  if (tv) tv.classList.toggle('hidden', v === 'card');
  if (vc) vc.classList.toggle('active', v === 'card');
  if (vt) vt.classList.toggle('active', v === 'table');
}
function switchTermView(v) {
  var cv = document.getElementById('termCardView');
  var tv = document.getElementById('termTableView');
  var vc = document.getElementById('vTermCard');
  var vt = document.getElementById('vTermTable');
  if (cv) cv.classList.toggle('hidden', v === 'table');
  if (tv) tv.classList.toggle('hidden', v === 'card');
  if (vc) vc.classList.toggle('active', v === 'card');
  if (vt) vt.classList.toggle('active', v === 'table');
}

/* ── Inline account name edit ────────────────── */
function startEdit(idx) {
  var span = document.getElementById('accName_' + idx);
  if (!span) return;
  var orig    = span.textContent.trim();
  var nameDiv = span.closest('.acct-name');
  nameDiv.innerHTML =
    '<div class="ie-wrap">' +
    '<input id="ei_' + idx + '" value="' + orig + '" aria-label="Edit account name"/>' +
    '<button class="ie-btn" onclick="confirmEdit(\'' + idx + '\')" style="color:#22c55e" title="Save" aria-label="Save name">&#10003;</button>' +
    '<button class="ie-btn" onclick="cancelEdit(\'' + idx + '\',\'' + orig + '\')" style="color:#ef4444" title="Cancel" aria-label="Cancel edit">&#10005;</button>' +
    '</div>';
  var inp = document.getElementById('ei_' + idx);
  if (inp) { inp.focus(); inp.select(); }
  inp.addEventListener('keydown', function(e) {
    if (e.key === 'Enter')  confirmEdit(idx);
    if (e.key === 'Escape') cancelEdit(idx, orig);
  });
}
function confirmEdit(idx) {
  var inp = document.getElementById('ei_' + idx);
  rebuildName(idx, inp ? (inp.value.trim() || 'Account') : 'Account');
}
function cancelEdit(idx, orig) { rebuildName(idx, orig); }
function rebuildName(idx, name) {
  var row = document.getElementById('accRow_' + idx);
  if (!row) return;
  row.querySelector('.acct-name').innerHTML =
    '<span id="accName_' + idx + '" class="text-truncate">' + name + '</span>' +
    '<button class="edit-name-btn" onclick="startEdit(\'' + idx + '\')" aria-label="Edit account name">' +
    '<img src="images/icons/edit.svg" width="12" height="12" alt="edit"/></button>';
}

/* ── Form toggles ────────────────────────────── */
function toggleBalFields() {
  var el  = document.getElementById('balFields');
  var tgl = document.getElementById('addBalTgl');
  if (el && tgl) el.classList.toggle('hidden', !tgl.checked);
}

/* ── Hard Copy Statement — mode of collection ── */
function updateMode() {
  var sel   = document.getElementById('modeCol');
  var mode  = sel ? sel.value : '';
  var bSec  = document.getElementById('branchSection');
  var aRow  = document.getElementById('addrRow');
  var aLbl  = document.getElementById('addrLbl');
  var aInp  = document.getElementById('addrInput');

  if (bSec) bSec.classList.add('hidden');
  if (aRow) aRow.classList.add('hidden');

  if (mode === 'branch') {
    if (bSec) bSec.classList.remove('hidden');
  } else if (mode === 'home') {
    if (aRow) aRow.classList.remove('hidden');
    if (aLbl) aLbl.textContent = 'Home Address';
    if (aInp) { aInp.value = 'Mauritanie-Tiris Zemmour-tvz'; aInp.style.color = '#8a979e'; }
  } else if (mode === 'other') {
    if (aRow) aRow.classList.remove('hidden');
    if (aLbl) aLbl.textContent = 'Other Address';
    if (aInp) { aInp.value = ''; aInp.placeholder = 'Enter address'; aInp.style.color = ''; }
  }
}

/* ── Collector toggle ────────────────────────── */
function toggleCollector() {
  var tgl = document.getElementById('selfCollect');
  var el  = document.getElementById('collectorDetails');
  if (el && tgl) el.classList.toggle('hidden', tgl.checked);
}

/* ── Transaction history ─────────────────────── */
var _filtersExpanded = false;
function toggleFilters() {
  _filtersExpanded = !_filtersExpanded;
  var body   = document.getElementById('filtersBody');
  var chev   = document.getElementById('filterChevron');
  var cancel = document.getElementById('filterCancelBtn');
  var btn    = document.getElementById('filterToggleBtn');
  if (body)   { body.classList.toggle('hidden', !_filtersExpanded); body.setAttribute('aria-hidden', String(!_filtersExpanded)); }
  if (chev)   chev.style.transform = _filtersExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
  if (cancel) cancel.classList.toggle('hidden', !_filtersExpanded);
  if (btn)    btn.setAttribute('aria-expanded', String(_filtersExpanded));
}
function removeChip(id) { var el = document.getElementById(id); if (el) el.remove(); }
function resetFilter() {
  document.querySelectorAll('.filter-field').forEach(function(f) {
    if (f.tagName === 'SELECT') f.selectedIndex = 0; else f.value = '';
  });
}
function applyFilter() { /* hook for real filtering logic */ }

/* ── App-header language selector ───────────────────────── */
function setHdrLang(code, flagCode, optBtn) {
  // Update button label + flag
  document.querySelectorAll('.hdr-lang').forEach(function(btn) {
    var flagEl = btn.querySelector('.fi');
    var codeEl = btn.querySelector('.lang-txt');
    if (flagEl) { flagEl.className = 'fi fi-' + flagCode; }
    if (codeEl) { codeEl.textContent = code; }
    else { btn.childNodes.forEach(function(n){ if (n.nodeType===3) n.textContent = ' ' + code + ' '; }); }
  });
  // Mark active option
  if (optBtn) {
    optBtn.closest('.hdr-lang-drop').querySelectorAll('.hdr-lang-opt').forEach(function(o){ o.classList.remove('active'); o.setAttribute('aria-selected','false'); });
    optBtn.classList.add('active');
    optBtn.setAttribute('aria-selected','true');
  }
}

/* ── Sidebar search ─────────────────────────────────────── */
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

/* ── Notification panel: mobile full-screen overlay ── */
function toggleNotifPanel(e) {
  if (window.innerWidth > 767) { window.location.href = 'all-notifications.html'; return; }
  e.preventDefault();
  e.stopPropagation();
  var ov = document.getElementById('mobileNotifOverlay');
  if (!ov) return;
  var isOpen = ov.style.display === 'flex';
  isOpen ? closeMobileNotif() : openMobileNotif();
}

function openMobileNotif() {
  var ov = document.getElementById('mobileNotifOverlay');
  if (!ov) return;
  ov.style.display = 'flex';
  ov.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeMobileNotif() {
  var ov = document.getElementById('mobileNotifOverlay');
  if (!ov) return;
  ov.style.display = 'none';
  ov.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function closeNotifPanel() { closeMobileNotif(); }
