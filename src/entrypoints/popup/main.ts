import "./style.css";
import { setupTheme } from "@/components/theme";
import { setupColorMode } from "@/components/color-mode";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="title-container">
    <img src="./icon/128.png" alt="FluidKeys Logo" width="64" height="64"/>
    <div class="title">FluidKeys</div>
  </div>
  <div class="settings-container">
    <div class="setting-title">Keyboard Theme:</div>
    <select id="theme-select">
      <option value="apple" selected>Apple (Default)</option>
    </select>
    <div class="setting-title">Color Mode:</div>
    <select id="color-mode">
      <option value="auto" selected>Auto</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </div>
`;

setupTheme(document.querySelector<HTMLSelectElement>("#theme-select")!);
setupColorMode(document.querySelector<HTMLSelectElement>("#color-mode")!);
