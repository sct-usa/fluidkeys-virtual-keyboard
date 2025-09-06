import Keyboard from "simple-keyboard";
import { theme, colorMode } from "@/utils/storage";
import { storage } from "#imports";
import "simple-keyboard/build/css/index.css";
import "./style.css";
import "./themes/apple-light.css";
import "./themes/apple-dark.css";

export default defineContentScript({
  matches: ["<all_urls>"],
  async main() {
    /**
     * Watch for system color scheme changes
     */
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", async (e) => {
        if (e.matches) {
          // Apply dark mode styles or logic
          if ((await colorMode.getValue()) !== "auto") return;

          await updateTheme(await theme.getValue(), await getColorMode("dark"));
        } else {
          // Apply light mode styles or logic
          if ((await colorMode.getValue()) !== "auto") return;

          await updateTheme(
            await theme.getValue(),
            await getColorMode("light")
          );
        }
      });

    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
    const isDarkMode = prefersDarkScheme.matches; // true if dark mode is preferred, false otherwise

    async function getColorMode(type: string): Promise<string> {
      switch (type) {
        case "auto":
          return isDarkMode ? "dark" : "light";
        case "dark":
          return "dark";
        case "light":
          return "light";
        default:
          return isDarkMode ? "dark" : "light";
      }
    }

    const defaultTheme = `hg-theme-default ${await theme.getValue()}-${await getColorMode(
      await colorMode.getValue()
    )}`;

    const sctKeyboard = document.createElement("div");
    sctKeyboard.className = "fluidkeys";
    document.body.append(sctKeyboard);

    let selectedInput: string | null = null;

    let keyboard = new Keyboard(".fluidkeys", {
      theme: defaultTheme,
      onChange: (input) => onChange(input),
      onKeyPress: (button) => onKeyPress(button),
      display: {
        "{enter}": "enter",
        "{bksp}": "backspace",
        "{shift}": "shift",
        "{space}": " ",
        "{tab}": "tab",
        "{lock}": "caps lock",
        "{alt}": ".?123",
        "{default}": "ABC",
      },
    });

    /**
     * Watch for changes in color mode and update the keyboard theme accordingly
     */
    const unwatchColorMode = storage.watch<string>(
      "local:colorMode",
      async (newValue, oldValue) => {
        await updateTheme(
          await theme.getValue(),
          await getColorMode(newValue || "")
        );
      }
    );

    /**
     * Watch for changes in the theme and update the keyboard theme accordingly
     */
    const unwatchTheme = storage.watch<string>(
      "local:theme",
      async (newValue, oldValue) => {
        await updateTheme(
          newValue || "",
          await getColorMode(await colorMode.getValue())
        );
      }
    );

    const updateTheme = async (theme: string, colorMode: string) => {
      const visible = keyboard.options.theme?.includes("visible")
        ? "visible"
        : "";
      const newTheme =
        `hg-theme-default ${theme}-${colorMode} ${visible}`.trim();
      keyboard.setOptions({ theme: newTheme });
    };

    function onChange(input: string): void {
      if (!selectedInput) return;
      const inputElement = document.querySelector<
        HTMLInputElement | HTMLTextAreaElement
      >(selectedInput);
      if (inputElement) {
        inputElement.value = input;
        inputElement.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }

    function onKeyPress(button: string): void {
      if (button.includes("{") && button.includes("}")) {
        /**
         * Handle toggles
         */
        handleLayoutChange(button);
      } else {
        let currentLayout: string = keyboard.options.layoutName as string;
        /**
         * If the current layout is "shift", revert to "default" after a key press
         */
        if (currentLayout === "shift") {
          keyboard.setOptions({
            layoutName: "default",
          });
        }
      }
    }

    function handleLayoutChange(button: string): void {
      let currentLayout: string = keyboard.options.layoutName as string;
      let layoutName: string | undefined;

      switch (button) {
        case "{shift}":
          layoutName = currentLayout === "default" ? "shift" : "default";
          break;

        case "{lock}":
          layoutName = currentLayout === "default" ? "caps" : "default";
          break;

        case "{alt}":
          layoutName = currentLayout === "alt" ? "default" : "alt";
          break;

        case "{default}":
          layoutName = "default";
          break;

        default:
          break;
      }

      if (layoutName) {
        keyboard.setOptions({
          layoutName: layoutName,
        });
      }
    }

    // Event listener to show the keyboard when input fields are focused
    document.addEventListener("focusin", (event) => {
      if (
        (event.target as HTMLElement).tagName === "INPUT" ||
        (event.target as HTMLElement).tagName === "TEXTAREA"
      ) {
        showKeyboard();
      }
    });

    /**
     * Keyboard show toggle
     */
    document.addEventListener("click", (event) => {
      if (
        /**
         * Hide the keyboard when you're not clicking it or when clicking an input
         * If you have installed a "click outside" library, please use that instead.
         */
        sctKeyboard.classList.contains("visible") &&
        !(
          (event.target as HTMLElement).tagName === "INPUT" ||
          (event.target as HTMLElement).tagName === "TEXTAREA"
        ) &&
        !(event.target as HTMLElement).classList.contains("hg-button") &&
        !(event.target as HTMLElement).classList.contains("hg-row") &&
        !(event.target as HTMLElement).classList.contains("fluidkeys")
      ) {
        hideKeyboard();
      }
    });

    document.querySelectorAll("input").forEach((input) => {
      input.addEventListener("focus", onInputFocus);
      input.addEventListener("input", onInputChange);
    });

    document.querySelectorAll("textarea").forEach((input) => {
      input.addEventListener("focus", onInputFocus);
      input.addEventListener("input", onInputChange);
    });

    interface KeyboardOptions {
      inputName: string;
    }

    function onInputFocus(event: FocusEvent): void {
      const target = event.target as HTMLInputElement;

      if (!target.id && !target.name) return;

      selectedInput = getInputName(event) || null;

      const options: KeyboardOptions = {
        inputName: getInputName(event) || "",
      };

      keyboard.setOptions(options);

      switch (target.getAttribute("type")) {
        case "number":
        case "date":
          changeLayoutKeys("numeric");
          break;
        case "tel":
          changeLayoutKeys("telephone");
          break;
        case "email":
          changeLayoutKeys("email");
          break;
        case "url":
          changeLayoutKeys("url");
          break;
        default:
          changeLayoutKeys("default");
      }
    }

    function onInputChange(event: Event): void {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
      ) {
        keyboard.setInput(
          (target as HTMLInputElement | HTMLTextAreaElement).value,
          getInputName(event)
        );
      }
    }

    function getInputName(event: Event): string | undefined {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement;
      if (target.id) return `#${target.id}`;
      if (target.name) {
        if (target.tagName === "TEXTAREA") {
          return `textarea[name="${target.name}"]`;
        }
        return `input[name="${target.name}"]`;
      }
      return undefined;
    }

    function showKeyboard() {
      sctKeyboard.classList.add("visible");

      if (selectedInput) {
        const inputElement = document.querySelector<
          HTMLInputElement | HTMLTextAreaElement
        >(selectedInput);
        if (inputElement) {
          setTimeout(() => {
            inputElement.scrollIntoView({
              block: "center",
              behavior: "smooth",
            });
          }, 100);

          setTimeout(() => {
            const rect = inputElement.getBoundingClientRect();
            const keyboardRect = sctKeyboard.getBoundingClientRect();
            const overlap = rect.bottom > keyboardRect.top;
            if (overlap) {
              // Add bottom padding to body so input can scroll above keyboard
              const keyboardHeight = sctKeyboard.getBoundingClientRect().height;
              document.body.style.paddingBottom = `${keyboardHeight}px`;
              // Calculate how much to scroll so input is just above keyboard
              const scrollY =
                window.scrollY + (rect.bottom - keyboardRect.top) + 10;
              window.scrollTo({ top: scrollY, behavior: "smooth" });
            } else {
              document.body.style.paddingBottom = "";
            }
          }, 400);
        }
      }
    }

    function hideKeyboard() {
      sctKeyboard.classList.remove("visible");
      // Remove bottom padding
      document.body.style.paddingBottom = "";
    }

    async function changeLayoutKeys(layout: string) {
      switch (layout) {
        case "numeric":
          keyboard.setOptions({
            theme: `visible hg-theme-default ${await theme.getValue()}-${await getColorMode(
              await colorMode.getValue()
            )} numeric`,
            layout: {
              default: ["1 2 3", "4 5 6", "7 8 9", ". 0 {bksp}"],
            },
          });
          break;
        case "telephone":
          keyboard.setOptions({
            theme: `visible hg-theme-default ${await theme.getValue()}-${await getColorMode(
              await colorMode.getValue()
            )} telephone`,
            layout: {
              default: ["1 2 3", "4 5 6", "7 8 9", "* 0 #", "{bksp}"],
            },
          });
          break;
        case "email":
          keyboard.setOptions({
            theme: `visible hg-theme-default ${await theme.getValue()}-${await getColorMode(
              await colorMode.getValue()
            )}`,
            layout: {
              default: [
                "{tab} q w e r t y u i o p {bksp}",
                "{lock} a s d f g h j k l {enter}",
                "{shift} z x c v b n m @ . {shift}",
                "{alt} {space} {alt}",
              ],
              shift: [
                "{tab} Q W E R T Y U I O P {bksp}",
                "{lock} A S D F G H J K L {enter}",
                "{shift} Z X C V B N M @ . {shift}",
                "{alt} {space} {alt}",
              ],
              caps: [
                "{tab} Q W E R T Y U I O P {bksp}",
                "{lock} A S D F G H J K L {enter}",
                "{shift} Z X C V B N M @ . {shift}",
                "{alt} {space} {alt}",
              ],
              alt: [
                "1 2 3 4 5 6 7 8 9 0 {bksp}",
                `@ # $ & * ( ) ' " {enter}`,
                "{shift} % - + = / ; : ! ? {shift}",
                "{default} {space}",
              ],
            },
          });
          break;
        case "url":
          keyboard.setOptions({
            theme: `visible hg-theme-default ${await theme.getValue()}-${await getColorMode(
              await colorMode.getValue()
            )}`,
            layout: {
              default: [
                "{tab} q w e r t y u i o p {bksp}",
                "{lock} a s d f g h j k l {enter}",
                "{shift} z x c v b n m , . {shift}",
                "{alt} {space} : / {alt}",
              ],
              shift: [
                "{tab} Q W E R T Y U I O P {bksp}",
                "{lock} A S D F G H J K L {enter}",
                "{shift} Z X C V B N M ! ? {shift}",
                "{alt} {space} : / {alt}",
              ],
              caps: [
                "{tab} Q W E R T Y U I O P {bksp}",
                "{lock} A S D F G H J K L {enter}",
                "{shift} Z X C V B N M ! ? {shift}",
                "{alt} {space} : / {alt}",
              ],
              alt: [
                "1 2 3 4 5 6 7 8 9 0 {bksp}",
                `@ # $ & * ( ) ' " {enter}`,
                "% - + = / ; : ! ?",
                "{default} {space}",
              ],
            },
          });
          break;
        default:
          keyboard.setOptions({
            theme: `visible hg-theme-default ${await theme.getValue()}-${await getColorMode(
              await colorMode.getValue()
            )}`,
            layout: {
              default: [
                "{tab} q w e r t y u i o p {bksp}",
                "{lock} a s d f g h j k l {enter}",
                "{shift} z x c v b n m , . {shift}",
                "{alt} {space} {alt}",
              ],
              shift: [
                "{tab} Q W E R T Y U I O P {bksp}",
                "{lock} A S D F G H J K L {enter}",
                "{shift} Z X C V B N M ! ? {shift}",
                "{alt} {space} {alt}",
              ],
              caps: [
                "{tab} Q W E R T Y U I O P {bksp}",
                "{lock} A S D F G H J K L {enter}",
                "{shift} Z X C V B N M ! ? {shift}",
                "{alt} {space} {alt}",
              ],
              alt: [
                "1 2 3 4 5 6 7 8 9 0 {bksp}",
                `@ # $ & * ( ) ' " {enter}`,
                "% - + = / ; : ! ?",
                "{default} {space}",
              ],
            },
          });
          break;
      }
    }
  },
});
