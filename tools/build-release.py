"""Build a checksummed Ackerzeit archive compatible with update.sh (stdlib only)."""
import argparse, hashlib, json, pathlib, zipfile
ROOT = pathlib.Path(__file__).resolve().parents[1]
p = argparse.ArgumentParser()
p.add_argument('--version', default='0.2.0')
p.add_argument('--output', type=pathlib.Path)
a = p.parse_args()
files = sorted(f for f in ROOT.rglob('*') if f.is_file() and not any(x in {'.git','node_modules','__pycache__'} for x in f.relative_to(ROOT).parts) and f.suffix not in {'.zip','.pyc'} and f.name != 'release-manifest.json')
if len(files)>1000 or sum(f.stat().st_size for f in files)>19_900_000:
    raise SystemExit('Paket überschreitet die Grenze des vorhandenen Update-Skripts.')
manifest = {'project':'ackerzeit','format':1,'version':a.version,'files':{str(f.relative_to(ROOT)):hashlib.sha256(f.read_bytes()).hexdigest() for f in files}}
mp = ROOT/'release-manifest.json'
mp.write_text(json.dumps(manifest,indent=2)+'\n')
output = (a.output or ROOT.parent/f'ackerzeit-v{a.version}.zip').resolve()
output.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED) as z:
    for f in files+[mp]: z.write(f,'farm-manager/'+str(f.relative_to(ROOT)))
print(f'{output}: {output.stat().st_size:,} Bytes, {len(files)} Dateien + Manifest')
