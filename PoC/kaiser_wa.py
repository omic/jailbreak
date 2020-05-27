import requests
import time
import random
import os
import json
from bs4 import BeautifulSoup


Downloaded_Filename = "KP_Downloaded_EMR_{}.zip"
DEBUG = False


def download(session, url, save_path = None, chunk_size=128):
	"""
		Download requested url 

		Parameters: 
			url - str url to download
			save_path (optional) - str path to save. Not including file name
			chunk_size - int chunk size to download

		Return: 
			bool False if exception caught, else True
	"""

	# Set save_path if None
	total_path = ''
	if not save_path:
		path = os.path.dirname(os.path.realpath(__file__))
	else:
		path = save_path

	if path[-1] != '/':
		path = path + '/'

	file_num = 1
	total_path = path + Downloaded_Filename.format(file_num)
	
	# Change file_name until we get a file that does not exist
	while os.path.exists(total_path):
		file_num = file_num + 1
		total_path = path + Downloaded_Filename.format(file_num)

	r = session.get(url, stream = True)
	try:
		# Write to disk
		with open(total_path, 'wb') as fd:
			for chunk in r.iter_content(chunk_size=chunk_size):
				fd.write(chunk)

	except Exception as e:
		print("Could not write to file\n{}".format(str(e)))
		return False

	return True


def custom_headers():
	"""
		Return custom headers to be used throughout entire session
		Headers for all requests. Real people headers for real people

		Return:
			Dict - Python Dictionary representing the Headers to use throughout the session
	"""
	return {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36'
		   ,'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'
		   ,'Accept-Language': 'en-US,en;q=0.9,es-EC;q=0.8,es;q=0.7'  
		   #,'Cache-Control': 'no-cache'
		   #,'Content-Type': 'application/x-www-form-urlencoded'
			}


def get_download_url(session):
	"""
		Return:
			str - Represents the url to download or bool - False if exception is caught
	"""

	# Crawl to records page...
	try:
		r = session.get("https://wa-member2.kaiserpermanente.org/MyChart/Documents/Released?from=landingpage", headers = {
			'Host': 'wa-member2.kaiserpermanente.org'
			,'Referer': 'https://wa-member2.kaiserpermanente.org/MyChart/Documents'
			})
	except Exception as e:
		print("Could not access https://wa-member2.kaiserpermanente.org/MyChart/Documents/Released?from=landingpage\n{}\nTerminating EMR Download".format(str(e)))
		return False
	
	# Retreive Request Verification Token	
	try:
		soup1 = BeautifulSoup(r.content, "html.parser")
		RequestVerificationToken = soup1.find('div', id = "__CSRFContainer").contents[0].get('value')
		#if DEBUG:
		#	print("Document list verification token: {}".format(str(RequestVerificationToken)))
	except Exception as e:
		print("Unable to find __RequestVerificationToken for https://wa-member2.kaiserpermanente.org/MyChart/Documents/Released?from=landingpage\n{}\n Terminating EMR download".format(str(e)))
		return False

	# Post to https://wa-member2.kaiserpermanente.org/MyChart/Documents/Released/LoadDownloads to retreive downloads JSON
	try:
		r = session.post('https://wa-member2.kaiserpermanente.org/MyChart/Documents/Released/LoadDownloads', headers = {
			'__RequestVerificationToken': str(RequestVerificationToken)
			,'Connection': 'keep-alive'
			,'Content-Length': '0'
			,'Host': 'wa-member2.kaiserpermanente.org'
			,'Referer': 'https://wa-member2.kaiserpermanente.org/MyChart/Documents/Released?from=landingpage'
			,'X-Requested-With': 'XMLHttpRequest'
			,'Sec-Fetch-Dest': 'empty'
			,'Sec-Fetch-Mode': 'cors'
			,'Sec-Fetch-Site': 'same-origin'
			})
	except Exception as e:
		print("Unable to load downloaded resources\n{}\n Terminating EMR download".format(str(e)))
		return False

	data = r.json()
	download_url = ''
	index = -1

	# Find the download JSON that is marked new. contruct and return the url
	for record in data['Docs']:
		index = index + 1
		if record['IsNew'] == 'true' or record['IsNew'] == True:
			# TODO: the query argument idx doesn't seem to do anything. In the future this may need to be looked into
			download_url = 'https://wa-member2.kaiserpermanente.org/MyChart/Documents/Released/Download?releaseId={}&docId={}&downloadedFileName={}&idx={}'.format(
				str(record['ReleaseID']), str(record['DocumentID']), str(record['PackageName']), str(0))
		
	
	return download_url


