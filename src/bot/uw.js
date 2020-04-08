import fs from 'fs'
import glob from 'glob'
import path from 'path'
import yauzl from 'yauzl'
import { parseString } from 'xml2js'

import { ProviderCrawler } from './master'
import { clickAll, typeAll, waitForClick, asyncForEach } from '../util'

export class UWMedicineBot extends ProviderCrawler {
    constructor (config, creds) {
        super(config, creds)
        this.baseUrl = 'https://ecare.uwmedicine.org/prod01'
        this.loginUrl = `${this.baseUrl}/Authentication/Login`
        this.recordUrl = `${this.baseUrl}/Documents/DownloadMyRecord`
    }
		async _extractVitals (content) {
			const { 
				table: [{ 
					colgroup, 
					thead: [{ 
						tr: [{ th }]
					}], 
					tbody: [{ tr }]
				}], 
				footnote 
			} = content 
			const header = th
			
			console.log(tr)
			const rows = tr.map(({ td }) => {
				console.log('row')
				console.dir(td)
			})
			//console.dir(tr)
		}	
    /** 
     * @override 
     */
    async extract (records) {
				const fields = {
						'allergies': [],
						'reason_for_visit': [],
						'encounter_details': [],
						'medications': [],
						// Current entry of interest
						'last_filed_vital_signs': [],
						'active_problems': [],
						'resolved_problems': [],
						'immunizations': [],
						'social_history': [],
						'ordered_prescriptions': [],
						'progress_notes': [],
						'plan_of_treatment': [],
						'results': [],
						'visit_diagnoses': []
				}
				const normalizeTitle = (title) => title.toLowerCase().trim().replace(/\s/g, '_')
				const self = this
        records.forEach(record => {
						console.log('>', record)
            fs.readFile(record, 'utf-8', (er, data) => {
                if (er) throw er
								console.log('>> Converted XML to JSON')
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
												console.log('>>>', normalizeTitle(title), text)
												if (normalizeTitle(title) === 'last_filed_vital_signs') {
													const [ content ] = text
													const vitals = self._extractVitals(content)
													fields['last_filed_vital_signs'].push(vitals)	
												} else {
													// Skip for now
												}
										})
                })
            })
        })
				console.dir(fields)
				return fields
    }
    /** 
     * @override 
     */
    async retrieve () {
        console.log('Logging in...')
        await this._login()
        console.log('Requesting records...')
        await this._requestExport()
        console.log('Polling for record export...')
        await this._pollDownload()
        console.log(`Downloaded records to ${this.resourceDownloadPath}.`)
        await this.page.waitFor(2250 + Math.floor(Math.random() * 250))
    }
    async _login () {
        const { un, pw } = this.creds
        const { loginUrl } = this
        await this.page.goto(loginUrl, { timeout: 60000 })
        await typeAll([['#Login', un], ['#Password', pw]], { page: this.page })
        await waitForClick('#submit', { page: this.page, wait: 1000 })
    }
    async _requestExport () {
        await this.page.goto(this.recordUrl)
        await clickAll(
            ['#tab_topic_3', '#vdtdownloadbutton', '#downloadbtn'], 
            { randomness: true, page: this.page })
    }
    async _pollDownload () {
        await this.page.waitForSelector('#ROIList', { timeout: 30000 })
        let content = 'refresh this page'
        while (content.toLowerCase().includes('refresh this page')) {
            await this.page.waitFor(10000)
            content = await this.page.evaluate(() => { 
                location.reload(true)
                return document.querySelector('#ROIList > .card').innerText
            })
        }
        await this.page.waitForSelector('#ROIList > .card > .formbuttons > a', { timeout: 30000 })
        await this.page.click('#ROIList > .card > .formbuttons > a')
        await this.page.waitFor(1000)
    }
    /** 
     * @override 
     */
    async parse () {
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
    /** 
     * @override 
     */
    async push () {
        // TODO
    }
}
