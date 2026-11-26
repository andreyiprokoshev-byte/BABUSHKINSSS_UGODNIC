import * as THREE from 'three';
import { BabushkaProfile } from '../types/game';
import { ARENA_HALF_SIZE } from '../data/gameData';

export function createGoldenSkyDome(): THREE.Mesh {
  const skyGeo = new THREE.SphereGeometry(185, 32, 24);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x1e40af) },
      midColor: { value: new THREE.Color(0x7c93d6) },
      horizonColor: { value: new THREE.Color(0xfdba74) },
      sunDir: { value: new THREE.Vector3(0.55, 0.28, 0.78).normalize() },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 midColor;
      uniform vec3 horizonColor;
      uniform vec3 sunDir;
      varying vec3 vWorldPos;
      void main() {
        vec3 dir = normalize(vWorldPos);
        float h = clamp(dir.y, 0.0, 1.0);
        vec3 col = mix(horizonColor, midColor, smoothstep(0.0, 0.26, h));
        col = mix(col, topColor, smoothstep(0.22, 0.85, h));
        float sunAmt = max(dot(dir, sunDir), 0.0);
        col += vec3(1.0, 0.82, 0.55) * pow(sunAmt, 24.0) * 0.75;
        col += vec3(1.0, 0.95, 0.85) * pow(sunAmt, 240.0) * 1.4;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  return new THREE.Mesh(skyGeo, skyMat);
}

export function createGrassTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#3D6B33';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 6500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle = Math.random() > 0.45 ? '#4E823E' : '#2E5425';
    ctx.fillRect(x, y, 2, 5);
  }
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#FDE047' : '#FFFBEB';
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 3, 3);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(36, 36);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createAsphaltTextures(maxAnisotropy: number): {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#252930';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 9000; i++) {
    const g = 30 + Math.floor(Math.random() * 24);
    ctx.fillStyle = `rgb(${g},${g + 2},${g + 6})`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }

  // Wet puddle roughness map (darker = glossier wet asphalt reflection!)
  const rc = document.createElement('canvas');
  rc.width = 512;
  rc.height = 512;
  const rctx = rc.getContext('2d')!;
  rctx.fillStyle = '#C8C8C8';
  rctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 16; i++) {
    const px = Math.random() * 512;
    const py = Math.random() * 512;
    const rad = 28 + Math.random() * 64;
    const grad = rctx.createRadialGradient(px, py, 4, px, py, rad);
    grad.addColorStop(0, '#222222');
    grad.addColorStop(1, 'rgba(200,200,200,0)');
    rctx.fillStyle = grad;
    rctx.beginPath();
    rctx.arc(px, py, rad, 0, Math.PI * 2);
    rctx.fill();
  }

  const map = new THREE.CanvasTexture(c);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(10, 10);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = maxAnisotropy;

  const roughnessMap = new THREE.CanvasTexture(rc);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(10, 10);
  roughnessMap.anisotropy = maxAnisotropy;

  return { map, roughnessMap };
}

export function createSidewalkTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#9CA3AF';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#6B7280';
  ctx.lineWidth = 3;
  for (let i = 0; i <= 256; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 16);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createWoodTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#8C5E35';
  ctx.fillRect(0, 0, 256, 256);

  for (let y = 0; y < 256; y += 32) {
    ctx.fillStyle = y % 64 === 0 ? '#7E532E' : '#96673D';
    ctx.fillRect(0, y, 256, 30);
    ctx.fillStyle = '#573619';
    ctx.fillRect(0, y + 30, 256, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createPanelkaFacadeTextures(
  wallColor: string,
  maxAnisotropy: number
): { map: THREE.CanvasTexture; emissiveMap: THREE.CanvasTexture } {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;

  const ec = document.createElement('canvas');
  ec.width = 512;
  ec.height = 512;
  const ectx = ec.getContext('2d')!;

  ctx.fillStyle = wallColor;
  ctx.fillRect(0, 0, 512, 512);
  ectx.fillStyle = '#000000';
  ectx.fillRect(0, 0, 512, 512);

  // Concrete panel seams
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 3;
  for (let y = 0; y < 512; y += 102) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Windows & warm golden-hour interior glow
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const wx = 26 + col * 96;
      const wy = 20 + row * 100;
      const lit = Math.random() > 0.45;
      ctx.fillStyle = lit ? '#FDE68A' : '#334155';
      ctx.fillRect(wx, wy, 56, 62);
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 4;
      ctx.strokeRect(wx, wy, 56, 62);

      // Window cross-bar
      ctx.fillStyle = '#CBD5E1';
      ctx.fillRect(wx + 26, wy, 4, 62);

      if (lit) {
        ectx.fillStyle = '#F59E0B';
        ectx.fillRect(wx + 2, wy + 2, 52, 58);
      }
    }
  }

  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = maxAnisotropy;

  const emissiveMap = new THREE.CanvasTexture(ec);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  emissiveMap.anisotropy = maxAnisotropy;

  return { map, emissiveMap };
}

