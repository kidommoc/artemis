import { Container } from 'typedi'

import * as utils from '@/main/utils'
import { State, type StateFile } from '@/main/State'

const CONFIG_PATH = 'CONFIGURATION' // !!!!!
const key = utils.Crypto.getSymEncKey('artemis')

export function load() {
    const file = ((): object => {
        try {
            const raw = utils.FSIO.readRaw(CONFIG_PATH)
            const decrypted = utils.Crypto.symDecrypt(raw, 'state', key)
            return JSON.parse(decrypted.toString())
        } catch (error) {
            // handle error
            throw new Error('Invalid config file!')
        }
    })()

    const state = new State(file as StateFile)
    Container.set('State', state)
}

export function save() {
    const serialized = (Container.get('State') as State).serialize()
    const encrypted = utils.Crypto.symEncrypt(
        Buffer.from(serialized, 'utf-8'),
        'state', key
    )
    utils.FSIO.write(CONFIG_PATH, encrypted)
}