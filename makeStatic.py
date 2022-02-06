import os
import shutil
from glob import glob
from bs4 import BeautifulSoup
import urllib.request

def download():
	os.system("wget -q  -nH -r localhost -P PLNET")
	print("website downloaded.")

            
def process():
	if os.path.isdir('PLNET/action'):
		shutil.rmtree('PLNET/action')
	if os.path.isfile('PLNET/login'):
		os.remove('PLNET/login')
	if os.path.isdir('../website/code/client'):
		shutil.rmtree('PLNET/client')
		shutil.copytree('../website/code/client', 'PLNET/client')
					
	results = [y for x in os.walk('PLNET/dictionary') for y in glob(os.path.join(x[0], '*'))]
	for result in results:
		if not os.path.isdir(result):
			if not result.endswith(".html"):
				os.rename(result, result + ".html")
				changeLink(result + ".html")
	print("content processed.")
			
def changeLink(fileName):
	print(fileName)
	html = open(fileName,'r')
	soup = BeautifulSoup(html, "html.parser")
	for a in soup.findAll('a'):
		if a['href'] == "/":
			a['href'] = "/PLNET/index.html"
		if not a['href'].startswith("/PLNET"):
			a['href'] = "/PLNET" + a['href'] + ".html"
		if a.has_attr('role'):
			if a['role'] == "button":
				if a.text.strip() != "Home":
					a.decompose()	 
	for a in soup.findAll('form'):
		if a.has_attr('id'):
			if a['id'] == "search_form":
				a.decompose()	 
	for a in soup.findAll('link'):
		if a.has_attr('href'):
			if a['href'].startswith("/resource"):
				a['href'] = "/PLNET" + a['href']
	for a in soup.findAll('script'):
		if a.has_attr('src'):
			if a['src'].startswith("/resource"):
				a['src'] = "/PLNET" + a['src']				
			if a['src'].startswith("/client"):
				a['src'] = "/PLNET" + a['src']				
	for a in soup.findAll('img'):
		if a.has_attr('src'):
			if a['src'].startswith("/resource"):
				a['src'] = "/PLNET" + a['src']				
			if a['src'].startswith("/client"):
				a['src'] = "/PLNET" + a['src']				
	textFile = open(fileName, "w")
	textFile.write(str(soup))
	textFile.close()

def changeMore(fileName):
	print(fileName)
	html = open(fileName,'r')
	soup = BeautifulSoup(html, "html.parser")
	for a in soup.findAll('a'):
		try:
			if a is not None and a['href'] is not None:
				if a['href'].startswith("/PLNET/action"):
					a.parent.parent.decompose()	 
		except TypeError:
			pass
	textFile = open(fileName, "w")
	textFile.write(str(soup))
	textFile.close()

download()
process()
changeLink("PLNET/index.html")
changeMore("PLNET/index.html")