export function createBaltikaCanTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#E2E8F0');
  grad.addColorStop(0.18, '#1D4ED8');
  grad.addColorStop(0.82, '#1E3A8A');
  grad.addColorStop(1, '#CBD5E1');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 62, 256, 18);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 32px Rubik, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('БАЛТИКА', 128, 122);

  ctx.fillStyle = '#93C5FD';
  ctx.font = '900 76px Rubik, sans-serif';
  ctx.fillText('0', 128, 200);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createSignTexture(
  line1: string,
  line2: string,
  bgHex: string,
  accentHex: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 504, 120);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 34px Rubik, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(line1, 256, 56);

  ctx.fillStyle = accentHex;
  ctx.font = '700 22px Manrope, sans-serif';
  ctx.fillText(line2, 256, 96);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createFloatingBadgeSprite(
  title: string,
  subtitle: string,
  accentHex: string = '#F59E0B'
): { sprite: THREE.Sprite; updateText: (t: string, s: string, accent?: string) => void } {
  const canvas = document.createElement('canvas');
  canvas.width = 380;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  const draw = (t: string, s: string, accent: string) => {
    ctx.clearRect(0, 0, 380, 96);
    ctx.fillStyle = 'rgba(20, 23, 28, 0.9)';
    ctx.beginPath();
    ctx.roundRect(10, 10, 360, 76, 14);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#FAF7F2';
    ctx.font = '700 23px Rubik, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t, 190, 42);

    ctx.fillStyle = accent;
    ctx.font = '700 19px Manrope, sans-serif';
    ctx.fillText(s, 190, 72);
    tex.needsUpdate = true;
  };

  draw(title, subtitle, accentHex);

  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.5, 0.64, 1);
  return {
    sprite,
    updateText: (t: string, s: string, accent: string = accentHex) => draw(t, s, accent),
  };
}

export interface BabushkaActor {
  profile: BabushkaProfile;
  group: THREE.Group;
  headGroup: THREE.Group;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  droolStrandL: THREE.Mesh;
  droolStrandR: THREE.Mesh;
  droolDrops: { mesh: THREE.Mesh; y: number; speed: number }[];
  badgeUpdate: (t: string, s: string, accent?: string) => void;
  pos: THREE.Vector3;
  targetAngle: number;
  wanderTimer: number;
  walkPhase: number;
  voiceCooldown: number;
  subtitleTimer: number;
}

