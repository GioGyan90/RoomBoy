import type { createRoomEffects, RoomToggle } from "../assets/procedural/roomV4/effects";

const labels: Record<RoomToggle, string> = {
  night: "夜间",
  lamps: "灯光",
  monitor: "电脑",
  curtains: "窗帘",
};

export function createRoomTools(effects: ReturnType<typeof createRoomEffects>) {
  const element = document.createElement("div");
  element.id = "room-controls";
  element.setAttribute("role", "group");
  element.setAttribute("aria-label", "房间设置");
  const buttons = new Map<RoomToggle, HTMLButtonElement>();

  function sync() {
    for (const [id, button] of buttons) {
      button.setAttribute("aria-pressed", String(effects.state[id]));
    }
  }

  function toggle(id: RoomToggle) {
    effects.toggle(id);
    sync();
  }

  for (const [id, label] of Object.entries(labels) as [RoomToggle, string][]) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.roomControl = id;
    button.textContent = label;
    button.addEventListener("click", () => toggle(id));
    buttons.set(id, button);
    element.append(button);
  }
  sync();
  document.body.append(element);
  return { element, toggle };
}
