import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { ParkingState } from "./lessons";

interface Scooter {
  group: THREE.Group;
  steering: THREE.Group;
  centerStand: THREE.Group;
  sideStand: THREE.Group;
  wheels: THREE.Group[];
  parts: THREE.Mesh[];
}
export interface SceneReport {
  clearance: number;
  progress: number;
  blocked: boolean;
  finished: boolean;
  density?: { together: number; mixed: number };
}

const materials = {
  black: new THREE.MeshStandardMaterial({ color: "#20272b", roughness: 0.78 }),
  seat: new THREE.MeshStandardMaterial({ color: "#303238", roughness: 0.95 }),
  metal: new THREE.MeshStandardMaterial({
    color: "#b6c6c4",
    metalness: 0.75,
    roughness: 0.28,
  }),
  glass: new THREE.MeshStandardMaterial({
    color: "#dff7f2",
    metalness: 0.2,
    roughness: 0.22,
  }),
  lamp: new THREE.MeshStandardMaterial({
    color: "#fff4cc",
    emissive: "#fff0b6",
    emissiveIntensity: 0.25,
  }),
  tail: new THREE.MeshStandardMaterial({
    color: "#ea5543",
    emissive: "#d92620",
    emissiveIntensity: 0.15,
  }),
};

function scooter(color: string): Scooter {
  // A seated rider faces +Z. With +Y up, rider-left is +X.
  const group = new THREE.Group();
  const steering = new THREE.Group();
  const centerStand = new THREE.Group();
  const sideStand = new THREE.Group();
  const parts: THREE.Mesh[] = [];
  const wheels: THREE.Group[] = [];
  const paint = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.36,
    metalness: 0.1,
  });
  const add = (
    parent: THREE.Group,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    position: number[],
    scale?: number[],
    collider = true,
  ) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position[0], position[1], position[2]);
    if (scale) mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    if (collider) parts.push(mesh);
    return mesh;
  };
  const box = (
    parent: THREE.Group,
    size: number[],
    pos: number[],
    mat: THREE.Material,
    collider = true,
  ) =>
    add(
      parent,
      new THREE.BoxGeometry(...(size as [number, number, number])),
      mat,
      pos,
      undefined,
      collider,
    );
  const oval = (
    parent: THREE.Group,
    size: number[],
    pos: number[],
    mat: THREE.Material,
  ) => add(parent, new THREE.SphereGeometry(1, 20, 12), mat, pos, size);
  const rod = (
    parent: THREE.Group,
    start: number[],
    end: number[],
    radius = 0.013,
    mat: THREE.Material = materials.metal,
    collider = true,
  ) => {
    const a = new THREE.Vector3(...(start as [number, number, number]));
    const b = new THREE.Vector3(...(end as [number, number, number]));
    const mesh = add(
      parent,
      new THREE.CylinderGeometry(radius, radius, a.distanceTo(b), 8),
      mat,
      a.clone().add(b).multiplyScalar(0.5).toArray(),
      undefined,
      collider,
    );
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      b.sub(a).normalize(),
    );
    return mesh;
  };
  const wheel = (parent: THREE.Group, position: number[]) => {
    const assembly = new THREE.Group();
    assembly.position.set(position[0], position[1], position[2]);
    assembly.rotation.z = Math.PI / 2;
    parent.add(assembly);
    wheels.push(assembly);
    add(
      assembly,
      new THREE.CylinderGeometry(0.24, 0.24, 0.105, 24),
      materials.black,
      [0, 0, 0],
    );
    for (const y of [-0.056, 0.056]) {
      add(
        assembly,
        new THREE.CylinderGeometry(0.13, 0.13, 0.012, 16),
        materials.black,
        [0, y, 0],
      );
      add(
        assembly,
        new THREE.CylinderGeometry(0.05, 0.05, 0.015, 12),
        materials.metal,
        [0, y * 1.1, 0],
      );
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5;
        rod(
          assembly,
          [0, y * 1.15, 0],
          [0.115 * Math.cos(angle), y * 1.15, 0.115 * Math.sin(angle)],
          0.009,
          materials.metal,
          false,
        );
      }
    }
  };
  wheel(group, [0, 0.24, -0.63]);
  oval(group, [0.225, 0.24, 0.45], [0, 0.55, -0.49], paint);
  oval(group, [0.205, 0.072, 0.38], [0, 0.81, -0.39], materials.seat);
  box(group, [0.44, 0.055, 0.64], [0, 0.33, 0.08], materials.black);
  box(group, [0.42, 0.055, 0.55], [0, 0.365, 0.11], paint);
  const shield = oval(group, [0.205, 0.36, 0.13], [0, 0.69, 0.46], paint);
  shield.rotation.x = -0.17;
  oval(group, [0.15, 0.29, 0.03], [0, 0.72, 0.335], materials.black);
  oval(group, [0.055, 0.085, 0.2], [-0.24, 0.35, -0.64], materials.metal);
  rod(group, [0.04, 0.32, -0.57], [0.04, 0.57, -0.26], 0.03, materials.metal);
  rod(group, [-0.19, 0.83, -0.61], [-0.19, 0.84, -0.83]);
  rod(group, [0.19, 0.83, -0.61], [0.19, 0.84, -0.83]);
  rod(group, [-0.19, 0.84, -0.83], [0.19, 0.84, -0.83]);
  box(group, [0.19, 0.05, 0.035], [0, 0.6, -0.87], materials.tail);
  box(group, [0.15, 0.09, 0.015], [0, 0.48, -0.85], materials.glass);

  steering.position.set(0, 0.87, 0.49);
  group.add(steering);
  wheel(steering, [0, -0.63, 0.17]);
  for (const x of [-0.07, 0.07])
    rod(steering, [x, -0.61, 0.17], [x, -0.2, 0.015], 0.022);
  oval(steering, [0.09, 0.07, 0.255], [0, -0.365, 0.16], paint);
  rod(steering, [0, -0.1, 0], [0, 0.19, 0.025], 0.023);
  oval(steering, [0.135, 0.075, 0.075], [0, 0.2, 0.025], paint);
  oval(steering, [0.075, 0.045, 0.016], [0, 0.21, 0.092], materials.lamp);
  rod(
    steering,
    [-0.31, 0.17, 0.015],
    [0.31, 0.17, 0.015],
    0.022,
    materials.black,
  );
  for (const side of [-1, 1]) {
    rod(steering, [side * 0.2, 0.2, 0.015], [side * 0.3, 0.39, -0.03], 0.008);
    oval(
      steering,
      [0.085, 0.049, 0.022],
      [side * 0.3, 0.405, -0.03],
      materials.black,
    );
    oval(
      steering,
      [0.067, 0.036, 0.005],
      [side * 0.3, 0.405, -0.055],
      materials.glass,
    );
    rod(
      steering,
      [side * 0.22, 0.13, 0.07],
      [side * 0.31, 0.14, 0.06],
      0.007,
      materials.metal,
    );
  }

  for (const x of [-0.13, 0.13])
    rod(
      centerStand,
      [x, 0.33, -0.22],
      [x, 0.015, -0.29],
      0.017,
      materials.metal,
      false,
    );
  rod(
    centerStand,
    [-0.16, 0.015, -0.29],
    [0.16, 0.015, -0.29],
    0.012,
    materials.metal,
    false,
  );
  rod(
    sideStand,
    [0.17, 0.25, -0.2],
    [0.38, 0.052, -0.32],
    0.018,
    materials.metal,
    false,
  );
  box(
    sideStand,
    [0.095, 0.015, 0.07],
    [0.38, 0.053, -0.32],
    materials.black,
    false,
  );
  centerStand.position.y = -0.065;
  group.add(centerStand, sideStand);
  return { group, steering, centerStand, sideStand, wheels, parts };
}

