export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A0C10",
        panel: "#14171F",
        panel2: "#1B1F29",
        paper: "#EEEBE3",
        haze: "#E9E9E7",
        muted: "#8A8E99",
        signal: "#29ABE2",
        signaldim: "#1B7FAD",
        signalbright: "#6FD0F5",
        graphite: "#6B6E75",
        pending: "#F5A524",
        transit: "#7C5CFC",
        delivered: "#22C55E",
        canceled: "#EF4444"
      },
      fontFamily: {
        display: ["'Bebas Neue'", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"]
      }
    }
  },
  plugins: []
};
