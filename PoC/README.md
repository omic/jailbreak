### JailBreak PoC

#######Created a Python script to log into http://wa.kaiserpermanente.org/

Here is some useful knowledge: 

- Use the method kaiser_WA_EMR_Download(username, password, download_path = None) in the kaiser_wa.py file to log into a 
	wa.kaiserpermanente account. based off The username and password. The download location will default to the script's
	directory. 

- Note this script currently only works for washington Kaiser members, and cannot log onto the main site https://healthy.kaiserpermanente.org/
	Or other regional Kaiser sites. 

- Script may not work properly if the user is currently logged in

- This script is built on python requests and beautiful soup. So it's functionality is subject to change if components of the site change. 

I hope this python script will be found useful! 