export class ParkingScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
  private controls: OrbitControls;
  private main = scooter("#ef8649");
  private left = scooter("#76b9b0");
  private right = scooter("#b3bcbd");
  private blocker = scooter("#8c999f");
  private state!: ParkingState;
  private footprint: THREE.Mesh;
  private edges: THREE.LineSegments;
  private danger: THREE.MeshStandardMaterial;
  private parkingLines = new THREE.Group();
  private path = new THREE.Group();
  private progress = 0;
  private elapsed = 0;
  private running = false;
  private obstructed = false;
  private lastTime = 0;
  private lastReport = "";
  private visible = true;
  private needsRender = true;
  private density?: { together: number; mixed: number };
  private initialNeighborAngle = 0;
  private parkedClearance = 0;
  private labels: { element: HTMLSpanElement; scooter: Scooter }[] = [];

  constructor(
    private container: HTMLElement,
    private report: (report: SceneReport) => void,
    onFailure: () => void,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "low-power",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor("#1d302b");
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.45;
    this.renderer.domElement.setAttribute(
      "aria-label",
      "橘色機車與左右鄰車；可拖曳旋轉，或使用上方視角按鈕",
    );
    this.renderer.domElement.setAttribute("role", "img");
    this.renderer.domElement.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this.running = false;
      this.renderer.setAnimationLoop(null);
      onFailure();
    });
    container.append(this.renderer.domElement);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.075;
    this.controls.enablePan = false;
    this.controls.minDistance = 3.3;
    this.controls.maxDistance = 11;
    this.controls.minPolarAngle = 0.02;
    this.controls.maxPolarAngle = Math.PI * 0.48;
    this.controls.target.set(0, 0.35, -0.55);
    this.controls.addEventListener("change", () => {
      this.needsRender = true;
    });
    this.controls.addEventListener("start", () => {
      container
        .closest(".viewport-wrap")
        ?.querySelectorAll("[data-view]")
        .forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-pressed", "false");
        });
    });
    this.scene.add(new THREE.HemisphereLight("#ecfff6", "#89998e", 2.5));
    const key = new THREE.DirectionalLight("#fff2d9", 4);
    key.position.set(-3, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, {
      left: -4,
      right: 4,
      top: 4,
      bottom: -4,
      near: 0.1,
      far: 15,
    });
    key.shadow.normalBias = 0.03;
    key.shadow.bias = -0.0002;
    this.scene.add(key);
    const fill = new THREE.DirectionalLight("#bbe7e0", 1.4);
    fill.position.set(4, 3, -4);
    this.scene.add(fill);
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(4.9, 0.14, 4.7),
      new THREE.MeshStandardMaterial({ color: "#435d52", roughness: 1 }),
    );
    floor.position.set(0, -0.09, -0.6);
    floor.receiveShadow = true;
    this.scene.add(floor);
    const curb = new THREE.Mesh(
      new THREE.BoxGeometry(4.9, 0.15, 0.16),
      new THREE.MeshStandardMaterial({ color: "#9ea89b", roughness: 0.95 }),
    );
    curb.position.set(0, -0.015, 1.64);
    curb.castShadow = true;
    this.scene.add(curb);
    this.scene.add(this.parkingLines, this.path);
    for (let i = 0; i < 8; i++) {
      const dash = new THREE.Mesh(
        new THREE.PlaneGeometry(0.035, 0.14),
        new THREE.MeshBasicMaterial({
          color: "#c4da88",
          transparent: true,
          opacity: 0.55,
        }),
      );
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, -0.012, -1.04 - i * 0.22);
      this.path.add(dash);
    }
    const arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.095, 0.18, 3),
      new THREE.MeshBasicMaterial({ color: "#d6f56d" }),
    );
    arrow.rotation.x = -Math.PI / 2;
    arrow.position.set(0, 0.01, -2.84);
    this.path.add(arrow);
    this.blocker.group.rotation.y = Math.PI / 2;
    this.blocker.group.position.set(0, 0, -1.95);
    [this.main, this.left, this.right, this.blocker].forEach((s) =>
      this.scene.add(s.group),
    );
    this.danger = new THREE.MeshStandardMaterial({
      color: "#d6f56d",
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
    });
    this.footprint = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.danger);
    this.footprint.rotation.x = -Math.PI / 2;
    this.edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
      new THREE.LineBasicMaterial({
        color: "#d6f56d",
        transparent: true,
        opacity: 0.28,
      }),
    );
    this.scene.add(this.footprint, this.edges);
    for (const [s, name, cls] of [
      [this.main, "你的車", "orange"],
      [this.left, "左側鄰車", "teal"],
    ] as const) {
      const element = document.createElement("span");
      element.className = `scooter-label ${cls}`;
      element.textContent = name;
      element.setAttribute("aria-hidden", "true");
      container.append(element);
      this.labels.push({ element, scooter: s });
    }
    this.setView("perspective");
    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height) return;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.needsRender = true;
    };
    new ResizeObserver(resize).observe(container);
    resize();
    let intersects = true;
    document.addEventListener("visibilitychange", () => {
      this.visible = intersects && !document.hidden;
      this.lastTime = 0;
      this.needsRender = true;
    });
    new IntersectionObserver(([entry]) => {
      intersects = entry.isIntersecting;
      this.visible = intersects && !document.hidden;
      this.lastTime = 0;
      this.needsRender = true;
    }).observe(container);
    this.renderer.setAnimationLoop((t) => this.frame(t));
    container.dataset.ready = "true";
  }

  setView(view: "perspective" | "top") {
    this.controls.target.set(0, 0.35, -0.55);
    this.camera.position.set(
      ...((view === "top" ? [0, 7.8, -0.549] : [4.1, 4.2, 5.1]) as [
        number,
        number,
        number,
      ]),
    );
    this.controls.update();
  }

  setEnvelope(visible: boolean) {
    this.footprint.visible = visible;
    this.edges.visible = visible;
    this.needsRender = true;
  }

  setState(state: ParkingState) {
    this.state = { ...state };
    this.progress = 0;
    this.elapsed = 0;
    this.running = false;
    this.obstructed = false;
    this.main.group.rotation.set(
      state.stand === "center" ? -0.035 : 0,
      0,
      state.stand === "side" ? -THREE.MathUtils.degToRad(12) : 0,
    );
    this.main.group.position.set(0, state.stand === "center" ? 0.028 : 0.02, 0);
    this.main.steering.rotation.y = THREE.MathUtils.degToRad(
      state.turnMode === "mixed" ? 0 : state.angle,
    );
    this.initialNeighborAngle =
      state.turnMode === "individual"
        ? 0
        : THREE.MathUtils.degToRad(state.angle);
    this.left.steering.rotation.y = this.initialNeighborAngle;
    this.right.steering.rotation.y = this.initialNeighborAngle;
    this.main.wheels.forEach((w) => w.rotation.set(0, 0, Math.PI / 2));
    this.main.centerStand.visible = state.stand === "center";
    this.main.sideStand.visible = state.stand === "side";
    for (const s of [this.left, this.right, this.blocker]) {
      s.sideStand.visible = false;
      s.centerStand.visible = true;
    }
    this.left.group.position.set(state.spacing / 100, 0.028, -0.1);
    this.right.group.position.set(-state.spacing / 100, 0.028, 0.05);
    this.blocker.group.visible = state.blocked;
    this.setEnvelope(state.envelope);
    while (this.parkingLines.children.length) {
      const mesh = this.parkingLines.children[0] as THREE.Mesh;
      this.parkingLines.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    for (const x of [-1.5, -0.5, 0.5, 1.5]) {
      const line = new THREE.Mesh(
        new THREE.PlaneGeometry(0.025, 2.3),
        new THREE.MeshBasicMaterial({
          color: "#d3ded2",
          transparent: true,
          opacity: 0.7,
        }),
      );
      line.rotation.x = -Math.PI / 2;
      line.position.set((x * state.spacing) / 100, -0.012, 0.14);
      this.parkingLines.add(line);
    }
    const cap = new THREE.Mesh(
      new THREE.PlaneGeometry((3 * state.spacing) / 100, 0.025),
      new THREE.MeshBasicMaterial({
        color: "#d3ded2",
        transparent: true,
        opacity: 0.7,
      }),
    );
    cap.rotation.x = -Math.PI / 2;
    cap.position.set(0, -0.012, 1.29);
    this.parkingLines.add(cap);
    this.scene.updateMatrixWorld(true);
    this.density =
      state.turnMode === "individual" ? undefined : this.compareDensity();
    this.lastReport = "";
    this.updateReport(false);
  }

  play(restart: boolean) {
    if (restart) this.setState(this.state);
    this.main.centerStand.visible = false;
    this.main.sideStand.visible = false;
    this.running = true;
    this.lastTime = 0;
  }
  pause() {
    this.running = false;
  }

  private bounds(s: Scooter) {
    return s.parts.map((p) => new THREE.Box3().setFromObject(p));
  }

  private overlaps(a: THREE.Box3[], b: THREE.Box3[]) {
    return a.some((x) => b.some((y) => x.intersectsBox(y)));
  }

  private compareDensity() {
    const angle = this.main.steering.rotation.y;
    const leftX = this.left.group.position.x;
    const rightX = this.right.group.position.x;
    this.left.group.position.x = 0;
    this.right.group.position.x = 0;
    const minimumPitch = (mainAngle: number) => {
      this.main.steering.rotation.y = mainAngle;
      this.scene.updateMatrixWorld(true);
      const main = this.bounds(this.main);
      let pitch = 0;
      for (const [neighbor, side] of [
        [this.left, "left"],
        [this.right, "right"],
      ] as const) {
        for (const a of main)
          for (const b of this.bounds(neighbor)) {
            if (
              a.max.y < b.min.y ||
              a.min.y > b.max.y ||
              a.max.z < b.min.z ||
              a.min.z > b.max.z
            )
              continue;
            pitch = Math.max(
              pitch,
              side === "left" ? a.max.x - b.min.x : b.max.x - a.min.x,
            );
          }
      }
      return Math.ceil(pitch * 100) + 1;
    };
    const together = minimumPitch(this.initialNeighborAngle);
    const mixed = minimumPitch(0);
    this.main.steering.rotation.y = angle;
    this.left.group.position.x = leftX;
    this.right.group.position.x = rightX;
    this.scene.updateMatrixWorld(true);
    return { together, mixed };
  }

  private updateReport(finished: boolean) {
    this.scene.updateMatrixWorld(true);
    const mainBounds = this.bounds(this.main);
    // This deliberately uses conservative world-axis boxes, not rigid-body collision physics.
    const neighborBounds = this.bounds(this.left);
    let clearance = Infinity;
    for (const a of mainBounds)
      for (const b of neighborBounds) {
        if (
          a.max.y < b.min.y ||
          a.min.y > b.max.y ||
          a.max.z < b.min.z ||
          a.min.z > b.max.z
        )
          continue;
        clearance = Math.min(clearance, b.min.x - a.max.x);
      }
    // Once the center scooter has left the row, keep the parked comparison visible.
    if (!Number.isFinite(clearance)) {
      clearance = this.parkedClearance;
    }
    if (this.progress === 0) this.parkedClearance = clearance;
    const union = mainBounds.reduce((box, b) => box.union(b), new THREE.Box3());
    const size = union.getSize(new THREE.Vector3());
    const center = union.getCenter(new THREE.Vector3());
    this.footprint.position.set(center.x, -0.007, center.z);
    this.footprint.scale.set(size.x, size.z, 1);
    this.edges.position.copy(center);
    this.edges.scale.copy(size);
    const color = clearance < 0.05 ? "#ffae86" : "#d6f56d";
    this.danger.color.set(color);
    (this.edges.material as THREE.LineBasicMaterial).color.set(color);
    const result: SceneReport = {
      clearance: Math.round(clearance * 100),
      progress: this.progress,
      blocked: this.obstructed,
      finished,
      density: this.density,
    };
    const signature = JSON.stringify(result);
    if (signature !== this.lastReport) {
      this.report(result);
      this.lastReport = signature;
    }
    this.container.dataset.progress = this.progress.toFixed(3);
    this.container.dataset.blocked = String(this.obstructed);
    this.container.dataset.clearance = String(result.clearance);
    if (this.density) {
      this.container.dataset.pitchTogether = String(this.density.together);
      this.container.dataset.pitchMixed = String(this.density.mixed);
    }
    // Diagnostics use actual rendered transforms, so tests catch axle wobble and wrong spin direction.
    const wheel = this.main.wheels[0];
    const orientation = wheel.getWorldQuaternion(new THREE.Quaternion());
    const axle = new THREE.Vector3(0, 1, 0).applyQuaternion(orientation);
    const spoke = new THREE.Vector3(1, 0, 0).applyQuaternion(orientation);
    this.container.dataset.wheelAxis = JSON.stringify(axle.toArray());
    this.container.dataset.wheelSpoke = JSON.stringify(spoke.toArray());
    this.container.dataset.wheelTravel = String(-this.main.group.position.z);
    this.container.dataset.wheelCenterY = String(
      wheel.getWorldPosition(new THREE.Vector3()).y,
    );
    this.container.dataset.movingScooter = "center";
    this.container.dataset.centerZ = String(this.main.group.position.z);
    this.container.dataset.leftZ = String(this.left.group.position.z);
    this.container.dataset.rightZ = String(this.right.group.position.z);
  }

  private frame(time: number) {
    const dt = this.lastTime
      ? Math.min((time - this.lastTime) / 1000, 0.05)
      : 0;
    this.lastTime = time;
    if (!this.visible || !this.state) return;
    if (this.running) {
      const previousZ = this.main.group.position.z;
      const previousY = this.main.group.position.y;
      const previousAngle = this.main.steering.rotation.y;
      const previousRotation = this.main.group.rotation.clone();
      this.elapsed = Math.min(this.elapsed + dt, 5);
      this.progress = this.elapsed / 5;
      const preparation = Math.min(this.elapsed / 0.8, 1);
      const eased = preparation * preparation * (3 - 2 * preparation);
      this.main.group.position.y =
        (this.state.stand === "center" ? 0.028 : 0.02) * (1 - eased);
      this.main.group.rotation.x =
        (this.state.stand === "center" ? -0.035 : 0) * (1 - eased);
      this.main.group.rotation.z =
        (this.state.stand === "side" ? -THREE.MathUtils.degToRad(12) : 0) *
        (1 - eased);
      this.main.steering.rotation.y =
        (this.state.turnMode === "mixed"
          ? 0
          : THREE.MathUtils.degToRad(this.state.angle)) *
        (1 - eased);
      const movement = Math.max(0, (this.elapsed - 0.8) / 4.2);
      this.main.group.position.z =
        -2.1 * movement * movement * (3 - 2 * movement);
      this.scene.updateMatrixWorld(true);
      const moving = this.bounds(this.main);
      this.obstructed =
        this.overlaps(moving, this.bounds(this.left)) ||
        this.overlaps(moving, this.bounds(this.right)) ||
        (this.state.blocked &&
          this.overlaps(moving, this.bounds(this.blocker)));
      if (this.obstructed) {
        this.main.group.position.z = previousZ;
        this.main.group.position.y = previousY;
        this.main.steering.rotation.y = previousAngle;
        this.main.group.rotation.copy(previousRotation);
        this.running = false;
      }
      this.main.wheels.forEach((w) =>
        w.rotateY((previousZ - this.main.group.position.z) / 0.24),
      );
      if (this.progress >= 1) this.running = false;
      this.updateReport(!this.running);
      this.needsRender = true;
    }
    this.controls.update();
    if (!this.needsRender) return;
    for (const label of this.labels) {
      const point = label.scooter.group
        .localToWorld(new THREE.Vector3(0, 1.5, -0.3))
        .project(this.camera);
      label.element.style.left = `${(point.x * 0.5 + 0.5) * this.container.clientWidth}px`;
      label.element.style.top = `${(-point.y * 0.5 + 0.5) * this.container.clientHeight}px`;
      label.element.hidden =
        point.z > 1 || Math.abs(point.x) > 0.95 || Math.abs(point.y) > 0.95;
    }
    this.renderer.render(this.scene, this.camera);
    this.needsRender = false;
  }
}
