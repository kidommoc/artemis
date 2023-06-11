export const mainColor = 'cadetblue'
export const subColor = '#91cbcb'
export const dangerColor = '#e35242'
export const paths = {
    home: '/app/home',
    search: '/app/search',
    followings: '/app/followings',
    favourites: '/app/favourites',
    upload: '/app/upload',
    myArticles: '/app/me',
    settings: '/app/settings',
    article: (ipfsAddress) => `/app/article/${ipfsAddress}`,
    publisher: (address) => `/app/publisher/${address}`,
    login: '/login',
    addAccount: '/add-account',
}