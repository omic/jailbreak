<p align="center">
  <img src="/res/screenshot.png" />
</p>

[![HitCount](http://hits.dwyl.com/lukedottec/omic-ai.svg)](http://hits.dwyl.com/lukedottec/omic-ai)

We jailbreak Electronic Health Records (EMRs) to help solve [COVID-19](https://www.cdc.gov/coronavirus/2019-ncov/index.html).

Under [HIPPA](https://www.healthit.gov/how-to-get-your-health-record) federal law, you have the right to your health records.  What this project enables you to do is to contribute your anonymized data help [researchers around the globe](https://c19.ai) discover optimal treatment paths.

Join the fight.

## how it works

The current process is quite simple and will become more complicated in the future, especially as multi-omics are considered.

1.  Enter healthcare provider alias (see below table) and portal credentials.
1.  Run the `jailbreak.sh` script.  Make sure you have [NPM](https://www.npmjs.com/get-npm) installed.  The program then executes:
    1.  Login to provider's portal.
    1.  Navigate to and download [C-CDA](http://www.hl7.org/implement/standards/product_brief.cfm?product_id=492) (medical) records.
    1.  Parse records into JSON format, anonymizing the data in the process.
    1.  Convert data to OMOP CDM.
    1.  Publish anonymized, transformed data to central database for researchers to analyze.

```sh
# Add provider credentials to untracked secret directory.
mkdir ~/.secrets/
echo "[healthcare-alias],[portal-username],[portal-password]" >> ~/.secrets/creds.csv

# Make some waves.
./jailbreak.sh
```

Currently supported and _not-yet-supported_ healthcare providers:

Provider | Supported? | Alias | Portal
--- | --- | --- | --- |
[UW Medicine](https://www.uwmedicine.org/) | Y | `uw` | - |
Aetna | N | `aetna` | - |
Johnson & Johnson | N | `johnson2` | - |
UnitedHealth Group | N | `united` | - |
Cardinal Health | N | `cardinal` | - |
Anthem | N | `anthem` | - |
CVS Health | N | `cvs` | - |
AmerisourceBergen | N | `ameriberg` | - |
Express Scripts Holdings  | N | `express` | - |

...and more.

## todo [![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/dwyl/esta/issues)

- Write githook to prevent engineers from stupidly committing highly sensitive secrets.
- Prompt user to reset password to help them stay extra secure. 
- Compile list of most related repos and integrate some of their insights.
- Secure compression and archiving of data for more thorough extraction later.

## disclaimer 

First off, if the approach is not secure, *we won't do it*.  We believe we can protect the privacy of data donors **and** simultaneously further scientific research for the common good.  Current approaches for patients to willingly donate (anonymized) EMR data to further scientific discoveries -- especially given the COVID-19 pandemic -- are incredibly anitquated and nearly nonexistent.

So we're trying something different.  There is absolutely no guarantee that this will work.

# research

Our first research target is in determining the most effective treatment paths for individuals based on what is already being tried and tested by doctors.

# making contributions

## consent
Starting off, **patient's must give us consent** to crawl and anonymize their EMRs for them.  The current approach relies on them providing us with login credentials in order for us to peruse their healthcare provider's portal.  This is likely not the PROD solution, because who the hell would do that?

Look at working in a very clear [DocuSign](https://www.docusign.com/) here along with a privacy policy so people know we're not evil.

## extract 
Crawlers run in secure headless browsers, automating the process of extracting patient records from healthcare provider portals.  Is there a better way? 

## transform 
The extracted data must then go through: 
* anonomyzation -- should do this as soon as possible upon obtaining the data.  At the basic level, we're need to remove SSNs, names, and probably birthdates.
* normalization -- tools such as [White Rabit](https://github.com/OHDSI/WhiteRabbit) are meant to help at this step.

## load 
Data is currently structured in the OMOP data format in Redshift tables so the data from the prior step should fit without much fuss.  TBD.

# references

- https://github.com/amida-tech/blue-button
- https://github.com/jmandel/sample_ccdas
- https://github.com/OHDSI/WhiteRabbit
- https://cms.pilotfishtechnology.com/producing-simplified-c-cda-data-with-bluebutton
- https://github.com/HL7/C-CDA-Examples
- https://github.com/healthlx/HL7Challenge
- https://github.com/brynlewis/C-CDA_Viewer
- https://healthitanalytics.com/news/open-source-ehr-generator-delivers-healthcare-big-data-with-fhir
- https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3779068/
- https://www.biostars.org/p/70204/
- https://github.com/cerner/fhir.cerner.com
- https://open.epic.com/Tutorial/PatientAuthentication
- https://www.sciencedirect.com/science/article/pii/S2352914817302253
