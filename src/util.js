import fs from 'fs'
import neatCsv from 'neat-csv'
import opn from 'opn'
import path from 'path'

export const what = () => opn('https://media.giphy.com/media/tVTnEqzAxxmyA/giphy.gif')

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

export const waitForClick = async (selector, options) => {
    const { page, timeout = 1000, wait = 0 } = options
    await page.waitForSelector(selector, { timeout })
    await page.waitFor(wait)
    await page.click(selector)
}

export const typeAll = async (selectors, options) => {
    const { randomness = true, timeout = 10 * 1000, page } = options
    await asyncForEach(selectors, async ([selector, value], _) => {
        if (randomness) {
            await page.waitFor(2250 + Math.floor(Math.random() * 250))
        }
        await waitForClick(selector, { timeout, page })
        await page.keyboard.type(value)
    })
}

export const clickAll = async (selectors, options = {}) => {
    const { 
        randomness = true, 
        timeout = 10 * 1000, 
        page
    } = options
    await asyncForEach(selectors, async (selector, _) => {
        if (randomness) {
            await page.waitFor(2250 + Math.floor(Math.random() * 250))
        }
        await waitForClick(selector, { timeout, page })
    })
}

export const asyncForEach = async (items, callback) => {
    const results = []
    for (let i = 0; i < items.length; i++) {
        results.push(await callback(items[i], i))
    }
    return results
}

export const deleteFolderRecursive = function (folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach((file, index) => {
            const curPath = path.join(folderPath, file)
            // Recurse
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath)
            } else {
                // Delete file
                fs.unlinkSync(curPath)
            }
        })
        fs.rmdirSync(folderPath)
    }
}

export class NotImplementedError extends Error {
    constructor(message = '', ...args) {
        super(message, ...args)
        this.message = message + ' has not yet been implemented.'
    }
}
