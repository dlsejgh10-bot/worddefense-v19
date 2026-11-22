"""Wait for Apple's build processing and attach it to existing internal groups."""
import base64
import json
import os
from pathlib import Path
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request

API = 'https://api.appstoreconnect.apple.com/v1/'
BUILD = os.environ['WD_BUILD_NUMBER']
KEY = Path.home() / 'private_keys' / ('AuthKey_'+os.environ['ASC_KEY_ID']+'.p8')

def b64(value):
    return base64.urlsafe_b64encode(value).rstrip(b'=').decode()

def token():
    now=int(time.time())
    header=b64(json.dumps({'alg':'ES256','kid':os.environ['ASC_KEY_ID'],'typ':'JWT'}).encode())
    body=b64(json.dumps({'iss':os.environ['ASC_ISSUER_ID'],'iat':now-10,'exp':now+600,'aud':'appstoreconnect-v1'}).encode())
    data=(header+'.'+body).encode()
    signature=subprocess.run(['openssl','dgst','-sha256','-sign',str(KEY)],input=data,capture_output=True,check=True).stdout
    # OpenSSL returns DER ECDSA. JWT needs the two unsigned 32-byte integers.
    assert signature[0]==0x30 and signature[2]==0x02
    r_length=signature[3];r=int.from_bytes(signature[4:4+r_length],'big')
    cursor=4+r_length
    assert signature[cursor]==0x02
    s_length=signature[cursor+1];s=int.from_bytes(signature[cursor+2:cursor+2+s_length],'big')
    return data.decode()+'.'+b64(r.to_bytes(32,'big')+s.to_bytes(32,'big'))

def request(path, data=None):
    payload=None if data is None else json.dumps(data).encode()
    req=urllib.request.Request(API+path,data=payload,headers={'Authorization':'Bearer '+token(),'Content-Type':'application/json'})
    try:
        with urllib.request.urlopen(req,timeout=30) as response:
            body=response.read()
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as error:
        details=json.loads(error.read())
        messages='; '.join(e.get('detail',e.get('title','')) for e in details.get('errors',[]))
        raise RuntimeError(f'App Store Connect HTTP {error.code}: {messages}') from None

apps=request('apps?'+urllib.parse.urlencode({'filter[bundleId]':'com.wordgame.worddefense','limit':10}))['data']
assert len(apps)==1, 'Expected exactly one WordDefense app for this bundle'
app=apps[0]['id']
print(f'App {app}, uploaded build {BUILD}',flush=True)
deadline=time.monotonic()+1800
build=None
while time.monotonic()<deadline:
    result=request('builds?'+urllib.parse.urlencode({'filter[app]':app,'filter[version]':BUILD,'sort':'-uploadedDate','limit':10}))
    builds=result['data']
    if builds:
        build=builds[0];state=build['attributes']['processingState']
        print(f'Build {BUILD} processing state {state}',flush=True)
        if state=='VALID':break
        if state in ['FAILED','INVALID']:raise RuntimeError('Apple rejected the uploaded build: '+state)
    else:print('Waiting for uploaded build to appear',flush=True)
    time.sleep(30)
else:raise TimeoutError('Apple build processing did not finish within 30 minutes')

assert build and build['attributes']['processingState']=='VALID'
groups=request(f'apps/{app}/betaGroups?limit=200')['data']
internal=[group for group in groups if group['attributes'].get('isInternalGroup')]
for group in internal:
    request(f'betaGroups/{group["id"]}/relationships/builds',{'data':[{'type':'builds','id':build['id']}]})
    print('Available to internal TestFlight group: '+group['attributes']['name'],flush=True)
if not internal:print('No existing internal TestFlight groups found',flush=True)
summary={'appId':app,'buildNumber':BUILD,'buildId':build['id'],'processingState':'VALID','internalGroups':len(internal)}
Path('dist').mkdir(exist_ok=True)
Path('dist/testflight-status.json').write_text(json.dumps(summary,indent=2))
print(json.dumps(summary),flush=True)
