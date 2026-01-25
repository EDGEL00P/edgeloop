import tailwindPostcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'

/** @type {import('postcss-load-config').Config} */
export default {
  plugins: [
    tailwindPostcss({ config: './tailwind.config.ts' }),
    autoprefixer(),
  ],
}
