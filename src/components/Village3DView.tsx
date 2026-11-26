import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import {
  BabushkaProfile,
  BabushkaRuntime,
  BowlingHudState,
  DistrictEventType,
  FillingType,
  PirozhokInventory,
  TargetPrompt,
} from '../types/game';
import {
  ARENA_HALF_SIZE,
  BABUSHKAS,
  BOWLING_BABUSHKA_IMAGES,
  FILLINGS,
  PITBIKER_SHOUTS,
} from '../data/gameData';
import {
  BabushkaActor,
  BowlingAlleyRig,
  PickupKind,
  PitbikerActor,
  buildBakeryKiosk,
  buildBowlingAlley,
  buildFirstPersonPirozhokViewModel,
  buildFranticPitbiker,
  buildMemeBabushka,
  buildOpenWorldDistrict,
  buildPickupMesh,
  buildThrownPirozhokMesh,
  createAsphaltTextures,
  createBaltikaCanTexture,
  createGoldenSkyDome,
  createGrassTexture,
  createSidewalkTexture,
  createSignTexture,
  createWoodTexture,
} from '../three/villageModels';
import { soundEngine } from '../utils/sound';

interface Village3DViewProps {
  isPlaying: boolean;
  isBowling: boolean;
  babushkaStates: Record<string, BabushkaRuntime>;
  inventory: PirozhokInventory;
  gazyavaBoostActive: boolean;
  activeEvent: DistrictEventType;
  onInteractBabushka: (babushka: BabushkaProfile) => void;
  onInteractBakery: () => void;
  onEnterBowling: () => void;
  onExitBowling: () => void;
  onBowlingResult: (pinsKnocked: number, isStrike: boolean) => void;
  onBowlingHudUpdate: (hud: BowlingHudState) => void;
  onConsumePirozhok: () => FillingType | null;
  onCollectPickup: (kind: PickupKind) => void;
  onPitbikerBump: () => void;
  onStepTimer: (dt: number) => void;
  onTargetChange: (target: TargetPrompt | null) => void;
  onPitbikerAlert: (msg: string) => void;
  virtualInputRef: React.MutableRefObject<{ dx: number; dy: number }>;
  interactTriggerRef: React.MutableRefObject<(() => void) | null>;
  throwTriggerRef: React.MutableRefObject<(() => void) | null>;
  bowlLaunchRef: React.MutableRefObject<(() => void) | null>;
}

interface ThrownPirozhok {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
}

interface WorldPickup {
  kind: PickupKind;
  mesh: THREE.Group;
  pos: THREE.Vector3;
  phase: number;
}

const _vecA = new THREE.Vector3();
const _vecB = new THREE.Vector3();
const _vecC = new THREE.Vector3();
const _forward = new THREE.Vector3();

const BAKERY_POS = new THREE.Vector3(0, 0, -21.2);
const GOLDEN_PIE_SPAWNS: [number, number][] = [
  [7.0, -29.0],
  [-7.0, 31.0],
  [32.0, 6.5],
  [-34.0, -7.8],
];

function disposeObjectResources(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const m = child as THREE.Mesh;
      m.geometry.dispose();
      if (Array.isArray(m.material)) {
        m.material.forEach((mat) => mat.dispose());
      } else {
        m.material.dispose();
      }
    }
  });
}

