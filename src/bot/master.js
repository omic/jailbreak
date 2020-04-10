import { v4 as uuidv4 } from 'uuid'

import { randomName, deleteFolderRecursive, NotImplementedError } from '../util'

/**
 * Superclass for any bot which extracts anonymized EMR data from its original source, 
 * transforms it, and pushes it to our central DB for downstream modeling and 
 * discoveries. 
 * 
 * Just some scrappy ETL, really.
 */
export class MasterBot {
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
     * Handles flow from login to upload.
     * 
     * MUST clean up all secrets.
     */
    async go() {
        this.message('Extracting data...')
        const intel = await this.extract()
        this.message('Compiling transformations...')
        const queries = await this.tx(intel)
        await this.load(queries)
        this.message('Destructing self of secrets...')
        await this.destruct()
    }

    /**
     * Retrieve, parse, and normalize records into memory.
     * 
     * The result should be exportable via CSV, and it's up to the developer how 
     * well structured this is for the `tx` step.
     */
    async extract() { throw NotImplementedError() }

    /**
     * Perform transformation from parsed intel to OMOP CDM. 
     */
    async tx(intel) { throw NotImplementedError() }

    /**
     * Push intel to remote database.
     */
    async load(queries) { throw NotImplementedError() }

    /**
     * Destroy all sensitive info.
     */
    async destruct() {
        await this.browser.close()
        deleteFolderRecursive(this.resourceDownloadPath)
        delete this.creds
    }
}
