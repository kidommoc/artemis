import { ref } from 'vue'
import type { Ref } from 'vue'
import { defineStore } from 'pinia'

export const useAccountStore = defineStore('account', () => {
    const account: Ref<{
        address: string,
        name?: string,
        balance: number,
        isPublisher: boolean,
        price?: number,
        followings: PublisherInfo[],
    }> = ref({
        address: '',
        balance: 0,
        isPublisher: false,
        followings: []
    })

    async function update() {
        const address = await window.api.account.getAccountAddress()
        if (!address)
            throw new Error('Not logined!')
        account.value.address = address
        account.value.name = await window.api.account.getName()
        account.value.balance = await window.api.account.getAccountBalance()
        account.value.isPublisher = await window.api.account.isPublisher()
        if (account.value.isPublisher)
            account.value.price = await window.api.query.getSubscribingPrice(address)
        account.value.followings = await window.api.account.getFollowingList()
    }

    return {
        data: account,
        update: update,
    }
})