import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
    { path: '/', redirect: '/app/home' },
    {
        path: '/app',
        component: () => import('@renderer/App.vue'),
        children: [
            { path: 'home', component: () => import('@renderer/Home.vue') },
            { path: 'search', component: () => import('@renderer/Search.vue') },
            { path: 'followings', component: () => import('@renderer/Followings.vue') },
            { path: 'favourites', component: () => import('@renderer/Favourites.vue') },
            { path: 'upload', component: () => import('@renderer/UploadArticle.vue') },
            { path: 'me', component: () => import('@renderer/MyArticles.vue') },
            { path: 'settings', component: () => import('@renderer/Settings.vue') },
            { path: 'article/:addr', component: () => import('@renderer/Article.vue') },
            { path: 'publisher/:addr', component: () => import('@renderer/Publisher.vue') },
        ]
    },
    { path: '/login', component: () => import('@renderer/Login.vue') },
    { path: '/add-account', component: () => import('@renderer/AddAccount.vue') },
]

const r = createRouter({
    history: createWebHashHistory(),
    routes: routes,
})

r.beforeEach(async (to, from) => {
    const address = await window.api.account.getAccountAddress()
    if (!address && (
        to.path != '/login' && to.path != '/add-account'
    ))
        return '/login'
    return true
})

export const router = r