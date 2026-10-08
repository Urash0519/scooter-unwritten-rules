# 機車有眉角 · scooter-unwritten-rules

用互動 3D 情境，讓騎士看懂停車的小動作如何影響隔壁。網站為繁體中文、純前端的靜態網站，無後端、資料庫、登入或付費 API。

**公開網站：[機車有眉角](https://urash0519.github.io/scooter-unwritten-rules/)**

## GitHub Pages 自動部署

公開網站由 `.github/workflows/pages.yml` 部署。每次推送 `main`，GitHub Actions 會在 Docker Node.js 24 容器內執行 `npm ci`、TypeScript 檢查與 Vite 建置，再將 `dist/` 發布到 GitHub Pages。也可從倉庫 Actions 頁面的 **Deploy GitHub Pages → Run workflow** 手動重新部署。

Pages 的建置來源需設為 **GitHub Actions**。Vite 使用相對資源路徑，因此 JavaScript、樣式、網站圖示與 3D 動態載入皆支援 `/scooter-unwritten-rules/` 子路徑。網站更新後可在 [Actions 部署紀錄](https://github.com/Urash0519/scooter-unwritten-rules/actions/workflows/pages.yml) 查看成功狀態與對應提交。

## 已實作

- **中柱與側柱**：切換直立／向左傾斜的車身，觀察占用空間及鄰車退車。
- **龍頭排列與停車密度**：比較「三台全部向左轉」與「中間一台不轉、鄰車仍左轉」，保持相同中心間距，並列出兩種整排等距排列的模型間距與相對密度。可調整整排示意左轉角度 0–45°。
- **停車間距**：調整兩車中心間距 58–110 cm，比較零件間的橫向空隙。
- **進出動線**：加入／移除後方橫停車輛，觀察直線退車路徑受阻的情境。
- 5 秒退車演示，支援播放、暫停、繼續、重播及重設情境。遇到模型零件邊界重疊即暫停。
- **中間橘色機車退車，左右鄰車保持原位**。先扶正車身、回正龍頭、收支架並讓輪胎接地，再往後退出；碰撞檢查涵蓋左右鄰車與後方車輛。
- 車輪沿固定輪軸滾動，輪胎、輪圈與輪輻一起旋轉，角位移依實際退車距離／0.24 公尺輪胎半徑計算。
- 拖曳旋轉、滾輪／雙指縮放、俯視／斜側視角、占用範圍開關。
- 四則延伸停車小默契：鏡子與把手留位、排氣管餘熱、尊重他人車輛、保留通行空間。
- 桌面／平板／手機版、鍵盤操作情境分頁、原生範圍滑桿，以及 WebGL 無法使用時的閱讀備援。

## 技術與環境

| 項目                  | 使用方式                                          |
| --------------------- | ------------------------------------------------- |
| HTML、CSS、TypeScript | 網頁與互動控制；不使用前端框架                    |
| Three.js              | WebGL 2、程序生成的機車模型、光影與 OrbitControls |
| Vite                  | 開發伺服器、TypeScript 編譯後的靜態建置           |
| Playwright／Chromium  | 實際瀏覽器驗證與畫面截圖                          |
| Docker Compose        | 所有依賴安裝、開發、建置及測試都在容器內執行      |
| Nginx                 | 正式版本的靜態檔案伺服器，沒有應用程式後端        |

依賴版本由 `package.json` 與 `package-lock.json` 鎖定。開發／建置容器使用 Node.js 24；本機只需 Git 與支援 Linux 容器的 Docker Desktop，不需安裝 Node.js、npm 或瀏覽器測試環境。

## 啟動開發版

在本專案根目錄執行：

```powershell
docker compose up -d dev
```

開啟 **http://localhost:5183**。容器啟動時會執行 `npm ci`，再啟動 Vite；修改原始碼會自動更新。5183 綁定本機位址，容器內埠為 5173。

```powershell
# 查看啟動及開發訊息
docker compose logs -f dev

# 停止本專案的容器（保留依賴快取 volume）
docker compose down
```

若埠被占用，可修改 `compose.yaml` 中左側主機埠，例如 `127.0.0.1:5184:5173`；不要改測試使用的容器內埠。

## 建置靜態檔案

```powershell
docker compose run --rm --no-deps dev sh -c "npm ci && npm run build"
```

此命令先執行 TypeScript 型別檢查，再輸出 `dist/`。`dist/` 可部署到一般靜態託管服務；Vite 使用相對資源路徑，也可放在子目錄。不需要 Node.js 伺服器。

3D 引擎採動態載入，文字與控制項先呈現。Three.js 的壓縮前大小會觸發 Vite 預設的 500 kB 區塊提示，屬於已知的 3D 引擎體積；不影響建置。3D 場景靜止時不重繪，離開視窗或捲出可視範圍時暫停更新，限制像素密度以降低裝置負擔。

## 啟動正式版（Docker）

```powershell
docker compose --profile production up -d --build production
```

開啟 **http://localhost:8083**。多階段 Dockerfile 在 Node.js 容器編譯，再由 Nginx 提供編譯完成的檔案。正式映像內沒有原始碼、Node.js 開發環境或 `node_modules`。

## 瀏覽器測試

```powershell
docker compose up -d dev
docker compose --profile test run --build --rm test
```

首次建置測試映像需要下載 Chromium 及其 Linux 依賴；這些只安裝在 Docker 內。測試使用軟體 WebGL，因此不需要 Docker GPU 透傳。

測試覆蓋桌面／390 px 手機畫面、無橫向溢出、3D 載入、支架／角度／間距變化、情境重設、鍵盤分頁、視角切換、播放／暫停／繼續、中間車退出與鄰車不動、阻擋與解除、龍頭排列密度比較、實際輪軸方向／接地／滾動角位移，以及 WebGL 失敗備援。截圖與失敗紀錄在忽略版控的 `test-results/`，包含 `desktop.png`、`mobile.png`、`top-view.png`、`steering-together.png` 與 `steering-mixed.png`。

正式版驗證可在啟動 `production` 服務後執行：

```powershell
docker compose --profile test run --build --rm -e BASE_URL=http://production test
```

## 原始碼位置

```text
src/
  main.ts          網頁、情境切換、控制項與播放狀態
  lessons.ts       四個情境的繁體中文內容與預設條件
  scene.ts         機車模型、3D 場景、退車動畫與邊界估算
  style.css        視覺樣式與響應式版面
tests/
  parking.spec.ts  互動流程與瀏覽器測試
public/
  favicon.svg      網站圖示
```

新增教學情境可從 `src/lessons.ts` 開始。模型尺寸、支架傾角、龍頭轉向與退車路徑在 `src/scene.ts`；教學文字應與模型實際行為保持一致。

## 演示的解讀與限制

- 三台車使用同一套原創簡化模型，並非任何特定車款的精準數位模型。1 個場景單位按 1 公尺解讀，數字只適合比較本模型的情境。
- 側柱左傾 12°、示意左轉極限 45° 都是展示設定，不是所有機車的規格。
- **左右以騎士坐上車、面向龍頭為準**。模型面向 +Z，因此 +X 為騎士左側；側柱、車身傾斜、龍頭左轉與「左側鄰車」皆使用同一方向定義。
- 「車身中心間距」是兩車中心的距離，**不是**兩車之間的淨空。
- 空間估算使用各零件的世界座標軸對齊包圍盒。僅比較高度與前後範圍有交集的零件；這是保守的邊界示意，不是精確碰撞或剛體物理模擬。
- 退車演示固定讓中間橘色機車往後退出；起始 0.8 秒為扶正、回正龍頭與支架收起的簡化演示，接著 4.2 秒直線移動。車輪在開始移動前接地，退車時按實際移動距離滾動。沒有騎士身體、左右迴轉、支架機構運動或真實路面摩擦／動力學。零件包圍盒重疊會暫停；不以「能完成動畫」認定現場安全。
- 車輛已離開比較範圍時，橫向空間數字回到停妥狀態的估算，方便持續比較設定。
- 龍頭密度比較在相同模型、支架、前後偏移與角度設定下，估算左右兩邊零件都不重疊的最小中心間距，並多留 1 cm 避免邊界接觸。相對密度按兩種間距的反比計算，前提是整排維持等距；不代表只要有一台沒轉，整個停車場必然少停相同比例。
- 「停妥時排得密」不表示「轉正龍頭與退車時也有足夠空間」；退車動畫另外檢查途中與左右鄰車是否重疊。
- 中柱與龍頭角度沒有一套適用所有現場的答案。操作依車款使用說明書、穩定地面、現場標線與通行需求判斷。
- 網站不取代交通法規或實車操作訓練。

## 資料與素材

- 轉向鎖操作參考：[Yamaha EMF 原廠使用說明書](https://www.yamaha-motor.com.tw/assets/images/motor/EMF/BKE-F8199-T1.pdf)。這是特定車款的參考，不能推論為所有機車的轉向／停車規則。
- 技術參考：[Three.js OrbitControls](https://threejs.org/docs/pages/OrbitControls.html)、[Vite 靜態建置](https://vite.dev/guide/build)。
- 機車幾何、標線、動畫、介面圖示為專案內生成，沒有外部 3D 模型下載需求。
- 字體為 Google Fonts 的 Noto Sans TC；字體載入需網路，失敗時退回本機 sans-serif。無分析追蹤、Cookie、帳號或使用者資料收集。

## Git 維護

### 最近驗證

2026-10-08：Docker 內的 TypeScript 型別檢查與 Vite 正式建置通過；對 Nginx 靜態正式版執行 **9 組 Playwright Chromium 測試，全部通過**（44.3 秒）。另確認 Docker 開發服務的就緒檢查正常、桌面與手機截圖無橫向溢出。

退車過程截圖：`test-results/retreat-center.png`。瀏覽器測試採 Linux Chromium 軟體 WebGL；尚未實機驗證 Safari／iOS 或各款手機 GPU。

更新功能時同步維護內容、預設情境、模型限制與 README；提交前執行建置及瀏覽器測試。

```powershell
git add .
git commit -m "Describe the change"
git push origin main
```

公開倉庫：[Urash0519/scooter-unwritten-rules](https://github.com/Urash0519/scooter-unwritten-rules)。公開網站：[GitHub Pages](https://urash0519.github.io/scooter-unwritten-rules/)，另保留本機 Docker 開發與正式版預覽。
