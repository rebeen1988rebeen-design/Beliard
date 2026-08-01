import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Ball, CameraMode, TrajectoryPrediction } from '../types/billiards';
import { TABLE_DIMENSIONS, POCKETS, predictTrajectory } from '../physics/billiardsPhysics';
import { getBallTexture } from '../utils/ballTextureGenerator';
import { TABLE_THEMES, ThemeConfig } from '../utils/tableThemes';
import { soundEngine } from '../audio/soundEngine';

interface ThreePoolTableProps {
  balls: Ball[];
  cueAngle: number;
  onAngleChange: (newAngle: number) => void;
  power: number;
  isAiming: boolean;
  isMoving: boolean;
  isBallInHand: boolean;
  onPlaceCueBall: (x: number, z: number) => void;
  cameraMode: CameraMode;
  theme: ThemeConfig;
  showGuideline: boolean;
  customFeltColor?: string;
}

export const ThreePoolTable: React.FC<ThreePoolTableProps> = ({
  balls,
  cueAngle,
  onAngleChange,
  power,
  isAiming,
  isMoving,
  isBallInHand,
  onPlaceCueBall,
  cameraMode,
  theme,
  showGuideline,
  customFeltColor,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // References to Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const ballMeshesRef = useRef<Record<number, THREE.Mesh>>({});
  const cueStickRef = useRef<THREE.Group | null>(null);
  const guideLineRef = useRef<THREE.Line | null>(null);
  const ghostBallRef = useRef<THREE.Mesh | null>(null);
  const deflectionLineRef = useRef<THREE.Line | null>(null);
  const feltMeshRef = useRef<THREE.Mesh | null>(null);

  // Drag interaction state
  const isDraggingRef = useRef(false);
  const lastMouseXRef = useRef(0);

  // 1. Initialize Three.js Scene, Camera, Table, Lighting, and Controls
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    // SCENE
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#030712');

    // CAMERA
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, 16, 18);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    mount.appendChild(renderer.domElement);

    // LIGHTING
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Primary overhead table light (warm billiard lamp style)
    const mainLight = new THREE.SpotLight(0xffffff, 240);
    mainLight.position.set(0, 15, 0);
    mainLight.angle = Math.PI / 3;
    mainLight.penumbra = 0.5;
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.bias = -0.0001;
    scene.add(mainLight);

    // Neon edge rim lights
    const rimLightLeft = new THREE.PointLight(theme.railEmissive, 30, 25);
    rimLightLeft.position.set(-14, 3, 0);
    scene.add(rimLightLeft);

    const rimLightRight = new THREE.PointLight(theme.railEmissive, 30, 25);
    rimLightRight.position.set(14, 3, 0);
    scene.add(rimLightRight);

    // BUILD LIQUID GLASS 3D TABLE
    buildPoolTable(scene, theme);

    // BUILD CUE STICK
    const cueStickGroup = buildCueStick(theme);
    scene.add(cueStickGroup);
    cueStickRef.current = cueStickGroup;

    // BUILD LASER AIMING GUIDE
    const guideMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 2,
      transparent: true,
      opacity: 0.85,
    });
    const guideGeom = new THREE.BufferGeometry();
    const guideLine = new THREE.Line(guideGeom, guideMat);
    scene.add(guideLine);
    guideLineRef.current = guideLine;

    // GHOST BALL AT IMPACT POINT
    const ghostGeom = new THREE.SphereGeometry(TABLE_DIMENSIONS.ballRadius, 32, 32);
    const ghostMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      transmission: 0.7,
      roughness: 0.1,
      wireframe: true,
    });
    const ghostBall = new THREE.Mesh(ghostGeom, ghostMat);
    ghostBall.visible = false;
    scene.add(ghostBall);
    ghostBallRef.current = ghostBall;

    // DEFLECTION LINE
    const defMat = new THREE.LineBasicMaterial({
      color: 0xfb7185,
      transparent: true,
      opacity: 0.6,
    });
    const defGeom = new THREE.BufferGeometry();
    const defLine = new THREE.Line(defGeom, defMat);
    scene.add(defLine);
    deflectionLineRef.current = defLine;

    // HANDLE RESIZE
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // ANIMATION LOOP
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // 2. Build or Update 3D Table Theme
  const buildPoolTable = (scene: THREE.Scene, activeTheme: ThemeConfig) => {
    // Remove existing table group if rebuilding
    const oldTable = scene.getObjectByName('PoolTableGroup');
    if (oldTable) scene.remove(oldTable);

    const tableGroup = new THREE.Group();
    tableGroup.name = 'PoolTableGroup';

    const { length, width, cushionHeight } = TABLE_DIMENSIONS;

    // --- FELT PLAYING SURFACE ---
    const feltGeom = new THREE.BoxGeometry(length, 0.3, width);
    const feltMat = new THREE.MeshStandardMaterial({
      color: customFeltColor || activeTheme.feltColor,
      roughness: 0.65,
      metalness: 0.05,
    });
    const feltMesh = new THREE.Mesh(feltGeom, feltMat);
    feltMesh.position.set(0, -0.15, 0);
    feltMesh.receiveShadow = true;
    tableGroup.add(feltMesh);
    feltMeshRef.current = feltMesh;

    // --- LIQUID GLASS RAILS / BORDERS ---
    const railMat = new THREE.MeshPhysicalMaterial({
      color: activeTheme.railColor,
      transmission: activeTheme.glassOpacity,
      opacity: 1,
      transparent: true,
      roughness: 0.15,
      ior: 1.48,
      thickness: 1.2,
      emissive: activeTheme.railEmissive,
      emissiveIntensity: activeTheme.railEmissiveIntensity,
    });

    const railThickness = 1.6;
    // Top & Bottom long rails
    const longRailGeom = new THREE.BoxGeometry(length + railThickness * 2, cushionHeight * 1.8, railThickness);
    const topRail = new THREE.Mesh(longRailGeom, railMat);
    topRail.position.set(0, cushionHeight * 0.5, -width / 2 - railThickness / 2);
    topRail.castShadow = true;
    tableGroup.add(topRail);

    const bottomRail = new THREE.Mesh(longRailGeom, railMat);
    bottomRail.position.set(0, cushionHeight * 0.5, width / 2 + railThickness / 2);
    bottomRail.castShadow = true;
    tableGroup.add(bottomRail);

    // Left & Right short rails
    const shortRailGeom = new THREE.BoxGeometry(railThickness, cushionHeight * 1.8, width);
    const leftRail = new THREE.Mesh(shortRailGeom, railMat);
    leftRail.position.set(-length / 2 - railThickness / 2, cushionHeight * 0.5, 0);
    leftRail.castShadow = true;
    tableGroup.add(leftRail);

    const rightRail = new THREE.Mesh(shortRailGeom, railMat);
    rightRail.position.set(length / 2 + railThickness / 2, cushionHeight * 0.5, 0);
    rightRail.castShadow = true;
    tableGroup.add(rightRail);

    // --- NEON LED STRIPS ALONG RAILS ---
    const neonMat = new THREE.MeshBasicMaterial({ color: activeTheme.neonBorder });
    const neonStripGeom = new THREE.BoxGeometry(length, 0.06, 0.08);
    const neonTop = new THREE.Mesh(neonStripGeom, neonMat);
    neonTop.position.set(0, cushionHeight + 0.05, -width / 2 - 0.1);
    tableGroup.add(neonTop);

    const neonBottom = new THREE.Mesh(neonStripGeom, neonMat);
    neonBottom.position.set(0, cushionHeight + 0.05, width / 2 + 0.1);
    tableGroup.add(neonBottom);

    // --- 6 METALLIC CORNER & SIDE POCKETS ---
    const pocketMetalMat = new THREE.MeshStandardMaterial({
      color: activeTheme.pocketMetalColor,
      metalness: 0.9,
      roughness: 0.2,
    });
    const pocketHoleMat = new THREE.MeshBasicMaterial({ color: '#000000' });

    for (const pocket of POCKETS) {
      // Dark pocket hole on the felt
      const holeGeom = new THREE.CircleGeometry(pocket.radius * 0.95, 32);
      const holeMesh = new THREE.Mesh(holeGeom, pocketHoleMat);
      holeMesh.rotation.x = -Math.PI / 2;
      holeMesh.position.set(pocket.position[0], 0.01, pocket.position[2]);
      tableGroup.add(holeMesh);

      // Chrome metallic rim
      const rimGeom = new THREE.TorusGeometry(pocket.radius, 0.1, 16, 32);
      const rimMesh = new THREE.Mesh(rimGeom, pocketMetalMat);
      rimMesh.rotation.x = Math.PI / 2;
      rimMesh.position.set(pocket.position[0], 0.04, pocket.position[2]);
      tableGroup.add(rimMesh);
    }

    // --- TABLE LEGS & STRUCTURAL BASE ---
    const legGeom = new THREE.CylinderGeometry(0.8, 1.2, 10, 16);
    const legMat = new THREE.MeshStandardMaterial({
      color: '#0f172a',
      roughness: 0.3,
      metalness: 0.7,
    });

    const legPositions = [
      [-length / 2 + 1, -5, -width / 2 + 1],
      [length / 2 - 1, -5, -width / 2 + 1],
      [-length / 2 + 1, -5, width / 2 - 1],
      [length / 2 - 1, -5, width / 2 - 1],
    ];

    for (const [lx, ly, lz] of legPositions) {
      const leg = new THREE.Mesh(legGeom, legMat);
      leg.position.set(lx, ly, lz);
      tableGroup.add(leg);
    }

    scene.add(tableGroup);
  };

  // 3. Build 3D Cue Stick
  const buildCueStick = (activeTheme: ThemeConfig): THREE.Group => {
    const cueGroup = new THREE.Group();

    // Cue shaft (tapered cylinder: thin tip, thicker butt)
    const shaftGeom = new THREE.CylinderGeometry(0.08, 0.22, 14, 32);
    // Rotate so it aligns along X axis
    shaftGeom.rotateZ(-Math.PI / 2);
    // Offset so tip is at origin (0,0,0) and handle extends backwards (-X)
    shaftGeom.translate(-7.4, 0, 0);

    const shaftMat = new THREE.MeshPhysicalMaterial({
      color: '#451a03', // Rich Walnut wood
      roughness: 0.3,
      clearcoat: 0.9,
    });
    const shaftMesh = new THREE.Mesh(shaftGeom, shaftMat);
    shaftMesh.castShadow = true;
    cueGroup.add(shaftMesh);

    // Glass glowing butt section
    const buttGeom = new THREE.CylinderGeometry(0.2, 0.23, 4, 32);
    buttGeom.rotateZ(-Math.PI / 2);
    buttGeom.translate(-12, 0, 0);
    const buttMat = new THREE.MeshPhysicalMaterial({
      color: activeTheme.cueColor,
      transmission: 0.7,
      roughness: 0.1,
      emissive: activeTheme.railEmissive,
      emissiveIntensity: 0.4,
    });
    const buttMesh = new THREE.Mesh(buttGeom, buttMat);
    cueGroup.add(buttMesh);

    // Chalk tip (white/blue tip at 0)
    const tipGeom = new THREE.CylinderGeometry(0.075, 0.08, 0.25, 16);
    tipGeom.rotateZ(-Math.PI / 2);
    tipGeom.translate(-0.25, 0, 0);
    const tipMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
    const tipMesh = new THREE.Mesh(tipGeom, tipMat);
    cueGroup.add(tipMesh);

    cueGroup.position.set(0, 0, 0);
    return cueGroup;
  };

  // 4. Update Balls in Scene
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    balls.forEach((ball) => {
      let mesh = ballMeshesRef.current[ball.id];

      // Create mesh if it doesn't exist
      if (!mesh) {
        const geom = new THREE.SphereGeometry(ball.radius, 32, 32);
        const texture = getBallTexture(ball.number);

        const mat = new THREE.MeshPhysicalMaterial({
          map: texture,
          roughness: 0.1,
          metalness: 0.05,
          clearcoat: 1.0,
          clearcoatRoughness: 0.1,
        });

        mesh = new THREE.Mesh(geom, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        ballMeshesRef.current[ball.id] = mesh;
      }

      // Update position
      mesh.position.set(ball.position[0], ball.position[1], ball.position[2]);
      mesh.visible = !ball.inPocket;

      // Rotate sphere based on movement
      if (Math.abs(ball.angularVelocity[0]) > 0.001 || Math.abs(ball.angularVelocity[2]) > 0.001) {
        mesh.rotation.x += ball.angularVelocity[0] * 0.05;
        mesh.rotation.z += ball.angularVelocity[2] * 0.05;
      }
    });

    // Clean up removed balls
    Object.keys(ballMeshesRef.current).forEach((idStr) => {
      const id = parseInt(idStr, 10);
      if (!balls.find((b) => b.id === id)) {
        const mesh = ballMeshesRef.current[id];
        if (mesh) {
          scene.remove(mesh);
          delete ballMeshesRef.current[id];
        }
      }
    });
  }, [balls]);

  // 5. Update Cue Stick & Aim Line
  useEffect(() => {
    const cueStick = cueStickRef.current;
    const guideLine = guideLineRef.current;
    const ghostBall = ghostBallRef.current;
    const defLine = deflectionLineRef.current;
    const cueBall = balls.find((b) => b.id === 0 && !b.inPocket);

    if (!cueBall || !cueStick || !guideLine || !ghostBall || !defLine) {
      if (cueStick) cueStick.visible = false;
      if (guideLine) guideLine.visible = false;
      if (ghostBall) ghostBall.visible = false;
      if (defLine) defLine.visible = false;
      return;
    }

    const isAimingState = isAiming && !isMoving && showGuideline && !isBallInHand;
    cueStick.visible = isAiming && !isMoving && !isBallInHand;
    guideLine.visible = isAimingState;
    ghostBall.visible = isAimingState;
    defLine.visible = isAimingState;

    if (cueStick.visible) {
      // Position cue stick behind cue ball along cueAngle
      const dist = cueBall.radius + 0.4 + power * 2.8; // Pull back when power increases!
      const stickX = cueBall.position[0] - Math.cos(cueAngle) * dist;
      const stickZ = cueBall.position[2] - Math.sin(cueAngle) * dist;

      cueStick.position.set(stickX, cueBall.position[1], stickZ);
      cueStick.rotation.y = -cueAngle;
      cueStick.rotation.z = Math.PI / 32; // Slight downward elevation angle
    }

    if (isAimingState) {
      const prediction: TrajectoryPrediction = predictTrajectory(balls, cueAngle);

      // Update main aim ray
      const cuePathCoords: number[] = [];
      prediction.cuePath.forEach((pt) => {
        cuePathCoords.push(pt[0], 0.1, pt[2]);
      });
      guideLine.geometry.setAttribute('position', new THREE.Float32BufferAttribute(cuePathCoords, 3));
      guideLine.geometry.attributes.position.needsUpdate = true;

      // Update target impact & ghost ball
      if (prediction.targetHit) {
        ghostBall.visible = true;
        ghostBall.position.set(
          prediction.targetHit.impactPoint[0],
          0.1,
          prediction.targetHit.impactPoint[2]
        );

        const defCoords: number[] = [];
        prediction.targetHit.targetPath.forEach((pt) => {
          defCoords.push(pt[0], 0.1, pt[2]);
        });
        defLine.geometry.setAttribute('position', new THREE.Float32BufferAttribute(defCoords, 3));
        defLine.geometry.attributes.position.needsUpdate = true;
      } else {
        ghostBall.visible = false;
        defLine.visible = false;
      }
    }
  }, [balls, cueAngle, isAiming, isMoving, power, isBallInHand, showGuideline]);

  // 6. Smooth Camera Transition Between Aim View, Top View, and 3D Orbit View
  useEffect(() => {
    const camera = cameraRef.current;
    if (!camera) return;

    const cueBall = balls.find((b) => b.id === 0 && !b.inPocket);
    const targetPos = new THREE.Vector3();
    const lookAtPos = new THREE.Vector3();

    if (cameraMode === 'TOP') {
      // Tactical overhead top-down view
      targetPos.set(0, 24, 0.1);
      lookAtPos.set(0, 0, 0);
    } else if (cameraMode === 'AIM' && cueBall) {
      // Player perspective aiming view behind cue ball
      const dist = 6.5;
      targetPos.set(
        cueBall.position[0] - Math.cos(cueAngle) * dist,
        3.8,
        cueBall.position[2] - Math.sin(cueAngle) * dist
      );
      lookAtPos.set(
        cueBall.position[0] + Math.cos(cueAngle) * 8,
        0,
        cueBall.position[2] + Math.sin(cueAngle) * 8
      );
    } else {
      // 3D Orbit view
      const dist = 19;
      targetPos.set(
        Math.cos(cueAngle * 0.4) * dist,
        13,
        Math.sin(cueAngle * 0.4) * dist + 8
      );
      lookAtPos.set(0, 0, 0);
    }

    // Animate camera position smoothly
    let frameId: number;
    const animateCamera = () => {
      camera.position.lerp(targetPos, 0.08);
      // Create temporary target lookAt
      const currentLookAt = new THREE.Vector3(0, 0, 0);
      camera.getWorldDirection(currentLookAt);
      camera.lookAt(lookAtPos);
      frameId = requestAnimationFrame(animateCamera);
    };
    animateCamera();

    return () => cancelAnimationFrame(frameId);
  }, [cameraMode, cueAngle, balls]);

  // 7. Handle Mouse / Touch Aiming & Ball-In-Hand Positioning
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastMouseXRef.current = e.clientX;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - lastMouseXRef.current;
    lastMouseXRef.current = e.clientX;

    // Adjust aiming angle
    if (!isMoving && !isBallInHand) {
      onAngleChange(cueAngle + deltaX * 0.008);
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Ball-in-hand click positioning on felt
  const handleTableClick = (e: React.MouseEvent) => {
    if (!isBallInHand || !mountRef.current || !cameraRef.current) return;

    const rect = mountRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    if (feltMeshRef.current) {
      const intersects = raycaster.intersectObject(feltMeshRef.current);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        // Clamp inside table boundaries
        const maxLen = TABLE_DIMENSIONS.length / 2 - 0.8;
        const maxWid = TABLE_DIMENSIONS.width / 2 - 0.8;
        const x = Math.min(Math.max(point.x, -maxLen), maxLen);
        const z = Math.min(Math.max(point.z, -maxWid), maxWid);
        onPlaceCueBall(x, z);
      }
    }
  };

  return (
    <div
      ref={mountRef}
      className="relative w-full h-full cursor-grab active:cursor-grabbing select-none overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleTableClick}
    >
      {/* Ball in Hand Crosshair helper if placing cue ball */}
      {isBallInHand && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-rose-500/80 backdrop-blur-md text-white font-medium rounded-full shadow-lg border border-rose-300/40 animate-pulse flex items-center gap-2">
          <span>🎯</span>
          <span>کلیک لەسەر مێزەکە بکە بۆ دانانی تۆپی سپی</span>
        </div>
      )}
    </div>
  );
};
