import { paths } from '@renderer/keys'

export const useLogin = (router, account, updates) => (async (address: string) => {
    await window.api.account.login(address)
    await account.update()
    await updates.addAccount(address)
    router.push(paths.home)
})