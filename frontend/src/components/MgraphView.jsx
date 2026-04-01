import React, { useRef, useEffect, useState, useCallback } from 'react';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';
import axios from 'axios';
import { Loader2, RefreshCw, Maximize2, Minimize2, X, Brain, AlertCircle } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TYPE_COLORS = {
  ART: [1.0, 0.843, 0.0],
  VIP: [0.608, 0.349, 0.714],
  STF: [0.204, 0.596, 0.859],
  SPO: [0.180, 0.800, 0.443],
  INT: [1.0, 1.0, 1.0],
  VIS: [0.0, 1.0, 1.0],
  BNV: [0.902, 0.494, 0.133],
  EXP: [1.0, 0.843, 0.0],
};
const TYPE_HEX = {
  ART: '#FFD700', VIP: '#9B59B6', STF: '#3498DB', SPO: '#2ECC71',
  INT: '#FFFFFF', VIS: '#00FFFF', BNV: '#E67E22', EXP: '#FFD700',
};
const TYPE_LABELS = {
  ART: 'Artiste', VIP: 'VIP', STF: 'Staff', SPO: 'Sponsor',
  INT: 'Institutionnel', VIS: 'Visiteur', BNV: 'Benevole', EXP: 'Exposant',
};
const DEFAULT_COLOR = [0.651, 0.365, 0.278];

const THREEJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

function loadThreeJS() {
  return new Promise((resolve, reject) => {
    if (window.THREE) { resolve(window.THREE); return; }
    const s = document.createElement('script');
    s.src = THREEJS_CDN;
    s.onload = () => resolve(window.THREE);
    s.onerror = () => reject(new Error('Three.js CDN failed'));
    document.head.appendChild(s);
  });
}

function getColor(type) { return TYPE_COLORS[type] || DEFAULT_COLOR; }

