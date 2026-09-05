import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

(function () {
  'use strict';

  // ---------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------
  const PX_PER_UNIT = 36;       // 2D screen pixels per world unit
  const FLOOR_HEIGHT = 2.6;     // world units per floor
  const MIN_SIZE = 1.2;         // smallest a block can be resized to
  const MAX_FLOORS = 6;
  const COLORS = ['#ff8a3d', '#60a5fa', '#34d399', '#f472b6', '#a78bfa', '#fbbf24'];
  const DEFAULTS = {
    house: { w: 4, h: 3, color: COLORS[0] },
    flat: { w: 3, h: 3, color: COLORS[1] },
    tower: { r: 1.4, color: COLORS[4] },
  };

  const clone = (o) => JSON.parse(JSON.stringify(o));
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------
  const state = {
    blocks: [],        // {id, type, x, y, w, h, r, floors, color}
    attachments: [],   // {id, hostId, kind, side|angle, t}
    selectedId: null,
    selectedKind: null, // 'block' | 'attachment'
    armedType: null,
    history: [],
    nextId: 1,
    drag: null,        // active pointer interaction on the yard canvas
  };

  function newId() { return 'b' + (state.nextId++); }

  function pushHistory() {
    state.history.push({ blocks: clone(state.blocks), attachments: clone(state.attachments) });
    if (state.history.length > 60) state.history.shift();
  }

  function undo() {
    const prev = state.history.pop();
    if (!prev) return;
    state.blocks = prev.blocks;
    state.attachments = prev.attachments;
    state.selectedId = null;
    state.selectedKind = null;
    syncAll();
  }

  function findBlock(id) { return state.blocks.find((b) => b.id === id); }

  // ---------------------------------------------------------------------
  // DOM refs
  // ---------------------------------------------------------------------
  const yardCanvas = document.getElementById('yard-canvas');
  const yardCtx = yardCanvas.getContext('2d');
  const yardWrap = document.getElementById('yard-wrap');
  const previewCanvas = document.getElementById('preview-canvas');
  const previewWrap = document.getElementById('preview-wrap');
  const ghost = document.getElementById('ghost');
  const paletteItems = Array.from(document.querySelectorAll('.palette-item'));
  const floatingToolbar = document.getElementById('floating-toolbar');
  const fabMinus = document.getElementById('fab-minus');
  const fabPlus = document.getElementById('fab-plus');
  const fabFloors = document.getElementById('fab-floors');
  const fabColors = document.getElementById('fab-colors');
  const fabDelete = document.getElementById('fab-delete');
  const btnUndo = document.getElementById('btn-undo');
  const btnClear = document.getElementById('btn-clear');

  const PALETTE_ICON = { house: '🏠', flat: '🧱', tower: '🗼', door: '🚪', window: '🪟' };

  fabColors.innerHTML = COLORS.map((c) => `<span class="color-dot" data-color="${c}" style="background:${c}"></span>`).join('');

  // ---------------------------------------------------------------------
  // 2D <-> screen mapping (world origin at canvas center, fixed scale)
  // ---------------------------------------------------------------------
  let yardW = 0, yardH = 0;
  function resizeYard() {
    const rect = yardWrap.getBoundingClientRect();
    const titleH = document.querySelector('#yard-wrap .view-title').offsetHeight;
    yardW = rect.width;
    yardH = rect.height - titleH;
    const dpr = window.devicePixelRatio || 1;
    yardCanvas.width = Math.max(1, Math.round(yardW * dpr));
    yardCanvas.height = Math.max(1, Math.round(yardH * dpr));
    yardCanvas.style.width = yardW + 'px';
    yardCanvas.style.height = yardH + 'px';
    yardCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function worldToScreen(p) { return { x: yardW / 2 + p.x * PX_PER_UNIT, y: yardH / 2 + p.y * PX_PER_UNIT }; }
  function screenToWorld(p) { return { x: (p.x - yardW / 2) / PX_PER_UNIT, y: (p.y - yardH / 2) / PX_PER_UNIT }; }

  function blockScreenRect(b) {
    if (b.type === 'tower') {
      const c = worldToScreen({ x: b.x, y: b.y });
      return { cx: c.x, cy: c.y, r: b.r * PX_PER_UNIT };
    }
    const c = worldToScreen({ x: b.x, y: b.y });
    return { x0: c.x - (b.w * PX_PER_UNIT) / 2, y0: c.y - (b.h * PX_PER_UNIT) / 2, w: b.w * PX_PER_UNIT, h: b.h * PX_PER_UNIT };
  }

  // ---------------------------------------------------------------------
  // 2D rendering
  // ---------------------------------------------------------------------
  function drawYard() {
    yardCtx.clearRect(0, 0, yardW, yardH);

    // soft decorative dot grid
    yardCtx.fillStyle = 'rgba(255,255,255,0.55)';
    const step = PX_PER_UNIT;
    const offX = (yardW / 2) % step, offY = (yardH / 2) % step;
    for (let x = offX; x < yardW; x += step) {
      for (let y = offY; y < yardH; y += step) {
        yardCtx.beginPath(); yardCtx.arc(x, y, 1.6, 0, Math.PI * 2); yardCtx.fill();
      }
    }

    for (const b of state.blocks) drawBlock2D(b, b.id === state.selectedId);
    for (const a of state.attachments) drawAttachment2D(a);
  }

  function drawBlock2D(b, selected) {
    const ctx = yardCtx;
    ctx.save();
    if (b.type === 'tower') {
      const { cx, cy, r } = blockScreenRect(b);
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = b.color; ctx.fill();
      ctx.lineWidth = selected ? 4 : 2.5;
      ctx.strokeStyle = selected ? '#223047' : 'rgba(0,0,0,0.25)';
      ctx.stroke();
      if (selected) drawHandle(cx + r, cy);
    } else {
      const { x0, y0, w, h } = blockScreenRect(b);
      const rad = 10;
      roundRect(ctx, x0, y0, w, h, rad);
      ctx.fillStyle = b.color; ctx.fill();
      ctx.lineWidth = selected ? 4 : 2.5;
      ctx.strokeStyle = selected ? '#223047' : 'rgba(0,0,0,0.25)';
      ctx.stroke();
      if (b.type === 'house') {
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x0 + w / 2, y0); ctx.lineTo(x0 + w / 2, y0 + h); ctx.stroke();
      }
      if (selected) drawHandle(x0 + w, y0 + h);
    }
    if (b.floors > 1) {
      const c = worldToScreen({ x: b.x, y: b.y });
      const badgeX = b.type === 'tower' ? c.x : blockScreenRect(b).x0 + 14;
      const badgeY = b.type === 'tower' ? c.y - b.r * PX_PER_UNIT - 12 : blockScreenRect(b).y0 + 14;
      ctx.beginPath(); ctx.arc(badgeX, badgeY, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#223047'; ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('x' + b.floors, badgeX, badgeY + 1);
    }
    ctx.restore();
  }

  function drawHandle(x, y) {
    const ctx = yardCtx;
    ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#ff8a3d'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function attachmentWorldPos(a) {
    const host = findBlock(a.hostId);
    if (!host) return null;
    if (host.type === 'tower') {
      const ang = a.angle;
      return { x: host.x + Math.cos(ang) * host.r, y: host.y + Math.sin(ang) * host.r, normal: ang };
    }
    const hw = host.w / 2, hh = host.h / 2;
    let x, y, normal;
    if (a.side === 'N') { x = host.x - hw + a.t * host.w; y = host.y - hh; normal = -Math.PI / 2; }
    else if (a.side === 'S') { x = host.x - hw + a.t * host.w; y = host.y + hh; normal = Math.PI / 2; }
    else if (a.side === 'W') { x = host.x - hw; y = host.y - hh + a.t * host.h; normal = Math.PI; }
    else { x = host.x + hw; y = host.y - hh + a.t * host.h; normal = 0; }
    return { x, y, normal };
  }

  function drawAttachment2D(a) {
    const pos = attachmentWorldPos(a);
    if (!pos) return;
    const s = worldToScreen(pos);
    const ctx = yardCtx;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(pos.normal);
    ctx.fillStyle = a.kind === 'door' ? '#8b5e34' : '#93c5fd';
    ctx.fillRect(-9, -4, 18, 8);
    ctx.restore();
  }

  // ---------------------------------------------------------------------
  // Hit testing (2D)
  // ---------------------------------------------------------------------
  function hitBlock(screenPt) {
    for (let i = state.blocks.length - 1; i >= 0; i--) {
      const b = state.blocks[i];
      if (b.type === 'tower') {
        const { cx, cy, r } = blockScreenRect(b);
        if (dist(screenPt, { x: cx, y: cy }) <= r) return b;
      } else {
        const { x0, y0, w, h } = blockScreenRect(b);
        if (screenPt.x >= x0 && screenPt.x <= x0 + w && screenPt.y >= y0 && screenPt.y <= y0 + h) return b;
      }
    }
    return null;
  }

  function hitHandle(screenPt) {
    const b = findBlock(state.selectedId);
    if (!b || state.selectedKind !== 'block') return false;
    let hx, hy;
    if (b.type === 'tower') { const r = blockScreenRect(b); hx = r.cx + r.r; hy = r.cy; }
    else { const r = blockScreenRect(b); hx = r.x0 + r.w; hy = r.y0 + r.h; }
    return dist(screenPt, { x: hx, y: hy }) <= 18;
  }

  function findNearestEdgeForAttachment(worldPt) {
    let best = null;
    for (const b of state.blocks) {
      if (b.type === 'tower') {
        const d = Math.abs(dist(worldPt, { x: b.x, y: b.y }) - b.r);
        if (d < 0.7 && (!best || d < best.d)) {
          const angle = Math.atan2(worldPt.y - b.y, worldPt.x - b.x);
          best = { d, hostId: b.id, angle };
        }
      } else {
        const hw = b.w / 2, hh = b.h / 2;
        const candidates = [
          { side: 'N', d: Math.abs(worldPt.y - (b.y - hh)), inRange: worldPt.x >= b.x - hw - 0.3 && worldPt.x <= b.x + hw + 0.3, t: clamp((worldPt.x - (b.x - hw)) / b.w, 0, 1) },
          { side: 'S', d: Math.abs(worldPt.y - (b.y + hh)), inRange: worldPt.x >= b.x - hw - 0.3 && worldPt.x <= b.x + hw + 0.3, t: clamp((worldPt.x - (b.x - hw)) / b.w, 0, 1) },
          { side: 'W', d: Math.abs(worldPt.x - (b.x - hw)), inRange: worldPt.y >= b.y - hh - 0.3 && worldPt.y <= b.y + hh + 0.3, t: clamp((worldPt.y - (b.y - hh)) / b.h, 0, 1) },
          { side: 'E', d: Math.abs(worldPt.x - (b.x + hw)), inRange: worldPt.y >= b.y - hh - 0.3 && worldPt.y <= b.y + hh + 0.3, t: clamp((worldPt.y - (b.y - hh)) / b.h, 0, 1) },
        ];
        for (const c of candidates) {
          if (c.inRange && c.d < 0.6 && (!best || c.d < best.d)) best = { d: c.d, hostId: b.id, side: c.side, t: c.t };
        }
      }
    }
    return best;
  }

  // ---------------------------------------------------------------------
  // Palette: tap-to-arm, tap-yard-to-place (works for mouse + touch)
  // ---------------------------------------------------------------------
  let pointerScreen = { x: 0, y: 0 };

  paletteItems.forEach((item) => {
    item.addEventListener('pointerdown', (evt) => {
      evt.preventDefault();
      const type = item.dataset.type;
      if (state.armedType === type) { disarm(); return; }
      state.armedType = type;
      paletteItems.forEach((p) => p.classList.toggle('armed', p === item));
      ghost.textContent = PALETTE_ICON[type];
      ghost.hidden = false;
      moveGhost(evt.clientX, evt.clientY);
    });
  });

  function disarm() {
    state.armedType = null;
    paletteItems.forEach((p) => p.classList.remove('armed'));
    ghost.hidden = true;
  }

  function moveGhost(clientX, clientY) {
    ghost.style.left = clientX + 'px';
    ghost.style.top = clientY + 'px';
  }

  document.addEventListener('pointermove', (evt) => {
    pointerScreen = { x: evt.clientX, y: evt.clientY };
    if (state.armedType) moveGhost(evt.clientX, evt.clientY);
  });

  // ---------------------------------------------------------------------
  // Yard interaction
  // ---------------------------------------------------------------------
  function yardPointFromEvent(evt) {
    const rect = yardCanvas.getBoundingClientRect();
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
  }

  yardCanvas.addEventListener('pointerdown', (evt) => {
    const screenPt = yardPointFromEvent(evt);
    const worldPt = screenToWorld(screenPt);

    if (state.armedType) {
      if (state.armedType === 'door' || state.armedType === 'window') {
        const edge = findNearestEdgeForAttachment(worldPt);
        if (edge) {
          pushHistory();
          state.attachments.push({ id: newId(), hostId: edge.hostId, kind: state.armedType, side: edge.side, t: edge.t, angle: edge.angle });
          syncAll();
        }
      } else {
        const d = DEFAULTS[state.armedType];
        const block = Object.assign({ id: newId(), type: state.armedType, x: worldPt.x, y: worldPt.y, floors: 1 }, d);
        pushHistory();
        state.blocks.push(block);
        state.selectedId = block.id;
        state.selectedKind = 'block';
        syncAll();
      }
      disarm();
      return;
    }

    if (hitHandle(screenPt)) {
      const b = findBlock(state.selectedId);
      state.drag = { kind: 'resize', id: b.id, startWorld: worldPt, start: clone(b), moved: false, beforeSnapshot: { blocks: clone(state.blocks), attachments: clone(state.attachments) } };
      yardCanvas.setPointerCapture(evt.pointerId);
      return;
    }

    const hit = hitBlock(screenPt);
    if (hit) {
      state.selectedId = hit.id;
      state.selectedKind = 'block';
      state.drag = { kind: 'move', id: hit.id, startWorld: worldPt, start: clone(hit), moved: false, beforeSnapshot: { blocks: clone(state.blocks), attachments: clone(state.attachments) } };
      yardCanvas.setPointerCapture(evt.pointerId);
      syncAll();
      return;
    }

    if (state.selectedId) { state.selectedId = null; state.selectedKind = null; syncAll(); }
  });

  yardCanvas.addEventListener('pointermove', (evt) => {
    if (!state.drag) return;
    const screenPt = yardPointFromEvent(evt);
    const worldPt = screenToWorld(screenPt);
    const b = findBlock(state.drag.id);
    if (!b) return;
    const dx = worldPt.x - state.drag.startWorld.x, dy = worldPt.y - state.drag.startWorld.y;
    if (dx === 0 && dy === 0) return;
    state.drag.moved = true;
    if (state.drag.kind === 'move') {
      b.x = state.drag.start.x + dx;
      b.y = state.drag.start.y + dy;
    } else if (state.drag.kind === 'resize') {
      if (b.type === 'tower') {
        b.r = Math.max(MIN_SIZE / 2, dist({ x: b.x, y: b.y }, worldPt));
      } else {
        // resize from the fixed center toward the dragged corner
        b.w = Math.max(MIN_SIZE, Math.abs(worldPt.x - b.x) * 2);
        b.h = Math.max(MIN_SIZE, Math.abs(worldPt.y - b.y) * 2);
      }
    }
    render2D();
    render3D();
  });

  function endYardDrag() {
    if (!state.drag) return;
    if (state.drag.moved) {
      state.history.push(state.drag.beforeSnapshot);
      if (state.history.length > 60) state.history.shift();
    }
    state.drag = null;
    syncAll();
  }
  yardCanvas.addEventListener('pointerup', endYardDrag);
  yardCanvas.addEventListener('pointercancel', endYardDrag);

  // ---------------------------------------------------------------------
  // Floating toolbar (floors, color, delete)
  // ---------------------------------------------------------------------
  function updateFloatingToolbar() {
    const b = findBlock(state.selectedId);
    if (!b || state.selectedKind !== 'block') { floatingToolbar.hidden = true; return; }
    floatingToolbar.hidden = false;
    fabFloors.textContent = b.floors + (b.floors === 1 ? ' floor' : ' floors');
    Array.from(fabColors.children).forEach((dot) => dot.classList.toggle('selected', dot.dataset.color.toLowerCase() === b.color.toLowerCase()));

    let top, left;
    if (b.type === 'tower') {
      const r = blockScreenRect(b);
      left = r.cx; top = r.cy - r.r - 60;
    } else {
      const r = blockScreenRect(b);
      left = r.x0 + r.w / 2; top = r.y0 - 60;
    }
    top = clamp(top, 8, yardH - 8);
    left = clamp(left, 90, yardW - 90);
    floatingToolbar.style.left = left + 'px';
    floatingToolbar.style.top = top + 'px';
  }

  fabPlus.addEventListener('click', () => {
    const b = findBlock(state.selectedId); if (!b) return;
    pushHistory(); b.floors = clamp(b.floors + 1, 1, MAX_FLOORS); syncAll();
  });
  fabMinus.addEventListener('click', () => {
    const b = findBlock(state.selectedId); if (!b) return;
    pushHistory(); b.floors = clamp(b.floors - 1, 1, MAX_FLOORS); syncAll();
  });
  fabColors.addEventListener('click', (evt) => {
    const dot = evt.target.closest('.color-dot'); if (!dot) return;
    const b = findBlock(state.selectedId); if (!b) return;
    pushHistory(); b.color = dot.dataset.color; syncAll();
  });
  fabDelete.addEventListener('click', () => {
    if (!state.selectedId) return;
    pushHistory();
    state.attachments = state.attachments.filter((a) => a.hostId !== state.selectedId);
    state.blocks = state.blocks.filter((b) => b.id !== state.selectedId);
    state.selectedId = null; state.selectedKind = null;
    syncAll();
  });

  btnUndo.addEventListener('click', undo);
  btnClear.addEventListener('click', () => {
    if ((state.blocks.length || state.attachments.length) && !window.confirm('Clear the whole yard?')) return;
    pushHistory();
    state.blocks = [];
    state.attachments = [];
    state.selectedId = null; state.selectedKind = null;
    syncAll();
  });

  // ---------------------------------------------------------------------
  // 3D scene
  // ---------------------------------------------------------------------
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfe6ff);
  scene.fog = new THREE.Fog(0xbfe6ff, 40, 90);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
  camera.position.set(14, 13, 16);

  const renderer = new THREE.WebGLRenderer({ canvas: previewCanvas, antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.12;
  controls.maxPolarAngle = Math.PI / 2 - 0.03;
  controls.minDistance = 4;
  controls.maxDistance = 80;
  controls.target.set(0, 1, 0);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(300, 300),
    new THREE.MeshStandardMaterial({ color: 0xcdeccb })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  const sun = new THREE.DirectionalLight(0xffffff, 0.9);
  sun.position.set(20, 30, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -40; sun.shadow.camera.right = 40;
  sun.shadow.camera.top = 40; sun.shadow.camera.bottom = -40;
  scene.add(sun);

  const contentGroup = new THREE.Group();
  scene.add(contentGroup);

  function disposeGroup(group) {
    group.children.slice().forEach((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
      group.remove(child);
    });
  }

  function box(w, h, d, color, opts) {
    const mat = new THREE.MeshStandardMaterial(Object.assign({ color }, opts || {}));
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.castShadow = true; mesh.receiveShadow = true;
    return mesh;
  }

  function render3D() {
    disposeGroup(contentGroup);
    for (const b of state.blocks) contentGroup.add(...buildBlockMeshes(b));
    for (const a of state.attachments) {
      const mesh = buildAttachmentMesh(a);
      if (mesh) contentGroup.add(mesh);
    }
  }

  function buildBlockMeshes(b) {
    const meshes = [];
    const totalH = b.floors * FLOOR_HEIGHT;
    if (b.type === 'tower') {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(b.r, b.r, totalH, 24), new THREE.MeshStandardMaterial({ color: b.color }));
      body.position.set(b.x, totalH / 2, b.y);
      body.castShadow = true; body.receiveShadow = true;
      const roofH = b.r * 1.6;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(b.r * 1.15, roofH, 24), new THREE.MeshStandardMaterial({ color: 0x7a3b5e }));
      roof.position.set(b.x, totalH + roofH / 2, b.y);
      roof.castShadow = true;
      meshes.push(body, roof);
    } else if (b.type === 'flat') {
      const body = box(b.w, totalH, b.h, b.color);
      body.position.set(b.x, totalH / 2, b.y);
      const cap = box(b.w * 1.04, 0.15, b.h * 1.04, 0xffffff, { opacity: 0.9, transparent: true });
      cap.position.set(b.x, totalH + 0.08, b.y);
      meshes.push(body, cap);
    } else { // house
      const body = box(b.w, totalH, b.h, b.color);
      body.position.set(b.x, totalH / 2, b.y);
      const roofH = Math.max(b.w, b.h) * 0.45;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(b.w, b.h) * 0.72, roofH, 4), new THREE.MeshStandardMaterial({ color: 0xb3462c }));
      roof.rotation.y = Math.PI / 4;
      roof.scale.set(b.w / Math.max(b.w, b.h), 1, b.h / Math.max(b.w, b.h));
      roof.position.set(b.x, totalH + roofH / 2, b.y);
      roof.castShadow = true;
      meshes.push(body, roof);
    }
    return meshes;
  }

  function buildAttachmentMesh(a) {
    const host = findBlock(a.hostId);
    const pos = attachmentWorldPos(a);
    if (!host || !pos) return null;
    const isDoor = a.kind === 'door';
    const w = isDoor ? 0.9 : 1.1, h = isDoor ? 2.0 : 1.0;
    const yCenter = isDoor ? h / 2 : FLOOR_HEIGHT * 0.55;
    const mat = new THREE.MeshStandardMaterial(isDoor
      ? { color: 0x8b5e34 }
      : { color: 0x93c5fd, transparent: true, opacity: 0.85 });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.12), mat);
    mesh.position.set(pos.x, yCenter, pos.y);
    mesh.rotation.y = -pos.normal;
    mesh.castShadow = true;
    return mesh;
  }

  function resizePreview() {
    const rect = previewWrap.getBoundingClientRect();
    const titleH = document.querySelector('#preview-wrap .view-title').offsetHeight;
    const w = rect.width, h = rect.height - titleH;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  }

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  // ---------------------------------------------------------------------
  // Sync everything after a state change
  // ---------------------------------------------------------------------
  function render2D() { drawYard(); updateFloatingToolbar(); }
  function syncAll() { render2D(); render3D(); }

  window.addEventListener('resize', () => { resizeYard(); resizePreview(); render2D(); });

  resizeYard();
  resizePreview();
  syncAll();
  animate();
})();
