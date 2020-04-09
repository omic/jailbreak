import puppeteer from 'puppeteer'
import { v4 as uuidv4 } from 'uuid'

import { randomName, deleteFolderRecursive, NotImplementedError } from '../util'

export class ProviderCrawler {
    constructor(config, creds, message) {
        this.config = config
        this.creds = creds
        this.patient_id = uuidv4()
        this.patient_alias = randomName()
        this.resourceDownloadPath = `${this.config.secretDownloads}/${this.patient_id}`
        this.message = message
        this.message(`Patient alias: ${this.patient_alias} (${this.patient_id})`)
    }
    /**
     * Kickoff headless browser.
     */
    async init() {
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
    async go() {
        // this.message('Starting headless browser...')
        //await this.init()
        //this.message('Retrieving...')
        // await this.retrieve()
        // Parse 'em
        //
        this.resourceDownloadPath = `${this.config.secretDownloads}/d450283d-c048-4a2c-becf-a9366d2fba54`
        //
        this.message('Parsing data...')
        const records = await this.parse()
        this.message(`Parsed ${records.length} records.`)
        const intel = await this.extract(records)
        this.message('Extracted intel:')
        this.message(intel)
        this.message('Compiling SQL queries...')
				const queries = await this.compile(intel)
				await this.push(queries)
        // Self-imposed destructor
        this.message('Destructing self of secrets...')
        await this.destruct()
    }
    /**
     * Parse records into memory.
     */
    async parse() { throw NotImplementedError() }
    /**
     * Extract intel from EMRs that are not personally identifiable 
     * (ergo, implicit anonymization).
     */
    async extract() { throw NotImplementedError() }
    /**
     * Compile SQL queries from extracted intel. 
     */
    async compile(intel) { throw NotImplementedError() }
    /**
     * Push intel to remote database.
     */
    async push(queries) { throw NotImplementedError() }
    /**
     * Destroy all sensitive info.
     */
    async destruct() {
        await this.browser.close()
        deleteFolderRecursive(this.resourceDownloadPath)
        delete this.creds
    }
}