export function buildMemeBabushka(
  profile: BabushkaProfile,
  memeFaceTexture: THREE.Texture
): BabushkaActor {
  const group = new THREE.Group();
  group.position.set(profile.startX, 0, profile.startZ);

  const coatMat = new THREE.MeshStandardMaterial({
    color: profile.coatColor,
    roughness: 0.78,
    metalness: 0.04,
  });
  const skirtMat = new THREE.MeshStandardMaterial({
    color: '#262336',
    roughness: 0.88,
  });
  const scarfMat = new THREE.MeshStandardMaterial({
    color: profile.scarfColor,
    roughness: 0.75,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: '#F2C6AA',
    roughness: 0.65,
  });
  const bootMat = new THREE.MeshStandardMaterial({
    color: '#18181B',
    roughness: 0.55,
  });

  // Legs/Boots
  const legGeo = new THREE.CylinderGeometry(0.11, 0.13, 0.44, 10);
  const leftLeg = new THREE.Mesh(legGeo, bootMat);
  leftLeg.position.set(-0.15, 0.22, 0);
  leftLeg.castShadow = true;
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, bootMat);
  rightLeg.position.set(0.15, 0.22, 0);
  rightLeg.castShadow = true;
  group.add(rightLeg);

  // Skirt
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.44, 0.68, 16), skirtMat);
  skirt.position.y = 0.68;
  skirt.castShadow = true;
  skirt.receiveShadow = true;
  group.add(skirt);

  // Cardigan Torso
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.31, 0.64, 16), coatMat);
  torso.position.y = 1.24;
  torso.castShadow = true;
  group.add(torso);

  // Arms
  const armGeo = new THREE.CylinderGeometry(0.08, 0.075, 0.54, 10);
  const leftArm = new THREE.Mesh(armGeo, coatMat);
  leftArm.position.set(-0.34, 1.24, 0);
  leftArm.rotation.z = 0.24;
  leftArm.castShadow = true;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, coatMat);
  rightArm.position.set(0.34, 1.24, 0);
  rightArm.rotation.z = -0.24;
  rightArm.castShadow = true;
  group.add(rightArm);

  // Articulated Head Group (so she turns & nods expressively!)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.76, 0);
  group.add(headGroup);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 14), skinMat);
  head.castShadow = true;
  headGroup.add(head);

  const scarfHood = new THREE.Mesh(
    new THREE.SphereGeometry(0.305, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.72),
    scarfMat
  );
  scarfHood.position.set(0, 0.03, -0.02);
  scarfHood.rotation.x = -0.28;
  scarfHood.castShadow = true;
  headGroup.add(scarfHood);

  const scarfKnot = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.24, 10), scarfMat);
  scarfKnot.position.set(0, -0.28, 0.16);
  scarfKnot.rotation.x = Math.PI;
  headGroup.add(scarfKnot);

  const faceMat = new THREE.MeshStandardMaterial({
    map: memeFaceTexture,
    roughness: 0.5,
    metalness: 0.0,
  });
  const facePlane = new THREE.Mesh(new THREE.CircleGeometry(0.275, 24), faceMat);
  facePlane.position.set(0, 0, 0.26);
  headGroup.add(facePlane);

  // Glossy 3D Drool Strands & Falling Droplets
  const droolMat = new THREE.MeshPhysicalMaterial({
    color: 0xbfe9ff,
    roughness: 0.06,
    metalness: 0.05,
    transparent: true,
    opacity: 0.9,
    clearcoat: 1.0,
  });
  const strandGeo = new THREE.CylinderGeometry(0.017, 0.008, 0.28, 8);
  const droolStrandL = new THREE.Mesh(strandGeo, droolMat);
  droolStrandL.position.set(-0.06, -0.22, 0.29);
  headGroup.add(droolStrandL);

  const droolStrandR = new THREE.Mesh(strandGeo, droolMat);
  droolStrandR.position.set(0.05, -0.2, 0.29);
  headGroup.add(droolStrandR);

  const droolDrops: { mesh: THREE.Mesh; y: number; speed: number }[] = [];
  const dropGeo = new THREE.SphereGeometry(0.03, 8, 8);
  for (let i = 0; i < 4; i++) {
    const drop = new THREE.Mesh(dropGeo, droolMat);
    const startY = 1.48 - i * 0.34;
    drop.position.set((i % 2 === 0 ? -0.05 : 0.05) + (Math.random() - 0.5) * 0.03, startY, 0.3);
    group.add(drop);
    droolDrops.push({ mesh: drop, y: startY, speed: 1.25 + Math.random() * 0.65 });
  }

  const { sprite, updateText } = createFloatingBadgeSprite(
    profile.name,
    `Ждёт: ${profile.defaultCraving}`,
    '#F59E0B'
  );
  sprite.position.set(0, 2.48, 0);
  group.add(sprite);

  return {
    profile,
    group,
    headGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    droolStrandL,
    droolStrandR,
    droolDrops,
    badgeUpdate: updateText,
    pos: new THREE.Vector3(profile.startX, 0, profile.startZ),
    targetAngle: Math.random() * Math.PI * 2,
    wanderTimer: 1 + Math.random() * 2,
    walkPhase: Math.random() * 6,
    voiceCooldown: 1 + Math.random() * 3,
    subtitleTimer: 0,
  };
}

export interface PitbikerActor {
  group: THREE.Group;
  frontWheel: THREE.Mesh;
  rearWheel: THREE.Mesh;
  baltikaArm: THREE.Group;
  exhaustParticles: { mesh: THREE.Mesh; life: number; vx: number; vy: number; vz: number }[];
  shoutUpdate: (t: string, s: string, accent?: string) => void;
  pos: THREE.Vector3;
  heading: number;
  targetBabushkaIdx: number;
  shoutTimer: number;
}

