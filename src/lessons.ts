export type LessonId = "stand" | "steering" | "spacing" | "exit";
export type Stand = "center" | "side";
export interface ParkingState {
  stand: Stand;
  angle: number;
  spacing: number;
  blocked: boolean;
  envelope: boolean;
  turnMode: "individual" | "together" | "mixed";
}
export interface Lesson {
  id: LessonId;
  number: string;
  short: string;
  title: string;
  description: string;
  takeaway: string;
  tip: string;
  defaults: ParkingState;
}
const defaults: ParkingState = {
  stand: "center",
  angle: 0,
  spacing: 82,
  blocked: false,
  envelope: true,
  turnMode: "individual",
};
export const lessons: Lesson[] = [
  {
    id: "stand",
    number: "01",
    short: "中柱與側柱",
    title: "車身一歪，空間也跟著偏。",
    description:
      "切換支架，觀察橘色機車往左傾時，後照鏡與車身如何靠近隔壁的車。",
    takeaway:
      "密集車位先看左右空間；能安全架設中柱時，直立車身通常更容易對齊。",
    tip: "中柱不是每次都適用。先確認車款、地面穩定度與自己的操作能力，再選擇支架。",
    defaults: { ...defaults, stand: "side" },
  },
  {
    id: "steering",
    number: "02",
    short: "龍頭怎麼轉",
    title: "整排同方向，更好排在一起。",
    description:
      "比較全部向左轉，和中間一台保持正前方。相同間距下，看看鏡子與把手怎麼互卡，再比較整排等距停放的密度。",
    takeaway:
      "同方向停放能讓這組模型的把手與鏡子更整齊；留足牽車空間，再依車款需求上鎖。",
    tip: "密度比較採相同車款、前後位置與等距排列，只估算零件邊界，不含握把與扶正空間。轉向鎖依原廠說明書；示意 45° 並非所有車款的極限。",
    defaults: { ...defaults, spacing: 64, angle: 45, turnMode: "together" },
  },
  {
    id: "spacing",
    number: "03",
    short: "留一點間距",
    title: "停得進去，也要出得來。",
    description:
      "把三台車拉近，再讓中間的橘色機車退出兩台鄰車之間。車身有空隙，後照鏡卻可能比你想像中更靠近。",
    takeaway: "留出能握把手、扶正與牽車的餘裕，別把「還塞得下」當成唯一標準。",
    tip: "畫面數字是這組簡化模型的估算。車款尺寸、停放前後位置與騎士操作都會改變實際所需空間。",
    defaults: { ...defaults, stand: "side", spacing: 64 },
  },
  {
    id: "exit",
    number: "04",
    short: "別擋住退路",
    title: "多停一台，可能擋住三台。",
    description:
      "切換後方車輛，再播放退車。從俯視角看，原本的進出路徑會如何被橫停的機車截斷。",
    takeaway:
      "進出動線、坡道與出入口要留空。離開前，多看一眼隔壁能不能把車牽出來。",
    tip: "演示的是固定方向的直線退車；現場還要考量行人、輪椅通行與其他車輛的動線。",
    defaults: { ...defaults, spacing: 88, blocked: true },
  },
];
