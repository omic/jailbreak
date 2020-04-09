import fs from 'fs'
import { homedir } from 'os'

// Setup home secrets directory.
const home = homedir()
const secretPath = `${home}/.secrets`
fs.mkdirSync(secretPath, { recursive: true });

// Compile config; use secret one if provided. 
// NOTE:  Do not commit your DB credentials (or any other sensitive 
//			  info) here.
const config = {
		secretPath,
		secretFile: `${secretPath}/creds.csv`,
		secretDownloads: `${secretPath}/records`,
		settings: {
				headless: true,
		},
		db: {
				type: 'aws-redshift',
				region: 'us-east-2',
				schema: 'cmsdesynpuf1k',
				tables: ['measurement', 'provider', 'person']
		}
}
const secretConfig = `${secretPath}/config.json`
if (fs.existsSync(secretConfig)) {
		const readConfig = JSON.parse(fs.readFileSync(secretConfig))
		Object.assign(config, readConfig)
} 

export default config

