import "./style.css";
import { lessons, type LessonId, type ParkingState } from "./lessons";
import type { ParkingScene, SceneReport } from "./scene";

const icon = (name: string, size = 20) => {
  const paths: Record<string, string> = {
    play: '<path d="m9 5 10 7-10 7z"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    reset: '<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',
    view: '<path d="m12 3 9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.info}</svg>`;
};
document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <a class="skip-link" href="#lab">跳到停車實驗室</a>
  <header class="header shell">
    <a href="#" class="brand" aria-label="機車有眉角首頁"><span class="brand-mark">P<span>·</span></span><span>機車有眉角<span class="brand-en">SCOOTER ETIQUETTE</span></span></a>
    <nav aria-label="主要導覽"><a class="nav-active" href="#lab">停車實驗室</a><a href="#notes">騎士小默契</a><a href="#about">關於這裡</a></nav>
    <span class="header-tag">讓路，從停車開始。</span>
  </header>
  <main class="shell">
    <section class="intro" aria-labelledby="intro-title">
      <div><p class="eyebrow"><span class="tiny-line"></span>沒寫在考卷上的騎士默契</p><h1 id="intro-title">停得剛好，<span>大家都好走。</span><span class="title-dot">*</span></h1></div>
      <div class="intro-side"><p>你的機車，只占一個車位嗎？<br>換個角度，看看小動作如何影響隔壁。</p><span class="intro-label">互動 3D 演示 <span> / </span> 四個停車眉角</span></div>
    </section>
    <section id="lab" class="lab" aria-label="停車 3D 實驗室">
      <div class="lesson-tabs" role="tablist" aria-label="停車情境">
        ${lessons.map((l, i) => `<button id="tab-${l.id}" class="lesson-tab${i === 0 ? " selected" : ""}" role="tab" aria-selected="${i === 0}" aria-controls="lesson-panel" tabindex="${i === 0 ? 0 : -1}" data-lesson="${l.id}"><span>${l.number}</span>${l.short}<span class="tab-dot"></span></button>`).join("")}
      </div>
      <div class="lab-body">
        <div class="viewport-wrap">
          <div class="scene-top"><span class="scene-label">停車實驗室 <span> / LIVE 3D</span></span><span class="model-tag">簡化情境示意</span></div>
          <div id="viewport" aria-label="三台機車的互動 3D 停車演示"></div>
          <div id="scene-fallback" class="scene-fallback" hidden><strong>這個瀏覽器暫時無法顯示 3D</strong><p>請使用支援 WebGL 2 的瀏覽器並開啟硬體加速。你仍可閱讀下方停車小默契。</p><button id="retry-scene">重新載入</button></div>
          <div class="scene-toolbar" role="group" aria-label="3D 觀察角度"><button class="view-btn active" data-view="perspective" aria-pressed="true">${icon("view", 17)} 斜側視角</button><button class="view-btn" data-view="top" aria-pressed="false">俯視視角</button><button class="icon-btn" id="reset-camera" aria-label="重設觀察視角">${icon("reset", 18)}</button></div>
          <div class="scene-legend"><span><i class="legend-orange"></i>你的車</span><span><i class="legend-teal"></i>左側鄰車</span><span><i class="legend-gray"></i>其他車輛</span></div>
          <div class="scene-bottom"><span>${icon("view", 15)} 拖曳旋轉 · 滾輪／雙指縮放</span><label class="envelope-toggle"><input id="envelope" type="checkbox" checked />顯示占用範圍</label></div>
          <div class="demo-timeline"><span id="animation-caption" aria-live="polite">讓中間的橘色機車退出左右鄰車之間</span><div class="timeline-track" role="progressbar" aria-label="退車演示進度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div id="timeline-progress"></div></div><span id="animation-time">0.0 / 5.0 s</span></div>
        </div>
        <div id="lesson-panel" class="control-panel" role="tabpanel" aria-labelledby="tab-stand">
          <div class="panel-kicker"><span id="lesson-number">01</span><span>停車眉角</span></div>
          <h2 id="lesson-title"></h2><p id="lesson-description" class="panel-description"></p>
          <fieldset id="stand-control" class="control-field"><legend>支架方式</legend><div class="segmented"><button data-stand="center" aria-pressed="false">立中柱 <span>車身直立</span></button><button data-stand="side" aria-pressed="true">側柱 <span>車身左傾</span></button></div></fieldset>
          <fieldset id="alignment-control" class="control-field" hidden><legend>龍頭排列方式</legend><div class="segmented"><button data-turn="together" aria-pressed="true">全部向左轉<span>三台方向一致</span></button><button data-turn="mixed" aria-pressed="false">中間一台不轉<span>鄰車仍向左轉</span></button></div></fieldset>
          <div class="control-field"><div class="control-heading"><label for="steering">龍頭向左轉</label><output id="steering-value" for="steering">0°</output></div><input id="steering" type="range" min="0" max="45" value="0" step="1" /><div class="range-labels"><span>正前方</span><span>示意轉到底</span></div></div>
          <div class="control-field"><div class="control-heading"><label for="spacing">車身中心間距</label><output id="spacing-value" for="spacing">82 cm</output></div><input id="spacing" type="range" min="58" max="110" value="82" step="1" /><div class="range-labels"><span>緊密</span><span>寬鬆</span></div></div>
          <label id="blocker-control" class="blocker-control" hidden><input id="blocked" type="checkbox" />後方多一台橫停機車</label>
          <div class="clearance-box" id="clearance-box"><span class="clearance-heading">${icon("eye", 17)} 與左側鄰車的空間</span><strong id="clearance-value">計算中</strong><p id="clearance-description">根據模型的零件邊界估算</p></div>
          <div id="density-comparison" class="density-comparison" hidden aria-label="等距停車密度比較"><p>模型不重疊的中心間距</p><div><span>全部向左轉</span><strong id="density-together">—</strong></div><div><span>中間一台不轉</span><strong id="density-mixed">—</strong></div><p id="density-difference"></p></div>
          <div class="animation-actions"><button id="play-demo" class="primary-button">${icon("play", 19)} 播放退車演示</button><button id="reset-demo" class="reset-button" aria-label="重設目前情境">${icon("reset", 19)}</button></div>
          <p class="model-note">左右以騎士坐上車、面向龍頭為準。<br>模型邊界僅供比較，不是實車安全距離。</p>
        </div>
      </div>
      <div class="takeaway"><span class="takeaway-label">${icon("check", 18)} 這個眉角，記起來</span><p id="takeaway-text"></p></div>
    </section>
    <div class="context-note">${icon("info", 18)}<p id="lesson-tip"></p></div>
    <section id="notes" class="notes" aria-labelledby="notes-title">
      <div class="section-heading"><div><p class="eyebrow">多替下一位騎士想一步</p><h2 id="notes-title">除了停好，還有這些小默契。</h2></div><span class="section-count">04 NOTES</span></div>
      <div class="note-grid">
        <article class="note-card"><span class="note-number">01 / 空間</span><h3>線內停好，<br>也替把手留位。</h3><p>車輪在線內，不代表鏡子沒越界。停好後看看左右，把手、鏡子與車身都別互相卡住。</p></article>
        <article class="note-card"><span class="note-number">02 / 體貼</span><h3>排氣管很燙，<br>離別人遠一點。</h3><p>剛熄火的排氣管仍有餘熱。留意它與鄰車、行人腿部的距離，避免緊貼通行空間。</p></article>
        <article class="note-card"><span class="note-number">03 / 尊重</span><h3>別人的車，<br>先別擅自搬。</h3><p>想多擠一台時，先找其他車位。別硬拉鄰車後照鏡，也別為了自己的方便把別人的車移到路中央。</p></article>
        <article class="note-card"><span class="note-number">04 / 通行</span><h3>留給人走的路，<br>就讓它空著。</h3><p>停車位置先確認現場標線與規定。出入口、坡道與行人動線需要完整空間，不能只留一條縫。</p></article>
      </div>
    </section>
    <section id="about" class="about"><div><span class="about-symbol">*</span><h2>默契不是標準答案，<br>是多看一眼。</h2></div><div><p>這裡用簡化的 3D 情境，把平常不容易注意的停車空間攤開來看。支架、龍頭角度與間距，應一起判斷。</p><p>演示不是物理模擬，也不是交通法規。實際操作依車款說明書、現場標線、地面狀況與通行需求為準。</p><a href="https://www.yamaha-motor.com.tw/assets/images/motor/EMF/BKE-F8199-T1.pdf" target="_blank" rel="noopener noreferrer">參考：Yamaha EMF 原廠使用說明書（PDF）</a></div></section>
  </main>
  <footer class="footer shell"><span>機車有眉角 <span class="footer-slash">/</span> 好停，也好相處。</span><span>MADE FOR THE NEXT RIDER.</span></footer>
`;

const el = <T extends HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!;
let lesson = lessons[0];
let state: ParkingState = { ...lesson.defaults };
let scene: ParkingScene | undefined;
let playStatus: "idle" | "playing" | "paused" | "complete" = "idle";

function renderReport(report: SceneReport) {
  if (report.density) {
    el("#density-together").textContent = `${report.density.together} cm`;
    el("#density-mixed").textContent = `${report.density.mixed} cm`;
    const difference = report.density.mixed - report.density.together;
    const ratio = Math.round(
      (report.density.mixed / report.density.together - 1) * 100,
    );
    el("#density-difference").textContent =
      difference > 0
        ? `同樣排寬、整排等距：全部左轉約可排密 ${ratio}%。`
        : difference === 0
          ? "這個角度下，兩種排列的估算密度相同。"
          : "這個角度下，全部左轉未必更密；試著增加左轉角度。";
  }
  el("#clearance-value").textContent =
    report.clearance <= 0 ? "模型邊界重疊" : `約 ${report.clearance} cm`;
  el("#clearance-description").textContent =
    report.clearance <= 0
      ? "觀察把手、鏡子與左傾車身的位置。"
      : "同高度與前後範圍內，最近的橫向邊界。";
  el("#clearance-box").classList.toggle("warning", report.clearance < 5);
  el("#timeline-progress").style.width = `${report.progress * 100}%`;
  el(".timeline-track").setAttribute(
    "aria-valuenow",
    String(Math.round(report.progress * 100)),
  );
  el("#animation-time").textContent =
    `${(report.progress * 5).toFixed(1)} / 5.0 s`;
  if (report.blocked)
    el("#animation-caption").textContent = "退車路徑遇到模型邊界，請先騰出空間";
  else if (report.progress === 1)
    el("#animation-caption").textContent =
      "你的車已從兩台鄰車之間退出；留足扶正與握把空間";
  else
    el("#animation-caption").textContent =
      report.progress > 0
        ? report.progress < 0.16
          ? "先扶正、收支架與回正龍頭，讓輪胎接地"
          : "橘色機車退車中，留意左右兩邊是否互卡"
        : "讓中間的橘色機車退出左右鄰車之間";
  if (report.finished && playStatus === "playing") {
    playStatus = "complete";
    renderPlay();
  }
}
function renderPlay() {
  const text =
    playStatus === "playing"
      ? "暫停演示"
      : playStatus === "paused"
        ? "繼續演示"
        : playStatus === "complete"
          ? "重新播放演示"
          : "播放退車演示";
  el("#play-demo").innerHTML =
    `${icon(playStatus === "playing" ? "pause" : "play", 19)} ${text}`;
}
function applyState() {
  document
    .querySelectorAll<HTMLButtonElement>("[data-turn]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.turn === state.turnMode)),
    );
  document
    .querySelectorAll<HTMLButtonElement>("[data-stand]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.stand === state.stand)),
    );
  el<HTMLInputElement>("#steering").value = String(state.angle);
  el("#steering-value").textContent = `${state.angle}°`;
  el<HTMLInputElement>("#spacing").value = String(state.spacing);
  el("#spacing-value").textContent = `${state.spacing} cm`;
  el<HTMLInputElement>("#blocked").checked = state.blocked;
  el<HTMLInputElement>("#envelope").checked = state.envelope;
  playStatus = "idle";
  renderPlay();
  scene?.setState(state);
}
function selectLesson(id: LessonId) {
  lesson = lessons.find((l) => l.id === id)!;
  state = { ...lesson.defaults };
  document.querySelectorAll<HTMLButtonElement>("[data-lesson]").forEach((b) => {
    const selected = b.dataset.lesson === id;
    b.classList.toggle("selected", selected);
    b.setAttribute("aria-selected", String(selected));
    b.tabIndex = selected ? 0 : -1;
  });
  el("#lesson-panel").setAttribute("aria-labelledby", `tab-${id}`);
  el("#lesson-number").textContent = lesson.number;
  el("#lesson-title").textContent = lesson.title;
  el("#lesson-description").textContent = lesson.description;
  el("#takeaway-text").textContent = lesson.takeaway;
  el("#lesson-tip").textContent = lesson.tip;
  el("#blocker-control").hidden = id !== "exit";
  el("#stand-control").hidden = id === "steering";
  el("#alignment-control").hidden = id !== "steering";
  el("#density-comparison").hidden = id !== "steering";
  el<HTMLLabelElement>('label[for="steering"]').textContent =
    id === "steering" ? "整排左轉角度" : "龍頭向左轉";
  applyState();
  if (id === "steering") selectView("top");
}
document.querySelectorAll<HTMLButtonElement>("[data-turn]").forEach((b) =>
  b.addEventListener("click", () => {
    state.turnMode = b.dataset.turn as ParkingState["turnMode"];
    applyState();
  }),
);
document
  .querySelectorAll<HTMLButtonElement>("[data-lesson]")
  .forEach((b, i) => {
    b.addEventListener("click", () =>
      selectLesson(b.dataset.lesson as LessonId),
    );
    b.addEventListener("keydown", (e) => {
      let index = i;
      if (e.key === "ArrowRight") index = (i + 1) % lessons.length;
      else if (e.key === "ArrowLeft")
        index = (i + lessons.length - 1) % lessons.length;
      else if (e.key === "Home") index = 0;
      else if (e.key === "End") index = lessons.length - 1;
      else return;
      e.preventDefault();
      selectLesson(lessons[index].id);
      el<HTMLButtonElement>(`#tab-${lessons[index].id}`).focus();
    });
  });
