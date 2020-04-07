import config from './config.js'
import { UWMedicineBot } from './bot'
import { readSecrets, asyncForEach } from './util'

const run = async () => {
    const start = Date()
    asyncForEach(await readSecrets(config.secretPath), async (secret) => {
        const bot = new UWMedicineBot(config, secret)
        await bot.crawl()
    })
    const end = Date()
    console.log(`START TIME - ${start} / END TIME - ${end}`)
}

run().catch(e => console.log(e.message))