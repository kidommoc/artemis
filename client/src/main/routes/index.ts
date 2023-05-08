import { dialog, ipcRenderer } from 'electron'

import account from '@/main/routes/account'
import article from '@/main/routes/article'
import query from '@/main/routes/query'

export type { AccountAPI } from '@/main/routes/account'
export type { ArticleAPI } from '@/main/routes/article'
export type { QueryAPI } from '@/main/routes/query'

const a = {
    account: account,
    article: article,
    query: query,
    openFile: () => ipcRenderer.invoke('dialog:OpenFile')
}
for (const [ key, value ] of Object.entries(account)) {
    const keyStr = key as keyof typeof a.account
    a.account[keyStr] = (...args) => ipcRenderer.invoke(value.signal, args)
}
for (const [ key, value ] of Object.entries(article)) {
    const keyStr = key as keyof typeof a.article
    a.article[keyStr] = (...args) => ipcRenderer.invoke(value.signal, args)
}
for (const [ key, value ] of Object.entries(query)) {
    const keyStr = key as keyof typeof a.query
    a.query[keyStr] = (...args) => ipcRenderer.invoke(value.signal, args)
}
export const api = a

const h: Map<string, any> = new Map<string, any>()
for (const [ , value ] of Object.entries(account))
    h[value.signal] = value.function
for (const [ , value ] of Object.entries(article))
    h[value.signal] = value.function
for (const [ , value ] of Object.entries(query))
    h[value.signal] = value.function
h['dialog:OpenFile'] = async function (): Promise<string | undefined> {
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
}
export const handles = h