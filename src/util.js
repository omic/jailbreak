import fs from 'fs'
import neatCsv from 'neat-csv'

/**
 * Read secure records into memory.
 */
export const readSecrets = async (secretPath) => {
    return await new Promise((resolve, reject) => 
        fs.readFile(secretPath, async (err, data) => {
            if (err) reject(err)
            resolve(await neatCsv(data))
    }))
}

export const asyncForEach = async (items, callback) => {
    const results = []
    for (let i = 0; i < items.length; i++) {
        results.push(await callback(items[i], i))
    }
    return results
}