import config from './config.js'
import { UWMedicineBot } from './uw-medicine'
import { readSecrets, asyncForEach } from './util'

const run = async () => {
    const start = Date()
    await asyncForEach(await readSecrets(config.secretFile), async (secret) => {
        const bot = new UWMedicineBot(config, secret)
        await bot.crawl()
        await bot.destruct()
    })
    const end = Date()
    console.log(`START TIME - ${start} / END TIME - ${end}`)
}

run().catch(e => console.log(e.message))