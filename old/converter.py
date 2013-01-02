import csv
from math import log

def nextData(reader):
	out = []
	error = False
	for _ in range(5):
		abr, name, _, _, _, k, _ = next(reader)
		error = error or k == ''
		if k: out.append(float(k))
	if not error:
		return {"abr": abr, "name":name, "data": out}
		
def readAll(filename):
	reader = csv.reader(open(filename), delimiter="\t")
	result = []
	try:
		while True:
			x = nextData(reader)
			if x is not None:
				x["data"][0] = log(x["data"][0])
				x["data"][1] = log(x["data"][1])
				result.append(x)
	finally:
		return result
		
out = readAll("countriesData.csv")
import json
print(json.dumps(out, indent=2))
#for x in out:
#	/k = [x["name"]] + list(map(str,x["data"]))
#	print '\t'.join(k)
