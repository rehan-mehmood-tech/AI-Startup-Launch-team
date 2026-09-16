// Tailwind v4 uses its own PostCSS plugin (and handles vendor prefixing
// internally, so autoprefixer is no longer needed).
export default {
  plugins: { "@tailwindcss/postcss": {} },
};
