import { ElectronAPI } from '@electron-toolkit/preload'
import {
    AccountAPI,
    ArticleAPI,
    QueryAPI
} from '@/main/routes'

declare global {
    interface Window {
        electron: ElectronAPI
        api: {
            account: AccountAPI,
            article: ArticleAPI,
            query: QueryAPI,
            openFile: () => Promise<string | undefined>,
        }
    }
}