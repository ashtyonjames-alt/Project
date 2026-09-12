(function () {
  'use strict';

  // ---------------------------------------------------------------------
  // Constants & basic helpers
  // ---------------------------------------------------------------------
  const M_PER_FT = 0.3048;
  const SNAP_PX = 10;        // screen-pixel radius for vertex snapping
  const EDGE_SNAP_PX = 18;   // screen-pixel radius for door/window edge snapping
  const BASE_SCALE = 60;     // px per meter at 100% zoom
  const STORAGE_KEY = 'architect-mapper-project-v2';

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
  // Arc / bulge geometry (bulge = tan(includedAngle/4), stored on the point
  // that STARTS the curved segment; 0/undefined = straight line to the next
  // point). Validated: angle(s) = startAngle + s*theta for s in [0,1] maps
  // s=0 -> p1, s=1 -> p2, with a consistent left/right side per bulge sign.
  // ---------------------------------------------------------------------
  function bulgeToArc(p1, p2, bulge) {
    const theta = 4 * Math.atan(bulge);
    const d = distance(p1, p2);
    const radius = Math.abs(d / (2 * Math.sin(theta / 2)));
    const apothem = d / (2 * Math.tan(theta / 2));
    const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    const dx = p2.x - p1.x, dy = p2.y - p1.y, len = Math.hypot(dx, dy);
    const nx = -dy / len, ny = dx / len;
    const center = { x: mid.x + nx * apothem, y: mid.y + ny * apothem };
    const startAngle = Math.atan2(p1.y - center.y, p1.x - center.x);
    return { center, radius, startAngle, theta };
  }

  function arcPointAt(arc, s) {
    const ang = arc.startAngle + s * arc.theta;
    return { x: arc.center.x + arc.radius * Math.cos(ang), y: arc.center.y + arc.radius * Math.sin(ang) };
  }

  function arcSegmentCount(theta) {
    return Math.max(6, Math.min(72, Math.ceil((Math.abs(theta) * 180 / Math.PI) / 8)));
  }

  // Sampled points along one edge, from a to b inclusive. Straight if no bulge.
  function expandEdge(a, b) {
    const bulge = a.bulge || 0;
    if (!bulge) return [a, b];
    const arc = bulgeToArc(a, b, bulge);
    const n = arcSegmentCount(arc.theta);
    const pts = [];
    for (let i = 0; i <= n; i++) pts.push(arcPointAt(arc, i / n));
    return pts;
  }

  function expandPolyline(points, closed) {
    const out = [];
    const edges = polylineEdges(points, closed);
    edges.forEach(([a, b], i) => {
      const seg = expandEdge(a, b);
      if (i === 0) out.push(...seg); else out.push(...seg.slice(1));
    });
    return out;
  }

  function edgeLength(a, b) {
    const bulge = a.bulge || 0;
    if (!bulge) return distance(a, b);
    const arc = bulgeToArc(a, b, bulge);
    return arc.radius * Math.abs(arc.theta);
  }

  function edgeMidWorld(a, b) {
    const bulge = a.bulge || 0;
    if (!bulge) return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    return arcPointAt(bulgeToArc(a, b, bulge), 0.5);
  }

  function shapeArea(points) { return polygonArea(expandPolyline(points, true)); }
  function shapePerimeter(points, closed) {
    let sum = 0;
    for (const [a, b] of polylineEdges(points, closed)) sum += edgeLength(a, b);
    return sum;
  }

  // Distance from pt to edge a-b (arc-aware). Always includes `angle`: the
  // exact chord angle for a straight edge, or the local tangent angle of the
  // nearest sampled sub-segment for an arc (used to orient doors/windows).
  function distToEdge(pt, a, b) {
    const bulge = a.bulge || 0;
    if (!bulge) {
      const r = pointToSegmentDistance(pt, a, b);
      return { dist: r.dist, point: r.point, angle: angleBetween(a, b) };
    }
    const pts = expandEdge(a, b);
    let best = null;
    for (let i = 0; i < pts.length - 1; i++) {
      const r = pointToSegmentDistance(pt, pts[i], pts[i + 1]);
      if (!best || r.dist < best.dist) best = { dist: r.dist, point: r.point, angle: angleBetween(pts[i], pts[i + 1]) };
    }
    return best;
  }

  function circlePolygon(cx, cy, r, samples) {
    const n = samples || 32;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
    return pts;
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

  function parseLength(str) {
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
    return state.units === 'm' ? val : val * M_PER_FT;
  }

  // ---------------------------------------------------------------------
  // View model: one footprint (plan) view + any number of elevation views.
  // Elevations flip the y axis so "up" on screen means "up" in height, and
  // draw a grade line at y=0.
  // ---------------------------------------------------------------------
  function makeView(id, name, kind) {
    return { id, name, kind, elements: [], history: [], future: [], scale: BASE_SCALE, offsetX: 80, offsetY: kind === 'elevation' ? 340 : 80, tool: 'select' };
  }

  const state = {
    units: 'ft-in',
    gridSize: 0.5,
    snapEnabled: true,
    wallThickness: 0.15,
    doorWidth: 0.9,
    windowWidth: 1.2,
    doorHeight: 2.03,
    windowHeight: 1.2,
    views: { footprint: makeView('footprint', 'Footprint', 'footprint') },
    elevationOrder: [],
    activeViewId: 'footprint',
    viewW: 0,
    viewH: 0,
    draft: null,
    circleCenter: null,
    rectStart: null,
    selectedId: null,
    dragging: null,
    measureFirst: null,
    mouseWorld: { x: 0, y: 0 },
    mouseScreen: { x: 0, y: 0 },
    isPanning: false,
    panLast: null,
    spaceDown: false,
    shiftDown: false,
    nextId: 1,
  };

  function currentView() { return state.views[state.activeViewId]; }
  function newId() { return 'el_' + (state.nextId++); }

  // ---------------------------------------------------------------------
  // DOM refs
  // ---------------------------------------------------------------------
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const wrap = document.getElementById('canvas-wrap');
  const viewTabsEl = document.getElementById('view-tabs');
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

  function hints() {
    const v = currentView();
    const arcHint = " Press 'A' to curve the last segment (drag to bulge, Enter for exact radius).";
    return {
      select: 'Click an element to select it. Drag to move. Delete removes it.',
      wall: 'Click to place points. Press Enter to type an exact length.' + arcHint + ' Double-click or right-click to finish.',
      shape: 'Click to place corners. Click near the start point to close it.' + arcHint + ' Enter for exact length.',
      circle: 'Click to set the center, then click (or press Enter to type a radius) to set the size.',
      door: v.kind === 'elevation'
        ? 'Click one corner then the opposite corner of the door opening. Enter to type an exact "width x height".'
        : 'Click on a wall, shape edge, or circle to place a door there.',
      window: v.kind === 'elevation'
        ? 'Click one corner then the opposite corner of the window opening. Enter to type an exact "width x height".'
        : 'Click on a wall, shape edge, or circle to place a window there.',
      measure: 'Click two points to measure the distance between them.',
      label: 'Click to place a text label.',
    };
  }

  // ---------------------------------------------------------------------
  // History (undo/redo) — per view
  // ---------------------------------------------------------------------
  function commitChange(mutator) {
    const v = currentView();
    const before = clone(v.elements);
    mutator();
    v.history.push(before);
    if (v.history.length > 100) v.history.shift();
    v.future = [];
    saveLocal();
    render();
  }

  function undo() {
    const v = currentView();
    if (!v.history.length) return;
    v.future.push(clone(v.elements));
    v.elements = v.history.pop();
    state.selectedId = null;
    saveLocal();
    showProperties();
    render();
  }

  function redo() {
    const v = currentView();
    if (!v.future.length) return;
    v.history.push(clone(v.elements));
    v.elements = v.future.pop();
    state.selectedId = null;
    saveLocal();
    showProperties();
    render();
  }

  // ---------------------------------------------------------------------
  // Persistence
  // ---------------------------------------------------------------------
  function serializeProject() {
    return {
      units: state.units,
      gridSize: state.gridSize,
      wallThickness: state.wallThickness,
      doorWidth: state.doorWidth,
      windowWidth: state.windowWidth,
      doorHeight: state.doorHeight,
      windowHeight: state.windowHeight,
      footprint: { elements: state.views.footprint.elements },
      elevations: state.elevationOrder.map((id) => ({ id, name: state.views[id].name, elements: state.views[id].elements })),
    };
  }

  function saveLocal() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeProject())); } catch (e) { /* storage unavailable */ }
  }

  function loadProjectData(data) {
    if (data.units) state.units = data.units;
    if (data.gridSize) state.gridSize = data.gridSize;
    if (data.wallThickness) state.wallThickness = data.wallThickness;
    if (data.doorWidth) state.doorWidth = data.doorWidth;
    if (data.windowWidth) state.windowWidth = data.windowWidth;
    if (data.doorHeight) state.doorHeight = data.doorHeight;
    if (data.windowHeight) state.windowHeight = data.windowHeight;

    state.views = { footprint: makeView('footprint', 'Footprint', 'footprint') };
    state.elevationOrder = [];
    if (data.footprint && Array.isArray(data.footprint.elements)) state.views.footprint.elements = data.footprint.elements;
    if (Array.isArray(data.elevations)) {
      for (const ev of data.elevations) {
        const v = makeView(ev.id, ev.name || 'Elevation', 'elevation');
        v.elements = Array.isArray(ev.elements) ? ev.elements : [];
        state.views[ev.id] = v;
        state.elevationOrder.push(ev.id);
      }
    }
    state.activeViewId = 'footprint';

    let maxId = 0;
    for (const v of Object.values(state.views)) {
      for (const el of v.elements) {
        const n = parseInt(String(el.id).replace('el_', ''), 10);
        if (!isNaN(n)) maxId = Math.max(maxId, n);
      }
    }
    state.nextId = maxId + 1;
  }

  function loadLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      loadProjectData(JSON.parse(raw));
    } catch (e) { /* ignore corrupt storage */ }
  }

  // ---------------------------------------------------------------------
  // Coordinate transforms (elevation views flip the y axis: up = up)
  // ---------------------------------------------------------------------
  function worldToScreen(p) {
    const v = currentView();
    const ys = v.kind === 'elevation' ? -1 : 1;
    return { x: p.x * v.scale + v.offsetX, y: p.y * ys * v.scale + v.offsetY };
  }
  function screenToWorld(p) {
    const v = currentView();
    const ys = v.kind === 'elevation' ? -1 : 1;
    return { x: (p.x - v.offsetX) / v.scale, y: ((p.y - v.offsetY) / v.scale) * ys };
  }

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
  // Element vertex/snap helpers
  // ---------------------------------------------------------------------
  function elementVertices(el) {
    if (el.points) return el.points;
    if (el.type === 'circle') return [{ x: el.cx, y: el.cy }, { x: el.cx + el.r, y: el.cy }, { x: el.cx - el.r, y: el.cy }, { x: el.cx, y: el.cy + el.r }, { x: el.cx, y: el.cy - el.r }];
    if (el.type === 'opening') return [{ x: el.x, y: el.y }, { x: el.x + el.w, y: el.y }, { x: el.x, y: el.y + el.h }, { x: el.x + el.w, y: el.y + el.h }];
    if (el.p1) return [el.p1, el.p2];
    if (el.x !== undefined) return [{ x: el.x, y: el.y }];
    return [];
  }

  function snapPoint(pt) {
    const v = currentView();
    const vertThreshold = SNAP_PX / v.scale;
    let best = null, bestDist = Infinity;
    for (const el of v.elements) {
      for (const vert of elementVertices(el)) {
        const d = distance(pt, vert);
        if (d < bestDist) { bestDist = d; best = vert; }
      }
    }
    if (state.draft) {
      for (const vert of state.draft.points) {
        const d = distance(pt, vert);
        if (d < bestDist) { bestDist = d; best = vert; }
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
        const r = distToEdge(pt, a, b);
        if (!best || r.dist < best.dist) best = r;
      }
    };
    for (const el of currentView().elements) {
      if (el.type === 'wall') consider(el.points, false);
      if (el.type === 'shape') consider(el.points, true);
      if (el.type === 'circle') consider(circlePolygon(el.cx, el.cy, el.r), true);
    }
    return best;
  }

  // ---------------------------------------------------------------------
  // Hit testing (select tool)
  // ---------------------------------------------------------------------
  function hitTest(pt) {
    const v = currentView();
    const threshold = SNAP_PX / v.scale;
    for (let i = v.elements.length - 1; i >= 0; i--) {
      const el = v.elements[i];
      if (el.type === 'wall') {
        for (const [a, b] of polylineEdges(el.points, false)) {
          if (distToEdge(pt, a, b).dist <= threshold + el.thickness / 2) return el;
        }
      } else if (el.type === 'shape') {
        for (const [a, b] of polylineEdges(el.points, true)) {
          if (distToEdge(pt, a, b).dist <= threshold + el.thickness / 2) return el;
        }
        if (pointInPolygon(pt, expandPolyline(el.points, true))) return el;
      } else if (el.type === 'circle') {
        if (distance(pt, { x: el.cx, y: el.cy }) <= el.r + threshold) return el;
      } else if (el.type === 'opening') {
        const x0 = Math.min(el.x, el.x + el.w), x1 = Math.max(el.x, el.x + el.w);
        const y0 = Math.min(el.y, el.y + el.h), y1 = Math.max(el.y, el.y + el.h);
        if (pt.x >= x0 - threshold && pt.x <= x1 + threshold && pt.y >= y0 - threshold && pt.y <= y1 + threshold) return el;
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

  function translateElement(el, delta) {
    switch (el.type) {
      case 'wall': case 'shape':
        el.points.forEach((p) => { p.x += delta.x; p.y += delta.y; });
        break;
      case 'circle': el.cx += delta.x; el.cy += delta.y; break;
      case 'opening': case 'door': case 'window': case 'label':
        el.x += delta.x; el.y += delta.y;
        break;
      case 'measure':
        el.p1.x += delta.x; el.p1.y += delta.y; el.p2.x += delta.x; el.p2.y += delta.y;
        break;
    }
  }

  // ---------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------
  function render() {
    ctx.clearRect(0, 0, state.viewW, state.viewH);
    drawGrid();
    if (currentView().kind === 'elevation') drawGradeLine();
    for (const el of currentView().elements) drawElement(el, el.id === state.selectedId);
    if (state.draft) drawDraft();
    if (currentView().tool === 'circle' && state.circleCenter) drawCirclePreview();
    if (currentView().tool === 'measure' && state.measureFirst) drawMeasurePreview();
    if ((currentView().tool === 'door' || currentView().tool === 'window') && currentView().kind === 'elevation' && state.rectStart) drawRectPreview();
    updateSummary();
    updateZoomLabel();
  }

  function drawGrid() {
    const v = currentView();
    const step = state.gridSize > 0 ? state.gridSize : 0.5;
    const c0 = screenToWorld({ x: 0, y: 0 });
    const c1 = screenToWorld({ x: state.viewW, y: state.viewH });
    const worldLeft = Math.min(c0.x, c1.x), worldRight = Math.max(c0.x, c1.x);
    const worldTop = Math.min(c0.y, c1.y), worldBottom = Math.max(c0.y, c1.y);
    const startX = Math.floor(worldLeft / step) * step;
    const startY = Math.floor(worldTop / step) * step;
    ctx.lineWidth = 1;
    for (let x = startX, i = Math.round(startX / step); x <= worldRight + step; x += step, i++) {
      const sx = worldToScreen({ x, y: 0 }).x;
      ctx.strokeStyle = (i % 5 === 0) ? '#c9ced8' : '#e3e6eb';
      ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, state.viewH); ctx.stroke();
    }
    for (let y = startY, i = Math.round(startY / step); y <= worldBottom + step; y += step, i++) {
      const sy = worldToScreen({ x: 0, y }).y;
      ctx.strokeStyle = (i % 5 === 0) ? '#c9ced8' : '#e3e6eb';
      ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(state.viewW, sy); ctx.stroke();
    }
    void v;
  }

  function drawGradeLine() {
    const sy = worldToScreen({ x: 0, y: 0 }).y;
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(state.viewW, sy); ctx.stroke();
    ctx.font = 'bold 10px -apple-system, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('GRADE', 6, sy - 3);
  }

  function pathForPoints(pts) {
    ctx.beginPath();
    pts.forEach((p, i) => {
      const s = worldToScreen(p);
      if (i === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y);
    });
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
    for (const [a, b] of polylineEdges(points, closed)) {
      const bulge = a.bulge || 0;
      const len = edgeLength(a, b);
      if (len < 0.05) continue;
      const mid = edgeMidWorld(a, b);
      let text = formatLength(len);
      let ang = 0;
      if (!bulge) {
        ang = Math.atan2(b.y - a.y, b.x - a.x);
        if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI;
      } else {
        const arc = bulgeToArc(a, b, bulge);
        text += '  (R ' + formatLength(arc.radius) + ')';
      }
      const nx = -Math.sin(ang), ny = Math.cos(ang);
      const labelWorld = { x: mid.x + nx * (10 / currentView().scale), y: mid.y + ny * (10 / currentView().scale) };
      const s = worldToScreen(labelWorld);
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(ang);
      const w = ctx.measureText(text).width + 6;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(-w / 2, -8, w, 14);
      ctx.fillStyle = '#374151';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }
  }

  function drawElement(el, selected) {
    switch (el.type) {
      case 'wall': return drawWall(el, selected);
      case 'shape': return drawShape(el, selected);
      case 'circle': return drawCircle(el, selected);
      case 'opening': return drawOpeningRect(el, selected);
      case 'door': return drawEdgeOpening(el, 'door', selected);
      case 'window': return drawEdgeOpening(el, 'window', selected);
      case 'measure': return drawMeasure(el, selected);
      case 'label': return drawLabelEl(el, selected);
    }
  }

  function drawWall(el, selected) {
    const px = Math.max(el.thickness * currentView().scale, 2);
    ctx.lineWidth = px;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = selected ? '#3b82f6' : '#2b3242';
    pathForPoints(expandPolyline(el.points, false));
    ctx.stroke();
    drawEdgeLabels(el.points, false);
    if (selected) drawVertexDots(el.points);
  }

  function drawShape(el, selected) {
    const expanded = expandPolyline(el.points, true);
    pathForPoints(expanded);
    ctx.closePath();
    ctx.fillStyle = selected ? 'rgba(59,130,246,0.25)' : 'rgba(207,227,255,0.45)';
    ctx.fill();
    ctx.lineWidth = Math.max(el.thickness * currentView().scale, 2);
    ctx.strokeStyle = selected ? '#1d4ed8' : '#3b82f6';
    ctx.lineJoin = 'round';
    ctx.stroke();
    drawEdgeLabels(el.points, true);
    if (selected) drawVertexDots(el.points);

    const area = shapeArea(el.points);
    const centroid = worldToScreen(polygonCentroid(expanded));
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

  function drawCircle(el, selected) {
    const s = worldToScreen({ x: el.cx, y: el.cy });
    const r = el.r * currentView().scale;
    ctx.beginPath();
    ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    ctx.fillStyle = selected ? 'rgba(59,130,246,0.25)' : 'rgba(207,227,255,0.45)';
    ctx.fill();
    ctx.lineWidth = selected ? 2.5 : 1.5;
    ctx.strokeStyle = selected ? '#1d4ed8' : '#3b82f6';
    ctx.stroke();
    ctx.font = '11px -apple-system, sans-serif';
    ctx.fillStyle = '#374151';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('R ' + formatLength(el.r), s.x, s.y);
    if (selected) drawVertexDots([{ x: el.cx, y: el.cy }]);
  }

  function drawOpeningRect(el, selected) {
    const x0 = Math.min(el.x, el.x + el.w), x1 = Math.max(el.x, el.x + el.w);
    const y0 = Math.min(el.y, el.y + el.h), y1 = Math.max(el.y, el.y + el.h);
    const s0 = worldToScreen({ x: x0, y: y0 });
    const s1 = worldToScreen({ x: x1, y: y1 });
    const rx = Math.min(s0.x, s1.x), ry = Math.min(s0.y, s1.y);
    const rw = Math.abs(s1.x - s0.x), rh = Math.abs(s1.y - s0.y);
    ctx.fillStyle = el.kind === 'door' ? 'rgba(139,94,52,0.18)' : 'rgba(37,99,235,0.15)';
    ctx.fillRect(rx, ry, rw, rh);
    ctx.lineWidth = selected ? 2.5 : 1.5;
    ctx.strokeStyle = selected ? '#1d4ed8' : (el.kind === 'door' ? '#8b5e34' : '#2563eb');
    ctx.strokeRect(rx, ry, rw, rh);
    if (el.kind === 'window') {
      ctx.beginPath(); ctx.moveTo(rx, ry + rh / 2); ctx.lineTo(rx + rw, ry + rh / 2); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(rx + rw * 0.15, ry + rh); ctx.lineTo(rx + rw * 0.15, ry); ctx.stroke();
    }
    ctx.font = '10px -apple-system, sans-serif';
    ctx.fillStyle = '#374151';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(formatLength(Math.abs(el.w)) + ' x ' + formatLength(Math.abs(el.h)), rx + rw / 2, ry + rh + 3);
  }

  function drawEdgeOpening(el, kind, selected) {
    const half = el.width / 2;
    const dx = Math.cos(el.angle), dy = Math.sin(el.angle);
    const p1 = { x: el.x - dx * half, y: el.y - dy * half };
    const p2 = { x: el.x + dx * half, y: el.y + dy * half };
    const s1 = worldToScreen(p1), s2 = worldToScreen(p2);

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
      ctx.arc(s1.x, s1.y, distance(p1, p2) * currentView().scale, Math.min(startAngle, endAngle), Math.max(startAngle, endAngle));
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

  function draftPreviewPoints() {
    const pts = state.draft.points;
    const committed = expandPolyline(pts, false);
    if (state.draft.arcMode) {
      const a = pts[state.draft.arcSegIndex], b = pts[state.draft.arcSegIndex + 1];
      const withBulge = Object.assign({}, a, { bulge: state.draft.pendingBulge });
      return expandPolyline(pts.slice(0, state.draft.arcSegIndex).concat([withBulge, b]), false);
    }
    return committed;
  }

  function drawDraft() {
    const pts = state.draft.points;
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    pathForPoints(draftPreviewPoints());

    if (!state.draft.arcMode) {
      const last = pts[pts.length - 1];
      let previewPt = snapPoint(state.mouseWorld);
      previewPt = applyAngleSnap(last, previewPt);
      const ps = worldToScreen(previewPt);
      ctx.lineTo(ps.x, ps.y);
      if (state.draft.type === 'shape' && pts.length >= 2) {
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
    } else {
      ctx.stroke();
      ctx.setLineDash([]);
      drawVertexDots(pts);
      const a = pts[state.draft.arcSegIndex], b = pts[state.draft.arcSegIndex + 1];
      const arc = bulgeToArc(a, b, state.draft.pendingBulge || 1e-6);
      const s = worldToScreen(arcPointAt(arc, 0.5));
      ctx.font = 'bold 12px -apple-system, sans-serif';
      ctx.fillStyle = '#c2410c';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`R ${formatLength(arc.radius)}  (A to lock, Enter for exact radius)`, s.x + 10, s.y - 6);
    }
  }

  function drawCirclePreview() {
    const r = distance(state.circleCenter, snapPoint(state.mouseWorld));
    const s = worldToScreen(state.circleCenter);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.arc(s.x, s.y, r * currentView().scale, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    drawVertexDots([state.circleCenter]);
    ctx.font = 'bold 12px -apple-system, sans-serif';
    ctx.fillStyle = '#1d4ed8';
    ctx.textAlign = 'left';
    ctx.fillText('R ' + formatLength(r), s.x + r * currentView().scale + 6, s.y);
  }

  function drawRectPreview() {
    const a = state.rectStart, b = snapPoint(state.mouseWorld);
    const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x);
    const y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y);
    const s0 = worldToScreen({ x: x0, y: y0 }), s1 = worldToScreen({ x: x1, y: y1 });
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(Math.min(s0.x, s1.x), Math.min(s0.y, s1.y), Math.abs(s1.x - s0.x), Math.abs(s1.y - s0.y));
    ctx.setLineDash([]);
    ctx.font = 'bold 12px -apple-system, sans-serif';
    ctx.fillStyle = '#1d4ed8';
    ctx.textAlign = 'left';
    ctx.fillText(formatLength(x1 - x0) + ' x ' + formatLength(y1 - y0), Math.max(s0.x, s1.x) + 8, Math.min(s0.y, s1.y));
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

  function updateZoomLabel() { zoomLevelEl.textContent = Math.round((currentView().scale / BASE_SCALE) * 100) + '%'; }

  function updateSummary() {
    const shapes = currentView().elements.filter((e) => e.type === 'shape' || e.type === 'circle');
    let totalArea = 0;
    for (const s of shapes) totalArea += s.type === 'circle' ? Math.PI * s.r * s.r : shapeArea(s.points);
    let lineLen = 0;
    for (const e of currentView().elements) {
      if (e.type === 'wall') lineLen += shapePerimeter(e.points, false);
      if (e.type === 'shape') lineLen += shapePerimeter(e.points, true);
      if (e.type === 'circle') lineLen += 2 * Math.PI * e.r;
    }
    summaryRoomCount.textContent = shapes.length;
    summaryTotalArea.textContent = formatArea(totalArea);
    summaryWallLength.textContent = formatLength(lineLen);
  }

  // ---------------------------------------------------------------------
  // Properties panel
  // ---------------------------------------------------------------------
  function showProperties() {
    const el = currentView().elements.find((e) => e.id === state.selectedId);
    if (!el) { propsContent.innerHTML = '<p class="props-empty">Nothing selected.</p>'; return; }

    let html = '';
    if (el.type === 'wall') {
      html += row('Type', 'Wall');
      html += row('Length', formatLength(shapePerimeter(el.points, false)));
      html += fieldRow('Thickness (m)', 'thickness', el.thickness);
    } else if (el.type === 'shape') {
      html += row('Type', 'Shape');
      html += fieldRowText('Name', 'name', el.name || '');
      html += row('Area', formatArea(shapeArea(el.points)));
      html += row('Perimeter', formatLength(shapePerimeter(el.points, true)));
      html += fieldRow('Line thk. (m)', 'thickness', el.thickness);
    } else if (el.type === 'circle') {
      html += row('Type', 'Circle');
      html += fieldRow('Radius (m)', 'r', el.r);
      html += row('Diameter', formatLength(el.r * 2));
      html += row('Circumference', formatLength(2 * Math.PI * el.r));
      html += row('Area', formatArea(Math.PI * el.r * el.r));
    } else if (el.type === 'opening') {
      html += row('Type', el.kind === 'door' ? 'Door opening' : 'Window opening');
      html += fieldRow('Width (m)', 'w', el.w);
      html += fieldRow('Height (m)', 'h', el.h);
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
          const target = currentView().elements.find((e) => e.id === state.selectedId);
          if (!target) return;
          target[field] = isNumeric ? (parseFloat(input.value) || 0) : input.value;
        });
        showProperties();
      });
    });
  }

  function row(label, value) { return `<div class="prop-row"><span>${label}</span><span>${value}</span></div>`; }
  function fieldRow(label, field, value) { return `<div class="prop-row"><span>${label}</span><input type="number" step="0.01" min="0.01" data-field="${field}" value="${value}"></div>`; }
  function fieldRowText(label, field, value) { return `<div class="prop-row"><span>${label}</span><input type="text" data-field="${field}" value="${escapeHtml(value)}"></div>`; }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  // ---------------------------------------------------------------------
  // View tabs
  // ---------------------------------------------------------------------
  function renderViewTabs() {
    viewTabsEl.innerHTML = '';
    const makeTab = (id, name, closable) => {
      const tab = document.createElement('button');
      tab.className = 'view-tab' + (state.activeViewId === id ? ' active' : '');
      tab.type = 'button';
      const label = document.createElement('span');
      label.textContent = name;
      tab.appendChild(label);
      tab.addEventListener('click', () => switchView(id));
      if (closable) {
        tab.addEventListener('dblclick', (e) => { e.stopPropagation(); renameElevation(id); });
        const close = document.createElement('span');
        close.className = 'view-tab-close';
        close.textContent = '×';
        close.title = 'Delete this elevation';
        close.addEventListener('click', (e) => { e.stopPropagation(); deleteElevation(id); });
        tab.appendChild(close);
      }
      return tab;
    };
    viewTabsEl.appendChild(makeTab('footprint', 'Footprint', false));
    for (const id of state.elevationOrder) viewTabsEl.appendChild(makeTab(id, state.views[id].name, true));
    const addBtn = document.createElement('button');
    addBtn.className = 'view-tab-add';
    addBtn.type = 'button';
    addBtn.textContent = '+ Elevation';
    addBtn.addEventListener('click', addElevationPrompt);
    viewTabsEl.appendChild(addBtn);
  }

  function suggestElevationName() {
    const taken = new Set(state.elevationOrder.map((id) => state.views[id].name));
    for (const n of ['Front', 'Right', 'Rear', 'Left']) if (!taken.has(n)) return n;
    return 'Elevation ' + (state.elevationOrder.length + 1);
  }

  function addElevationPrompt() {
    const name = window.prompt('Name this elevation:', suggestElevationName());
    if (!name || !name.trim()) return;
    const id = 'elev_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    state.views[id] = makeView(id, name.trim(), 'elevation');
    state.elevationOrder.push(id);
    saveLocal();
    switchView(id);
    renderViewTabs();
  }

  function renameElevation(id) {
    const v = state.views[id];
    const name = window.prompt('Rename view:', v.name);
    if (name && name.trim()) { v.name = name.trim(); saveLocal(); renderViewTabs(); }
  }

  function deleteElevation(id) {
    const v = state.views[id];
    if (v.elements.length && !window.confirm('Delete the "' + v.name + '" elevation? This cannot be undone.')) return;
    delete state.views[id];
    state.elevationOrder = state.elevationOrder.filter((x) => x !== id);
    if (state.activeViewId === id) state.activeViewId = 'footprint';
    saveLocal();
    renderViewTabs();
    switchView(state.activeViewId, true);
  }

  function switchView(id, force) {
    if (state.activeViewId === id && !force) return;
    state.activeViewId = id;
    state.draft = null;
    state.circleCenter = null;
    state.rectStart = null;
    state.measureFirst = null;
    state.selectedId = null;
    lengthInput.hidden = true;
    renderViewTabs();
    syncToolButtons();
    updateHint();
    showProperties();
    resizeCanvas();
    render();
  }

  // ---------------------------------------------------------------------
  // Tool switching
  // ---------------------------------------------------------------------
  function syncToolButtons() {
    const tool = currentView().tool;
    toolButtons.forEach((b) => b.classList.toggle('active', b.dataset.tool === tool));
  }
  function updateHint() { hintText.textContent = hints()[currentView().tool] || ''; }

  function setTool(tool) {
    currentView().tool = tool;
    state.draft = null;
    state.circleCenter = null;
    state.rectStart = null;
    state.measureFirst = null;
    lengthInput.hidden = true;
    syncToolButtons();
    updateHint();
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
      const v = currentView();
      v.offsetX += evt.clientX - state.panLast.x;
      v.offsetY += evt.clientY - state.panLast.y;
      state.panLast = { x: evt.clientX, y: evt.clientY };
      render();
      return;
    }

    if (state.dragging) {
      const delta = { x: state.mouseWorld.x - state.dragging.lastWorld.x, y: state.mouseWorld.y - state.dragging.lastWorld.y };
      if (Math.abs(delta.x) > 1e-9 || Math.abs(delta.y) > 1e-9) {
        const el = currentView().elements.find((e) => e.id === state.dragging.id);
        if (el) translateElement(el, delta);
        state.dragging.lastWorld = state.mouseWorld;
        state.dragging.moved = true;
        render();
      }
      return;
    }

    if (state.draft && state.draft.arcMode) {
      const a = state.draft.points[state.draft.arcSegIndex], b = state.draft.points[state.draft.arcSegIndex + 1];
      const chordLen = distance(a, b);
      const dx = b.x - a.x, dy = b.y - a.y;
      const nx = -dy / chordLen, ny = dx / chordLen;
      const mx = state.mouseWorld.x - a.x, my = state.mouseWorld.y - a.y;
      const sagitta = mx * nx + my * ny;
      // negated: bulgeToArc's own sagitta convention (mid + n*(chord/2)*bulge)
      // points opposite the mouse-offset direction measured here, per n.
      let bulge = chordLen > 1e-9 ? -(2 * sagitta) / chordLen : 0;
      bulge = Math.max(-20, Math.min(20, bulge));
      state.draft.pendingBulge = bulge;
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
    const tool = currentView().tool;
    const view = currentView();

    if (tool === 'select') {
      const hit = hitTest(world);
      state.selectedId = hit ? hit.id : null;
      state.dragging = hit ? { id: hit.id, lastWorld: world, moved: false, beforeSnapshot: clone(view.elements) } : null;
      showProperties();
      render();
      return;
    }

    if (tool === 'wall' || tool === 'shape') {
      if (evt.detail >= 2 && state.draft) return; // 2nd mousedown of a dblclick; handled by 'dblclick'
      if (state.draft && state.draft.arcMode) {
        state.draft.points[state.draft.arcSegIndex].bulge = state.draft.pendingBulge || undefined;
        state.draft.arcMode = false;
      }
      let pt = snapPoint(world);
      if (state.draft) pt = applyAngleSnap(state.draft.points[state.draft.points.length - 1], pt);
      if (tool === 'shape' && state.draft && state.draft.points.length >= 3) {
        if (distance(pt, state.draft.points[0]) <= SNAP_PX / view.scale) {
          const points = state.draft.points;
          commitChange(() => view.elements.push({ id: newId(), type: 'shape', points, thickness: state.wallThickness, name: '' }));
          state.draft = null;
          render();
          return;
        }
      }
      if (!state.draft) state.draft = { type: tool, points: [pt], arcMode: false };
      else state.draft.points.push(pt);
      render();
      return;
    }

    if (tool === 'circle') {
      if (!state.circleCenter) {
        state.circleCenter = snapPoint(world);
      } else {
        const r = distance(state.circleCenter, snapPoint(world));
        if (r > 0.01) {
          const c = state.circleCenter;
          commitChange(() => view.elements.push({ id: newId(), type: 'circle', cx: c.x, cy: c.y, r }));
        }
        state.circleCenter = null;
      }
      render();
      return;
    }

    if (tool === 'door' || tool === 'window') {
      if (view.kind === 'elevation') {
        if (!state.rectStart) {
          state.rectStart = snapPoint(world);
        } else {
          commitOpeningRect(snapPoint(world));
        }
      } else {
        const edge = findNearestEdge(world);
        if (edge && edge.dist <= EDGE_SNAP_PX / view.scale) {
          const width = tool === 'door' ? state.doorWidth : state.windowWidth;
          const newEl = { id: newId(), type: tool, x: edge.point.x, y: edge.point.y, angle: edge.angle, width };
          commitChange(() => view.elements.push(newEl));
          state.selectedId = newEl.id;
          showProperties();
        }
      }
      return;
    }

    if (tool === 'measure') {
      const pt = snapPoint(world);
      if (!state.measureFirst) {
        state.measureFirst = pt;
      } else {
        const p1 = state.measureFirst, p2 = pt;
        commitChange(() => view.elements.push({ id: newId(), type: 'measure', p1, p2 }));
        state.measureFirst = null;
      }
      render();
      return;
    }

    if (tool === 'label') {
      const pt = snapPoint(world);
      const text = window.prompt('Label text:', 'Label');
      if (text === null || text.trim() === '') return;
      commitChange(() => view.elements.push({ id: newId(), type: 'label', x: pt.x, y: pt.y, text }));
      return;
    }
  });

  function commitOpeningRect(corner2) {
    const view = currentView();
    const a = state.rectStart, b = corner2;
    const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y), w = Math.abs(b.x - a.x), h = Math.abs(b.y - a.y);
    const kind = view.tool;
    if (w > 0.02 && h > 0.02) {
      const newEl = { id: newId(), type: 'opening', kind, x, y, w, h };
      commitChange(() => view.elements.push(newEl));
      state.selectedId = newEl.id;
      showProperties();
    }
    state.rectStart = null;
  }

  window.addEventListener('mouseup', () => {
    if (state.isPanning) { state.isPanning = false; state.panLast = null; return; }
    if (state.dragging) {
      if (state.dragging.moved) {
        const view = currentView();
        view.history.push(state.dragging.beforeSnapshot);
        view.history = view.history.slice(-100);
        view.future = [];
        saveLocal();
      }
      state.dragging = null;
    }
  });

  canvas.addEventListener('dblclick', (evt) => {
    evt.preventDefault();
    if (!state.draft) return;
    const view = currentView();
    if (state.draft.arcMode) {
      state.draft.points[state.draft.arcSegIndex].bulge = state.draft.pendingBulge || undefined;
      state.draft.arcMode = false;
    }
    if (state.draft.type === 'wall' && state.draft.points.length >= 2) {
      const points = state.draft.points;
      commitChange(() => view.elements.push({ id: newId(), type: 'wall', points, thickness: state.wallThickness }));
    } else if (state.draft.type === 'shape' && state.draft.points.length >= 3) {
      const points = state.draft.points;
      commitChange(() => view.elements.push({ id: newId(), type: 'shape', points, thickness: state.wallThickness, name: '' }));
    }
    state.draft = null;
    render();
  });

  canvas.addEventListener('contextmenu', (evt) => {
    evt.preventDefault();
    if (state.draft) { state.draft = null; render(); }
    else if (state.measureFirst) { state.measureFirst = null; render(); }
    else if (state.circleCenter) { state.circleCenter = null; render(); }
    else if (state.rectStart) { state.rectStart = null; render(); }
  });

  canvas.addEventListener('wheel', (evt) => {
    evt.preventDefault();
    const view = currentView();
    const rect = canvas.getBoundingClientRect();
    const screenPt = { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
    const worldPt = screenToWorld(screenPt);
    const factor = evt.deltaY < 0 ? 1.1 : 1 / 1.1;
    view.scale = Math.min(400, Math.max(10, view.scale * factor));
    const ys = view.kind === 'elevation' ? -1 : 1;
    view.offsetX = screenPt.x - worldPt.x * view.scale;
    view.offsetY = screenPt.y - worldPt.y * ys * view.scale;
    render();
  }, { passive: false });

  function zoomAround(factor) {
    const view = currentView();
    const center = { x: state.viewW / 2, y: state.viewH / 2 };
    const worldPt = screenToWorld(center);
    view.scale = Math.min(400, Math.max(10, view.scale * factor));
    const ys = view.kind === 'elevation' ? -1 : 1;
    view.offsetX = center.x - worldPt.x * view.scale;
    view.offsetY = center.y - worldPt.y * ys * view.scale;
    render();
  }
  zoomInBtn.addEventListener('click', () => zoomAround(1.2));
  zoomOutBtn.addEventListener('click', () => zoomAround(1 / 1.2));
  zoomResetBtn.addEventListener('click', () => {
    const view = currentView();
    view.scale = BASE_SCALE; view.offsetX = 80; view.offsetY = view.kind === 'elevation' ? 340 : 80;
    render();
  });

  // ---------------------------------------------------------------------
  // Exact-value input overlay (reused for length, radius, and W x H)
  // ---------------------------------------------------------------------
  let inputMode = null; // 'length' | 'radius-arc' | 'radius-circle' | 'rect'

  function positionInputAt(screenPt) {
    lengthInput.hidden = false;
    lengthInput.style.left = screenPt.x + 'px';
    lengthInput.style.top = Math.max(0, screenPt.y - 30) + 'px';
  }

  function openLengthInput() {
    inputMode = 'length';
    const last = state.draft.points[state.draft.points.length - 1];
    let previewPt = snapPoint(state.mouseWorld);
    previewPt = applyAngleSnap(last, previewPt);
    const liveLen = distance(last, previewPt);
    state.pendingDraftDirection = angleBetween(last, previewPt);
    positionInputAt(state.mouseScreen);
    lengthInput.value = formatLength(liveLen);
    lengthInput.focus();
    lengthInput.select();
  }

  function openRadiusInputForArc() {
    inputMode = 'radius-arc';
    positionInputAt(state.mouseScreen);
    const a = state.draft.points[state.draft.arcSegIndex], b = state.draft.points[state.draft.arcSegIndex + 1];
    const bulge = state.draft.pendingBulge || 0.001;
    const arc = bulgeToArc(a, b, bulge);
    lengthInput.value = formatLength(arc.radius);
    lengthInput.focus();
    lengthInput.select();
  }

  function openRadiusInputForCircle() {
    inputMode = 'radius-circle';
    positionInputAt(state.mouseScreen);
    lengthInput.value = formatLength(distance(state.circleCenter, snapPoint(state.mouseWorld)));
    lengthInput.focus();
    lengthInput.select();
  }

  function openSizeInputForOpening() {
    inputMode = 'rect';
    positionInputAt(state.mouseScreen);
    const a = state.rectStart, b = snapPoint(state.mouseWorld);
    lengthInput.value = formatLength(Math.abs(b.x - a.x)) + ' x ' + formatLength(Math.abs(b.y - a.y));
    lengthInput.focus();
    lengthInput.select();
  }

  lengthInput.addEventListener('keydown', (evt) => {
    evt.stopPropagation();
    if (evt.key === 'Enter') {
      evt.preventDefault();
      if (inputMode === 'length') {
        const meters = parseLength(lengthInput.value);
        if (isFinite(meters) && meters > 0 && state.draft) {
          const last = state.draft.points[state.draft.points.length - 1];
          const dir = state.pendingDraftDirection;
          state.draft.points.push({ x: last.x + Math.cos(dir) * meters, y: last.y + Math.sin(dir) * meters });
        }
      } else if (inputMode === 'radius-arc') {
        const radius = parseLength(lengthInput.value);
        if (isFinite(radius) && radius > 0 && state.draft && state.draft.arcMode) {
          const a = state.draft.points[state.draft.arcSegIndex], b = state.draft.points[state.draft.arcSegIndex + 1];
          const chord = distance(a, b);
          if (chord < 2 * radius) {
            const theta = 2 * Math.asin(Math.min(1, chord / (2 * radius)));
            const sign = (state.draft.pendingBulge || 0) < 0 ? -1 : 1;
            const bulge = sign * Math.tan(theta / 4);
            state.draft.points[state.draft.arcSegIndex].bulge = bulge;
          }
          state.draft.arcMode = false;
        }
      } else if (inputMode === 'radius-circle') {
        const radius = parseLength(lengthInput.value);
        if (isFinite(radius) && radius > 0 && state.circleCenter) {
          const c = state.circleCenter;
          const view = currentView();
          commitChange(() => view.elements.push({ id: newId(), type: 'circle', cx: c.x, cy: c.y, r: radius }));
        }
        state.circleCenter = null;
      } else if (inputMode === 'rect') {
        const parts = lengthInput.value.split(/x/i);
        if (parts.length === 2 && state.rectStart) {
          const w = parseLength(parts[0]), h = parseLength(parts[1]);
          if (isFinite(w) && isFinite(h) && w > 0 && h > 0) {
            const dirX = (state.mouseWorld.x >= state.rectStart.x) ? 1 : -1;
            const dirY = (state.mouseWorld.y >= state.rectStart.y) ? 1 : -1;
            commitOpeningRect({ x: state.rectStart.x + dirX * w, y: state.rectStart.y + dirY * h });
          } else {
            state.rectStart = null;
          }
        }
      }
      inputMode = null;
      lengthInput.hidden = true;
      canvas.focus();
      render();
    } else if (evt.key === 'Escape') {
      evt.preventDefault();
      inputMode = null;
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

    const view = currentView();

    if (evt.key === 'Escape') {
      if (!lengthInput.hidden) { lengthInput.hidden = true; inputMode = null; }
      else if (state.draft && state.draft.arcMode) {
        state.draft.points[state.draft.arcSegIndex].bulge = state.draft.arcOriginalBulge;
        state.draft.arcMode = false;
      } else if (state.draft) { state.draft = null; }
      else if (state.circleCenter) { state.circleCenter = null; }
      else if (state.rectStart) { state.rectStart = null; }
      else if (state.measureFirst) { state.measureFirst = null; }
      else { state.selectedId = null; showProperties(); }
      render();
    } else if (evt.key === 'a' || evt.key === 'A') {
      if ((view.tool === 'wall' || view.tool === 'shape') && state.draft && state.draft.points.length >= 2 && lengthInput.hidden) {
        evt.preventDefault();
        if (!state.draft.arcMode) {
          state.draft.arcSegIndex = state.draft.points.length - 2;
          state.draft.arcOriginalBulge = state.draft.points[state.draft.arcSegIndex].bulge;
          state.draft.pendingBulge = state.draft.points[state.draft.arcSegIndex].bulge || 0;
          state.draft.arcMode = true;
        } else {
          state.draft.points[state.draft.arcSegIndex].bulge = state.draft.pendingBulge || undefined;
          state.draft.arcMode = false;
        }
        render();
      }
    } else if (evt.key === 'Enter') {
      if (lengthInput.hidden) {
        evt.preventDefault();
        if (state.draft && state.draft.arcMode) openRadiusInputForArc();
        else if ((view.tool === 'wall' || view.tool === 'shape') && state.draft && state.draft.points.length > 0) openLengthInput();
        else if (view.tool === 'circle' && state.circleCenter) openRadiusInputForCircle();
        else if ((view.tool === 'door' || view.tool === 'window') && view.kind === 'elevation' && state.rectStart) openSizeInputForOpening();
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
    commitChange(() => { currentView().elements = currentView().elements.filter((e) => e.id !== id); });
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
    const view = currentView();
    if (view.elements.length && !window.confirm('Clear all shapes in "' + view.name + '"? Unsaved changes in this view will be lost.')) return;
    view.elements = [];
    view.history = [];
    view.future = [];
    state.selectedId = null;
    state.draft = null;
    saveLocal();
    showProperties();
    render();
  });

  btnExportJson.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(serializeProject(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'architect-mapper-project.json';
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
        if (!data.footprint) throw new Error('Invalid file: missing footprint view');
        loadProjectData(data);
        unitsSelect.value = state.units;
        gridSizeInput.value = state.gridSize;
        wallThicknessInput.value = state.wallThickness;
        saveLocal();
        renderViewTabs();
        switchView('footprint', true);
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
    a.download = (currentView().name || 'view') + '.png';
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
    renderViewTabs();
    syncToolButtons();
    updateHint();
    showProperties();
    render();
  }

  function handleResize() { resizeCanvas(); render(); }

  init();
})();
