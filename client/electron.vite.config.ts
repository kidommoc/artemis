import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
    main: {
        build: {
            outDir: 'dist/main'
        },
        resolve: {
            alias: {
                '@': resolve('src\\main')
            }
        },
        plugins: [externalizeDepsPlugin()]
    },
    preload: {
        build: {
            outDir: 'dist/preload'
        },
        resolve: {
            alias: {
                '@': resolve('src\\main')
            }
        },
        plugins: [externalizeDepsPlugin()]
    },
    renderer: {
        build: {
            outDir: 'dist/renderer'
        },
        resolve: {
            alias: {
                '@renderer': resolve('src/renderer/src')
            }
        },
        plugins: [vue()]
    }
})