export function buildFranticPitbiker(baltikaTex: THREE.Texture): PitbikerActor {
  const group = new THREE.Group();
  group.position.set(0, 0, -14);

  const frameMat = new THREE.MeshPhysicalMaterial({
    color: 0xdc2626,
    roughness: 0.25,
    metalness: 0.55,
    clearcoat: 0.85,
  });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe4e4e7,
    roughness: 0.14,
    metalness: 0.95,
  });
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.75 });
  const tracksuitMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.75 });
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xe6b595, roughness: 0.65 });

  const wheelGeo = new THREE.TorusGeometry(0.32, 0.09, 10, 20);
  const rearWheel = new THREE.Mesh(wheelGeo, tireMat);
  rearWheel.rotation.y = Math.PI / 2;
  rearWheel.position.set(0, 0.4, -0.74);
  rearWheel.castShadow = true;
  group.add(rearWheel);

  const frontWheel = new THREE.Mesh(wheelGeo, tireMat);
  frontWheel.rotation.y = Math.PI / 2;
  frontWheel.position.set(0, 0.4, 0.78);
  frontWheel.castShadow = true;
  group.add(frontWheel);

  const mainFrame = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 1.15), frameMat);
  mainFrame.position.set(0, 0.66, 0);
  mainFrame.castShadow = true;
  group.add(mainFrame);

  const engineBlock = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.24, 0.34), chromeMat);
  engineBlock.position.set(0, 0.5, 0.05);
  group.add(engineBlock);

  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.75, 10), chromeMat);
  exhaust.rotation.x = Math.PI / 2 - 0.18;
  exhaust.position.set(0.16, 0.58, -0.56);
  group.add(exhaust);

  const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.85, 8), chromeMat);
  fork.position.set(0, 0.77, 0.65);
  fork.rotation.x = -0.3;
  group.add(fork);

  const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.76, 8), chromeMat);
  handlebar.rotation.z = Math.PI / 2;
  handlebar.position.set(0, 1.14, 0.54);
  group.add(handlebar);

  // Glowing headlight (triggers subtle bloom on GPU!)
  const headlight = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12),
    new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfacc15,
      emissiveIntensity: 2.2,
    })
  );
  headlight.rotation.x = Math.PI / 2;
  headlight.position.set(0, 0.98, 0.72);
  group.add(headlight);

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.12, 0.62), seatMat);
  seat.position.set(0, 0.86, -0.18);
  group.add(seat);

  const riderTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.62, 10), tracksuitMat);
  riderTorso.position.set(0, 1.18, -0.1);
  riderTorso.rotation.x = 0.42;
  riderTorso.castShadow = true;
  group.add(riderTorso);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.14), stripeMat);
  stripe.position.set(0, 1.4, -0.02);
  group.add(stripe);

  const riderHead = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 12), skinMat);
  riderHead.position.set(0, 1.58, 0.08);
  group.add(riderHead);

  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.215, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.62),
    frameMat
  );
  helmet.position.set(0, 1.61, 0.06);
  helmet.rotation.x = -0.2;
  group.add(helmet);

  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.56, 8), tracksuitMat);
  leftArm.position.set(-0.24, 1.26, 0.24);
  leftArm.rotation.x = 1.05;
  leftArm.rotation.z = -0.2;
  group.add(leftArm);

  const baltikaArm = new THREE.Group();
  baltikaArm.position.set(0.25, 1.4, -0.02);
  group.add(baltikaArm);

  const rightArmMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.055, 0.52, 8),
    tracksuitMat
  );
  rightArmMesh.position.set(0.06, 0.24, 0);
  rightArmMesh.rotation.z = -0.25;
  baltikaArm.add(rightArmMesh);

  const baltikaCanMat = new THREE.MeshStandardMaterial({
    map: baltikaTex,
    roughness: 0.22,
    metalness: 0.78,
  });
  const canBody = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.36, 16), baltikaCanMat);
  canBody.position.set(0.14, 0.56, 0.04);
  canBody.castShadow = true;
  baltikaArm.add(canBody);

  const canTop = new THREE.Mesh(new THREE.CylinderGeometry(0.096, 0.096, 0.03, 16), chromeMat);
  canTop.position.set(0.14, 0.75, 0.04);
  baltikaArm.add(canTop);

  const smokeMat = new THREE.MeshStandardMaterial({
    color: 0xe5e7eb,
    transparent: true,
    opacity: 0.5,
    roughness: 1,
  });
  const smokeGeo = new THREE.SphereGeometry(0.12, 8, 8);
  const exhaustParticles: PitbikerActor['exhaustParticles'] = [];
  for (let i = 0; i < 8; i++) {
    const m = new THREE.Mesh(smokeGeo, smokeMat);
    m.visible = false;
    group.add(m);
    exhaustParticles.push({ mesh: m, life: 0, vx: 0, vy: 0, vz: 0 });
  }

  const { sprite, updateText } = createFloatingBadgeSprite(
    'ПИТБАЙКЕР С БАЛТИКОЙ 0',
    'БРАААП! С ДОРОГИ!',
    '#EF4444'
  );
  sprite.position.set(0, 2.38, 0);
  sprite.scale.set(2.9, 0.74, 1);
  group.add(sprite);

  return {
    group,
    frontWheel,
    rearWheel,
    baltikaArm,
    exhaustParticles,
    shoutUpdate: updateText,
    pos: new THREE.Vector3(4, 0, -14),
    heading: 0,
    targetBabushkaIdx: 0,
    shoutTimer: 2.5,
  };
}

export interface BowlingPinActor {
  mesh: THREE.Group;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rotVel: THREE.Vector3;
  knocked: boolean;
  basePos: THREE.Vector3;
}

export interface BowlingAlleyRig {
  root: THREE.Group;
  benchBabushkas: THREE.Group[];
  aimArrow: THREE.Mesh;
  bowlingBall: THREE.Group;
  pins: BowlingPinActor[];
  laneStartWorld: THREE.Vector3;
  benchInteractPoint: THREE.Vector3;
}

