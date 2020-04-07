import fs from 'fs'
import neatCsv from 'neat-csv'

import { UWMedicineBot } from './bot'
import config from './config.json'

const SECRET_CRED_FILE = '../../.secret/creds.csv'

/**
 * Read secure records into memory.
 */
const readSecrets = async () => {
    return await new Promise((resolve, reject) => 
        fs.readFile(SECRET_CRED_FILE, async (err, data) => {
            if (err) reject(err)
            resolve(await neatCsv(data))
    }))
}

const asyncForEach = async (items, callback) => {
    const results = []
    for (let i = 0; i < items.length; i++) {
        results.push(await callback(items[i], i))
    }
    return results
}

/**
 * Driver
 */
const run = async () => {
    const start = Date()
    asyncForEach(await readSecrets(), async (secret) => {
        const bot = new UWMedicineBot(config, secret)
        await bot.crawl()
    })
    const end = Date()
    console.log(`START TIME - ${start} / END TIME - ${end}`)
}

run().catch(e => console.log(e.message))
// run bot at certain interval we have set in our config file
// setInterval(run, config.settings.run_every_x_hours * 3600000)