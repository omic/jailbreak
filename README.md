# emr
Consensually automatting EMR collection and anonymization... for science!

## disclaimer 

First off, if the approach is not secure, *we won't do it*.  We believe we can protect the privacy of data donors **and** simultaneously further scientific research for the common good.  Current approaches for patients to willingly donate (anonymized) EMR data to further scientific discoveries -- especially given the COVID-19 pandemic -- are incredibly anitquated and nearly nonexistent.

So we're trying something different.  There is absolutely no guarantee that this will work.

## working-mem
- UW Medicine login: https://ecare.uwmedicine.org/prod01/Authentication/Login
- Appears that the download from this portal gives decently structured XML files.  Before writing parsers for this, let's make sure there's no better avenue for obtaining the data from UW Medicine.

## making contributions
### consent
Starting off, **patient's must give us consent** to crawl and anonymize their EMRs for them.  The current approach relies on them providing us with login credentials in order for us to peruse their healthcare provider's portal.  This is likely not the PROD solution, because who the hell would do that?

Look at working in a very clear [DocuSign](https://www.docusign.com/) here along with a privacy policy so people know we're not evil.

### extract 
Crawlers run in secure headless browsers, automating the process of extracting patient records from healthcare provider portals.  Is there a better way? 

### transform 
The extracted data must then go through: 
* anonomyzation -- should do this as soon as possible upon obtaining the data.  At the basic level, we're need to remove SSNs, names, and probably birthdates.
* normalization -- tools such as [White Rabit](https://github.com/OHDSI/WhiteRabbit) are meant to help at this step.

### load 
Data is currently structured in the OMOP data format in Redshift tables so the data from the prior step should fit without much fuss.  TBD.

## todo
- Write webhook to prevent user from stupidly committing highly sensitive secrets.

## links

- https://healthitanalytics.com/news/open-source-ehr-generator-delivers-healthcare-big-data-with-fhir
- https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3779068/
- https://www.biostars.org/p/70204/
- https://github.com/cerner/fhir.cerner.com
- https://open.epic.com/Tutorial/PatientAuthentication
