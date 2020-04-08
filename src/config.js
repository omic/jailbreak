const secretPath = `${__dirname}/.secret`

const config = {
    secretPath,
    secretFile: `${secretPath}/creds.csv`,
    secretDownloads: `${secretPath}/records`,
    settings: {
        headless: false,
    }
}

export default config
