# 🔓 jailbreak
We jailbreak EMRs.  For **COVID-19** research.

```
cd src/
npm run start
```

## disclaimer 

First off, if the approach is not secure, *we won't do it*.  We believe we can protect the privacy of data donors **and** simultaneously further scientific research for the common good.  Current approaches for patients to willingly donate (anonymized) EMR data to further scientific discoveries -- especially given the COVID-19 pandemic -- are incredibly anitquated and nearly nonexistent.

So we're trying something different.  There is absolutely no guarantee that this will work.

## todo
- Write githook to prevent engineers from stupidly committing highly sensitive secrets.
- Prompt user to reset password to help them stay extra secure. 
- Compile list of most related repos and integrate some of their insights.
- Secure compression and archiving of data for more thorough extraction later.

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

## links

- https://github.com/jmandel/sample_ccdas
- https://healthitanalytics.com/news/open-source-ehr-generator-delivers-healthcare-big-data-with-fhir
- https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3779068/
- https://www.biostars.org/p/70204/
- https://github.com/cerner/fhir.cerner.com
- https://open.epic.com/Tutorial/PatientAuthentication
