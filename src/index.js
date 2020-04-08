#!/usr/bin/env node

import config from './config.js'
import { UWMedicineBot } from './bot/uw'
import { what, readSecrets, asyncForEach } from './util'

const run = async () => {
    const start = Date()
    await asyncForEach(await readSecrets(config.secretFile), async (secret) => {
        switch (secret.provider) {
            case 'uw':
                const bot = new UWMedicineBot(config, secret)
                await bot.go()
                break
            default:
                console.log('Healthcare provider not found.')
                what()
        }
    })
    const end = Date()
    console.log(`START TIME - ${start} / END TIME - ${end}`)
}

run().catch(e => console.log(e.message))
