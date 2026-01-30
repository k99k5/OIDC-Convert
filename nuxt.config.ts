// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2026-01-01',
    devtools: {
        enabled: false,
    },

    // 运行时配置
    runtimeConfig: {
        // QQ 登录配置（服务端私有）
        qq: {
            appId: '',
            appKey: '',
            redirectUri: '',
        },
        // OAuth 服务配置
        oauth: {
            clientId: 'qq-connector',
            clientSecret: '',
            jwtSecret: '',
        },
        // 公开配置（可在客户端访问）
        public: {
            baseUrl: 'http://localhost:3000',
        },
    },

    vite: {
        server: {
            allowedHosts: true,
        },
    },
})
