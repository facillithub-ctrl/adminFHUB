import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Adicione suas cores de admin aqui
      colors: {
        admin: {
          primary: '#FF5733', // Ex: Laranja
          secondary: '#335BFF', // Ex: Azul
        }
      }
    },
  },
  plugins: [],
};
export default config;