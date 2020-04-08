import puppeteer from 'puppeteer'
import { v4 as uuidv4 } from 'uuid'

import { deleteFolderRecursive } from './util'

export class ProviderCrawler {
    constructor (config, creds) { 
        this.config = config
        this.creds = creds 
        this.patient_id = uuidv4()
        this.resourceDownloadPath = `${this.config.secretDownloads}/${this.patient_id}`
    }
    async anon () { }
    async init () { 
        this.browser = await puppeteer.launch({
            headless: this.config.settings.headless,
            defaultViewport: null,
            args: ['--no-sandbox', '--start-fullscreen'],
        })
        this.page = await this.browser.newPage()
        // Allow and direct downloads
        await this.page._client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: this.resourceDownloadPath 
        })
    }
    async crawl () { await this.init() }
    async parse () { }
    async push () { }
    async destruct () { 
        await this.browser.close() 
        deleteFolderRecursive(this.resourceDownloadPath)
        delete this.creds
    }
}
