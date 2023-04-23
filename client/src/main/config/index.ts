import { Container } from 'typedi'
import * as fs from 'node:fs'

import { State } from '@/main/utils/State'

const CONFIG_PATH = '' // !!!!!

export default () => {
    const file = ((): object => {
        try {
            return JSON.parse(fs.readFileSync(CONFIG_PATH).toString('utf-8'))
        } catch (error) {
            // handle error
        }
        return {}
    })()

    try {
        let state = new State(file)
        Container.set('State', state)
    } catch (error) {
        // handle error
    }
}