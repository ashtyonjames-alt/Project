import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

(function () {
  'use strict';

  const canvas = document.getElementById('canvas-3d');
  const wrap = document.getElementById('canvas-wrap');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdbe4ee);
  scene.fog = new THREE.Fog(0xdbe4ee, 60, 160);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
  camera.position.set(18, 16, 22);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.maxPolarAngle = Math.PI / 2 - 0.02;
  controls.minDistance = 2;
  controls.maxDistance = 300;
  controls.target.set(0, 1, 0);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ color: 0xeef1f5 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const grid = new THREE.GridHelper(400, 400, 0xc3cbd6, 0xdde2e9);
  grid.position.y = 0.002;
  scene.add(grid);

  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const sun = new THREE.DirectionalLight(0xffffff, 0.75);
  sun.position.set(18, 28, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -50; sun.shadow.camera.right = 50;
  sun.shadow.camera.top = 50; sun.shadow.camera.bottom = -50;
  scene.add(sun);

  const group = new THREE.Group();
  scene.add(group);

  const WALL_COLOR = 0xd7dbe0;
  const WALL_COLOR_ARC = 0xc9ced8;

  function disposeGroup(g) {
    g.children.slice().forEach((child) => {
      if (child.children && child.children.length) disposeGroup(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
      g.remove(child);
    });
  }

  // A flat wall panel from local x=0..length, y=0..height, thickness centered
  // on z=0, with rectangular holes cut for each opening (real geometric
  // holes via a Shape + holes, not a decorative overlay).
  function wallPanel(length, height, thickness, openings, color) {
    const extend = thickness / 2; // overlap into neighboring segments so corners have no visible gap
    const shape = new THREE.Shape();
    shape.moveTo(-extend, 0);
    shape.lineTo(length + extend, 0);
    shape.lineTo(length + extend, height);
    shape.lineTo(-extend, height);
    shape.lineTo(-extend, 0);

    const margin = 0.06;
    for (const o of openings || []) {
      const halfW = Math.min(o.width / 2, length / 2 - margin);
      let x0 = o.t * length - halfW, x1 = x0 + halfW * 2;
      if (x0 < margin) { const s = margin - x0; x0 += s; x1 += s; }
      if (x1 > length - margin) { const s = x1 - (length - margin); x0 -= s; x1 -= s; }
      const y0 = Math.max(0.03, o.sill), y1 = Math.min(height - 0.03, o.sill + o.height);
      if (x1 - x0 < 0.08 || y1 - y0 < 0.08) continue;
      const hole = new THREE.Path();
      hole.moveTo(x0, y0); hole.lineTo(x1, y0); hole.lineTo(x1, y1); hole.lineTo(x0, y1); hole.lineTo(x0, y0);
      shape.holes.push(hole);
    }

    const geo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
    geo.translate(0, 0, -thickness / 2);
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color }));
    mesh.castShadow = true; mesh.receiveShadow = true;
    return mesh;
  }

  function addSegment(seg, wallHeight) {
    const dx = seg.bx - seg.ax, dy = seg.by - seg.ay;
    const length = Math.hypot(dx, dy);
    if (length < 0.02) return;
    const angle = Math.atan2(dy, dx);
    const mesh = wallPanel(length, wallHeight, seg.thickness, seg.openings, seg.arc ? WALL_COLOR_ARC : WALL_COLOR);
    mesh.position.set(seg.ax, 0, seg.ay);
    mesh.rotation.y = -angle;
    group.add(mesh);
  }

  function addCircle(c, wallHeight) {
    const outer = new THREE.Shape();
    outer.absarc(0, 0, c.r + c.thickness / 2, 0, Math.PI * 2, false);
    const inner = new THREE.Path();
    inner.absarc(0, 0, Math.max(0.05, c.r - c.thickness / 2), 0, Math.PI * 2, true);
    outer.holes.push(inner);
    const geo = new THREE.ExtrudeGeometry(outer, { depth: wallHeight, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: WALL_COLOR }));
    mesh.position.set(c.cx, 0, c.cy);
    mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh);

    for (const o of c.overlays || []) {
      const isDoor = o.kind === 'door';
      const w = Math.min(o.width, c.r * 1.6);
      const h = o.height;
      const yCenter = o.sill + h / 2;
      const px = c.cx + Math.cos(o.angle) * c.r, py = c.cy + Math.sin(o.angle) * c.r;
      const mat = new THREE.MeshStandardMaterial(isDoor ? { color: 0x8b5e34 } : { color: 0x93c5fd, transparent: true, opacity: 0.85 });
      const om = new THREE.Mesh(new THREE.BoxGeometry(w, h, c.thickness * 0.7), mat);
      om.position.set(px, yCenter, py);
      om.rotation.y = -o.angle;
      om.castShadow = true;
      group.add(om);
    }
  }

  function rebuild(model) {
    disposeGroup(group);
    if (!model) return;
    const wallHeight = model.wallHeight || 2.7;
    for (const seg of model.segments || []) addSegment(seg, wallHeight);
    for (const c of model.circles || []) addCircle(c, wallHeight);

    // frame the camera on the model the first time content appears
    if (!framed && (model.segments || []).length + (model.circles || []).length > 0) {
      frameModel(model);
      framed = true;
    }
  }

  let framed = false;
  function frameModel(model) {
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    const consider = (x, z) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z); };
    for (const s of model.segments || []) { consider(s.ax, s.ay); consider(s.bx, s.by); }
    for (const c of model.circles || []) { consider(c.cx - c.r, c.cy - c.r); consider(c.cx + c.r, c.cy + c.r); }
    if (!isFinite(minX)) return;
    const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
    const span = Math.max(6, Math.max(maxX - minX, maxZ - minZ));
    controls.target.set(cx, (model.wallHeight || 2.7) / 2, cz);
    camera.position.set(cx + span * 0.8, span * 0.9, cz + span * 0.9);
  }

  function resize() {
    const rect = wrap.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / Math.max(1, rect.height);
    camera.updateProjectionMatrix();
  }

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  window.addEventListener('resize', resize);
  resize();
  animate();

  let pendingModel = null;
  window.AM3D = {
    rebuild(model) { pendingModel = model; rebuild(model); },
    resize,
    setVisible(v) { canvas.hidden = !v; if (v) { resize(); if (pendingModel) rebuild(pendingModel); } },
  };
  if (window.AM_onReady) window.AM_onReady();
})();
