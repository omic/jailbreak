import AWS from 'aws-sdk'
import fs from 'fs'
import glob from 'glob'
import path from 'path'
import puppeteer from 'puppeteer'
import yauzl from 'yauzl'
import { parseString } from 'xml2js'

import { MasterBot } from './master'
import {
    clickAll,
    typeAll,
    waitForClick,
    asyncForEach,
    normalizeTitle,
    cleanEntry
} from '../util'

export class UWMedicineBot extends MasterBot {
    constructor(config, creds, message) {
        super(config, creds, message)
        this.baseUrl = 'https://ecare.uwmedicine.org/prod01'
        this.loginUrl = `${this.baseUrl}/Authentication/Login`
        this.recordUrl = `${this.baseUrl}/Documents/DownloadMyRecord`
    }

    _parseVitals(content) {
        const {
            table: [{
                colgroup,
                thead: [{ tr: [{ th }] }],
                tbody: [{ tr }]
            }],
            footnote
        } = content
        const unfurl = td => (td._) ? td._ : td
        const header = th.map(normalizeTitle)
        const rows = tr.map(({ td: row }) => {
            // TODO:  Auto-detect how to extract desired value from cell.  Right now
            //		  we're using some embedded heuristics to parse the row.  Yuck.
            let [{ _: metric }, measure, ts, comment] = row
            metric = normalizeTitle(metric)
            ts = Date.parse(ts) || null
            if (metric === 'blood_pressure') {
                // Blood pressure has nested content
                const { content: [over, under] } = measure
                measure = `${unfurl(over)} ${unfurl(measure)} ${unfurl(under)}`
            } else {
                measure = unfurl(measure) 
            }
            if (measure.match(/.*\(.*\)/g)) {
                // Remove parentheses
                measure = measure.slice(0, measure.indexOf('(')).trim()
            }
            return [metric, measure, ts, comment]
        })
        return header.reduce((acc, col, i) => (
            Object.assign(acc, { [col]: rows.map(row => row[i]) })
        ), { })
    }

    _txVitals(vitals) {
        const getRow = (obj, i) => (
            Object.entries(obj).reduce((acc, [key, values]) => (
                Object.assign(acc, { [key]: values[i]} )
            ), { })
        )
        // Assume uniform length, which ought to be the case.
        const l = Object.values(vitals)[0].length
        // const observation_table = 'ha'
        return Array(l).fill().map((_, i) => {
            const row = getRow(vitals, i) 
            const values = Object.values(row)
            return values 
            // const values = Object.values(row).join(', ')
            // TODO:  const columns = Object.keys(row).join(', ')
            // TODO:  const values = Object.values(row).map(v => `"${v}"`).join(', ')
            // TODO:  return `insert into ${observation_table} (${columns}) values (${values})`
        })
    }

    async _login() {
        const { un, pw } = this.creds
        const { loginUrl } = this
        await this.page.goto(loginUrl, { timeout: 60000 })
        await typeAll([['#Login', un], ['#Password', pw]], { page: this.page })
        await waitForClick('#submit', { page: this.page, wait: 1000 })
    }

    async _requestExport() {
        await this.page.goto(this.recordUrl)
        await clickAll(
            ['#tab_topic_3', '#vdtdownloadbutton', '#downloadbtn'],
            { randomness: true, page: this.page })
    }

    async _pollDownload() {
        await this.page.waitForSelector('#ROIList', { timeout: 30000 })
        let content = 'refresh this page'
        while (content.toLowerCase().includes('refresh this page')) {
            await this.page.waitFor(5000)
            content = await this.page.evaluate(() => {
                location.reload(true)
                return document.querySelector('#ROIList > .card').innerText
            })
        }
        await this.page.waitForSelector(
            '#ROIList > .card > .formbuttons > a',
            { timeout: 30000 }
        )
        await this.page.click('#ROIList > .card > .formbuttons > a')
        await this.page.waitFor(1000)
    }

    /**
     * Download records from web portal. 
     */
    async _retrieve() {
        // Kickoff headless browser.
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
        console.log('Logging in...')
        await this._login()
        console.log('Requesting records...')
        await this._requestExport()
        console.log('Polling for record export...')
        await this._pollDownload()
        console.log(`Downloaded records to ${this.resourceDownloadPath}.`)
        await this.page.waitFor(2250 + Math.floor(Math.random() * 250))
    }