const MgraphView = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const stateRef = useRef({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [popup, setPopup] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });
  const [webglOk, setWebglOk] = useState(true);
  const [fallbackNodes, setFallbackNodes] = useState([]);
  const [fallbackEdges, setFallbackEdges] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/smart-engine/mgraph`);
      return data;
    } catch {
      return { nodes: [], edges: [], total_nodes: 0, total_edges: 0 };
    }
  }, []);

  // === 2D FALLBACK ===
  const renderFallback2D = useCallback((data) => {
    if (!data?.nodes?.length) return;
    const nodes = data.nodes.map((n, i) => ({
      ...n, x: 400 + Math.cos(i * 0.4) * (150 + n.score), y: 300 + Math.sin(i * 0.4) * (150 + n.score),
    }));
    const idMap = {};
    nodes.forEach((n, i) => { idMap[n.id] = i; });
    const edges = data.edges.filter(e => idMap[e.source] !== undefined && idMap[e.target] !== undefined);
    setFallbackNodes(nodes);
    setFallbackEdges(edges);
    setStats({ nodes: data.total_nodes, edges: data.total_edges });
    setLoading(false);
  }, []);

  // === MAIN 3D INIT ===
  useEffect(() => {
    let disposed = false;
    let animId = null;
    let refreshTimer = null;

    const init = async () => {
      // Check WebGL
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglOk(false);
        const data = await fetchData();
        renderFallback2D(data);
        return;
      }

      let THREE;
      try {
        THREE = await loadThreeJS();
      } catch {
        setWebglOk(false);
        const data = await fetchData();
        renderFallback2D(data);
        return;
      }

      const container = containerRef.current;
      const cvs = canvasRef.current;
      if (!container || !cvs || disposed) return;

      const W = container.clientWidth;
      const H = container.clientHeight || 600;

      // Scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);

      // Camera
      const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 2000);
      camera.position.set(0, 0, 350);

      // Renderer
      const renderer = new THREE.WebGLRenderer({ canvas: cvs, antialias: true, alpha: false });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // Lights
      const ambient = new THREE.AmbientLight(0x333333, 0.6);
      scene.add(ambient);
      const light1 = new THREE.PointLight(0xFFD700, 0.8, 800);
      light1.position.set(200, 200, 200);
      scene.add(light1);
      const light2 = new THREE.PointLight(0x9B59B6, 0.6, 800);
      light2.position.set(-200, -100, 150);
      scene.add(light2);
      const light3 = new THREE.PointLight(0x3498DB, 0.5, 600);
      light3.position.set(0, -200, -100);
      scene.add(light3);
      const light4 = new THREE.DirectionalLight(0xF4F1EA, 0.4);
      light4.position.set(0, 1, 1);
      scene.add(light4);

      // Glow texture (canvas-generated radial gradient)
      const glowCanvas = document.createElement('canvas');
      glowCanvas.width = 64;
      glowCanvas.height = 64;
      const gCtx = glowCanvas.getContext('2d');
      const grad = gCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255,255,255,0.6)');
      grad.addColorStop(0.3, 'rgba(255,255,255,0.15)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      gCtx.fillStyle = grad;
      gCtx.fillRect(0, 0, 64, 64);
      const glowTexture = new THREE.CanvasTexture(glowCanvas);

      // Groups
      const nodeGroup = new THREE.Group();
      const edgeGroup = new THREE.Group();
      const particleGroup = new THREE.Group();
      scene.add(edgeGroup);
      scene.add(nodeGroup);
      scene.add(particleGroup);

      // Ambient particles
      const pCount = 200;
      const pGeom = new THREE.BufferGeometry();
      const pPos = new Float32Array(pCount * 3);
      for (let i = 0; i < pCount * 3; i++) pPos[i] = (Math.random() - 0.5) * 800;
      pGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      const pMat = new THREE.PointsMaterial({ color: 0xFFD700, size: 1.5, transparent: true, opacity: 0.3, map: glowTexture, blending: THREE.AdditiveBlending, depthWrite: false });
      const particles = new THREE.Points(pGeom, pMat);
      particleGroup.add(particles);

      // State
      const st = {
        THREE, scene, camera, renderer, nodeGroup, edgeGroup, particles,
        nodeMeshes: [], nodeData: [], edgeLines: [],
        rotation: { x: 0.3, y: 0, autoRotate: true },
        mouse: { down: false, x: 0, y: 0, button: 0 },
        touch: { active: false, startDist: 0, startMid: { x: 0, y: 0 } },
        zoom: 350,
        panX: 0, panY: 0,
        selectedNode: null, isolatedNode: null,
        lastTap: 0, longPressTimer: null,
        raycaster: new THREE.Raycaster(),
        mouseVec: new THREE.Vector2(),
        clock: new THREE.Clock(),
      };
      stateRef.current = st;

      // Build graph
      const buildGraph = (data) => {
        if (disposed) return;
        // Clear old
        while (nodeGroup.children.length) {
          const c = nodeGroup.children[0];
          c.geometry?.dispose();
          c.material?.dispose();
          nodeGroup.remove(c);
        }
        while (edgeGroup.children.length) {
          const c = edgeGroup.children[0];
          c.geometry?.dispose();
          c.material?.dispose();
          edgeGroup.remove(c);
        }
        st.nodeMeshes = [];
        st.nodeData = [];
        st.edgeLines = [];

        if (!data?.nodes?.length) return;

        // D3 force simulation
        const simNodes = data.nodes.map(n => ({ ...n }));
        const idIndex = {};
        simNodes.forEach((n, i) => { idIndex[n.id] = i; });
        const simLinks = data.edges
          .filter(e => idIndex[e.source] !== undefined && idIndex[e.target] !== undefined)
          .map(e => ({ source: idIndex[e.source], target: idIndex[e.target], link_type: e.link_type, strength: e.strength }));

        const sim = forceSimulation(simNodes)
          .force('charge', forceManyBody().strength(-60))
          .force('link', forceLink(simLinks).distance(60).strength(d => d.strength || 0.3))
          .force('center', forceCenter(0, 0))
          .force('collide', forceCollide(12))
          .stop();

        // Run simulation synchronously
        for (let i = 0; i < 200; i++) sim.tick();

        // Create node meshes
        const sphereGeo = new THREE.SphereGeometry(1, 16, 16);
        simNodes.forEach((n, i) => {
          const col = getColor(n.type);
          const radius = 4 + (n.score || 0) * 0.06;
          const mat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(col[0], col[1], col[2]),
            emissive: new THREE.Color(col[0] * 0.4, col[1] * 0.4, col[2] * 0.4),
            emissiveIntensity: 0.6,
            metalness: 0.3,
            roughness: 0.4,
          });
          const mesh = new THREE.Mesh(sphereGeo, mat);
          mesh.scale.set(radius, radius, radius);
          const z = ((n.score || 0) - 50) * 1.5;
          mesh.position.set(n.x || 0, n.y || 0, z);
          mesh.userData = { index: i, nodeId: n.id };
          nodeGroup.add(mesh);
          st.nodeMeshes.push(mesh);
          st.nodeData.push({ ...n, radius, baseEmissive: 0.6 });

          // Glow sprite with radial texture
          const spriteMat = new THREE.SpriteMaterial({
            map: glowTexture,
            color: new THREE.Color(col[0], col[1], col[2]),
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });
          const sprite = new THREE.Sprite(spriteMat);
          sprite.scale.set(radius * 3.5, radius * 3.5, 1);
          mesh.add(sprite);
        });

        // Create edges
        const edgeMat = new THREE.LineBasicMaterial({ color: 0xFFD700, transparent: true, opacity: 0.08 });
        const orgMat = new THREE.LineBasicMaterial({ color: 0xA65D47, transparent: true, opacity: 0.2 });
        const brainMat = new THREE.LineBasicMaterial({ color: 0x9B59B6, transparent: true, opacity: 0.15 });
        simLinks.forEach(link => {
          const sn = simNodes[link.source?.index ?? link.source];
          const tn = simNodes[link.target?.index ?? link.target];
          if (!sn || !tn) return;
          const geom = new THREE.BufferGeometry();
          const sz = ((sn.score || 0) - 50) * 1.5;
          const tz = ((tn.score || 0) - 50) * 1.5;
          const positions = new Float32Array([sn.x, sn.y, sz, tn.x, tn.y, tz]);
          geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          const mat = link.link_type === 'org' ? orgMat : link.link_type === 'brain' ? brainMat : edgeMat;
          const line = new THREE.Line(geom, mat.clone());
          edgeGroup.add(line);
          st.edgeLines.push(line);
        });

        setStats({ nodes: data.total_nodes, edges: data.total_edges });
        setLoading(false);
      };

      // Initial load
      const data = await fetchData();
      if (disposed) return;
      buildGraph(data);

      // Auto refresh every 30s
      refreshTimer = setInterval(async () => {
        const fresh = await fetchData();
        if (!disposed) buildGraph(fresh);
      }, 30000);

      // Animation loop
      const animate = () => {
        if (disposed) return;
        animId = requestAnimationFrame(animate);

        const t = st.clock.getElapsedTime();

        // Auto-rotate
        if (st.rotation.autoRotate && !st.mouse.down && !st.touch.active) {
          st.rotation.y += 0.002;
        }

        // Pulse nodes
        st.nodeMeshes.forEach((mesh, i) => {
          const nd = st.nodeData[i];
          if (!nd) return;
          const pulseSpeed = 1 + (nd.score || 0) * 0.02;
          const pulseAmp = 0.15 + (nd.score || 0) * 0.003;
          const pulse = 1 + Math.sin(t * pulseSpeed + i * 0.5) * pulseAmp;
          mesh.scale.set(nd.radius * pulse, nd.radius * pulse, nd.radius * pulse);
          const ei = nd.baseEmissive + Math.sin(t * pulseSpeed + i) * 0.2;
          mesh.material.emissiveIntensity = Math.max(0.1, ei);
        });

        // Animate particles
        const pAttr = st.particles.geometry.attributes.position;
        for (let i = 0; i < pAttr.count; i++) {
          pAttr.array[i * 3 + 1] += Math.sin(t + i * 0.1) * 0.05;
          pAttr.array[i * 3] += Math.cos(t * 0.5 + i * 0.2) * 0.03;
        }
        pAttr.needsUpdate = true;

        // Isolate mode opacity
        if (st.isolatedNode !== null) {
          const iso = st.isolatedNode;
          st.nodeMeshes.forEach((m, i) => {
            m.material.opacity = i === iso ? 1 : 0.1;
            m.material.transparent = i !== iso;
          });
        }

        // Apply rotation + zoom + pan
        const pivot = new THREE.Object3D();
        camera.position.set(st.panX, st.panY, st.zoom);
        camera.lookAt(st.panX, st.panY, 0);
        nodeGroup.rotation.x = st.rotation.x;
        nodeGroup.rotation.y = st.rotation.y;
        edgeGroup.rotation.x = st.rotation.x;
        edgeGroup.rotation.y = st.rotation.y;
        particleGroup.rotation.y = st.rotation.y * 0.3;

        renderer.render(scene, camera);
      };
      animate();

      // === INTERACTION HANDLERS ===
      const getCanvasXY = (e) => {
        const rect = cvs.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
      };
      const getNDC = (px, py) => {
        const rect = cvs.getBoundingClientRect();
        return { x: ((px) / rect.width) * 2 - 1, y: -((py) / rect.height) * 2 + 1 };
      };
      const raycast = (px, py) => {
        const ndc = getNDC(px, py);
        st.mouseVec.set(ndc.x, ndc.y);
        st.raycaster.setFromCamera(st.mouseVec, camera);
        const hits = st.raycaster.intersectObjects(st.nodeMeshes, false);
        return hits.length > 0 ? hits[0].object : null;
      };
      const showPopup = (nodeIdx, px, py) => {
        const nd = st.nodeData[nodeIdx];
        if (!nd) return;
        setPopup({ ...nd, px, py });
        st.selectedNode = nodeIdx;
      };
      const hidePopup = () => { setPopup(null); st.selectedNode = null; };

      // Mouse events
      const onMouseDown = (e) => {
        st.mouse.down = true;
        st.mouse.x = e.clientX;
        st.mouse.y = e.clientY;
        st.mouse.button = e.button;
        st.rotation.autoRotate = false;
      };
      const onMouseMove = (e) => {
        if (!st.mouse.down) return;
        const dx = e.clientX - st.mouse.x;
        const dy = e.clientY - st.mouse.y;
        if (st.mouse.button === 0) {
          st.rotation.y += dx * 0.005;
          st.rotation.x += dy * 0.005;
          st.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, st.rotation.x));
        } else if (st.mouse.button === 2) {
          st.panX -= dx * 0.5;
          st.panY += dy * 0.5;
        }
        st.mouse.x = e.clientX;
        st.mouse.y = e.clientY;
      };
      const onMouseUp = (e) => {
        if (st.mouse.down && Math.abs(e.clientX - st.mouse.x) < 3 && Math.abs(e.clientY - st.mouse.y) < 3) {
          const pos = getCanvasXY(e);
          const hit = raycast(pos.x, pos.y);
          if (hit) {
            const now = Date.now();
            if (now - st.lastTap < 400) {
              // Double click -> isolate
              const idx = hit.userData.index;
              st.isolatedNode = st.isolatedNode === idx ? null : idx;
              if (st.isolatedNode === null) {
                st.nodeMeshes.forEach(m => { m.material.transparent = false; m.material.opacity = 1; });
                st.edgeLines.forEach(l => { l.material.opacity = l.material._origOpacity || 0.08; });
              }
            } else {
              showPopup(hit.userData.index, e.clientX, e.clientY);
            }
            st.lastTap = now;
          } else {
            hidePopup();
            if (st.isolatedNode !== null) {
              st.isolatedNode = null;
              st.nodeMeshes.forEach(m => { m.material.transparent = false; m.material.opacity = 1; });
            }
          }
        }
        st.mouse.down = false;
        setTimeout(() => { st.rotation.autoRotate = true; }, 5000);
      };
      const onWheel = (e) => {
        e.preventDefault();
        st.zoom = Math.max(100, Math.min(800, st.zoom + e.deltaY * 0.3));
      };
      const onContextMenu = (e) => e.preventDefault();

      // Touch events
      const getTouchDist = (t1, t2) => Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const getTouchMid = (t1, t2) => ({ x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 });

      const onTouchStart = (e) => {
        e.preventDefault();
        st.rotation.autoRotate = false;
        if (e.touches.length === 1) {
          const t = e.touches[0];
          st.touch.active = true;
          st.mouse.x = t.clientX;
          st.mouse.y = t.clientY;
          st.mouse.down = true;
          // Long press detection
          st.longPressTimer = setTimeout(async () => {
            const pos = getCanvasXY(t);
            const hit = raycast(pos.x, pos.y);
            if (hit) {
              const nd = st.nodeData[hit.userData.index];
              if (nd) {
                setPopup({ ...nd, px: t.clientX, py: t.clientY, brainLoading: true });
                try {
                  const res = await axios.post(`${API}/brain/analyse`, { badge_id: nd.id, frek_id: nd.frek_id });
                  setPopup(prev => prev ? { ...prev, brainResult: res.data, brainLoading: false } : null);
                } catch {
                  setPopup(prev => prev ? { ...prev, brainLoading: false, brainError: true } : null);
                }
              }
            }
          }, 800);
        } else if (e.touches.length === 2) {
          clearTimeout(st.longPressTimer);
          st.touch.startDist = getTouchDist(e.touches[0], e.touches[1]);
          st.touch.startMid = getTouchMid(e.touches[0], e.touches[1]);
        }
      };
      const onTouchMove = (e) => {
        e.preventDefault();
        clearTimeout(st.longPressTimer);
        if (e.touches.length === 1 && st.mouse.down) {
          const t = e.touches[0];
          const dx = t.clientX - st.mouse.x;
          const dy = t.clientY - st.mouse.y;
          st.rotation.y += dx * 0.005;
          st.rotation.x += dy * 0.005;
          st.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, st.rotation.x));
          st.mouse.x = t.clientX;
          st.mouse.y = t.clientY;
        } else if (e.touches.length === 2) {
          const dist = getTouchDist(e.touches[0], e.touches[1]);
          const mid = getTouchMid(e.touches[0], e.touches[1]);
          const scale = st.touch.startDist / dist;
          st.zoom = Math.max(100, Math.min(800, st.zoom * scale));
          st.touch.startDist = dist;
          st.panX -= (mid.x - st.touch.startMid.x) * 0.5;
          st.panY += (mid.y - st.touch.startMid.y) * 0.5;
          st.touch.startMid = mid;
        }
      };
      const onTouchEnd = (e) => {
        clearTimeout(st.longPressTimer);
        if (e.touches.length === 0) {
          if (st.mouse.down) {
            const pos = getCanvasXY(e.changedTouches[0]);
            const hit = raycast(pos.x, pos.y);
            if (hit) {
              const now = Date.now();
              if (now - st.lastTap < 400) {
                const idx = hit.userData.index;
                st.isolatedNode = st.isolatedNode === idx ? null : idx;
                if (st.isolatedNode === null) {
                  st.nodeMeshes.forEach(m => { m.material.transparent = false; m.material.opacity = 1; });
                }
              } else {
                showPopup(hit.userData.index, e.changedTouches[0].clientX, e.changedTouches[0].clientY);
              }
              st.lastTap = now;
            } else {
              hidePopup();
            }
          }
          st.mouse.down = false;
          st.touch.active = false;
          setTimeout(() => { st.rotation.autoRotate = true; }, 5000);
        }
      };

      // Resize handler
      const onResize = () => {
        if (disposed || !container) return;
        const nw = container.clientWidth;
        const nh = container.clientHeight || 600;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      };

      cvs.addEventListener('mousedown', onMouseDown);
      cvs.addEventListener('mousemove', onMouseMove);
      cvs.addEventListener('mouseup', onMouseUp);
      cvs.addEventListener('wheel', onWheel, { passive: false });
      cvs.addEventListener('contextmenu', onContextMenu);
      cvs.addEventListener('touchstart', onTouchStart, { passive: false });
      cvs.addEventListener('touchmove', onTouchMove, { passive: false });
      cvs.addEventListener('touchend', onTouchEnd);
      window.addEventListener('resize', onResize);

      // Cleanup
      stateRef.current._cleanup = () => {
        disposed = true;
        if (animId) cancelAnimationFrame(animId);
        if (refreshTimer) clearInterval(refreshTimer);
        clearTimeout(st.longPressTimer);
        cvs.removeEventListener('mousedown', onMouseDown);
        cvs.removeEventListener('mousemove', onMouseMove);
        cvs.removeEventListener('mouseup', onMouseUp);
        cvs.removeEventListener('wheel', onWheel);
        cvs.removeEventListener('contextmenu', onContextMenu);
        cvs.removeEventListener('touchstart', onTouchStart);
        cvs.removeEventListener('touchmove', onTouchMove);
        cvs.removeEventListener('touchend', onTouchEnd);
        window.removeEventListener('resize', onResize);
        st.nodeMeshes.forEach(m => { m.geometry?.dispose(); m.material?.dispose(); });
        st.edgeLines.forEach(l => { l.geometry?.dispose(); l.material?.dispose(); });
        renderer.dispose();
      };
    };

    init().catch(err => {
      setError(err.message);
      setLoading(false);
    });

    return () => {
      if (stateRef.current._cleanup) stateRef.current._cleanup();
    };
  }, [fetchData, renderFallback2D]);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    const data = await fetchData();
    if (!webglOk) {
      renderFallback2D(data);
      return;
    }
    // Re-trigger by unmounting/remounting would be complex; the 30s refresh handles it
    setLoading(false);
  }, [fetchData, webglOk, renderFallback2D]);

  const toggleFullscreen = () => setFullscreen(f => !f);

  // 2D Fallback renderer
  if (!webglOk) {
    const idMap = {};
    fallbackNodes.forEach((n, i) => { idMap[n.id] = i; });
    return (
      <div data-testid="mgraph-fallback-2d" className="relative bg-black rounded-lg overflow-hidden" style={{ height: fullscreen ? '100vh' : '600px' }}>
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
          <AlertCircle size={14} className="text-yellow-500" />
          <span className="text-xs text-[#888]">Mode 2D (WebGL indisponible)</span>
        </div>
        <svg width="100%" height="100%" viewBox="0 0 800 600">
          {fallbackEdges.map((e, i) => {
            const s = fallbackNodes[idMap[e.source]];
            const t = fallbackNodes[idMap[e.target]];
            if (!s || !t) return null;
            return <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#FFD700" strokeOpacity={0.1} />;
          })}
          {fallbackNodes.map((n, i) => (
            <g key={i}>
              <circle cx={n.x} cy={n.y} r={5 + n.score * 0.05} fill={TYPE_HEX[n.type] || '#A65D47'} opacity={0.8} />
              <text x={n.x} y={n.y + 15} textAnchor="middle" fill="#888" fontSize="8">{n.label}</text>
            </g>
          ))}
        </svg>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-testid="mgraph-3d-container"
      className={`relative bg-black rounded-lg overflow-hidden ${fullscreen ? 'fixed inset-0 z-50' : ''}`}
      style={{ height: fullscreen ? '100vh' : '600px' }}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#F4F1EA] tracking-widest uppercase">Mgraph 3D</span>
          <span className="text-[10px] text-[#666]">{stats.nodes} noeuds / {stats.edges} liens</span>
          {loading && <Loader2 size={12} className="animate-spin text-[#A65D47]" />}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} className="p-1.5 rounded hover:bg-white/10 text-[#888] hover:text-[#F4F1EA] transition-colors" data-testid="mgraph-refresh">
            <RefreshCw size={14} />
          </button>
          <button onClick={toggleFullscreen} className="p-1.5 rounded hover:bg-white/10 text-[#888] hover:text-[#F4F1EA] transition-colors" data-testid="mgraph-fullscreen">
            {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-2">
        {Object.entries(TYPE_HEX).map(([type, hex]) => (
          <div key={type} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: hex, boxShadow: `0 0 4px ${hex}` }} />
            <span className="text-[9px] text-[#999]">{TYPE_LABELS[type] || type}</span>
          </div>
        ))}
      </div>

      {/* Canvas */}
      <canvas ref={canvasRef} data-testid="mgraph-canvas" className="w-full h-full block" style={{ touchAction: 'none' }} />

      {/* Popup */}
      {popup && (
        <div
          data-testid="mgraph-popup"
          className="absolute z-20 bg-[#1A1A1A]/95 backdrop-blur-md border border-[#333] rounded-lg p-4 shadow-2xl"
          style={{
            left: Math.min(popup.px, (containerRef.current?.clientWidth || 800) - 280),
            top: Math.min(popup.py - 60, (containerRef.current?.clientHeight || 600) - 200),
            minWidth: 240,
          }}
        >
          <button onClick={() => setPopup(null)} className="absolute top-2 right-2 text-[#666] hover:text-[#F4F1EA]"><X size={12} /></button>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: TYPE_HEX[popup.type] || '#A65D47', boxShadow: `0 0 8px ${TYPE_HEX[popup.type] || '#A65D47'}` }} />
            <span className="text-sm font-bold text-[#F4F1EA]">{popup.label || 'Inconnu'}</span>
          </div>
          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between"><span className="text-[#888]">FREK-ID</span><span className="text-[#F4F1EA] font-mono">{popup.frek_id}</span></div>
            <div className="flex justify-between"><span className="text-[#888]">Type</span><span style={{ color: TYPE_HEX[popup.type] }}>{TYPE_LABELS[popup.type] || popup.full_type}</span></div>
            <div className="flex justify-between"><span className="text-[#888]">Impact Score</span>
              <span className="font-bold" style={{ color: popup.score >= 70 ? '#FFD700' : popup.score >= 40 ? '#E67E22' : '#888' }}>{popup.score}/100</span>
            </div>
            {popup.org && <div className="flex justify-between"><span className="text-[#888]">Organisation</span><span className="text-[#CCC]">{popup.org}</span></div>}
            <div className="flex justify-between"><span className="text-[#888]">Statut</span><span className="text-[#CCC]">{popup.statut}</span></div>
            {/* Score bar */}
            <div className="mt-2 h-1.5 bg-[#222] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${popup.score}%`, background: `linear-gradient(90deg, ${TYPE_HEX[popup.type] || '#A65D47'}, #FFD700)` }} />
            </div>
          </div>
          {popup.brainLoading && (
            <div className="mt-3 flex items-center gap-2 text-[10px] text-[#9B59B6]">
              <Loader2 size={10} className="animate-spin" /> Analyse CVL BRAIN...
            </div>
          )}
          {popup.brainResult && (
            <div className="mt-3 pt-2 border-t border-[#333]">
              <div className="flex items-center gap-1 text-[10px] text-[#9B59B6] font-bold mb-1"><Brain size={10} /> CVL BRAIN</div>
              <p className="text-[9px] text-[#888] leading-relaxed">{popup.brainResult.justification_score || popup.brainResult.message || 'Analyse effectuee'}</p>
            </div>
          )}
          {popup.brainError && (
            <div className="mt-2 text-[9px] text-red-500">Erreur analyse BRAIN</div>
          )}
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
          <div className="text-center">
            <AlertCircle size={32} className="mx-auto mb-2 text-red-500" />
            <p className="text-sm text-[#F4F1EA]">{error}</p>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30">
          <div className="text-center">
            <Loader2 size={32} className="animate-spin text-[#A65D47] mx-auto mb-2" />
            <p className="text-xs text-[#888]">Chargement du graphe culturel...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MgraphView;
