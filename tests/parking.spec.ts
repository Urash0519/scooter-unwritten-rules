import { expect, test, type Page } from "@playwright/test";

async function openLab(page: Page) {
  await page.goto("/");
  await expect(page.locator("#viewport")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("#scene-fallback")).toBeHidden();
}
async function changeRange(page: Page, id: string, value: number) {
  await page.locator(id).evaluate((input, value) => {
    (input as HTMLInputElement).value = String(value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}

test("renders actual WebGL scooters without page errors, desktop and mobile", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await openLab(page);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "停得剛好",
  );
  await expect(page.locator("canvas")).toBeVisible();
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("button", { name: "立中柱 車身直立" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("stand, steering, spacing and reset alter the scene and estimated clearance", async ({
  page,
}) => {
  await openLab(page);
  const before = await page.locator("#viewport").getAttribute("data-clearance");
  await page.getByRole("button", { name: "立中柱 車身直立" }).click();
  await expect(
    page.getByRole("button", { name: "立中柱 車身直立" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#viewport")).not.toHaveAttribute(
    "data-clearance",
    before!,
  );
  await changeRange(page, "#steering", 45);
  await expect(page.locator("#steering-value")).toHaveText("45°");
  await changeRange(page, "#spacing", 110);
  await expect(page.locator("#spacing-value")).toHaveText("110 cm");
  const wide = Number(
    await page.locator("#viewport").getAttribute("data-clearance"),
  );
  await changeRange(page, "#spacing", 58);
  const tight = Number(
    await page.locator("#viewport").getAttribute("data-clearance"),
  );
  expect(wide).toBeGreaterThan(tight);
  await page.getByRole("button", { name: "重設目前情境" }).click();
  await expect(page.locator("#steering-value")).toHaveText("0°");
  await expect(page.locator("#spacing-value")).toHaveText("82 cm");
  await expect(
    page.getByRole("button", { name: "側柱 車身左傾" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.locator("#envelope").uncheck();
  await expect(page.locator("#envelope")).not.toBeChecked();
});

test("keyboard topic selection and camera controls work", async ({ page }) => {
  await openLab(page);
  await page.getByRole("tab", { name: "01 中柱與側柱" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "02 龍頭怎麼轉" }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#lesson-title")).toHaveText(
    "整排同方向，更好排在一起。",
  );
  await page.getByRole("button", { name: "俯視視角" }).click();
  await expect(page.getByRole("button", { name: "俯視視角" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.screenshot({ path: "test-results/top-view.png", fullPage: true });
  await page.getByRole("button", { name: "重設觀察視角" }).click();
  await expect(page.getByRole("button", { name: "斜側視角" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("tab", { name: "04 別擋住退路" }).click();
  await expect(page.locator("#blocked")).toBeVisible();
  await page.getByRole("tab", { name: "03 留一點間距" }).click();
  await expect(page.locator("#blocked")).toBeHidden();
});

test("play, pause, resume and finish an unobstructed exit", async ({
  page,
}) => {
  await openLab(page);
  await page.getByRole("button", { name: "立中柱 車身直立" }).click();
  await changeRange(page, "#spacing", 110);
  await page.getByRole("button", { name: "播放退車演示" }).click();
  await expect
    .poll(async () =>
      Number(await page.locator("#viewport").getAttribute("data-progress")),
    )
    .toBeGreaterThan(0.45);
  await page.getByRole("button", { name: "暫停演示" }).click();
  await page
    .locator("#lab")
    .screenshot({ path: "test-results/retreat-center.png" });
  const paused = await page.locator("#viewport").getAttribute("data-progress");
  await page.waitForTimeout(300);
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-progress",
    paused!,
  );
  await page.getByRole("button", { name: "繼續演示" }).click();
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-progress",
    "1.000",
  );
  await expect(page.locator("#animation-caption")).toContainText(
    "你的車已從兩台鄰車之間退出",
  );
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-center-z",
    "-2.1",
  );
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-left-z",
    "-0.1",
  );
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-right-z",
    "0.05",
  );
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-blocked",
    "false",
  );
});

test("blocked exit stops, removing the blocker makes the same path usable", async ({
  page,
}) => {
  await openLab(page);
  await page.getByRole("tab", { name: "04 別擋住退路" }).click();
  await page.getByRole("button", { name: "播放退車演示" }).click();
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-blocked",
    "true",
  );
  expect(
    Number(await page.locator("#viewport").getAttribute("data-progress")),
  ).toBeLessThan(1);
  await expect(page.locator("#animation-caption")).toContainText(
    "請先騰出空間",
  );
  await page.locator("#blocked").uncheck();
  await page.getByRole("button", { name: "播放退車演示" }).click();
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-progress",
    "1.000",
  );
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-blocked",
    "false",
  );
});

test("WebGL failure keeps educational content usable", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      ...args: Parameters<typeof original>
    ) {
      if (String(args[0]).startsWith("webgl")) return null;
      return original.apply(this, args);
    } as typeof original;
  });
  await page.goto("/");
  await expect(page.locator("#scene-fallback")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "播放退車演示" }),
  ).toBeDisabled();
  await page.getByRole("tab", { name: "02 龍頭怎麼轉" }).click();
  await expect(page.locator("#lesson-title")).toHaveText(
    "整排同方向，更好排在一起。",
  );
  await expect(
    page.getByRole("heading", { name: "除了停好，還有這些小默契。" }),
  ).toBeVisible();
  await context.close();
});

test("compares an aligned row against one straight handlebar at identical spacing", async ({
  page,
}) => {
  await openLab(page);
  await page.getByRole("tab", { name: "02 龍頭怎麼轉" }).click();
  await expect(
    page.getByRole("button", { name: "全部向左轉 三台方向一致" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#steering-value")).toHaveText("45°");
  const together = Number(
    await page.locator("#viewport").getAttribute("data-pitch-together"),
  );
  const mixed = Number(
    await page.locator("#viewport").getAttribute("data-pitch-mixed"),
  );
  expect(together).toBeLessThan(mixed);
  await expect(page.locator("#density-together")).toHaveText(`${together} cm`);
  await expect(page.locator("#density-mixed")).toHaveText(`${mixed} cm`);
  const before = await page.locator("#viewport").getAttribute("data-clearance");
  const spacing = await page.locator("#spacing").inputValue();
  await page.screenshot({
    path: "test-results/steering-together.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "中間一台不轉 鄰車仍向左轉" }).click();
  await expect(page.locator("#viewport")).not.toHaveAttribute(
    "data-clearance",
    before!,
  );
  await expect(page.locator("#spacing")).toHaveValue(spacing);
  await page.screenshot({
    path: "test-results/steering-mixed.png",
    fullPage: true,
  });
  await changeRange(page, "#steering", 0);
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-pitch-together",
    (await page
      .locator("#viewport")
      .getAttribute("data-pitch-mixed")) as string,
  );
});

test("wheels roll about a fixed axle, stay on the ground and follow travel / radius", async ({
  page,
}) => {
  await openLab(page);
  await page.getByRole("button", { name: "立中柱 車身直立" }).click();
  await changeRange(page, "#spacing", 110);
  await page.getByRole("button", { name: "播放退車演示" }).click();
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-progress",
    "1.000",
  );
  const axis = JSON.parse(
    (await page.locator("#viewport").getAttribute("data-wheel-axis")) as string,
  );
  const spoke = JSON.parse(
    (await page
      .locator("#viewport")
      .getAttribute("data-wheel-spoke")) as string,
  );
  const distance = Number(
    await page.locator("#viewport").getAttribute("data-wheel-travel"),
  );
  const centerY = Number(
    await page.locator("#viewport").getAttribute("data-wheel-center-y"),
  );
  expect(distance).toBeCloseTo(2.1, 5);
  expect(axis[0]).toBeCloseTo(-1, 5);
  expect(axis[1]).toBeCloseTo(0, 5);
  expect(axis[2]).toBeCloseTo(0, 5);
  expect(spoke[1]).toBeCloseTo(Math.cos(distance / 0.24), 5);
  expect(spoke[2]).toBeCloseTo(-Math.sin(distance / 0.24), 5);
  expect(centerY - 0.24).toBeCloseTo(0, 5);
});

test("the squeezed center scooter stops before passing through a neighbor", async ({
  page,
}) => {
  await openLab(page);
  await page.getByRole("button", { name: "立中柱 車身直立" }).click();
  await changeRange(page, "#spacing", 58);
  await page.getByRole("button", { name: "播放退車演示" }).click();
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-blocked",
    "true",
  );
  expect(
    Number(await page.locator("#viewport").getAttribute("data-center-z")),
  ).toBeGreaterThan(-0.2);
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-left-z",
    "-0.1",
  );
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-right-z",
    "0.05",
  );
  await expect(
    page.getByRole("button", { name: "重新播放演示" }),
  ).toBeVisible();
});
