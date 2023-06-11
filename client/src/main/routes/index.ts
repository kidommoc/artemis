import { dialog, ipcMain } from 'electron'
import { ipcRenderer } from 'electron'

import account from '@/routes/account'
import article from '@/routes/article'
import query from '@/routes/query'

import { AccountAPI } from '@/routes/account'
import { ArticleAPI  } from '@/routes/article'
import { QueryAPI  } from '@/routes/query'

const OPEN_FILE = 'dialog:OpenFile'
const temp = {
    account: { ...account },
    article: { ...article },
    query: { ...query },
}
for (const [ key, value ] of Object.entries(account)) {
    const keyStr = key as keyof typeof temp.account
    temp.account[keyStr] = (...args) => ipcRenderer.invoke(value.signal, ...args)
}
for (const [ key, value ] of Object.entries(article)) {
    const keyStr = key as keyof typeof temp.article
    temp.article[keyStr] = (...args) => ipcRenderer.invoke(value.signal, ...args)
}
for (const [ key, value ] of Object.entries(query)) {
    const keyStr = key as keyof typeof temp.query
    temp.query[keyStr] = (...args) => ipcRenderer.invoke(value.signal, ...args)
}
export const api: {
    account: AccountAPI,
    article: ArticleAPI,
    query: QueryAPI,
    openFile: () => Promise<any>,
} = {
    account: temp.account as unknown as AccountAPI,
    article: temp.article as unknown as ArticleAPI,
    query: temp.query as unknown as QueryAPI,
    openFile: () => ipcRenderer.invoke(OPEN_FILE)
}


export async function registerHandlers() {
    for (const [ , value ] of Object.entries(account))
        ipcMain.handle(value.signal, async (event, ...args) => {
            const result = await value.function(...args)
            console.log(`event: ${value.signal}, from: ${event.sender.id}\nresult:\n${JSON.stringify(result)}`)
            return result
        })
    for (const [ , value ] of Object.entries(article))
        ipcMain.handle(value.signal, async (event, ...args) => {
            const result = await value.function(...args)
            console.log(`event: ${value.signal}, from: ${event.sender.id}\nresult:\n${JSON.stringify(result)}`)
            return result
        })
    for (const [ , value ] of Object.entries(query))
        ipcMain.handle(value.signal, async (event, ...args) => {
            const result = await value.function(...args)
            console.log(`event: ${value.signal}, from: ${event.sender.id}\nresult:\n${JSON.stringify(result)}`)
            return result
        })
    ipcMain.handle(OPEN_FILE, async (): Promise<string | undefined> => {
        console.log(`event: ${OPEN_FILE}, result:`)
        const { canceled, filePaths } = await dialog.showOpenDialog({
            title: 'Select article ...',
            properties: [ 'openFile' ],
            filters: [
                { name: 'Markdown', extensions: ['md']},
            ],
        })
        if (canceled)
            return undefined
        else
            return filePaths[0]
    })
}