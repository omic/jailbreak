import puppeteer from 'puppeteer'
import { v4 as uuidv4 } from 'uuid'

import { deleteFolderRecursive, NotImplementedError } from '../util'

export class ProviderCrawler {
    constructor (config, creds) { 
        this.config = config
        this.creds = creds 
        this.patient_id = uuidv4()
        this.resourceDownloadPath = `${this.config.secretDownloads}/${this.patient_id}`
    }
    /**
     * Kickoff headless browser.
     */
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
    /**
     * Handles flow from login to upload.
     */
    async go () { 
        await this.init() 
        // Get records
        // console.log('Starting headless browser...')
        // await super.crawl()
        // await this.retrieve()
        // Parse 'em
        this.resourceDownloadPath = `${this.config.secretDownloads}/2fa6d444-ef15-49ec-83c5-3c50d2905cb8`
        console.log('Parsing data...')
        const records = await this.parse()
        console.log('Parsed records here:', records)
        const intel = await this.extract(records)
        console.log('Extracted intel:', intel)
        // Self-imposed destructor
        await this.destruct()
    }
    /**
     * ...
     */
    async crawl () { throw NotImplementedError() }
    /**
     * Parse records into memory.
     */
    async parse () { throw NotImplementedError() }
    /**
     * Extract intel from EMRs that are not personally identifiable 
     * (ergo, implicit anonymization).
     */
    async extract () { throw NotImplementedError() }
    /**
     * Push intel to remote database.
     */
    async push () { throw NotImplementedError() }
    /**
     * Destroy all sensitive info.
     */
    async destruct () { 
        await this.browser.close() 
        deleteFolderRecursive(this.resourceDownloadPath)
        delete this.creds
    }
}
