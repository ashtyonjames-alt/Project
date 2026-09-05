(function () {
  'use strict';

  // ---------------------------------------------------------------------
  // Constants & helpers
  // ---------------------------------------------------------------------
  const M_PER_FT = 0.3048;
  const SNAP_PX = 10;        // screen-pixel radius for vertex snapping
  const EDGE_SNAP_PX = 18;   // screen-pixel radius for door/window edge snapping
  const BASE_SCALE = 60;     // px per meter at 100% zoom
  const STORAGE_KEY = 'architect-mapper-project';

  const clone = (o) => JSON.parse(JSON.stringify(o));
  const distance = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
  const angleBetween = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);

  function pointToSegmentDistance(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    let t = len2 === 0 ? 0 : ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const proj = { x: a.x + dx * t, y: a.y + dy * t };
    return { dist: distance(p, proj), point: proj, t };
  }

  function polygonArea(points) {
    let sum = 0;
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      sum += a.x * b.y - b.x * a.y;
    }
    return Math.abs(sum) / 2;
  }

  function polygonPerimeter(points, closed) {
    let sum = 0;
    const n = points.length;
    const limit = closed ? n : n - 1;
    for (let i = 0; i < limit; i++) {
      sum += distance(points[i], points[(i + 1) % n]);
    }
    return sum;
  }

  function polygonCentroid(points) {
    let x = 0, y = 0;
    for (const p of points) { x += p.x; y += p.y; }
    return { x: x / points.length, y: y / points.length };
  }

  function polylineEdges(points, closed) {
    const edges = [];
    for (let i = 0; i < points.length - 1; i++) edges.push([points[i], points[i + 1]]);
    if (closed && points.length > 2) edges.push([points[points.length - 1], points[0]]);
    return edges;
  }

  // ---------------------------------------------------------------------
  // Unit formatting
  // ---------------------------------------------------------------------
  function formatLength(meters) {
    if (state.units === 'm') return meters.toFixed(2) + ' m';
    let totalIn = Math.round((meters / M_PER_FT) * 12);
    let feet = Math.floor(totalIn / 12);
    let inches = totalIn % 12;
    return feet + "'" + inches + '"';
  }

  function formatArea(sqMeters) {
    if (state.units === 'm') return sqMeters.toFixed(2) + ' m²';
    const sqFt = sqMeters / (M_PER_FT * M_PER_FT);
    return sqFt.toFixed(1) + ' sq ft';
  }

  function parseLength(str, units) {
    if (!str) return NaN;
    str = str.trim().toLowerCase();
    if (str.includes("'")) {
      const ftMatch = str.match(/(-?\d+(?:\.\d+)?)\s*'/);
      const inMatch = str.match(/(\d+(?:\.\d+)?)\s*"/);
      const ft = ftMatch ? parseFloat(ftMatch[1]) : 0;
      const inch = inMatch ? parseFloat(inMatch[1]) : 0;
      return (ft + inch / 12) * M_PER_FT;
    }
    if (str.endsWith('ft')) return parseFloat(str) * M_PER_FT;
    if (str.endsWith('in')) return (parseFloat(str) / 12) * M_PER_FT;
    if (str.endsWith('m')) return parseFloat(str);
    const val = parseFloat(str);
    if (isNaN(val)) return NaN;
    return units === 'm' ? val : val * M_PER_FT;
  }

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------
  const state = {
    units: 'ft-in',
    gridSize: 0.5,
    snapEnabled: true,
    wallThickness: 0.15,
    doorWidth: 0.9,
    windowWidth: 1.2,
    scale: BASE_SCALE,
    offsetX: 80,
    offsetY: 80,
    viewW: 0,
    viewH: 0,
    tool: 'select',
    elements: [],
    draft: null,
    pendingDraftDirection: 0,
    selectedId: null,
    dragging: null,
    measureFirst: null,
    history: [],
    future: [],
    mouseWorld: { x: 0, y: 0 },
    mouseScreen: { x: 0, y: 0 },
    isPanning: false,
    panLast: null,
    spaceDown: false,
    shiftDown: false,
    nextId: 1,
  };

  function newId() { return 'el_' + (state.nextId++); }

  // ---------------------------------------------------------------------
  // DOM refs
  // ---------------------------------------------------------------------
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const wrap = document.getElementById('canvas-wrap');
  const toolButtons = Array.from(document.querySelectorAll('.tool-btn[data-tool]'));
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  const btnDelete = document.getElementById('btn-delete');
  const unitsSelect = document.getElementById('units-select');
  const gridSizeInput = document.getElementById('grid-size');
  const snapToggle = document.getElementById('snap-toggle');
  const wallThicknessInput = document.getElementById('wall-thickness');
  const btnNew = document.getElementById('btn-new');
  const btnExportJson = document.getElementById('btn-export-json');
  const importJsonInput = document.getElementById('import-json-input');
  const btnExportPng = document.getElementById('btn-export-png');
  const summaryRoomCount = document.getElementById('summary-room-count');
  const summaryTotalArea = document.getElementById('summary-total-area');
  const summaryWallLength = document.getElementById('summary-wall-length');
  const hintText = document.getElementById('hint-text');
  const coordReadout = document.getElementById('coord-readout');
  const zoomLevelEl = document.getElementById('zoom-level');
  const zoomInBtn = document.getElementById('zoom-in');
  const zoomOutBtn = document.getElementById('zoom-out');
  const zoomResetBtn = document.getElementById('zoom-reset');
  const propsContent = document.getElementById('props-content');
  const lengthInput = document.getElementById('length-input');

  const HINTS = {
    select: 'Click an element to select it. Drag to move. Delete removes it.',
    wall: 'Click to place wall points. Press Enter to type an exact length. Double-click or right-click to finish.',
    room: 'Click to place room corners. Click near the start point to close it. Enter for exact length.',
    door: 'Click on a wall or room edge to place a door.',
    window: 'Click on a wall or room edge to place a window.',
    measure: 'Click two points to measure the distance between them.',
    label: 'Click to place a text label.',
  };

  // ---------------------------------------------------------------------
  // History (undo/redo)
  // ---------------------------------------------------------------------
  function commitChange(mutator) {
    const before = clone(state.elements);
    mutator();
    state.history.push(before);
    if (state.history.length > 100) state.history.shift();
    state.future = [];
    saveLocal();
    render();
  }

  function undo() {
    if (!state.history.length) return;
    state.future.push(clone(state.elements));
    state.elements = state.history.pop();
    state.selectedId = null;
    saveLocal();
    render();
  }

  function redo() {
    if (!state.future.length) return;
    state.history.push(clone(state.elements));
    state.elements = state.future.pop();
    state.selectedId = null;
    saveLocal();
    render();
  }

  // ---------------------------------------------------------------------
  // Persistence
  // ---------------------------------------------------------------------
  function saveLocal() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        units: state.units,
        gridSize: state.gridSize,
        wallThickness: state.wallThickness,
        elements: state.elements,
      }));
    } catch (e) { /* storage unavailable - ignore */ }
  }

  function loadLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.units) state.units = data.units;
      if (data.gridSize) state.gridSize = data.gridSize;
      if (data.wallThickness) state.wallThickness = data.wallThickness;
      if (Array.isArray(data.elements)) state.elements = data.elements;
      let maxId = 0;
      for (const el of state.elements) {
        const n = parseInt(String(el.id).replace('el_', ''), 10);
        if (!isNaN(n)) maxId = Math.max(maxId, n);
      }
      state.nextId = maxId + 1;
    } catch (e) { /* ignore corrupt storage */ }
  }

  // ---------------------------------------------------------------------
  // Coordinate transforms
  // ---------------------------------------------------------------------
  function worldToScreen(p) { return { x: p.x * state.scale + state.offsetX, y: p.y * state.scale + state.offsetY }; }
  function screenToWorld(p) { return { x: (p.x - state.offsetX) / state.scale, y: (p.y - state.offsetY) / state.scale }; }

  function resizeCanvas() {
    const rect = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.viewW = rect.width;
    state.viewH = rect.height;
  }

  // ---------------------------------------------------------------------
  // Snapping
  // ---------------------------------------------------------------------
  function elementVertices(el) {
    if (el.points) return el.points;
    if (el.x !== undefined) return [{ x: el.x, y: el.y }];
    return [];
  }

  function snapPoint(pt) {
    const vertThreshold = SNAP_PX / state.scale;
    let best = null, bestDist = Infinity;
    for (const el of state.elements) {
      for (const v of elementVertices(el)) {
        const d = distance(pt, v);
        if (d < bestDist) { bestDist = d; best = v; }
      }
    }
    if (state.draft) {
      for (const v of state.draft.points) {
        const d = distance(pt, v);
        if (d < bestDist) { bestDist = d; best = v; }
      }
    }
    if (best && bestDist <= vertThreshold) return { x: best.x, y: best.y };
    if (state.snapEnabled) {
      const g = state.gridSize || 0.5;
      return { x: Math.round(pt.x / g) * g, y: Math.round(pt.y / g) * g };
    }
    return { x: pt.x, y: pt.y };
  }

  function applyAngleSnap(from, to) {
    if (!state.shiftDown) return to;
    const dx = to.x - from.x, dy = to.y - from.y;
    const dist = Math.hypot(dx, dy);
    const ang = Math.atan2(dy, dx);
    const step = Math.PI / 12; // 15 degrees
    const snapAngle = Math.round(ang / step) * step;
    return { x: from.x + Math.cos(snapAngle) * dist, y: from.y + Math.sin(snapAngle) * dist };
  }

  function findNearestEdge(pt) {
    let best = null;
    const consider = (points, closed) => {
      for (const [a, b] of polylineEdges(points, closed)) {
        const r = pointToSegmentDistance(pt, a, b);
        if (!best || r.dist < best.dist) best = { dist: r.dist, point: r.point, angle: angleBetween(a, b) };
      }
    };
    for (const el of state.elements) {
      if (el.type === 'wall') consider(el.points, false);
      if (el.type === 'room') consider(el.points, true);
    }
    return best;
  }

  // ---------------------------------------------------------------------
  // Hit testing (select tool)
  // ---------------------------------------------------------------------
  function hitTest(pt) {
    const threshold = SNAP_PX / state.scale;
    for (let i = state.elements.length - 1; i >= 0; i--) {
      const el = state.elements[i];
      if (el.type === 'wall') {
        for (const [a, b] of polylineEdges(el.points, false)) {
          if (pointToSegmentDistance(pt, a, b).dist <= threshold + el.thickness / 2) return el;
        }
      } else if (el.type === 'room') {
        for (const [a, b] of polylineEdges(el.points, true)) {
          if (pointToSegmentDistance(pt, a, b).dist <= threshold + el.thickness / 2) return el;
        }
        if (pointInPolygon(pt, el.points)) return el;
      } else if (el.type === 'door' || el.type === 'window') {
        if (distance(pt, { x: el.x, y: el.y }) <= threshold * 1.5) return el;
      } else if (el.type === 'measure') {
        if (pointToSegmentDistance(pt, el.p1, el.p2).dist <= threshold) return el;
      } else if (el.type === 'label') {
        const s = worldToScreen({ x: el.x, y: el.y });
        const sp = worldToScreen(pt);
        if (sp.x >= s.x - 6 && sp.x <= s.x + 110 && sp.y >= s.y - 16 && sp.y <= s.y + 6) return el;
      }
    }
    return null;
  }

  function pointInPolygon(p, points) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x, yi = points[i].y, xj = points[j].x, yj = points[j].y;
      const intersect = ((yi > p.y) !== (yj > p.y)) && (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // ---------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------
  function render() {
    ctx.clearRect(0, 0, state.viewW, state.viewH);
    drawGrid();
    for (const el of state.elements) drawElement(el, el.id === state.selectedId);
    if (state.draft) drawDraft();
    if (state.tool === 'measure' && state.measureFirst) drawMeasurePreview();
    updateSummary();
    updateZoomLabel();
  }

  function drawGrid() {
    const step = state.gridSize > 0 ? state.gridSize : 0.5;
    const worldLeft = (0 - state.offsetX) / state.scale;
    const worldRight = (state.viewW - state.offsetX) / state.scale;
    const worldTop = (0 - state.offsetY) / state.scale;
    const worldBottom = (state.viewH - state.offsetY) / state.scale;
    const startX = Math.floor(worldLeft / step) * step;
    const startY = Math.floor(worldTop / step) * step;
    ctx.lineWidth = 1;
    for (let x = startX, i = Math.round(startX / step); x <= worldRight + step; x += step, i++) {
      const sx = x * state.scale + state.offsetX;
      ctx.strokeStyle = (i % 5 === 0) ? '#c9ced8' : '#e3e6eb';
      ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, state.viewH); ctx.stroke();
    }
    for (let y = startY, i = Math.round(startY / step); y <= worldBottom + step; y += step, i++) {
      const sy = y * state.scale + state.offsetY;
      ctx.strokeStyle = (i % 5 === 0) ? '#c9ced8' : '#e3e6eb';
      ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(state.viewW, sy); ctx.stroke();
    }
  }

  function drawVertexDots(points) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    for (const p of points) {
      const s = worldToScreen(p);
      ctx.beginPath(); ctx.arc(s.x, s.y, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
  }

  function drawEdgeLabels(points, closed) {
    ctx.font = '11px -apple-system, sans-serif';
    ctx.fillStyle = '#374151';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const [a, b] of polylineEdges(points, closed)) {
      const len = distance(a, b);
      if (len < 0.05) continue;
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      let ang = Math.atan2(b.y - a.y, b.x - a.x);
      if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI;
      const nx = -Math.sin(ang), ny = Math.cos(ang);
      const labelWorld = { x: mid.x + nx * (10 / state.scale), y: mid.y + ny * (10 / state.scale) };
      const s = worldToScreen(labelWorld);
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(ang);
      const text = formatLength(len);
      const w = ctx.measureText(text).width + 6;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(-w / 2, -8, w, 14);
      ctx.fillStyle = '#374151';
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }
  }

  function drawElement(el, selected) {
    switch (el.type) {
      case 'wall': return drawWall(el, selected);
      case 'room': return drawRoom(el, selected);
      case 'door': return drawOpening(el, 'door', selected);
      case 'window': return drawOpening(el, 'window', selected);
      case 'measure': return drawMeasure(el, selected);
      case 'label': return drawLabelEl(el, selected);
    }
  }

  function drawWall(el, selected) {
    const px = Math.max(el.thickness * state.scale, 2);
    ctx.lineWidth = px;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = selected ? '#3b82f6' : '#2b3242';
    ctx.beginPath();
    el.points.forEach((p, i) => {
      const s = worldToScreen(p);
      if (i === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y);
    });
    ctx.stroke();
    drawEdgeLabels(el.points, false);
    if (selected) drawVertexDots(el.points);
  }

  function drawRoom(el, selected) {
    ctx.beginPath();
    el.points.forEach((p, i) => {
      const s = worldToScreen(p);
      if (i === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y);
    });
    ctx.closePath();
    ctx.fillStyle = selected ? 'rgba(59,130,246,0.25)' : 'rgba(207,227,255,0.45)';
    ctx.fill();
    ctx.lineWidth = Math.max(el.thickness * state.scale, 2);
    ctx.strokeStyle = selected ? '#1d4ed8' : '#3b82f6';
    ctx.lineJoin = 'round';
    ctx.stroke();
    drawEdgeLabels(el.points, true);
    if (selected) drawVertexDots(el.points);

    const area = polygonArea(el.points);
    const centroid = worldToScreen(polygonCentroid(el.points));
    ctx.font = 'bold 12px -apple-system, sans-serif';
    ctx.fillStyle = '#1c2230';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (el.name) {
      ctx.fillText(el.name, centroid.x, centroid.y - 8);
      ctx.font = '11px -apple-system, sans-serif';
      ctx.fillText(formatArea(area), centroid.x, centroid.y + 8);
    } else {
      ctx.fillText(formatArea(area), centroid.x, centroid.y);
    }
  }

  function drawOpening(el, kind, selected) {
    const half = el.width / 2;
    const dx = Math.cos(el.angle), dy = Math.sin(el.angle);
    const p1 = { x: el.x - dx * half, y: el.y - dy * half };
    const p2 = { x: el.x + dx * half, y: el.y + dy * half };
    const s1 = worldToScreen(p1), s2 = worldToScreen(p2);

    // erase the wall line under the opening
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(s2.x, s2.y); ctx.stroke();

    ctx.strokeStyle = selected ? '#3b82f6' : (kind === 'door' ? '#8b5e34' : '#2563eb');
    ctx.lineWidth = 2;

    if (kind === 'door') {
      const nx = -dy, ny = dx;
      const tip = { x: p1.x + nx * el.width, y: p1.y + ny * el.width };
      const st = worldToScreen(tip);
      ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(st.x, st.y); ctx.stroke();
      ctx.setLineDash([3, 3]);
      const startAngle = Math.atan2(s2.y - s1.y, s2.x - s1.x);
      const endAngle = Math.atan2(st.y - s1.y, st.x - s1.x);
      ctx.beginPath();
      ctx.arc(s1.x, s1.y, distance(p1, p2) * state.scale, Math.min(startAngle, endAngle), Math.max(startAngle, endAngle));
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      const nx = -dy * 4, ny = dx * 4;
      ctx.beginPath();
      ctx.moveTo(s1.x + nx, s1.y + ny); ctx.lineTo(s2.x + nx, s2.y + ny);
      ctx.moveTo(s1.x - nx, s1.y - ny); ctx.lineTo(s2.x - nx, s2.y - ny);
      ctx.stroke();
    }

    ctx.font = '10px -apple-system, sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'center';
    ctx.fillText(formatLength(el.width), (s1.x + s2.x) / 2, (s1.y + s2.y) / 2 - 10);
  }

  function drawMeasure(el, selected) {
    const s1 = worldToScreen(el.p1), s2 = worldToScreen(el.p2);
    ctx.strokeStyle = selected ? '#3b82f6' : '#e0862c';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(s2.x, s2.y); ctx.stroke();
    ctx.setLineDash([]);
    const mid = { x: (s1.x + s2.x) / 2, y: (s1.y + s2.y) / 2 };
    const text = formatLength(distance(el.p1, el.p2));
    ctx.font = 'bold 11px -apple-system, sans-serif';
    const w = ctx.measureText(text).width + 8;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(mid.x - w / 2, mid.y - 9, w, 16);
    ctx.fillStyle = '#e0862c';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, mid.x, mid.y - 1);
  }

  function drawLabelEl(el, selected) {
    const s = worldToScreen({ x: el.x, y: el.y });
    ctx.font = '13px -apple-system, sans-serif';
    ctx.fillStyle = selected ? '#1d4ed8' : '#1c2230';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(el.text, s.x, s.y);
    if (selected) {
      const w = ctx.measureText(el.text).width;
      ctx.strokeStyle = '#3b82f6';
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(s.x - 4, s.y - 10, w + 8, 20);
      ctx.setLineDash([]);
    }
  }

  function drawDraft() {
    const pts = state.draft.points;
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    pts.forEach((p, i) => {
      const s = worldToScreen(p);
      if (i === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y);
    });
    const last = pts[pts.length - 1];
    let previewPt = snapPoint(state.mouseWorld);
    previewPt = applyAngleSnap(last, previewPt);
    const ps = worldToScreen(previewPt);
    ctx.lineTo(ps.x, ps.y);
    if (state.draft.type === 'room' && pts.length >= 2) {
      const firstS = worldToScreen(pts[0]);
      ctx.lineTo(firstS.x, firstS.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    drawVertexDots(pts);

    const segLen = distance(last, previewPt);
    const angDeg = Math.round((Math.atan2(previewPt.y - last.y, previewPt.x - last.x) * 180) / Math.PI);
    ctx.font = 'bold 12px -apple-system, sans-serif';
    ctx.fillStyle = '#1d4ed8';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${formatLength(segLen)}  ∠${angDeg}°`, ps.x + 10, ps.y - 6);
  }

  function drawMeasurePreview() {
    const s1 = worldToScreen(state.measureFirst);
    const pt = snapPoint(state.mouseWorld);
    const s2 = worldToScreen(pt);
    ctx.strokeStyle = '#e0862c';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(s2.x, s2.y); ctx.stroke();
    ctx.setLineDash([]);
    const text = formatLength(distance(state.measureFirst, pt));
    ctx.font = 'bold 11px -apple-system, sans-serif';
    ctx.fillStyle = '#e0862c';
    ctx.textAlign = 'left';
    ctx.fillText(text, s2.x + 8, s2.y - 8);
  }

  function updateZoomLabel() {
    zoomLevelEl.textContent = Math.round((state.scale / BASE_SCALE) * 100) + '%';
  }

  function updateSummary() {
    const rooms = state.elements.filter((e) => e.type === 'room');
    let totalArea = 0;
    for (const r of rooms) totalArea += polygonArea(r.points);
    let wallLen = 0;
    for (const e of state.elements) {
      if (e.type === 'wall') wallLen += polygonPerimeter(e.points, false);
      if (e.type === 'room') wallLen += polygonPerimeter(e.points, true);
    }
    summaryRoomCount.textContent = rooms.length;
    summaryTotalArea.textContent = formatArea(totalArea);
    summaryWallLength.textContent = formatLength(wallLen);
  }

  // ---------------------------------------------------------------------
  // Properties panel
  // ---------------------------------------------------------------------
  function showProperties() {
    const el = state.elements.find((e) => e.id === state.selectedId);
    if (!el) { propsContent.innerHTML = '<p class="props-empty">Nothing selected.</p>'; return; }

    let html = '';
    if (el.type === 'wall') {
      html += row('Type', 'Wall');
      html += row('Length', formatLength(polygonPerimeter(el.points, false)));
      html += fieldRow('Thickness (m)', 'thickness', el.thickness);
    } else if (el.type === 'room') {
      html += row('Type', 'Room');
      html += fieldRowText('Name', 'name', el.name || '');
      html += row('Area', formatArea(polygonArea(el.points)));
      html += row('Perimeter', formatLength(polygonPerimeter(el.points, true)));
      html += fieldRow('Wall thk. (m)', 'thickness', el.thickness);
    } else if (el.type === 'door' || el.type === 'window') {
      html += row('Type', el.type === 'door' ? 'Door' : 'Window');
      html += fieldRow('Width (m)', 'width', el.width);
    } else if (el.type === 'measure') {
      html += row('Type', 'Measurement');
      html += row('Distance', formatLength(distance(el.p1, el.p2)));
    } else if (el.type === 'label') {
      html += row('Type', 'Label');
      html += fieldRowText('Text', 'text', el.text);
    }
    propsContent.innerHTML = html;

    propsContent.querySelectorAll('[data-field]').forEach((input) => {
      input.addEventListener('change', () => {
        const field = input.dataset.field;
        const isNumeric = input.type === 'number';
        commitChange(() => {
          const target = state.elements.find((e) => e.id === state.selectedId);
          if (!target) return;
          target[field] = isNumeric ? (parseFloat(input.value) || 0) : input.value;
        });
        showProperties();
      });
    });
  }

  function row(label, value) {
    return `<div class="prop-row"><span>${label}</span><span>${value}</span></div>`;
  }
  function fieldRow(label, field, value) {
    return `<div class="prop-row"><span>${label}</span><input type="number" step="0.01" min="0.01" data-field="${field}" value="${value}"></div>`;
  }
  function fieldRowText(label, field, value) {
    return `<div class="prop-row"><span>${label}</span><input type="text" data-field="${field}" value="${escapeHtml(value)}"></div>`;
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  // ---------------------------------------------------------------------
  // Tool switching
  // ---------------------------------------------------------------------
  function setTool(tool) {
    state.tool = tool;
    state.draft = null;
    state.measureFirst = null;
    lengthInput.hidden = true;
    toolButtons.forEach((b) => b.classList.toggle('active', b.dataset.tool === tool));
    hintText.textContent = HINTS[tool] || '';
    render();
  }

  toolButtons.forEach((btn) => btn.addEventListener('click', () => setTool(btn.dataset.tool)));

  // ---------------------------------------------------------------------
  // Canvas mouse interaction
  // ---------------------------------------------------------------------
  function getMouseWorld(evt) {
    const rect = canvas.getBoundingClientRect();
    const sp = { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
    state.mouseScreen = sp;
    return screenToWorld(sp);
  }

  canvas.addEventListener('mousemove', (evt) => {
    state.mouseWorld = getMouseWorld(evt);
    coordReadout.textContent = `x: ${formatLength(state.mouseWorld.x)}, y: ${formatLength(state.mouseWorld.y)}`;

    if (state.isPanning && state.panLast) {
      state.offsetX += evt.clientX - state.panLast.x;
      state.offsetY += evt.clientY - state.panLast.y;
      state.panLast = { x: evt.clientX, y: evt.clientY };
      render();
      return;
    }

    if (state.dragging) {
      const delta = { x: state.mouseWorld.x - state.dragging.lastWorld.x, y: state.mouseWorld.y - state.dragging.lastWorld.y };
      const el = state.elements.find((e) => e.id === state.dragging.id);
      if (el) {
        if (el.points) el.points.forEach((p) => { p.x += delta.x; p.y += delta.y; });
        else if (el.x !== undefined) { el.x += delta.x; el.y += delta.y; }
        else if (el.p1) { el.p1.x += delta.x; el.p1.y += delta.y; el.p2.x += delta.x; el.p2.y += delta.y; }
      }
      state.dragging.lastWorld = state.mouseWorld;
      render();
      return;
    }

    render();
  });

  canvas.addEventListener('mousedown', (evt) => {
    canvas.focus();
    if (evt.button === 1 || state.spaceDown) {
      state.isPanning = true;
      state.panLast = { x: evt.clientX, y: evt.clientY };
      evt.preventDefault();
      return;
    }
    if (evt.button !== 0) return;
    const world = getMouseWorld(evt);

    if (state.tool === 'select') {
      const hit = hitTest(world);
      state.selectedId = hit ? hit.id : null;
      if (hit) {
        state.dragging = { id: hit.id, beforeSnapshot: clone(state.elements), lastWorld: world };
      } else {
        state.dragging = null;
      }
      showProperties();
      render();
      return;
    }

    if (state.tool === 'wall' || state.tool === 'room') {
      // the 2nd mousedown of a double-click (evt.detail >= 2) is the finishing
      // click handled by the 'dblclick' listener below - don't also add a point for it.
      if (evt.detail >= 2 && state.draft) return;
      let pt = snapPoint(world);
      if (state.draft) pt = applyAngleSnap(state.draft.points[state.draft.points.length - 1], pt);
      if (state.tool === 'room' && state.draft && state.draft.points.length >= 3) {
        if (distance(pt, state.draft.points[0]) <= SNAP_PX / state.scale) {
          const points = state.draft.points;
          commitChange(() => state.elements.push({ id: newId(), type: 'room', points, thickness: state.wallThickness, name: '' }));
          state.draft = null;
          render();
          return;
        }
      }
      if (!state.draft) state.draft = { type: state.tool, points: [pt] };
      else state.draft.points.push(pt);
      render();
      return;
    }

    if (state.tool === 'door' || state.tool === 'window') {
      const edge = findNearestEdge(world);
      if (edge && edge.dist <= EDGE_SNAP_PX / state.scale) {
        const width = state.tool === 'door' ? state.doorWidth : state.windowWidth;
        const newEl = { id: newId(), type: state.tool, x: edge.point.x, y: edge.point.y, angle: edge.angle, width };
        commitChange(() => state.elements.push(newEl));
        state.selectedId = newEl.id;
        showProperties();
      }
      return;
    }

    if (state.tool === 'measure') {
      const pt = snapPoint(world);
      if (!state.measureFirst) {
        state.measureFirst = pt;
      } else {
        const p1 = state.measureFirst, p2 = pt;
        commitChange(() => state.elements.push({ id: newId(), type: 'measure', p1, p2 }));
        state.measureFirst = null;
      }
      render();
      return;
    }

    if (state.tool === 'label') {
      const pt = snapPoint(world);
      const text = window.prompt('Label text:', 'Label');
      if (text === null || text.trim() === '') return;
      commitChange(() => state.elements.push({ id: newId(), type: 'label', x: pt.x, y: pt.y, text }));
      return;
    }
  });

  window.addEventListener('mouseup', () => {
    if (state.isPanning) { state.isPanning = false; state.panLast = null; return; }
    if (state.dragging) {
      state.history.push(state.dragging.beforeSnapshot);
      state.history = state.history.slice(-100);
      state.future = [];
      saveLocal();
      state.dragging = null;
    }
  });

  canvas.addEventListener('dblclick', (evt) => {
    evt.preventDefault();
    if (!state.draft) return;
    if (state.draft.type === 'wall' && state.draft.points.length >= 2) {
      const points = state.draft.points;
      commitChange(() => state.elements.push({ id: newId(), type: 'wall', points, thickness: state.wallThickness }));
    } else if (state.draft.type === 'room' && state.draft.points.length >= 3) {
      const points = state.draft.points;
      commitChange(() => state.elements.push({ id: newId(), type: 'room', points, thickness: state.wallThickness, name: '' }));
    }
    state.draft = null;
    render();
  });

  canvas.addEventListener('contextmenu', (evt) => {
    evt.preventDefault();
    if (state.draft) { state.draft = null; render(); }
    else if (state.measureFirst) { state.measureFirst = null; render(); }
  });

  canvas.addEventListener('wheel', (evt) => {
    evt.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const screenPt = { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
    const worldPt = screenToWorld(screenPt);
    const factor = evt.deltaY < 0 ? 1.1 : 1 / 1.1;
    state.scale = Math.min(400, Math.max(10, state.scale * factor));
    state.offsetX = screenPt.x - worldPt.x * state.scale;
    state.offsetY = screenPt.y - worldPt.y * state.scale;
    render();
  }, { passive: false });

  function zoomAround(factor) {
    const center = { x: state.viewW / 2, y: state.viewH / 2 };
    const worldPt = screenToWorld(center);
    state.scale = Math.min(400, Math.max(10, state.scale * factor));
    state.offsetX = center.x - worldPt.x * state.scale;
    state.offsetY = center.y - worldPt.y * state.scale;
    render();
  }
  zoomInBtn.addEventListener('click', () => zoomAround(1.2));
  zoomOutBtn.addEventListener('click', () => zoomAround(1 / 1.2));
  zoomResetBtn.addEventListener('click', () => { state.scale = BASE_SCALE; state.offsetX = 80; state.offsetY = 80; render(); });

  // ---------------------------------------------------------------------
  // Exact-length input overlay
  // ---------------------------------------------------------------------
  function openLengthInput() {
    const last = state.draft.points[state.draft.points.length - 1];
    let previewPt = snapPoint(state.mouseWorld);
    previewPt = applyAngleSnap(last, previewPt);
    const liveLen = distance(last, previewPt);
    state.pendingDraftDirection = angleBetween(last, previewPt);

    lengthInput.hidden = false;
    lengthInput.style.left = state.mouseScreen.x + 'px';
    lengthInput.style.top = Math.max(0, state.mouseScreen.y - 30) + 'px';
    lengthInput.value = formatLength(liveLen);
    lengthInput.focus();
    lengthInput.select();
  }

  lengthInput.addEventListener('keydown', (evt) => {
    evt.stopPropagation();
    if (evt.key === 'Enter') {
      evt.preventDefault();
      const meters = parseLength(lengthInput.value, state.units);
      if (isFinite(meters) && meters > 0 && state.draft) {
        const last = state.draft.points[state.draft.points.length - 1];
        const dir = state.pendingDraftDirection;
        state.draft.points.push({ x: last.x + Math.cos(dir) * meters, y: last.y + Math.sin(dir) * meters });
      }
      lengthInput.hidden = true;
      canvas.focus();
      render();
    } else if (evt.key === 'Escape') {
      evt.preventDefault();
      lengthInput.hidden = true;
      canvas.focus();
    }
  });

  // ---------------------------------------------------------------------
  // Keyboard shortcuts
  // ---------------------------------------------------------------------
  window.addEventListener('keydown', (evt) => {
    if (evt.key === 'Shift') state.shiftDown = true;
    if (evt.code === 'Space' && document.activeElement.tagName !== 'INPUT') {
      state.spaceDown = true;
      wrap.style.cursor = 'grab';
    }
    const inFormField = ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName) && document.activeElement !== lengthInput;
    if (inFormField) return;

    if (evt.key === 'Escape') {
      if (!lengthInput.hidden) { lengthInput.hidden = true; }
      else if (state.draft) { state.draft = null; }
      else if (state.measureFirst) { state.measureFirst = null; }
      else { state.selectedId = null; showProperties(); }
      render();
    } else if (evt.key === 'Enter') {
      if ((state.tool === 'wall' || state.tool === 'room') && state.draft && state.draft.points.length > 0 && lengthInput.hidden) {
        evt.preventDefault();
        openLengthInput();
      }
    } else if (evt.key === 'Delete' || evt.key === 'Backspace') {
      if (state.selectedId) { evt.preventDefault(); deleteSelected(); }
    } else if (evt.ctrlKey && evt.key.toLowerCase() === 'z' && !evt.shiftKey) {
      evt.preventDefault(); undo();
    } else if (evt.ctrlKey && (evt.key.toLowerCase() === 'y' || (evt.shiftKey && evt.key.toLowerCase() === 'z'))) {
      evt.preventDefault(); redo();
    }
  });

  window.addEventListener('keyup', (evt) => {
    if (evt.key === 'Shift') state.shiftDown = false;
    if (evt.code === 'Space') { state.spaceDown = false; wrap.style.cursor = ''; }
  });

  function deleteSelected() {
    if (!state.selectedId) return;
    const id = state.selectedId;
    commitChange(() => { state.elements = state.elements.filter((e) => e.id !== id); });
    state.selectedId = null;
    showProperties();
  }
  btnDelete.addEventListener('click', deleteSelected);
  btnUndo.addEventListener('click', undo);
  btnRedo.addEventListener('click', redo);

  // ---------------------------------------------------------------------
  // Toolbar settings
  // ---------------------------------------------------------------------
  unitsSelect.addEventListener('change', () => { state.units = unitsSelect.value; saveLocal(); render(); });
  gridSizeInput.addEventListener('change', () => { state.gridSize = parseFloat(gridSizeInput.value) || 0.5; saveLocal(); render(); });
  snapToggle.addEventListener('change', () => { state.snapEnabled = snapToggle.checked; });
  wallThicknessInput.addEventListener('change', () => { state.wallThickness = parseFloat(wallThicknessInput.value) || 0.15; saveLocal(); });

  btnNew.addEventListener('click', () => {
    if (state.elements.length && !window.confirm('Start a new project? Unsaved changes will be lost.')) return;
    state.elements = [];
    state.history = [];
    state.future = [];
    state.selectedId = null;
    state.draft = null;
    saveLocal();
    showProperties();
    render();
  });

  btnExportJson.addEventListener('click', () => {
    const data = { units: state.units, gridSize: state.gridSize, wallThickness: state.wallThickness, elements: state.elements };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'floorplan.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  importJsonInput.addEventListener('change', () => {
    const file = importJsonInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data.elements)) throw new Error('Invalid file: missing elements array');
        commitChange(() => {
          state.elements = data.elements;
          if (data.units) { state.units = data.units; unitsSelect.value = data.units; }
          if (data.gridSize) { state.gridSize = data.gridSize; gridSizeInput.value = data.gridSize; }
          if (data.wallThickness) { state.wallThickness = data.wallThickness; wallThicknessInput.value = data.wallThickness; }
        });
        let maxId = 0;
        for (const el of state.elements) {
          const n = parseInt(String(el.id).replace('el_', ''), 10);
          if (!isNaN(n)) maxId = Math.max(maxId, n);
        }
        state.nextId = maxId + 1;
      } catch (e) {
        window.alert('Could not import file: ' + e.message);
      }
      importJsonInput.value = '';
    };
    reader.readAsText(file);
  });

  btnExportPng.addEventListener('click', () => {
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'floorplan.png';
    a.click();
  });

  // ---------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------
  function init() {
    loadLocal();
    unitsSelect.value = state.units;
    gridSizeInput.value = state.gridSize;
    wallThicknessInput.value = state.wallThickness;
    snapToggle.checked = state.snapEnabled;
    resizeCanvas();
    window.addEventListener('resize', handleResize);
    if (window.ResizeObserver) new ResizeObserver(handleResize).observe(wrap);
    setTool('select');
    showProperties();
    render();
  }

  function handleResize() { resizeCanvas(); render(); }

  init();
})();