export function buildBowlingAlley(
  woodTex: THREE.Texture,
  baltikaTex: THREE.Texture,
  signTex: THREE.Texture,
  babushkaTextures: THREE.Texture[]
): BowlingAlleyRig {
  const laneX = -25;
  const laneStartZ = -4;
  const root = new THREE.Group();
  root.position.set(laneX, 0, laneStartZ);

  const polishedWoodMat = new THREE.MeshPhysicalMaterial({
    map: woodTex,
    roughness: 0.22,
    clearcoat: 0.75,
    clearcoatRoughness: 0.18,
  });
  const railMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.7 });

  // 18-meter polished bowling promenade
  const laneDeck = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.14, 18.5), polishedWoodMat);
  laneDeck.position.set(0, 0.07, 9);
  laneDeck.receiveShadow = true;
  root.add(laneDeck);

  [-1.78, 1.78].forEach((rx) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.34, 18.5), railMat);
    rail.position.set(rx, 0.17, 9);
    rail.castShadow = true;
    root.add(rail);
  });

  // Overhead Bowling Arch & Glowing Sign
  const postGeo = new THREE.BoxGeometry(0.24, 3.4, 0.24);
  [-1.85, 1.85].forEach((px) => {
    const p = new THREE.Mesh(postGeo, railMat);
    p.position.set(px, 1.7, 0.5);
    p.castShadow = true;
    root.add(p);
  });

  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 1.05),
    new THREE.MeshStandardMaterial({
      map: signTex,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.22,
    })
  );
  signMesh.position.set(0, 3.15, 0.65);
  root.add(signMesh);

  // Wooden Park Bench at start of lane with 3 sitting Bowling Babushkas!
  const bench = new THREE.Group();
  bench.position.set(0, 0, -1.6);
  const benchSeat = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.14, 0.8), railMat);
  benchSeat.position.y = 0.52;
  benchSeat.castShadow = true;
  bench.add(benchSeat);
  const benchBack = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.65, 0.12), railMat);
  benchBack.position.set(0, 0.9, -0.35);
  bench.add(benchBack);
  root.add(bench);

  const benchBabushkas: THREE.Group[] = [];
  const scarfColors = ['#B91C1C', '#6D28D9', '#047857'];
  const coatColors = ['#4F46E5', '#7C3AED', '#0F766E'];

  for (let i = 0; i < 3; i++) {
    const sitter = new THREE.Group();
    sitter.position.set(-0.95 + i * 0.95, 0.58, -1.55);

    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.27, 0.55, 12),
      new THREE.MeshStandardMaterial({ color: coatColors[i], roughness: 0.8 })
    );
    torso.position.y = 0.28;
    torso.castShadow = true;
    sitter.add(torso);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.23, 14, 12),
      new THREE.MeshStandardMaterial({ color: '#F2C6AA', roughness: 0.65 })
    );
    head.position.y = 0.74;
    sitter.add(head);

    const scarf = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.72),
      new THREE.MeshStandardMaterial({ color: scarfColors[i], roughness: 0.75 })
    );
    scarf.position.set(0, 0.77, -0.02);
    scarf.rotation.x = -0.25;
    sitter.add(scarf);

    const faceTex = babushkaTextures[i % babushkaTextures.length];
    const face = new THREE.Mesh(
      new THREE.CircleGeometry(0.22, 20),
      new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.5 })
    );
    face.position.set(0, 0.74, 0.22);
    sitter.add(face);

    // Dangling legs sitting off bench
    const legGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.42, 8);
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.6 });
    [-0.1, 0.1].forEach((lx) => {
      const leg = new THREE.Mesh(legGeo, bootMat);
      leg.position.set(lx, -0.1, 0.24);
      leg.rotation.x = -0.45;
      sitter.add(leg);
    });

    root.add(sitter);
    benchBabushkas.push(sitter);
  }

  // Aiming Arrow along lane
  const aimArrow = new THREE.Mesh(
    new THREE.ConeGeometry(0.24, 1.4, 8),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 1.6,
    })
  );
  aimArrow.rotation.x = Math.PI / 2;
  aimArrow.position.set(0, 0.24, 2.2);
  aimArrow.visible = false;
  root.add(aimArrow);

  // Rolling Curled Bowling Babushka Ball!
  const bowlingBall = new THREE.Group();
  const ballBody = new THREE.Mesh(
    new THREE.SphereGeometry(0.46, 18, 16),
    new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.6 })
  );
  ballBody.castShadow = true;
  bowlingBall.add(ballBody);

  const ballScarf = new THREE.Mesh(
    new THREE.TorusGeometry(0.44, 0.08, 10, 20),
    new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.7 })
  );
  bowlingBall.add(ballScarf);

  const ballFace = new THREE.Mesh(
    new THREE.CircleGeometry(0.32, 20),
    new THREE.MeshStandardMaterial({ map: babushkaTextures[0], roughness: 0.45 })
  );
  ballFace.position.set(0, 0, 0.44);
  bowlingBall.add(ballFace);
  bowlingBall.visible = false;
  root.add(bowlingBall);

  // 6 Giant Baltika 0 Bowling Pins in 1-2-3 triangle at far end of lane!
  const pins: BowlingPinActor[] = [];
  const pinCanMat = new THREE.MeshStandardMaterial({
    map: baltikaTex,
    roughness: 0.25,
    metalness: 0.75,
  });
  const pinCapMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.2,
    metalness: 0.9,
  });

  const pinOffsets: [number, number][] = [
    [0, 14.0],
    [-0.55, 15.1],
    [0.55, 15.1],
    [-1.1, 16.2],
    [0, 16.2],
    [1.1, 16.2],
  ];

  pinOffsets.forEach(([px, pz]) => {
    const pinGroup = new THREE.Group();
    pinGroup.position.set(px, 0.14, pz);

    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.95, 16), pinCanMat);
    can.position.y = 0.475;
    can.castShadow = true;
    pinGroup.add(can);

    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.06, 16), pinCapMat);
    top.position.y = 0.98;
    pinGroup.add(top);

    root.add(pinGroup);
    pins.push({
      mesh: pinGroup,
      pos: new THREE.Vector3(px, 0.14, pz),
      vel: new THREE.Vector3(),
      rotVel: new THREE.Vector3(),
      knocked: false,
      basePos: new THREE.Vector3(px, 0.14, pz),
    });
  });

  return {
    root,
    benchBabushkas,
    aimArrow,
    bowlingBall,
    pins,
    laneStartWorld: new THREE.Vector3(laneX, 0, laneStartZ),
    benchInteractPoint: new THREE.Vector3(laneX, 0, laneStartZ - 1.2),
  };
}

