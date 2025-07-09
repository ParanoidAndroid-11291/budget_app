import { type Config } from "tailwindcss";

export default {
  content: [
    "{routes,islands,components}/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        purp: "#AF05FF",
        minty: "#00FFAB",
        carbon: "#1E1E1E",
        notWhite: "#EFEFEF",
        stormy: "#666666",
        chalkboard: "#333333",
        foggy: "#E0E0E0",
        danger: "#FF1E0A",
        warning: "#FF9F05",
        success: "#42CF00",
        pinky: "#D67EFF",
        pea: "#7ECCB2"
      }
    }
  }
} satisfies Config;
