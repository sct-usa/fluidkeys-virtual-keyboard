import { storage } from "#imports";

export async function setupColorMode(element: HTMLSelectElement) {
  const storedColorMode = (await storage.getItem("local:colorMode")) as string;
  if (storedColorMode) {
    element.value = storedColorMode;
  }
  let colorMode = element.value;
  const setColorMode = async (newColorMode: string) => {
    colorMode = newColorMode;
    await storage.setItem("local:colorMode", colorMode);
  };
  element.addEventListener("change", (event) => {
    const target = event.target as HTMLSelectElement | null;
    if (target) {
      setColorMode(target.value);
    }
  });
  setColorMode(colorMode);
}
