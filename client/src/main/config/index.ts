import { Container } from 'typedi'

import * as utils from '@/main/utils'
import { State } from '@/main/State'

const CONFIG_PATH = '' // !!!!!

export default () => {
    const file = ((): object => {
        try {
            return JSON.parse(utils.FSIO.read(CONFIG_PATH))
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