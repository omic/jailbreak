#!/usr/bin/env node

import config from './config.js'
import { UWMedicineBot } from './bot/uw'
import { what, elapsed, readSecrets, asyncForEach } from './util'

// TODO:  Add mode for allowing users to enter provider and creds at runtime.

const run = async () => {
    const message = (msg) => console.log(new Date(), '|', msg)
    await asyncForEach(await readSecrets(config.secretFile), async (secret) => {
        switch (secret.provider) {
            case 'uw':
                message('[UW Medicine] patient found', 'Processing...')
                const bot = new UWMedicineBot(config, secret, message)
                await bot.go()
                break
            default:
                message('Healthcare provider not found.')
                what()
        }
    })
    message('Fin.')
}

run().catch(e => console.log(e.message))
