import { storage } from "#imports"; // Import explicitly if needed

// Define a string setting with a fallback default value
export const colorMode = storage.defineItem<string>("local:colorMode", {
  fallback: "auto", // Default to 'auto' if the item doesn't exist
});

// Define a string setting with a fallback default value
export const theme = storage.defineItem<string>("local:theme", {
  fallback: "apple", // Default to 'apple' if the item doesn't exist
});
