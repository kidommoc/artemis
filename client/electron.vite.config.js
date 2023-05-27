import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
    main: {
        build: {
            outDir: 'out/main',
        },
        resolve: {
            alias: {
                '@': resolve('src\\main')
            }
        },
        plugins: [
            externalizeDepsPlugin(),
        ]
    },
    preload: {
        build: {
            outDir: 'out/preload',
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
            outDir: 'out/renderer',
        },
        resolve: {
            alias: {
                '@renderer': resolve('src/renderer/src')
            }
        },
        plugins: [vue()]
    }
})
