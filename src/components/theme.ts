import { theme } from "@/utils/storage";

export async function setupTheme(element: HTMLSelectElement) {
  const storedTheme = (await theme.getValue()) as string;
  if (storedTheme) {
    element.value = storedTheme;
  } else {
    element.value = "auto";
  }
  let currentTheme = element.value;
  const setTheme = async (newTheme: string) => {
    currentTheme = newTheme;
    await theme.setValue(currentTheme);
  };
  element.addEventListener("change", (event) => {
    const target = event.target as HTMLSelectElement | null;
    if (target) {
      setTheme(target.value);
    }
  });
  setTheme(currentTheme);
}
