#!/usr/bin/env node

import config from './config.js'
import { UWMedicineBot } from './bot/uw'
import { what, elapsed, readSecrets, asyncForEach } from './util'

// TODO:  Add mode for allowing users to enter provider and creds at runtime.

const run = async () => {
    const message = (msg) => console.log(new Date(), '|', msg)
    await asyncForEach(await readSecrets(config.secretFile), async (secret) => {
        message(`[${secret.provider}] patient found in ~/.secrets folder.`)
        switch (secret.provider) {
            case 'uw':
                await (new UWMedicineBot(config, secret, message)).go()
                break
            default:
                message('Healthcare provider not found.')
                what()
        }
    })
    message('Fin.')
}

run().catch(e => console.log(e.message))