def request_new_EMR(session):
	"""
		Request a new EMR to be downloaded. Doesn't seem to work if user is already logged in

		Return: 
			Bool - False if Exception found with request Else True. 
	"""

	# Grab the Request Verification Token from https://wa-member2.kaiserpermanente.org/MyChart/Documents/DownloadMyRecord?from=landingpage
	try:
		r = session.get("https://wa-member2.kaiserpermanente.org/MyChart/Documents/DownloadMyRecord?from=landingpage", headers = {
			'Host': 'wa-member2.kaiserpermanente.org'
			,'Referer': 'https://wa-member2.kaiserpermanente.org/MyChart/Documents'
			})
	except Exception as e:
		print("Could not access https://wa-member2.kaiserpermanente.org/MyChart/Documents/DownloadMyRecord?from=landingpage\n{}\nTerminating EMR Download".format(str(e)))
		return False

	# Need to look for the __RequestVerificationToken to prove my humanity
	try:
		soup1 = BeautifulSoup(r.content, "html.parser")
		RequestVerificationToken = soup1.find('div', id = "__CSRFContainer").contents[0].get('value')
	except Exception as e:
		print("Could not retreive Request Verification Token.\n{}".format(str(e)))
		return False

	# Sleep between requests...
	time.sleep(random.randint(5, 14))

	# Request new record from https://wa-member2.kaiserpermanente.org/MyChart/Documents/DownloadMyRecord/GetDownloadStartedTwo
	try:
		r = session.post("https://wa-member2.kaiserpermanente.org/MyChart/Documents/DownloadMyRecord/GetDownloadStartedTwo", data = {
			"mode":"lucySummaryView"
			,"csn": None
			,"startdate": None
			,"enddate": None
			,"doencrypt": False
			,"documentpassword": None
			,"passwordverify": None
			,"encCount": 0
			,"encDate": None
			}, headers = { 
			'__RequestVerificationToken': str(RequestVerificationToken)
			,'Referer': 'https://wa-member2.kaiserpermanente.org/MyChart/Documents/DownloadMyRecord?from=landingpage'
			,'X-Requested-With': 'XMLHttpRequest'
			,'Sec-Fetch-Dest': 'empty'
			,'Sec-Fetch-Mode': 'cors'
			,'Sec-Fetch-Site': 'same-origin'
			,'Content-Length': '0'
			,'Host': 'wa-member2.kaiserpermanente.org'
			#,'Cache-Control': 'no-cache, no-store, must-revalidate'
			#,'Pragma': 'no-cache'
			})

	except Exception as e:
		print("Could not perform Request new medical record\n{}\nTerminating EMR download".format(str(e)))
		return False

	#if DEBUG:
	#	print("{}\n\nRequest Headers:{}\n\nResponse Headers: {}".format(str(r.text), str(r.request.headers), str(r.headers)))

	return True	


def login(session, username, password):
	"""
		Login to https://wa-member3.kaiserpermanente.org/

		Return: 
			Bool - False if Exception found with request Else True. 
	"""	

	try:
		r = session.post("https://wa-member3.kaiserpermanente.org/siteminder/forms/loginmember.fcc", data={"USER":str(username), "PASSWORD": str(password), "target": "/home", "SMAUTHREASON":0}, headers = {})
	except Exception as e:
		print("Could not perform login\n{}\nTerminating EMR download".format(str(e)))
		return False

	return True


def kaiser_WA_EMR_Download(username, password, download_path = None):
	"""
		Given username, password and optional download path, download a WA Kaiser user's EMR

		Parameters
			username - str username for WA Kaiser account (WILL NOT BE SAVED)
			password - str password for WA Kaiser account (WILL NOT BE SAVED)
			download_path (optional) - str download path (excluding filename) for the zip file. If none will default to directory of this script

		Return:
			bool - True if no errors caught, False otherwise
	"""

	with requests.Session() as s:
		
		# Set Headers...
		s.headers.update(custom_headers())
		
		# Login
		print("Logging in...")
		if not login(s, str(username), str(password)):
			return False

		# Give this request some time... like a real human
		time.sleep(random.randint(5, 14))
		
		# Request a new EMR
		print("Requesting New EMR...")
		if not request_new_EMR(s):
			return False

		# More sleep time
		time.sleep(random.randint(10, 17))

		# Get the download url
		print("Retreiving Download Link...")
		download_url = get_download_url(s)
		if not download_url:
			return False

		time.sleep(random.randint(3, 14))

		# Download...
		print("Downloading...")
		if not download(s, str(download_url)):
			return False

		print("All Done! Closing session...")
		time.sleep(random.randint(5, 16))

	return True