export function buildBakeryKiosk(
  woodTex: THREE.Texture,
  signTex: THREE.Texture
): THREE.Group {
  const kiosk = new THREE.Group();
  kiosk.position.set(0, 0, -24);

  const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.85 });
  const counterMat = new THREE.MeshStandardMaterial({ color: 0xfaf3e7, roughness: 0.65 });
  const redAwningMat = new THREE.MeshStandardMaterial({ color: 0xd9483b, roughness: 0.72 });
  const creamAwningMat = new THREE.MeshStandardMaterial({ color: 0xfff8ed, roughness: 0.72 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(6.2, 1.25, 2.6), counterMat);
  base.position.set(0, 0.625, 0);
  base.castShadow = true;
  base.receiveShadow = true;
  kiosk.add(base);

  const topCounter = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.16, 2.9), woodMat);
  topCounter.position.set(0, 1.3, 0.1);
  topCounter.castShadow = true;
  kiosk.add(topCounter);

  const postGeo = new THREE.BoxGeometry(0.2, 2.6, 0.2);
  [
    [-2.9, -1.0],
    [2.9, -1.0],
    [-2.9, 1.0],
    [2.9, 1.0],
  ].forEach(([px, pz]) => {
    const post = new THREE.Mesh(postGeo, woodMat);
    post.position.set(px, 2.5, pz);
    post.castShadow = true;
    kiosk.add(post);
  });

  for (let i = 0; i < 6; i++) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(1.12, 0.14, 3.4),
      i % 2 === 0 ? redAwningMat : creamAwningMat
    );
    stripe.position.set(-2.8 + i * 1.12, 3.75, 0.3);
    stripe.rotation.x = 0.22;
    stripe.castShadow = true;
    kiosk.add(stripe);
  }

  const signMat = new THREE.MeshStandardMaterial({
    map: signTex,
    emissive: 0xfbbf24,
    emissiveIntensity: 0.28,
    roughness: 0.4,
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.25), signMat);
  sign.position.set(0, 3.45, 2.0);
  kiosk.add(sign);

  const pieMat = new THREE.MeshStandardMaterial({ color: 0xe08e26, roughness: 0.5 });
  const pieGeo = new THREE.SphereGeometry(0.18, 12, 10);
  for (let i = 0; i < 6; i++) {
    const pie = new THREE.Mesh(pieGeo, pieMat);
    pie.scale.set(1.4, 0.65, 0.85);
    pie.position.set(-1.1 + i * 0.44, 1.48, 0.65);
    kiosk.add(pie);
  }

  return kiosk;
}