document.querySelectorAll<HTMLButtonElement>("[data-stand]").forEach((b) =>
  b.addEventListener("click", () => {
    state.stand = b.dataset.stand as ParkingState["stand"];
    applyState();
  }),
);
el("#steering").addEventListener("input", (e) => {
  state.angle = Number((e.target as HTMLInputElement).value);
  applyState();
});
el("#spacing").addEventListener("input", (e) => {
  state.spacing = Number((e.target as HTMLInputElement).value);
  applyState();
});
el("#blocked").addEventListener("change", (e) => {
  state.blocked = (e.target as HTMLInputElement).checked;
  applyState();
});
el("#envelope").addEventListener("change", (e) => {
  state.envelope = (e.target as HTMLInputElement).checked;
  scene?.setEnvelope(state.envelope);
});
el("#reset-demo").addEventListener("click", () => {
  state = { ...lesson.defaults };
  applyState();
});
el("#play-demo").addEventListener("click", () => {
  if (!scene) return;
  if (playStatus === "playing") {
    scene.pause();
    playStatus = "paused";
  } else {
    scene.play(playStatus !== "paused");
    playStatus = "playing";
  }
  renderPlay();
});
function selectView(view: "perspective" | "top") {
  scene?.setView(view);
  document.querySelectorAll<HTMLButtonElement>("[data-view]").forEach((b) => {
    b.classList.toggle("active", b.dataset.view === view);
    b.setAttribute("aria-pressed", String(b.dataset.view === view));
  });
}
document
  .querySelectorAll<HTMLButtonElement>("[data-view]")
  .forEach((b) =>
    b.addEventListener("click", () =>
      selectView(b.dataset.view as "perspective" | "top"),
    ),
  );
el("#reset-camera").addEventListener("click", () => selectView("perspective"));
el("#retry-scene").addEventListener("click", () => location.reload());
selectLesson("stand");
function showFallback() {
  el("#scene-fallback").hidden = false;
  el("#viewport").hidden = true;
  el<HTMLButtonElement>("#play-demo").disabled = true;
  document
    .querySelectorAll<HTMLButtonElement>("[data-view], #reset-camera")
    .forEach((b) => (b.disabled = true));
  el("#clearance-value").textContent = "3D 暫時無法顯示";
  el("#clearance-description").textContent = "仍可切換情境閱讀說明與小默契。";
}
async function initializeScene() {
  try {
    const { ParkingScene } = await import("./scene");
    scene = new ParkingScene(el("#viewport"), renderReport, showFallback);
    scene.setState(state);
  } catch {
    showFallback();
  }
}
void initializeScene();
