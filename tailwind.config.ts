
import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                // Custom semantic colors
                alert: "#EF4444", // Red-500
                safe: "#10B981", // Green-500
                warning: "#F59E0B", // Amber-500
                ice: "#0ea5e9", // Sky-500 (Agency blue)
            },
        },
    },
    plugins: [],
};
export default config;