export function buildFirstPersonPirozhokViewModel(): {
  root: THREE.Group;
  pirozhokMesh: THREE.Mesh;
  fillingSpot: THREE.Mesh;
} {
  const root = new THREE.Group();
  root.position.set(0.32, -0.28, -0.52);

  const arm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.055, 0.36, 10),
    new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.8 })
  );
  arm.rotation.x = Math.PI / 2 - 0.35;
  arm.rotation.z = 0.25;
  arm.position.set(0.08, -0.1, 0.14);
  root.add(arm);

  const hand = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xf5cbb0, roughness: 0.7 })
  );
  hand.position.set(0, -0.02, 0);
  root.add(hand);

  const pirozhokMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.085, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xe08e26, roughness: 0.48 })
  );
  pirozhokMesh.scale.set(1.45, 0.72, 0.9);
  pirozhokMesh.position.set(-0.02, 0.03, -0.04);
  pirozhokMesh.rotation.y = 0.4;
  root.add(pirozhokMesh);

  const fillingSpot = new THREE.Mesh(
    new THREE.SphereGeometry(0.028, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0x76a647, roughness: 0.5 })
  );
  fillingSpot.position.set(0.05, 0.035, -0.02);
  root.add(fillingSpot);

  return { root, pirozhokMesh, fillingSpot };
}

function buildParkedZhiguli(colorHex: number): THREE.Group {
  const car = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: colorHex,
    roughness: 0.22,
    metalness: 0.5,
    clearcoat: 0.92,
    clearcoatRoughness: 0.12,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x1e293b,
    roughness: 0.08,
    metalness: 0.2,
    clearcoat: 1.0,
  });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.15,
    metalness: 0.95,
  });

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.65, 4.1), bodyMat);
  chassis.position.y = 0.62;
  chassis.castShadow = true;
  car.add(chassis);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.58, 2.1), glassMat);
  cabin.position.set(0, 1.2, -0.1);
  cabin.castShadow = true;
  car.add(cabin);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.08, 2.0), bodyMat);
  roof.position.set(0, 1.51, -0.1);
  car.add(roof);

  // Chrome bumpers
  [2.1, -2.1].forEach((bz) => {
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.14, 0.14), chromeMat);
    bumper.position.set(0, 0.42, bz);
    car.add(bumper);
  });

  // Glowing headlights & taillights
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xfef9c3,
    emissive: 0xfde047,
    emissiveIntensity: 1.5,
  });
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 1.4,
  });
  [-0.6, 0.6].forEach((lx) => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.06), headMat);
    hl.position.set(lx, 0.68, 2.06);
    car.add(hl);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.06), tailMat);
    tl.position.set(lx, 0.68, -2.06);
    car.add(tl);
  });

  // 4 Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 14);
  [
    [-0.88, 0.34, 1.25],
    [0.88, 0.34, 1.25],
    [-0.88, 0.34, -1.25],
    [0.88, 0.34, -1.25],
  ].forEach(([wx, wy, wz]) => {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(wx, wy, wz);
    w.castShadow = true;
    car.add(w);
  });

  return car;
}

