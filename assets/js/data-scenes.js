/*
 * Dependency-free perspective scenes for the academy.
 * The root page renders a distributed data-orbit scene; course pages render
 * a calmer relational-schema globe. Both remain fully static and offline.
 */
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const palette = () => {
    const styles = getComputedStyle(document.documentElement);
    return {
      primary: styles.getPropertyValue('--accent').trim() || '#5eead4',
      secondary: styles.getPropertyValue('--accent-2').trim() || '#38bdf8',
      tertiary: styles.getPropertyValue('--accent-3').trim() || '#a78bfa',
      text: styles.getPropertyValue('--text').trim() || '#f5f7fb',
      muted: styles.getPropertyValue('--muted').trim() || '#9aa8bc',
      line: styles.getPropertyValue('--line').trim() || 'rgba(164,187,220,.15)',
      surface: styles.getPropertyValue('--surface-solid').trim() || '#0d121b'
    };
  };

  const rgba = (color, alpha) => {
    if (color.startsWith('#')) {
      const raw = color.slice(1);
      const value = raw.length === 3 ? raw.split('').map(char => char + char).join('') : raw;
      const number = Number.parseInt(value, 16);
      return `rgba(${(number >> 16) & 255},${(number >> 8) & 255},${number & 255},${alpha})`;
    }
    const match = color.match(/[\d.]+/g);
    if (match?.length >= 3) return `rgba(${match[0]},${match[1]},${match[2]},${alpha})`;
    return color;
  };

  const rotatePoint = (point, rx, ry, rz = 0) => {
    const cosY = Math.cos(ry), sinY = Math.sin(ry);
    const cosX = Math.cos(rx), sinX = Math.sin(rx);
    const cosZ = Math.cos(rz), sinZ = Math.sin(rz);
    const x1 = point.x * cosY - point.z * sinY;
    const z1 = point.x * sinY + point.z * cosY;
    const y1 = point.y * cosX - z1 * sinX;
    const z2 = point.y * sinX + z1 * cosX;
    return { x: x1 * cosZ - y1 * sinZ, y: x1 * sinZ + y1 * cosZ, z: z2 };
  };

  const seededRandom = seed => {
    let value = seed >>> 0;
    return () => {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 4294967296;
    };
  };

  const fibonacciSphere = (count, radius) => Array.from({ length: count }, (_, index) => {
    const y = 1 - ((index + 0.5) / count) * 2;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = Math.PI * (3 - Math.sqrt(5)) * index;
    const pulse = radius + Math.sin(index * 1.73) * 0.13;
    return { x: Math.cos(theta) * ring * pulse, y: y * pulse, z: Math.sin(theta) * ring * pulse };
  });

  const setupCanvas = canvas => {
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return null;

    let width = 1;
    let height = 1;
    let ratio = 1;
    let pointerX = 0;
    let pointerY = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      ratio = Math.min(window.devicePixelRatio || 1, 1.8);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
    else addEventListener('resize', resize);
    resize();

    canvas.parentElement?.addEventListener('pointermove', event => {
      const rect = canvas.getBoundingClientRect();
      pointerX = ((event.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 0.52;
      pointerY = ((event.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 0.34;
    }, { passive: true });

    canvas.parentElement?.addEventListener('pointerleave', () => {
      pointerX = 0;
      pointerY = 0;
    }, { passive: true });

    const project = (point, camera = 6.1, scaleFactor = 0.19) => {
      const perspective = camera / Math.max(0.8, camera + point.z);
      const scale = Math.min(width, height) * scaleFactor;
      return {
        x: width / 2 + point.x * scale * perspective,
        y: height / 2 + point.y * scale * perspective,
        z: point.z,
        size: Math.max(0.45, perspective)
      };
    };

    return {
      canvas,
      context,
      resize,
      project,
      get width() { return width; },
      get height() { return height; },
      get pointerX() { return pointerX; },
      get pointerY() { return pointerY; }
    };
  };

  const drawBackgroundGlow = (scene, colors, strength = 1) => {
    const { context, width, height } = scene;
    const radius = Math.min(width, height) * 0.52;
    const glow = context.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, radius);
    glow.addColorStop(0, rgba(colors.primary, 0.13 * strength));
    glow.addColorStop(0.43, rgba(colors.secondary, 0.07 * strength));
    glow.addColorStop(0.72, rgba(colors.tertiary, 0.035 * strength));
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);
  };

  const initSchemaScene = scene => {
    const points = fibonacciSphere(46, 1.92);
    const links = Array.from({ length: points.length }, (_, index) => [index, (index * 7 + 11) % points.length]);

    const draw = now => {
      const seconds = now * 0.001;
      const colors = palette();
      const ry = (reducedMotion ? 0.35 : seconds * 0.072) + scene.pointerX;
      const rx = (reducedMotion ? -0.08 : Math.sin(seconds * 0.22) * 0.085) + scene.pointerY;
      const projected = points.map(point => scene.project(rotatePoint(point, rx, ry)));
      const { context, width, height } = scene;

      context.clearRect(0, 0, width, height);
      drawBackgroundGlow(scene, colors, 0.9);

      for (const [aIndex, bIndex] of links) {
        const a = projected[aIndex];
        const b = projected[bIndex];
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.strokeStyle = rgba(colors.primary, 0.08 + ((a.z + b.z + 5) / 10) * 0.08);
        context.lineWidth = 1;
        context.stroke();
      }

      for (let ring = 0; ring < 3; ring += 1) {
        context.beginPath();
        const radiusX = Math.min(width, height) * (0.205 + ring * 0.04);
        const radiusY = radiusX * (0.38 + ring * 0.018);
        context.ellipse(width / 2, height / 2, radiusX, radiusY, ry + ring * 0.39, 0, Math.PI * 2);
        context.strokeStyle = rgba(ring % 2 ? colors.secondary : colors.primary, 0.1);
        context.stroke();
      }

      projected
        .map((point, index) => ({ ...point, index }))
        .sort((a, b) => a.z - b.z)
        .forEach(point => {
          const radius = (point.index % 9 === 0 ? 3.7 : 2.2) * point.size;
          context.beginPath();
          context.arc(point.x, point.y, radius, 0, Math.PI * 2);
          context.fillStyle = rgba(point.index % 5 === 0 ? colors.secondary : colors.primary, 0.48 + Math.max(0, point.z + 2.4) / 10);
          context.fill();
        });

      for (let index = 0; index < 7; index += 1) {
        const angle = index / 7 * Math.PI * 2 + seconds * 0.035;
        const point = scene.project(rotatePoint({
          x: Math.cos(angle) * 2.85,
          y: (index % 3 - 1) * 0.70,
          z: Math.sin(angle) * 1.42
        }, rx, ry));
        const cardWidth = 53 * point.size;
        const cardHeight = 34 * point.size;
        context.save();
        context.translate(point.x, point.y);
        context.strokeStyle = rgba(colors.primary, 0.2 + Math.max(0, point.z + 1.5) * 0.025);
        context.lineWidth = 1;
        context.strokeRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);
        context.beginPath();
        context.moveTo(-cardWidth / 2 + 7, -4);
        context.lineTo(cardWidth / 2 - 7, -4);
        context.moveTo(-cardWidth / 2 + 7, 5);
        context.lineTo(cardWidth / 4, 5);
        context.stroke();
        context.restore();
      }

      if (!reducedMotion) requestAnimationFrame(draw);
    };

    requestAnimationFrame(draw);
    addEventListener('themechange', () => requestAnimationFrame(draw), { passive: true });
  };

  const initNetworkScene = scene => {
    const random = seededRandom(27831);
    const stars = Array.from({ length: 72 }, () => ({
      x: random() * 2 - 1,
      y: random() * 2 - 1,
      depth: random(),
      size: 0.5 + random() * 1.5
    }));

    const coreVertices = [
      { x: -1, y: -1, z: -1 }, { x: 1, y: -1, z: -1 },
      { x: 1, y: 1, z: -1 }, { x: -1, y: 1, z: -1 },
      { x: -1, y: -1, z: 1 }, { x: 1, y: -1, z: 1 },
      { x: 1, y: 1, z: 1 }, { x: -1, y: 1, z: 1 }
    ].map(point => ({ x: point.x * 0.72, y: point.y * 0.72, z: point.z * 0.72 }));

    const coreEdges = [
      [0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],
      [0,4],[1,5],[2,6],[3,7],[0,6],[1,7],[2,4],[3,5]
    ];

    const endpoints = [
      { x: -3.2, y: -1.35, z: 0.2, label: 'INGEST', color: 'secondary' },
      { x: -3.55, y: 0.15, z: -0.35, label: 'STREAM', color: 'primary' },
      { x: -2.95, y: 1.55, z: 0.55, label: 'CDC', color: 'tertiary' },
      { x: 3.1, y: -1.55, z: 0.45, label: 'LAKE', color: 'primary' },
      { x: 3.55, y: 0.05, z: -0.25, label: 'QUERY', color: 'secondary' },
      { x: 2.85, y: 1.55, z: 0.65, label: 'MODEL', color: 'tertiary' }
    ];

    const orbitPackets = Array.from({ length: 28 }, (_, index) => ({
      orbit: index % 3,
      offset: index / 28 * Math.PI * 2,
      speed: 0.13 + (index % 5) * 0.012,
      size: index % 7 === 0 ? 3.2 : 1.8
    }));

    const drawGrid = (colors, seconds) => {
      const { context, width, height } = scene;
      const horizon = height * 0.60;
      const bottom = height * 1.06;
      context.save();
      context.strokeStyle = rgba(colors.secondary, 0.09);
      context.lineWidth = 1;

      for (let column = -7; column <= 7; column += 1) {
        const nearX = width / 2 + column * width * 0.105;
        const farX = width / 2 + column * width * 0.017;
        context.beginPath();
        context.moveTo(farX, horizon);
        context.lineTo(nearX, bottom);
        context.stroke();
      }

      const scroll = reducedMotion ? 0 : (seconds * 0.22) % 1;
      for (let row = 0; row < 10; row += 1) {
        const t = (row + scroll) / 10;
        const eased = t * t;
        const y = horizon + eased * (bottom - horizon);
        context.globalAlpha = 0.35 + t * 0.65;
        context.beginPath();
        context.moveTo(width * (0.44 - t * 0.54), y);
        context.lineTo(width * (0.56 + t * 0.54), y);
        context.stroke();
      }
      context.restore();
    };

    const drawEndpointCard = (point, endpoint, colors) => {
      const { context } = scene;
      const color = colors[endpoint.color];
      const width = 62 * point.size;
      const height = 32 * point.size;
      context.save();
      context.translate(point.x, point.y);
      context.fillStyle = rgba(colors.surface, 0.84);
      context.strokeStyle = rgba(color, 0.48);
      context.lineWidth = 1;
      context.beginPath();
      context.roundRect(-width / 2, -height / 2, width, height, 7 * point.size);
      context.fill();
      context.stroke();
      context.fillStyle = rgba(color, 0.92);
      context.font = `700 ${Math.max(7, 8.5 * point.size)}px ui-monospace, monospace`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(endpoint.label, 0, 0);
      context.restore();
    };

    const drawFlow = (start, end, bend, color, seconds, offset) => {
      const { context } = scene;
      const controlX = (start.x + end.x) / 2 + bend;
      const controlY = Math.min(start.y, end.y) - 42 - Math.abs(bend) * 0.12;
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.quadraticCurveTo(controlX, controlY, end.x, end.y);
      context.strokeStyle = rgba(color, 0.19);
      context.lineWidth = 1.15;
      context.stroke();

      for (let packet = 0; packet < 3; packet += 1) {
        const t = reducedMotion ? (packet + 1) / 4 : (seconds * 0.16 + offset + packet / 3) % 1;
        const oneMinus = 1 - t;
        const x = oneMinus * oneMinus * start.x + 2 * oneMinus * t * controlX + t * t * end.x;
        const y = oneMinus * oneMinus * start.y + 2 * oneMinus * t * controlY + t * t * end.y;
        context.beginPath();
        context.arc(x, y, packet === 0 ? 2.8 : 1.8, 0, Math.PI * 2);
        context.fillStyle = rgba(color, 0.72 - packet * 0.13);
        context.fill();
      }
    };

    const draw = now => {
      const seconds = now * 0.001;
      const colors = palette();
      const { context, width, height } = scene;
      const rx = -0.16 + scene.pointerY * 0.5;
      const ry = (reducedMotion ? 0.45 : seconds * 0.16) + scene.pointerX * 0.75;
      const rz = reducedMotion ? 0.08 : Math.sin(seconds * 0.18) * 0.08;

      context.clearRect(0, 0, width, height);
      drawBackgroundGlow(scene, colors, 1.25);
      drawGrid(colors, seconds);

      stars.forEach(star => {
        const drift = reducedMotion ? 0 : seconds * (0.003 + star.depth * 0.006);
        const x = ((star.x + drift) % 2.2 - 1.1) * width * 0.48 + width / 2;
        const y = star.y * height * 0.42 + height / 2;
        context.beginPath();
        context.arc(x, y, star.size * (0.55 + star.depth), 0, Math.PI * 2);
        context.fillStyle = rgba(star.depth > 0.66 ? colors.secondary : colors.primary, 0.07 + star.depth * 0.18);
        context.fill();
      });

      const coreProjected = coreVertices.map(vertex => scene.project(rotatePoint(vertex, rx, ry, rz), 6.2, 0.185));
      const center = scene.project({ x: 0, y: 0, z: 0 }, 6.2, 0.185);
      const endpointProjected = endpoints
        .map(endpoint => scene.project(rotatePoint(endpoint, rx * 0.20, ry * 0.16), 6.4, 0.172))
        .map(point => ({
          ...point,
          x: Math.min(width - 44, Math.max(44, point.x)),
          y: Math.min(height - 86, Math.max(32, point.y))
        }));

      endpointProjected.forEach((point, index) => {
        const endpoint = endpoints[index];
        const color = colors[endpoint.color];
        const bend = index < 3 ? -28 - index * 13 : 28 + (index - 3) * 13;
        drawFlow(point, center, bend, color, seconds, index * 0.17);
      });

      for (let ring = 0; ring < 3; ring += 1) {
        const radiusX = Math.min(width, height) * (0.21 + ring * 0.058);
        const radiusY = radiusX * (0.31 + ring * 0.045);
        context.beginPath();
        context.ellipse(width / 2, height / 2, radiusX, radiusY, ry * (ring % 2 ? -0.55 : 0.38) + ring * 0.63, 0, Math.PI * 2);
        context.strokeStyle = rgba([colors.primary, colors.secondary, colors.tertiary][ring], 0.13);
        context.lineWidth = 1;
        context.stroke();
      }

      orbitPackets.forEach((packet, index) => {
        const radii = [1.55, 2.05, 2.58];
        const angle = packet.offset + seconds * packet.speed * (packet.orbit === 1 ? -1 : 1);
        const source = {
          x: Math.cos(angle) * radii[packet.orbit],
          y: Math.sin(angle * 1.7 + packet.orbit) * (0.36 + packet.orbit * 0.12),
          z: Math.sin(angle) * radii[packet.orbit]
        };
        const point = scene.project(rotatePoint(source, rx * 0.7, ry * 0.72, rz));
        const color = [colors.primary, colors.secondary, colors.tertiary][packet.orbit];
        context.beginPath();
        context.arc(point.x, point.y, packet.size * point.size, 0, Math.PI * 2);
        context.fillStyle = rgba(color, 0.42 + Math.max(0, point.z + 2.5) * 0.09);
        context.fill();
        if (index % 7 === 0) {
          context.beginPath();
          context.arc(point.x, point.y, packet.size * point.size * 2.5, 0, Math.PI * 2);
          context.strokeStyle = rgba(color, 0.16);
          context.stroke();
        }
      });

      coreEdges.forEach(([aIndex, bIndex], edgeIndex) => {
        const a = coreProjected[aIndex];
        const b = coreProjected[bIndex];
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.strokeStyle = rgba(edgeIndex % 3 === 0 ? colors.secondary : colors.primary, 0.34 + Math.max(0, (a.z + b.z) / 5));
        context.lineWidth = edgeIndex < 12 ? 1.2 : 0.7;
        context.stroke();
      });

      const pulse = reducedMotion ? 1 : 1 + Math.sin(seconds * 2.2) * 0.08;
      const coreGlow = context.createRadialGradient(center.x, center.y, 0, center.x, center.y, 58 * pulse);
      coreGlow.addColorStop(0, rgba(colors.primary, 0.34));
      coreGlow.addColorStop(0.45, rgba(colors.secondary, 0.13));
      coreGlow.addColorStop(1, 'rgba(0,0,0,0)');
      context.fillStyle = coreGlow;
      context.beginPath();
      context.arc(center.x, center.y, 58 * pulse, 0, Math.PI * 2);
      context.fill();

      coreProjected
        .map((point, index) => ({ ...point, index }))
        .sort((a, b) => a.z - b.z)
        .forEach(point => {
          context.beginPath();
          context.arc(point.x, point.y, (point.index % 2 ? 3.4 : 4.5) * point.size, 0, Math.PI * 2);
          context.fillStyle = rgba(point.index % 2 ? colors.secondary : colors.primary, 0.82);
          context.fill();
        });

      endpointProjected
        .map((point, index) => ({ point, endpoint: endpoints[index] }))
        .sort((a, b) => a.point.z - b.point.z)
        .forEach(({ point, endpoint }) => drawEndpointCard(point, endpoint, colors));

      context.save();
      context.textAlign = 'center';
      context.fillStyle = rgba(colors.text, 0.82);
      context.font = '700 10px ui-monospace, monospace';
      context.fillText('DISTRIBUTED DATA CORE', center.x, center.y + 78);
      context.fillStyle = rgba(colors.muted, 0.68);
      context.font = '600 8px ui-monospace, monospace';
      context.fillText('batch · stream · query · govern', center.x, center.y + 94);
      context.restore();

      if (!reducedMotion) requestAnimationFrame(draw);
    };

    requestAnimationFrame(draw);
    addEventListener('themechange', () => requestAnimationFrame(draw), { passive: true });
  };

  document.querySelectorAll('[data-three-scene]').forEach(canvas => {
    const scene = setupCanvas(canvas);
    if (!scene) {
      canvas.classList.add('three-fallback');
      return;
    }

    if (canvas.dataset.threeScene === 'schema') initSchemaScene(scene);
    else initNetworkScene(scene);
  });
})();
