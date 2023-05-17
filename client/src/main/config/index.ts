import { Container } from 'typedi'

import * as utils from '@/utils'
import { State } from '@/State'
import type { AccountInfo, StateFile } from '@/State'

const CONFIG_PATH = 'ACCOUNTS' // !!!!!
const key = utils.Crypto.getSymEncKey('artemis')

export function load() {
    const file: StateFile = {
        EthereumUrl: import.meta.env.MAIN_VITE_ETHEREUM_URL,
        ContractArtemis: import.meta.env.MAIN_VITE_CONTRACT_ARTEMIS,
        ContractMessage: import.meta.env.MAIN_VITE_CONTRACT_MESSAGE,
        GraphQLUrl: import.meta.env.MAIN_VITE_GRAPHQL_URL,
        Accounts: [],
    }
    if (import.meta.env.DEV)
        console.log('starting app in development mode...')
    else if (import.meta.env.PROD) {
        try {
            const raw = utils.FSIO.readRaw(CONFIG_PATH)
            const decrypted = JSON.parse(
                utils.Crypto.symDecrypt(raw, 'state', key).toString('utf-8')
            )
            file.Accounts = decrypted.Accounts as AccountInfo[]
            file.LoginAccountAddress = decrypted.LoginAccountAddress
        } catch (error) {
            // handle error
            throw new Error('Invalid config file!')
        }
    }

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