export function buildOpenWorldDistrict(
  scene: THREE.Scene,
  grassTex: THREE.Texture,
  asphalt: { map: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture },
  sidewalkTex: THREE.Texture,
  woodTex: THREE.Texture,
  maxAnisotropy: number
): void {
  // Extended grassy open terrain
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(340, 340),
    new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.92, metalness: 0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Asphalt Boulevard Cross-Roads + Town Ring
  const asphaltMat = new THREE.MeshPhysicalMaterial({
    map: asphalt.map,
    roughnessMap: asphalt.roughnessMap,
    roughness: 0.72,
    metalness: 0.05,
    clearcoat: 0.32,
    clearcoatRoughness: 0.35,
  });

  const roadNS = new THREE.Mesh(new THREE.PlaneGeometry(14, 150), asphaltMat);
  roadNS.rotation.x = -Math.PI / 2;
  roadNS.position.y = 0.025;
  roadNS.receiveShadow = true;
  scene.add(roadNS);

  const roadEW = new THREE.Mesh(new THREE.PlaneGeometry(150, 14), asphaltMat);
  roadEW.rotation.x = -Math.PI / 2;
  roadEW.position.y = 0.028;
  roadEW.receiveShadow = true;
  scene.add(roadEW);

  // Central Paved Sidewalk Plaza
  const sidewalkMat = new THREE.MeshStandardMaterial({
    map: sidewalkTex,
    roughness: 0.82,
  });
  const plaza = new THREE.Mesh(new THREE.BoxGeometry(44, 0.08, 44), sidewalkMat);
  plaza.position.set(0, 0.01, 0);
  plaza.receiveShadow = true;
  scene.add(plaza);

  // Dashed road markings
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.6 });
  for (let d = -66; d <= 66; d += 7) {
    if (Math.abs(d) < 23) continue;
    const s1 = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 3.2), stripeMat);
    s1.rotation.x = -Math.PI / 2;
    s1.position.set(0, 0.04, d);
    scene.add(s1);

    const s2 = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.28), stripeMat);
    s2.rotation.x = -Math.PI / 2;
    s2.position.set(d, 0.04, 0);
    scene.add(s2);
  }

  // Multi-story Soviet Panelkas & Shops framing the open world blocks
  const panelkaColors = ['#D6CFC4', '#C4B5A5', '#B9C4CC', '#D8B4A0'];
  const buildings: [number, number, number, number, number, number][] = [
    [-38, -38, 22, 16, 12, 0],
    [38, -38, 22, 19, 12, 0],
    [-40, 38, 24, 15, 12, 0],
    [40, 38, 22, 21, 13, 0],
    [-64, 0, 14, 14, 24, 1],
    [64, 0, 14, 16, 24, 2],
    [0, 62, 26, 17, 13, 3],
    [0, -64, 28, 15, 12, 1],
  ];

  const facadePairs = panelkaColors.map((col) =>
    createPanelkaFacadeTextures(col, maxAnisotropy)
  );
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.9 });

  buildings.forEach(([bx, bz, bw, bh, bd, idx]) => {
    const texSet = facadePairs[idx % facadePairs.length];
    const wallMat = new THREE.MeshStandardMaterial({
      map: texSet.map,
      emissiveMap: texSet.emissiveMap,
      emissive: new THREE.Color(0xfbbf24),
      emissiveIntensity: 0.85,
      roughness: 0.78,
    });
    const bldg = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), [
      wallMat,
      wallMat,
      roofMat,
      roofMat,
      wallMat,
      wallMat,
    ]);
    bldg.position.set(bx, bh / 2, bz);
    bldg.castShadow = true;
    bldg.receiveShadow = true;
    scene.add(bldg);
  });

  // Streetlamps with glowing bulbs along the boulevard
  const poleMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    roughness: 0.4,
    metalness: 0.7,
  });
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: 0xfbbf24,
    emissiveIntensity: 2.4,
  });
  const lampCoords: [number, number][] = [
    [-9, -18],
    [9, -18],
    [-9, 18],
    [9, 18],
    [-20, -9],
    [-20, 9],
    [20, -9],
    [20, 9],
  ];
  lampCoords.forEach(([lx, lz]) => {
    const lamp = new THREE.Group();
    lamp.position.set(lx, 0, lz);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.13, 5.4, 8), poleMat);
    pole.position.y = 2.7;
    pole.castShadow = true;
    lamp.add(pole);

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), bulbMat);
    bulb.position.y = 5.5;
    lamp.add(bulb);
    scene.add(lamp);
  });

  // Parked Zhiguli Sedans along street curbs
  const carSpecs: [number, number, number, number][] = [
    [9.2, -29, 0.15, 0xb91c1c],
    [-9.2, 31, Math.PI - 0.1, 0x1d4ed8],
    [32, 9.2, Math.PI / 2, 0xfef3c7],
    [-34, -10.5, -Math.PI / 2, 0x047857],
  ];
  carSpecs.forEach(([cx, cz, rot, col]) => {
    const car = buildParkedZhiguli(col);
    car.position.set(cx, 0, cz);
    car.rotation.y = rot;
    scene.add(car);
  });

  // Low Wooden & Brick Park Perimeter beyond ±58m + Instanced Trees
  const treeCount = 64;
  const trunkMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.9 });
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x3b7a32, roughness: 0.82 });
  const trunks = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.26, 0.38, 4.2, 8),
    trunkMat,
    treeCount
  );
  const crowns = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(2.3, 1),
    foliageMat,
    treeCount
  );

  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();
  for (let i = 0; i < treeCount; i++) {
    const angle = (i / treeCount) * Math.PI * 2;
    const dist = (i % 2 === 0 ? 28 : ARENA_HALF_SIZE + 10) + (i % 5) * 4;
    let tx = Math.cos(angle) * dist;
    let tz = Math.sin(angle) * dist;
    // Keep roads clear
    if (Math.abs(tx) < 10) tx += tx >= 0 ? 11 : -11;
    if (Math.abs(tz) < 10) tz += tz >= 0 ? 11 : -11;

    const sc = 0.85 + (i % 4) * 0.14;
    dummy.position.set(tx, 2.1 * sc, tz);
    dummy.scale.set(sc, sc, sc);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);

    dummy.position.set(tx, 4.9 * sc, tz);
    dummy.updateMatrix();
    crowns.setMatrixAt(i, dummy.matrix);

    tint.setHSL(0.26 + (i % 4) * 0.02, 0.48, 0.3 + (i % 5) * 0.03);
    crowns.setColorAt(i, tint);
  }
  trunks.computeBoundingSphere();
  crowns.computeBoundingSphere();
  scene.add(trunks);
  scene.add(crowns);
}