export const Village3DView: React.FC<Village3DViewProps> = ({
  isPlaying,
  isBowling,
  babushkaStates,
  inventory,
  gazyavaBoostActive,
  activeEvent,
  onInteractBabushka,
  onInteractBakery,
  onEnterBowling,
  onExitBowling,
  onBowlingResult,
  onBowlingHudUpdate,
  onConsumePirozhok,
  onCollectPickup,
  onPitbikerBump,
  onStepTimer,
  onTargetChange,
  onPitbikerAlert,
  virtualInputRef,
  interactTriggerRef,
  throwTriggerRef,
  bowlLaunchRef,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [pointerLocked, setPointerLocked] = useState<boolean>(false);
  const [contextLost, setContextLost] = useState<boolean>(false);

  const propsRef = useRef({
    isPlaying,
    isBowling,
    babushkaStates,
    inventory,
    gazyavaBoostActive,
    activeEvent,
    onInteractBabushka,
    onInteractBakery,
    onEnterBowling,
    onExitBowling,
    onBowlingResult,
    onBowlingHudUpdate,
    onConsumePirozhok,
    onCollectPickup,
    onPitbikerBump,
    onStepTimer,
    onTargetChange,
    onPitbikerAlert,
  });
  propsRef.current = {
    isPlaying,
    isBowling,
    babushkaStates,
    inventory,
    gazyavaBoostActive,
    activeEvent,
    onInteractBabushka,
    onInteractBakery,
    onEnterBowling,
    onExitBowling,
    onBowlingResult,
    onBowlingHudUpdate,
    onConsumePirozhok,
    onCollectPickup,
    onPitbikerBump,
    onStepTimer,
    onTargetChange,
    onPitbikerAlert,
  };

  const keysRef = useRef<Set<string>>(new Set());
  const cameraYawRef = useRef<number>(Math.PI);
  const cameraPitchRef = useRef<number>(-0.04);
  const playerPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, -14));
  const lastTargetKeyRef = useRef<string>('');
  const currentTargetRef = useRef<TargetPrompt | null>(null);
  const pendingThrowRef = useRef<boolean>(false);
  const throwCooldownRef = useRef<number>(0);
  const bowlingEnterCooldownRef = useRef<number>(0);

  // Bowling runtime state
  const bowlingStateRef = useRef<{
    phase: 'AIMING' | 'ROLLING' | 'RESULT';
    aimAngle: number; // +0.26 = LEFT on screen (+X), -0.26 = RIGHT on screen (-X)
    ballPos: THREE.Vector3;
    ballVel: THREE.Vector3;
    resultTimer: number;
    throwsLeft: number;
    pinsKnockedThisTurn: number;
    scoredThisRoll: boolean;
  }>({
    phase: 'AIMING',
    aimAngle: 0,
    ballPos: new THREE.Vector3(0, 0.48, 0.5),
    ballVel: new THREE.Vector3(),
    resultTimer: 0,
    throwsLeft: 3,
    pinsKnockedThisTurn: 0,
    scoredThisRoll: false,
  });

  const getTotalPirozhki = (inv: PirozhokInventory) =>
    inv.cabbage + inv.potato + inv.cherry + inv.meat;

  const launchBowlingBabushka = () => {
    const bs = bowlingStateRef.current;
    if (
      !propsRef.current.isBowling ||
      bs.phase !== 'AIMING' ||
      bowlingEnterCooldownRef.current > 0
    ) {
      return;
    }

    bs.phase = 'ROLLING';
    bs.ballPos.set(0, 0.48, 0.5);
    const launchSpeed = 16.5;
    bs.ballVel.set(Math.sin(bs.aimAngle) * launchSpeed, 0, Math.cos(bs.aimAngle) * launchSpeed);
    bs.scoredThisRoll = false;

    soundEngine.playBowlingRoll();
    soundEngine.speakRussian('Уииии! Держитесь, банки!', {
      pitch: 1.42,
      rate: 1.15,
      priority: true,
    });
  };
  bowlLaunchRef.current = launchBowlingBabushka;

  const requestThrowPirozhok = () => {
    if (!propsRef.current.isPlaying || throwCooldownRef.current > 0) return;
    if (getTotalPirozhki(propsRef.current.inventory) <= 0) {
      propsRef.current.onPitbikerAlert('Пирожки кончились! Беги в пекарню пополнить поднос!');
      return;
    }
    pendingThrowRef.current = true;
  };
  throwTriggerRef.current = requestThrowPirozhok;

  const triggerInteraction = () => {
    if (!propsRef.current.isPlaying) return;
    const target = currentTargetRef.current;
    if (!target || !target.canInteract) return;

    if (target.kind === 'bakery') {
      propsRef.current.onInteractBakery();
    } else if (target.kind === 'bowling') {
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
      bowlingEnterCooldownRef.current = 0.35;
      propsRef.current.onEnterBowling();
    } else if (target.kind === 'babushka' && target.babushka) {
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
      propsRef.current.onInteractBabushka(target.babushka);
    }
  };
  interactTriggerRef.current = triggerInteraction;

  useEffect(() => {
    if (!isPlaying && !isBowling) {
      keysRef.current.clear();
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    }
    if (isBowling) {
      bowlingEnterCooldownRef.current = 0.35;
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    }
  }, [isPlaying, isBowling]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;

      if (propsRef.current.isBowling) {
        if (code === 'Escape') {
          e.preventDefault();
          propsRef.current.onExitBowling();
          return;
        }
        if (code === 'Space' || code === 'KeyE' || code === 'Enter') {
          e.preventDefault();
          if (!e.repeat) {
            launchBowlingBabushka();
          }
          return;
        }
        keysRef.current.add(code);
        return;
      }

      if (!propsRef.current.isPlaying) return;

      if (
        code === 'KeyW' ||
        code === 'KeyA' ||
        code === 'KeyS' ||
        code === 'KeyD' ||
        code === 'ArrowUp' ||
        code === 'ArrowDown' ||
        code === 'ArrowLeft' ||
        code === 'ArrowRight'
      ) {
        e.preventDefault();
        keysRef.current.add(code);
      } else if (code === 'KeyE') {
        e.preventDefault();
        if (!e.repeat) {
          triggerInteraction();
        }
      } else if (code === 'KeyQ') {
        e.preventDefault();
        if (!e.repeat) {
          requestThrowPirozhok();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    const onBlur = () => {
      keysRef.current.clear();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = container.clientWidth || 960;
    const height = container.clientHeight || 540;
    renderer.setSize(width, height);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const scene = new THREE.Scene();
    const fogColor = 0xdcb995;
    scene.fog = new THREE.FogExp2(fogColor, 0.0045);
    scene.add(createGoldenSkyDome());

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.5;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(74, width / height, 0.1, 240);
    camera.rotation.order = 'YXZ';
    scene.add(camera);

    // Balanced Golden-Hour 3-point lighting
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x3b4d2b, 0.55);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffdca8, 1.35);
    sunLight.position.set(42, 28, 52);
    sunLight.castShadow = !isSoftwareGl;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 4;
    sunLight.shadow.camera.far = 140;
    sunLight.shadow.camera.left = -46;
    sunLight.shadow.camera.right = 46;
    sunLight.shadow.camera.top = 46;
    sunLight.shadow.camera.bottom = -46;
    sunLight.shadow.bias = -0.0004;
    sunLight.shadow.normalBias = 0.02;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0xa5b4fc, 0.35);
    rimLight.position.set(-34, 18, -36);
    scene.add(rimLight);

    // Post-Processing Composer with OutputPass for proper ACESFilmicToneMapping + sRGB output
    let composer: EffectComposer | null = null;
    if (!isSoftwareGl) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        0.2,
        0.35,
        0.94
      );
      composer.addPass(bloomPass);
      composer.addPass(new OutputPass());
    }

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const grassTex = createGrassTexture(maxAniso);
    const asphalt = createAsphaltTextures(maxAniso);
    const sidewalkTex = createSidewalkTexture(maxAniso);
    const woodTex = createWoodTexture(maxAniso);
    const baltikaTex = createBaltikaCanTexture(maxAniso);
    const bakerySignTex = createSignTexture(
      'ПЕКАРНЯ У ТЁТИ ЛЮБЫ',
      'ГОРЯЧИЕ ПИРОЖКИ · НАЖМИ [E]',
      '#FAF3E7',
      '#B45309',
      maxAniso
    );
    const bowlingSignTex = createSignTexture(
      'БАБУШКО-БОУЛИНГ НА ЛАВКЕ',
      'СБЕЙ БАЛТИКУ 0 · НАЖМИ [E]',
      '#1E1B4B',
      '#38BDF8',
      maxAniso
    );

    const textureLoader = new THREE.TextureLoader();
    const babushkaTextures = BABUSHKAS.map((b) => {
      const t = textureLoader.load(b.imageUrl);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = maxAniso;
      return t;
    });
    const bowlingTextures = BOWLING_BABUSHKA_IMAGES.map((url) => {
      const t = textureLoader.load(url);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = maxAniso;
      return t;
    });

    buildOpenWorldDistrict(scene, grassTex, asphalt, sidewalkTex, woodTex, maxAniso);
    const bakeryGroup = buildBakeryKiosk(woodTex, bakerySignTex);
    scene.add(bakeryGroup);

    const bowlingAlley: BowlingAlleyRig = buildBowlingAlley(
      woodTex,
      baltikaTex,
      bowlingSignTex,
      bowlingTextures
    );
    scene.add(bowlingAlley.root);

    const babushkaActors: BabushkaActor[] = BABUSHKAS.map((b, idx) => {
      const actor = buildMemeBabushka(b, babushkaTextures[idx]);
      scene.add(actor.group);
      return actor;
    });

    const pitbiker: PitbikerActor = buildFranticPitbiker(baltikaTex);
    scene.add(pitbiker.group);

    const viewModel = buildFirstPersonPirozhokViewModel();
    camera.add(viewModel.root);

    // Street pickups & thrown pirozhki
    const worldPickups: WorldPickup[] = [];
    const thrownPirozhki: ThrownPirozhok[] = [];

    const spawnPickup = (kind: PickupKind, x: number, z: number) => {
      if (worldPickups.length >= 24) return;
      const mesh = buildPickupMesh(kind, baltikaTex);
      const clampedX = THREE.MathUtils.clamp(x, -ARENA_HALF_SIZE + 2, ARENA_HALF_SIZE - 2);
      const clampedZ = THREE.MathUtils.clamp(z, -ARENA_HALF_SIZE + 2, ARENA_HALF_SIZE - 2);
      mesh.position.set(clampedX, 0, clampedZ);
      scene.add(mesh);
      worldPickups.push({
        kind,
        mesh,
        pos: new THREE.Vector3(clampedX, 0, clampedZ),
        phase: Math.random() * Math.PI * 2,
      });
    };

    GOLDEN_PIE_SPAWNS.forEach(([gx, gz]) => {
      spawnPickup('golden_pie', gx, gz);
    });

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Pointer lock, right-click throw & drag look controls
    let isDragging = false;
    let lastDragX = 0;
    let lastDragY = 0;

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (propsRef.current.isBowling) {
        if (e.button === 0) {
          launchBowlingBabushka();
        }
        return;
      }
      if (!propsRef.current.isPlaying) return;

      if (e.button === 2) {
        requestThrowPirozhok();
        return;
      }

      isDragging = true;
      lastDragX = e.clientX;
      lastDragY = e.clientY;
      if (!document.pointerLockElement && renderer.domElement.requestPointerLock) {
        try {
          renderer.domElement.requestPointerLock();
        } catch {
          // Drag look fallback remains active
        }
      }
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (propsRef.current.isBowling && bowlingStateRef.current.phase === 'AIMING') {
        const rect = renderer.domElement.getBoundingClientRect();
        const normX = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
        // Looking along +Z means LEFT is +X (+aimAngle) and RIGHT is -X (-aimAngle)
        bowlingStateRef.current.aimAngle = THREE.MathUtils.clamp(-normX * 0.26, -0.26, 0.26);
        return;
      }

      if (!propsRef.current.isPlaying) return;
      const sensitivity = 0.0024;
      if (document.pointerLockElement === renderer.domElement) {
        cameraYawRef.current -= e.movementX * sensitivity;
        cameraPitchRef.current = THREE.MathUtils.clamp(
          cameraPitchRef.current - e.movementY * sensitivity,
          -0.68,
          0.62
        );
      } else if (isDragging) {
        const dx = e.clientX - lastDragX;
        const dy = e.clientY - lastDragY;
        lastDragX = e.clientX;
        lastDragY = e.clientY;
        cameraYawRef.current -= dx * sensitivity * 1.3;
        cameraPitchRef.current = THREE.MathUtils.clamp(
          cameraPitchRef.current - dy * sensitivity * 1.3,
          -0.68,
          0.62
        );
      }
    };

    const onPointerLockChange = () => {
      setPointerLocked(document.pointerLockElement === renderer.domElement);
    };

    renderer.domElement.addEventListener('contextmenu', onContextMenu);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onPointerLockChange);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 960;
      const h = container.clientHeight || 540;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      if (composer) composer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    let frameId = 0;
    let lastTime = performance.now();
    let walkBobPhase = 0;
    let smokeSpawnTimer = 0;
    let badgeSyncTimer = 0;
    let pitBumpCooldown = 0;
    let bowlingHudTimer = 0;
    let goldenRespawnTimer = 8;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const resetBowlingPins = () => {
      bowlingAlley.pins.forEach((pin) => {
        pin.knocked = false;
        pin.pos.copy(pin.basePos);
        pin.vel.set(0, 0, 0);
        pin.rotVel.set(0, 0, 0);
        pin.mesh.position.copy(pin.basePos);
        pin.mesh.rotation.set(0, 0, 0);
      });
    };

    const updateBowling = (dt: number, elapsedSec: number) => {
      const bs = bowlingStateRef.current;
      bowlingEnterCooldownRef.current = Math.max(0, bowlingEnterCooldownRef.current - dt);

      // Clear unobstructed camera behind foul line overlooking the alley (+Z)
      const targetCamX = bowlingAlley.laneStartWorld.x;
      const targetCamY = 2.35;
      const targetCamZ = bowlingAlley.laneStartWorld.z - 2.2;
      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 8, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 8, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 8, dt);

      let yawDiff = Math.PI - camera.rotation.y;
      while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
      while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
      camera.rotation.y += yawDiff * Math.min(1, 8 * dt);
      camera.rotation.x = THREE.MathUtils.damp(camera.rotation.x, -0.14, 8, dt);
      camera.rotation.z = THREE.MathUtils.damp(camera.rotation.z, 0, 8, dt);
      if (Math.abs(camera.fov - 68) > 0.1) {
        camera.fov = THREE.MathUtils.damp(camera.fov, 68, 8, dt);
        camera.updateProjectionMatrix();
      }
      viewModel.root.visible = false;

      // Animate sitting bench babushkas kicking legs excitedly
      bowlingAlley.benchBabushkas.forEach((b, idx) => {
        b.position.y = 0.58 + Math.abs(Math.sin(elapsedSec * 5 + idx)) * 0.05;
      });

      if (bs.phase === 'AIMING') {
        // Looking along +Z: Left = +X (+aimAngle), Right = -X (-aimAngle)
        if (keysRef.current.has('KeyA') || keysRef.current.has('ArrowLeft')) {
          bs.aimAngle = Math.min(0.26, bs.aimAngle + 0.55 * dt);
        }
        if (keysRef.current.has('KeyD') || keysRef.current.has('ArrowRight')) {
          bs.aimAngle = Math.max(-0.26, bs.aimAngle - 0.55 * dt);
        }

        bowlingAlley.aimGroup.visible = true;
        bowlingAlley.aimGroup.rotation.y = bs.aimAngle;
        bowlingAlley.bowlingBall.visible = true;
        bowlingAlley.bowlingBall.position.set(0, 0.48, 0.5);
        bowlingAlley.bowlingBall.rotation.set(0, bs.aimAngle, 0);
      } else if (bs.phase === 'ROLLING') {
        bowlingAlley.aimGroup.visible = false;
        bs.ballPos.x += bs.ballVel.x * dt;
        bs.ballPos.z += bs.ballVel.z * dt;

        // Gentle bumper rails
        if (Math.abs(bs.ballPos.x) > 1.45) {
          bs.ballVel.x *= -0.45;
          bs.ballPos.x = THREE.MathUtils.clamp(bs.ballPos.x, -1.45, 1.45);
        }
        bowlingAlley.bowlingBall.position.copy(bs.ballPos);
        bowlingAlley.bowlingBall.rotation.x += bs.ballVel.z * dt * 2.0;

        // Ball-to-pin collisions
        bowlingAlley.pins.forEach((pin) => {
          const dist = Math.hypot(bs.ballPos.x - pin.pos.x, bs.ballPos.z - pin.pos.z);
          if (!pin.knocked && dist < 0.78) {
            pin.knocked = true;
            bs.pinsKnockedThisTurn += 1;
            soundEngine.playPinHit();
            const dx = pin.pos.x - bs.ballPos.x;
            const dz = pin.pos.z - bs.ballPos.z;
            const len = Math.max(0.1, Math.hypot(dx, dz));
            pin.vel.set((dx / len) * 5.8 + bs.ballVel.x * 0.35, 4.4, (dz / len) * 6.0 + 3.2);
            pin.rotVel.set(4 + Math.random() * 6, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
          }
        });

        // Pin-to-pin chain reaction
        for (let i = 0; i < bowlingAlley.pins.length; i++) {
          const a = bowlingAlley.pins[i];
          if (!a.knocked) continue;
          for (let j = 0; j < bowlingAlley.pins.length; j++) {
            if (i === j) continue;
            const b = bowlingAlley.pins[j];
            if (!b.knocked && a.pos.distanceTo(b.pos) < 0.78) {
              b.knocked = true;
              bs.pinsKnockedThisTurn += 1;
              soundEngine.playPinHit();
              b.vel.set((b.pos.x - a.pos.x) * 6, 3.2, 4.5);
              b.rotVel.set(5, 3, -4);
            }
          }
        }

        if (bs.ballPos.z > 17.8) {
          bs.phase = 'RESULT';
          bs.resultTimer = 1.7;
          if (!bs.scoredThisRoll) {
            bs.scoredThisRoll = true;
            const knockedTotal = bowlingAlley.pins.filter((p) => p.knocked).length;
            const isStrike = knockedTotal === bowlingAlley.pins.length;
            propsRef.current.onBowlingResult(bs.pinsKnockedThisTurn, isStrike);
          }
        }
      } else if (bs.phase === 'RESULT') {
        bs.resultTimer -= dt;
        if (bs.resultTimer <= 0) {
          const remaining = bowlingAlley.pins.filter((p) => !p.knocked).length;
          if (remaining === 0 || bs.throwsLeft <= 1) {
            resetBowlingPins();
            bs.throwsLeft = 3;
          } else {
            bs.throwsLeft -= 1;
          }
          bs.pinsKnockedThisTurn = 0;
          bs.phase = 'AIMING';
        }
      }

      // Physics update for knocked pins
      bowlingAlley.pins.forEach((pin) => {
        if (pin.knocked) {
          pin.vel.y -= 13.5 * dt;
          pin.pos.x += pin.vel.x * dt;
          pin.pos.y += pin.vel.y * dt;
          pin.pos.z += pin.vel.z * dt;
          if (pin.pos.y < 0.18) {
            pin.pos.y = 0.18;
            pin.vel.y = 0;
            pin.vel.x *= 0.9;
            pin.vel.z *= 0.9;
            pin.rotVel.multiplyScalar(0.88);
          }
          pin.mesh.position.copy(pin.pos);
          pin.mesh.rotation.x += pin.rotVel.x * dt;
          pin.mesh.rotation.y += pin.rotVel.y * dt;
          pin.mesh.rotation.z += pin.rotVel.z * dt;
        }
      });

      bowlingHudTimer -= dt;
      if (bowlingHudTimer <= 0) {
        bowlingHudTimer = 0.08;
        const knockedCount = bowlingAlley.pins.filter((p) => p.knocked).length;
        propsRef.current.onBowlingHudUpdate({
          aimAngle: bs.aimAngle / 0.26,
          phase: bs.phase,
          pinsKnocked: knockedCount,
          totalPins: bowlingAlley.pins.length,
          throwsLeft: bs.throwsLeft,
        });
      }
    };

    const updateSimulation = (dt: number, elapsedSec: number) => {
      // Animate sitting bench babushkas even during roam
      bowlingAlley.benchBabushkas.forEach((b, idx) => {
        b.position.y = 0.58 + Math.abs(Math.sin(elapsedSec * 4 + idx * 1.1)) * 0.04;
      });

      if (propsRef.current.isBowling) {
        updateBowling(dt, elapsedSec);
        return;
      }

      const {
        isPlaying: playing,
        babushkaStates: bStates,
        inventory: inv,
        gazyavaBoostActive: boost,
        activeEvent: eventType,
        onConsumePirozhok: consumePie,
        onCollectPickup: collectPickup,
        onPitbikerBump: pitbikerBump,
        onStepTimer: stepTimer,
        onTargetChange: notifyTarget,
        onPitbikerAlert: notifyAlert,
      } = propsRef.current;

      if (!playing) return;

      stepTimer(dt);
      pitBumpCooldown = Math.max(0, pitBumpCooldown - dt);
      throwCooldownRef.current = Math.max(0, throwCooldownRef.current - dt);

      // 1. First-person WASD movement
      let fwd = -virtualInputRef.current.dy;
      let strafe = virtualInputRef.current.dx;
      if (keysRef.current.has('KeyW') || keysRef.current.has('ArrowUp')) fwd += 1;
      if (keysRef.current.has('KeyS') || keysRef.current.has('ArrowDown')) fwd -= 1;
      if (keysRef.current.has('KeyD')) strafe += 1;
      if (keysRef.current.has('KeyA')) strafe -= 1;

      if (keysRef.current.has('ArrowLeft')) cameraYawRef.current += 2.2 * dt;
      if (keysRef.current.has('ArrowRight')) cameraYawRef.current -= 2.2 * dt;

      const yaw = cameraYawRef.current;
      const speed = boost ? 12.8 : 8.6;
      const isMoving = Math.abs(fwd) > 0.01 || Math.abs(strafe) > 0.01;

      if (isMoving) {
        _vecA.set(-Math.sin(yaw), 0, -Math.cos(yaw)).multiplyScalar(fwd);
        _vecB.set(Math.cos(yaw), 0, -Math.sin(yaw)).multiplyScalar(strafe);
        _vecA.add(_vecB).normalize().multiplyScalar(speed * dt);

        const nextX = THREE.MathUtils.clamp(
          playerPosRef.current.x + _vecA.x,
          -ARENA_HALF_SIZE,
          ARENA_HALF_SIZE
        );
        const nextZ = THREE.MathUtils.clamp(
          playerPosRef.current.z + _vecA.z,
          -ARENA_HALF_SIZE,
          ARENA_HALF_SIZE
        );

        // Simple collision around bakery counter
        if (Math.abs(nextX) > 3.5 || nextZ > -22.0) {
          playerPosRef.current.x = nextX;
          playerPosRef.current.z = nextZ;
        }
        walkBobPhase += dt * (boost ? 14 : 9.5);
      }

      const targetFov = boost ? 84 : 74;
      if (Math.abs(camera.fov - targetFov) > 0.1) {
        camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 8, dt);
        camera.updateProjectionMatrix();
      }

      const bobY = isMoving ? Math.sin(walkBobPhase) * 0.055 : Math.sin(elapsedSec * 2) * 0.008;
      camera.position.set(playerPosRef.current.x, 1.72 + bobY, playerPosRef.current.z);
      camera.rotation.y = cameraYawRef.current;
      camera.rotation.x = cameraPitchRef.current;
      camera.rotation.z = 0;

      const totalPies = getTotalPirozhki(inv);
      viewModel.root.visible = totalPies > 0;
      if (totalPies > 0) {
        viewModel.root.position.y = -0.28 + (isMoving ? Math.sin(walkBobPhase * 2) * 0.018 : 0);
        viewModel.root.position.x = 0.32 + (isMoving ? Math.cos(walkBobPhase) * 0.015 : 0);
        viewModel.pirozhokMesh.rotation.z = Math.sin(elapsedSec * 3) * 0.06;
      }

      // 1b. Handle Thrown Pirozhok (Q / Right-Click)
      if (pendingThrowRef.current) {
        pendingThrowRef.current = false;
        const used = consumePie();
        if (used) {
          throwCooldownRef.current = 0.4;
          camera.getWorldDirection(_forward);
          const mesh = buildThrownPirozhokMesh();
          mesh.position
            .copy(camera.position)
            .addScaledVector(_forward, 0.7)
            .add(new THREE.Vector3(0, -0.14, 0));
          scene.add(mesh);
          thrownPirozhki.push({
            mesh,
            vel: _forward.clone().multiplyScalar(24).add(new THREE.Vector3(0, 2.2, 0)),
            life: 2.2,
          });
          soundEngine.playThrowPirozhok();
        }
      }

      for (let i = thrownPirozhki.length - 1; i >= 0; i--) {
        const proj = thrownPirozhki[i];
        proj.life -= dt;
        proj.vel.y -= 7.2 * dt;
        proj.mesh.position.addScaledVector(proj.vel, dt);
        proj.mesh.rotation.x += 12 * dt;
        proj.mesh.rotation.y += 8 * dt;

        let consumed = false;

        // Check hit on Pitbiker
        const bikeHitCenterY = pitbiker.pos.y + 1.05;
        const distToBike = Math.hypot(
          proj.mesh.position.x - pitbiker.pos.x,
          proj.mesh.position.y - bikeHitCenterY,
          proj.mesh.position.z - pitbiker.pos.z
        );
        if (distToBike < 1.8 && pitbiker.stunTimer <= 0.2) {
          consumed = true;
          pitbiker.stunTimer = 3.8;
          pitbiker.shoutUpdate('ПИТБАЙКЕР ОГЛУШЁН!', 'АЙ! ПИРОЖКОМ В КАСКУ!', '#10B981');
          soundEngine.playHitPitbiker();
          soundEngine.speakRussian('Ай, горячим пирожком прямо в шлем!', {
            pitch: 0.75,
            rate: 1.15,
            priority: true,
          });
          notifyAlert('Прямое попадание! Питбайкер выронил Газяву и Кирики!');
          spawnPickup('gazyava', pitbiker.pos.x + 1.4, pitbiker.pos.z + 0.8);
          spawnPickup('gazyava', pitbiker.pos.x - 1.4, pitbiker.pos.z - 0.6);
          spawnPickup('kiriki', pitbiker.pos.x + 0.6, pitbiker.pos.z - 1.5);
          spawnPickup('kiriki', pitbiker.pos.x - 0.8, pitbiker.pos.z + 1.4);
        }

        // Check hit on Babushkas (charms them to pause & wave!)
        if (!consumed) {
          for (const actor of babushkaActors) {
            const distToB = Math.hypot(
              proj.mesh.position.x - actor.pos.x,
              proj.mesh.position.y - 1.25,
              proj.mesh.position.z - actor.pos.z
            );
            if (distToB < 1.35) {
              consumed = true;
              actor.charmedTimer = 4.8;
              actor.subtitleTimer = 3.2;
              actor.badgeUpdate(actor.profile.name, 'Поймала! Подходи [E]!', '#10B981');
              soundEngine.playPickup();
              soundEngine.speakRussian('Ой, поймала на лету! Иди поводи по губкам!', {
                pitch: actor.profile.voicePitch,
                rate: actor.profile.voiceRate,
              });
              break;
            }
          }
        }

        if (consumed || proj.life <= 0 || proj.mesh.position.y <= 0.14) {
          scene.remove(proj.mesh);
          disposeObjectResources(proj.mesh);
          thrownPirozhki.splice(i, 1);
        }
      }

      // 1c. Street Pickups Animation & Collection
      goldenRespawnTimer -= dt;
      if (goldenRespawnTimer <= 0) {
        goldenRespawnTimer = 9;
        const goldenCount = worldPickups.filter((p) => p.kind === 'golden_pie').length;
        if (goldenCount < 3) {
          const spot = GOLDEN_PIE_SPAWNS[Math.floor(Math.random() * GOLDEN_PIE_SPAWNS.length)];
          spawnPickup('golden_pie', spot[0], spot[1]);
        }
      }

      for (let i = worldPickups.length - 1; i >= 0; i--) {
        const p = worldPickups[i];
        p.phase += dt * 3.0;
        p.mesh.rotation.y += dt * 2.2;
        p.mesh.children[0].position.y = 0.55 + Math.sin(p.phase) * 0.12;

        const dPlayer = Math.hypot(
          p.pos.x - playerPosRef.current.x,
          p.pos.z - playerPosRef.current.z
        );
        if (dPlayer < 1.85) {
          soundEngine.playPickup();
          collectPickup(p.kind);
          scene.remove(p.mesh);
          disposeObjectResources(p.mesh);
          worldPickups.splice(i, 1);
        }
      }

      // 2. Frantic Village Pitbiker with Baltika 0
      if (pitbiker.stunTimer > 0) {
        pitbiker.stunTimer = Math.max(0, pitbiker.stunTimer - dt);
        pitbiker.group.rotation.y += 7.5 * dt;
        pitbiker.group.rotation.z = Math.sin(elapsedSec * 18) * 0.25;
        pitbiker.baltikaArm.rotation.x = Math.sin(elapsedSec * 16) * 0.6;
      } else {
        const chasedActor = babushkaActors[pitbiker.targetBabushkaIdx % babushkaActors.length];
        _vecA.subVectors(chasedActor.pos, pitbiker.pos);
        _vecA.y = 0;
        const distToChased = _vecA.length();

        if (distToChased < 2.8) {
          pitbiker.targetBabushkaIdx =
            (pitbiker.targetBabushkaIdx + 1 + Math.floor(Math.random() * 2)) %
            babushkaActors.length;
        }

        if (distToChased > 0.2) {
          const desiredHeading = Math.atan2(_vecA.x, _vecA.z);
          let diff = desiredHeading - pitbiker.heading;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          pitbiker.heading += THREE.MathUtils.clamp(diff, -3.4 * dt, 3.4 * dt);
          pitbiker.group.rotation.z = THREE.MathUtils.damp(
            pitbiker.group.rotation.z,
            THREE.MathUtils.clamp(-diff * 0.38, -0.38, 0.38),
            8,
            dt
          );
        }

        const bikeSpeed = eventType === 'PITBIKE_TURBO' ? 13.8 : 10.2;
        pitbiker.pos.x = THREE.MathUtils.clamp(
          pitbiker.pos.x + Math.sin(pitbiker.heading) * bikeSpeed * dt,
          -26,
          26
        );
        pitbiker.pos.z = THREE.MathUtils.clamp(
          pitbiker.pos.z + Math.cos(pitbiker.heading) * bikeSpeed * dt,
          -20,
          24
        );
        pitbiker.group.position.copy(pitbiker.pos);
        pitbiker.group.rotation.y = pitbiker.heading;

        pitbiker.frontWheel.rotation.z -= bikeSpeed * dt * 2.5;
        pitbiker.rearWheel.rotation.z -= bikeSpeed * dt * 2.5;
        pitbiker.baltikaArm.rotation.x = Math.sin(elapsedSec * 10) * 0.35;
        pitbiker.baltikaArm.rotation.z = -0.18 + Math.cos(elapsedSec * 8) * 0.2;

        // Periodic loot drop behind pitbiker
        pitbiker.dropTimer -= dt;
        if (pitbiker.dropTimer <= 0) {
          pitbiker.dropTimer = eventType === 'PITBIKE_TURBO' ? 2.6 : 5.2;
          spawnPickup(
            Math.random() > 0.45 ? 'gazyava' : 'kiriki',
            pitbiker.pos.x,
            pitbiker.pos.z
          );
        }

        pitbiker.shoutTimer -= dt;
        if (pitbiker.shoutTimer <= 0) {
          pitbiker.shoutTimer = 3.8;
          const shout = PITBIKER_SHOUTS[Math.floor(Math.random() * PITBIKER_SHOUTS.length)];
          pitbiker.shoutUpdate('ПИТБАЙКЕР С БАЛТИКОЙ 0', shout, '#EF4444');
          if (pitbiker.pos.distanceTo(playerPosRef.current) < 16) {
            soundEngine.speakRussian(shout, { pitch: 0.78, rate: 1.15 });
          }
        }
      }

      smokeSpawnTimer -= dt;
      if (smokeSpawnTimer <= 0) {
        smokeSpawnTimer = 0.08;
        const freeSmoke = pitbiker.exhaustParticles.find((p) => p.life <= 0);
        if (freeSmoke) {
          freeSmoke.life = 0.6;
          freeSmoke.mesh.visible = true;
          freeSmoke.mesh.position.set(0.16, 0.54, -0.95);
          freeSmoke.mesh.scale.setScalar(0.6);
          freeSmoke.vx = (Math.random() - 0.5) * 0.4;
          freeSmoke.vy = 0.8 + Math.random() * 0.5;
          freeSmoke.vz = -1.6;
        }
      }
      pitbiker.exhaustParticles.forEach((p) => {
        if (p.life > 0) {
          p.life -= dt;
          p.mesh.position.x += p.vx * dt;
          p.mesh.position.y += p.vy * dt;
          p.mesh.position.z += p.vz * dt;
          p.mesh.scale.addScalar(dt * 1.8);
          if (p.life <= 0) p.mesh.visible = false;
        }
      });

      const distBikeToPlayer = pitbiker.pos.distanceTo(playerPosRef.current);
      soundEngine.playPitbikePutter(distBikeToPlayer);
      if (pitbiker.stunTimer <= 0 && distBikeToPlayer < 1.9 && pitBumpCooldown <= 0) {
        pitBumpCooldown = 2.2;
        soundEngine.playPitbikeBump();
        _vecB.subVectors(playerPosRef.current, pitbiker.pos).setY(0).normalize();
        playerPosRef.current.x = THREE.MathUtils.clamp(
          playerPosRef.current.x + _vecB.x * 2.5,
          -ARENA_HALF_SIZE,
          ARENA_HALF_SIZE
        );
        playerPosRef.current.z = THREE.MathUtils.clamp(
          playerPosRef.current.z + _vecB.z * 2.5,
          -ARENA_HALF_SIZE,
          ARENA_HALF_SIZE
        );
        pitbikerBump();
        notifyAlert('Питбайкер задел с Балтикой 0! Комбо сброшено — бей его пирожком [Q]!');
      }

      // 3. Lively Meme Babushkas AI + Voice + Drooling
      badgeSyncTimer -= dt;
      const shouldSyncBadges = badgeSyncTimer <= 0;
      if (shouldSyncBadges) badgeSyncTimer = 0.4;

      let bestTarget: TargetPrompt | null = null;
      let bestDist = Infinity;

      const distToBakery = playerPosRef.current.distanceTo(BAKERY_POS);
      if (distToBakery < 5.2) {
        bestDist = distToBakery;
        bestTarget = {
          kind: 'bakery',
          label: '[E] Пополнить поднос горячими пирожками',
          canInteract: true,
        };
      }

      const distToBowling = playerPosRef.current.distanceTo(bowlingAlley.benchInteractPoint);
      if (distToBowling < 4.8 && distToBowling < bestDist) {
        bestDist = distToBowling;
        bestTarget = {
          kind: 'bowling',
          label: '[E] Играть в боулинг бабушками с лавочки!',
          canInteract: true,
        };
      }

      babushkaActors.forEach((actor) => {
        const runtime = bStates[actor.profile.id];
        const distToBike = actor.pos.distanceTo(pitbiker.pos);
        const distToPlayer = actor.pos.distanceTo(playerPosRef.current);

        actor.voiceCooldown = Math.max(0, actor.voiceCooldown - dt);
        actor.subtitleTimer = Math.max(0, actor.subtitleTimer - dt);
        actor.charmedTimer = Math.max(0, actor.charmedTimer - dt);

        let bSpeed = 2.3;
        if (actor.charmedTimer > 0) {
          // Charmed by thrown pirozhok: faces player and waits happily
          _vecC.subVectors(playerPosRef.current, actor.pos).setY(0);
          if (_vecC.lengthSq() > 0.01) {
            actor.targetAngle = Math.atan2(_vecC.x, _vecC.z);
          }
          bSpeed = 0.0;
        } else if (distToBike < 10.0 && pitbiker.stunTimer <= 0) {
          _vecC.subVectors(actor.pos, pitbiker.pos).setY(0);
          if (_vecC.lengthSq() > 0.01) {
            actor.targetAngle = Math.atan2(_vecC.x, _vecC.z);
          }
          bSpeed = 5.6;

          if (distToBike < 5.0 && distToPlayer < 20 && actor.voiceCooldown <= 0) {
            actor.voiceCooldown = 5.5;
            const panicLine =
              actor.profile.panicLines[
                Math.floor(Math.random() * actor.profile.panicLines.length)
              ];
            actor.subtitleTimer = 2.5;
            actor.badgeUpdate(actor.profile.name, panicLine, '#EF4444');
            soundEngine.speakRussian(panicLine, {
              pitch: actor.profile.voicePitch,
              rate: actor.profile.voiceRate + 0.08,
            });
          }
        } else if (distToPlayer < 6.0 && totalPies > 0 && runtime?.cooldownRemaining <= 0) {
          _vecC.subVectors(playerPosRef.current, actor.pos).setY(0);
          actor.targetAngle = Math.atan2(_vecC.x, _vecC.z);
          bSpeed = distToPlayer < 2.8 ? 0.3 : 2.0;

          if (distToPlayer < 5.5 && actor.voiceCooldown <= 0) {
            actor.voiceCooldown = 6.5;
            const greet =
              actor.profile.greetingLines[
                Math.floor(Math.random() * actor.profile.greetingLines.length)
              ];
            actor.subtitleTimer = 2.5;
            soundEngine.speakRussian(greet, {
              pitch: actor.profile.voicePitch,
              rate: actor.profile.voiceRate,
            });
          }
        } else {
          actor.wanderTimer -= dt;
          if (actor.wanderTimer <= 0) {
            actor.wanderTimer = 1.6 + Math.random() * 2.2;
            actor.targetAngle += (Math.random() - 0.5) * 2.4;
          }
        }

        if (Math.abs(actor.pos.x) > 22 || Math.abs(actor.pos.z) > 22) {
          actor.targetAngle = Math.atan2(-actor.pos.x, -actor.pos.z);
        }

        actor.pos.x += Math.sin(actor.targetAngle) * bSpeed * dt;
        actor.pos.z += Math.cos(actor.targetAngle) * bSpeed * dt;
        actor.pos.x = THREE.MathUtils.clamp(actor.pos.x, -23, 23);
        actor.pos.z = THREE.MathUtils.clamp(actor.pos.z, -20, 23);

        actor.group.position.copy(actor.pos);
        actor.group.rotation.y = THREE.MathUtils.damp(
          actor.group.rotation.y,
          actor.targetAngle,
          7,
          dt
        );

        // Head bobbing & arms animation
        if (actor.charmedTimer > 0) {
          actor.headGroup.rotation.x = Math.sin(elapsedSec * 7) * 0.1;
          actor.leftArm.rotation.x = -0.9 + Math.sin(elapsedSec * 8) * 0.4;
          actor.rightArm.rotation.x = -0.9 + Math.cos(elapsedSec * 8) * 0.4;
          actor.leftLeg.rotation.x = 0;
          actor.rightLeg.rotation.x = 0;
        } else {
          if (distToPlayer < 8) {
            actor.headGroup.rotation.x = Math.sin(elapsedSec * 5) * 0.08 - 0.05;
          } else {
            actor.headGroup.rotation.x = Math.sin(elapsedSec * 3) * 0.05;
          }
          actor.walkPhase += dt * bSpeed * 2.8;
          const swing = Math.sin(actor.walkPhase) * 0.5;
          actor.leftArm.rotation.x = swing;
          actor.rightArm.rotation.x = -swing;
          actor.leftLeg.rotation.x = -swing * 0.7;
          actor.rightLeg.rotation.x = swing * 0.7;
        }

        const eventDroolMult = eventType === 'DOUBLE_DROOL' ? 1.7 : 1.0;
        const droolBoost = (distToPlayer < 6.5 ? 1.55 : 1.0) * eventDroolMult;
        actor.droolStrandL.scale.y = 0.8 + Math.sin(elapsedSec * 5 + actor.pos.x) * 0.35;
        actor.droolStrandR.scale.y = 0.8 + Math.cos(elapsedSec * 4.5 + actor.pos.z) * 0.35;
        actor.droolDrops.forEach((drop) => {
          drop.y -= drop.speed * droolBoost * dt;
          if (drop.y < 0.05) {
            drop.y = 1.48;
          }
          drop.mesh.position.y = drop.y;
        });

        if (shouldSyncBadges && runtime && actor.subtitleTimer <= 0) {
          if (actor.charmedTimer > 0) {
            actor.badgeUpdate(actor.profile.name, 'Очарована! Подходи [E]', '#10B981');
          } else if (runtime.cooldownRemaining > 0) {
            actor.badgeUpdate(
              actor.profile.name,
              `Жуёт · ${Math.ceil(runtime.cooldownRemaining)}с`,
              '#94A3B8'
            );
          } else {
            const info = FILLINGS[runtime.craving];
            actor.badgeUpdate(actor.profile.name, `Ждёт: ${info.shortLabel}`, '#F59E0B');
          }
        }

        if (distToPlayer < 4.3 && distToPlayer < bestDist) {
          bestDist = distToPlayer;
          if (totalPies <= 0) {
            bestTarget = {
              kind: 'babushka',
              babushka: actor.profile,
              label: 'Поднос пуст! Беги в пекарню ↑',
              canInteract: false,
            };
          } else if (runtime && runtime.cooldownRemaining > 0) {
            bestTarget = {
              kind: 'babushka',
              babushka: actor.profile,
              label: `${actor.profile.name} жуёт (${Math.ceil(runtime.cooldownRemaining)}с)`,
              canInteract: false,
            };
          } else {
            bestTarget = {
              kind: 'babushka',
              babushka: actor.profile,
              label: `[E] Поводить пирожком по губам (${actor.profile.name})`,
              canInteract: true,
            };
          }
        }
      });

      currentTargetRef.current = bestTarget;
      const targetKey = bestTarget
        ? `${bestTarget.kind}:${bestTarget.babushka?.id || ''}:${bestTarget.label}`
        : '';
      if (targetKey !== lastTargetKeyRef.current) {
        lastTargetKeyRef.current = targetKey;
        notifyTarget(bestTarget);
      }
    };

    const tick = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      updateSimulation(dt, now * 0.001);
      if (composer) composer.render();
      else renderer.render(scene, camera);

      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    };

    if (isSoftwareGl) afterDraw(tick);
    else frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);

      renderer.domElement.removeEventListener('contextmenu', onContextMenu);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('pointerlockchange', onPointerLockChange);

      disposeObjectResources(scene);

      grassTex.dispose();
      asphalt.map.dispose();
      asphalt.roughnessMap.dispose();
      sidewalkTex.dispose();
      woodTex.dispose();
      baltikaTex.dispose();
      bakerySignTex.dispose();
      bowlingSignTex.dispose();
      babushkaTextures.forEach((t) => t.dispose());
      bowlingTextures.forEach((t) => t.dispose());
      if (composer) composer.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-xl overflow-hidden border border-[#2F3540] bg-[#1E293B] select-none">
      <div ref={mountRef} className="w-full h-full" />

      {isPlaying && !isBowling && !contextLost && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full border-2 border-white/90 bg-black/40" />
        </div>
      )}

      {isPlaying && !isBowling && !pointerLocked && !contextLost && (
        <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-md bg-[#16191D]/85 text-xs font-medium text-stone-200 whitespace-nowrap border border-white/10">
          Клик — обзор мышкой · WASD бег · E действие · Q / ПКМ бросить пирожок
        </div>
      )}

      {contextLost && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#16191D] text-stone-200 p-6 text-center">
          <p className="font-display text-lg font-bold mb-1">Восстановление 3D-рендера…</p>
          <p className="text-xs text-stone-400">Подождите секунду, сцена обновляется.</p>
        </div>
      )}
    </div>
  );
};