    async _uncompressDownloads() {
        // Get ZIP path
        const zip = await new Promise((resolve, reject) => {
            glob(`${this.resourceDownloadPath}/*.zip`, (er, files) => {
                if (er) reject(er)
                if (files.length !== 1) reject('Weird number of files matched.')
                resolve(files[0])
            })
        })
        // Extract files from ZIP into flattened secret directory.
        const self = this
        const extractPath = `${self.resourceDownloadPath}/extract`
        fs.mkdirSync(extractPath, { recursive: true });
        const records = []
        await new Promise((resolve, reject) => {
            yauzl.open(zip, { lazyEntries: true }, function (er, zipfile) {
                if (er) reject(er)
                zipfile.readEntry()
                zipfile.on('entry', function (entry) {
                    const basename = path.basename(entry.fileName).toLowerCase()
                    if (/doc[0-9]+.xml$/.test(basename)) {
                        // Record file found
                        zipfile.openReadStream(entry, function (er, readStream) {
                            if (er) reject(er)
                            readStream.on('end', () => zipfile.readEntry())
                            const filePath = `${extractPath}/${basename}`
                            const writeable = fs.createWriteStream(filePath)
                            readStream.pipe(writeable)
                            records.push(filePath)
                        })
                    } else zipfile.readEntry()
                })
                zipfile.once('error', reject)
                zipfile.once('end', resolve)
            })
        })
        return records
    }
    
    async _parse(records) {
        const fields = {
            'allergies': { },
            'reason_for_visit': { },
            'encounter_details': { },
            'medications': { },
            // Current entry of interest
            'last_filed_vital_signs': { },
            'active_problems': { },
            'resolved_problems': { },
            'immunizations': { },
            'social_history': { },
            'ordered_prescriptions': { },
            'progress_notes': { },
            'plan_of_treatment': { },
            'results': { },
            'visit_diagnoses': { }
        }
        const self = this
        records.forEach(record => {
            const data = fs.readFileSync(record, { encoding: 'utf-8' })
            parseString(data, function (er, result) {
                const doc = result.ClinicalDocument.component[0]
                const sections = doc.structuredBody[0].component
                sections.forEach(comp => {
                    const {
                        section: [{
                            id,
                            code,
                            templateId,
                            title: [title],
                            text,
                            entry
                        }]
                    } = comp
                    const normTitle = normalizeTitle(title)
                    // NOTE:  Assumes same-named tables in each section have same headers.
                    //			  Otherwise, things might get a little weird.
                    if (normTitle === 'last_filed_vital_signs') {
                        const [content] = text
                        const fe = fields[normTitle]
                        const vitals = self._parseVitals(content)
                        Object.entries(vitals).forEach(([key, vals]) => {
                            vals = vals.map(cleanEntry)
                            fe[key] = (fe[key] && fe[key].concat(vals)) || vals
                        })
                    } else {
                        // Skip for now
                    }
                })
            })
        })
        return fields
    }

    /** 
     * @override 
     */
    async extract() {
        await this._retrieve()
        // this.resourceDownloadPath = `${this.config.secretDownloads}/d450283d-c048-4a2c-becf-a9366d2fba54`
        const records = await this._uncompressDownloads()
        return await this._parse(records)
    }

    /** 
     * @override 
     */
    async tx(intel) {
        const txMap = {
            'last_filed_vital_signs': this._txVitals
        }
        let txs = []
        Object.entries(intel).forEach(([key, value]) => {
            if (Object.keys(value).length === 0 || !(key in txMap)) return
            txs = txs.concat(txMap[key](value))
        })
        // console.log(JSON.stringify(txs))
        console.dir(txs)
        return txs
    }

    /** 
     * @override 
     */
    async load(queries) {
        // TODO:  Establish secure connection with Redshift DB and send queries.
        //        Read schema and connection string from secret config file.
        const redshift = new AWS.Redshift({ apiVersion: '2012-12-01' })
    }
}
