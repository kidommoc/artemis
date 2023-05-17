import { reactive } from 'vue'
import { defineStore } from 'pinia'

export interface Updates {
    content: {
        from: Date,
        to: Date,
        infos: ArticleInfo[],
    }[],
}

export const useUpdatesStore = defineStore('updates', () => {
    const updates: Map<string, Updates> = reactive(new Map<string, Updates>())

    function update(address: string, from: Date, to: Date, infos: ArticleInfo[]) {
        let u = updates.get(address)
        if (!u) {
            updates.set(address, { content: [] })
            u = updates.get(address)
        }
        if (u) {
            u.content.push({
                from: from,
                to: to,
                infos: infos,
            })
        }
    }

    function addAccount(address: string) {
        updates.set(address, { content: [] })
    }

    return {
        data: updates,
        update: update,
        addAccount: addAccount,
    }
})