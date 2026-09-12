#!/usr/bin/env bash
# Ackerzeit ZIP -> dedicated Git checkout -> ordinary commit and push.
set -Eeuo pipefail
umask 077
fail() { printf 'Fehler: %s\n' "$*" >&2; exit 1; }
usage() {
  cat <<'EOF'
Ackerzeit aktualisieren
  bash update.sh DATEI.zip BESITZER/REPOSITORY
  bash update.sh DATEI.zip                      # zuletzt verwendetes Repo
  bash update.sh --check DATEI.zip              # nur ZIP prüfen, kein Git

Voraussetzungen in Termux:
  pkg install git python gh
  termux-setup-storage
  gh auth login --hostname github.com --git-protocol https --web
  gh auth setup-git

Das GitHub-Repository muss bereits existieren und für Ackerzeit vorgesehen sein.
Lokale Kopie: ~/ackerzeit-repos/BESITZER/REPOSITORY
Kein Force-Push. Lokale Änderungen und divergierende Git-Verläufe führen zum Stopp.
EOF
}
[[ ${1:-} != --help && ${1:-} != -h ]] || { usage; exit 0; }
command -v python3 >/dev/null || fail 'Python fehlt. In Termux: pkg install python'
mode=upload
if [[ ${1:-} == --check ]]; then mode=check; shift; fi
[[ $# -ge 1 && $# -le 2 ]] || { usage; exit 1; }
archive=$(python3 -c 'import os,sys; print(os.path.abspath(os.path.expanduser(sys.argv[1])))' "$1")
[[ -f $archive ]] || fail 'ZIP-Datei nicht gefunden. Prüfe den Pfad und die Android-Speicherfreigabe.'
task_tmp=$(mktemp -d)
trap 'rm -rf -- "$task_tmp"' EXIT
# This validator is part of the installed updater, never executed from the ZIP.
cat > "$task_tmp/package.py" <<'PY'
import hashlib, json, os, pathlib, shutil, stat, sys, zipfile

def safe(name):
    p = pathlib.PurePosixPath(name)
    return bool(name) and not p.is_absolute() and str(p) == name and all(
        part not in ('', '.', '..', '.git') and not part.startswith('-')
        for part in p.parts
    ) and not any(c in name for c in '\\\x00\r\n\t')

def load_manifest(value):
    if not isinstance(value, dict) or value.get('project') != 'ackerzeit' or value.get('format') != 1:
        raise ValueError('Kein unterstütztes Ackerzeit-Paket.')
    files = value.get('files')
    if not isinstance(files, dict) or not files or len(files) > 1000:
        raise ValueError('Ungültige Dateiliste.')
    for name, digest in files.items():
        if not safe(name) or not isinstance(digest, str) or len(digest) != 64 or any(c not in '0123456789abcdef' for c in digest):
            raise ValueError('Ungültiger Dateipfad oder Prüfsumme.')
    if not {'index.html', 'engine.js', 'app.js', 'style.css', 'update.sh', '.nojekyll'} <= set(files):
        raise ValueError('Spiel-Dateien fehlen.')
    return value

def no_links(base, rel):
    current = base
    for part in pathlib.PurePosixPath(rel).parts:
        current = current / part
        if current.is_symlink():
            raise ValueError('Symbolischer Link im Zielpfad: ' + rel)

try:
    mode, source, target = sys.argv[1:]
    dest = pathlib.Path(target)
    if mode == 'extract':
        with zipfile.ZipFile(source) as z:
            members = z.infolist()
            if len(members) > 1100 or sum(i.file_size for i in members) > 20_000_000:
                raise ValueError('Paket ist zu groß.')
            names = [i.filename for i in members]
            if len(names) != len(set(names)):
                raise ValueError('Doppelte ZIP-Einträge.')
            for info in members:
                if info.is_dir():
                    if not safe(info.filename.rstrip('/')):
                        raise ValueError('Unsicherer Ordnerpfad.')
                    continue
                if not safe(info.filename) or stat.S_ISLNK(info.external_attr >> 16):
                    raise ValueError('Unsicherer Dateipfad im ZIP.')
                if not info.filename.startswith('farm-manager/'):
                    raise ValueError('Erwarteter Paketordner: farm-manager/')
            manifest = load_manifest(json.loads(z.read('farm-manager/release-manifest.json')))
            expected = {'farm-manager/' + p for p in manifest['files']} | {'farm-manager/release-manifest.json'}
            if {i.filename for i in members if not i.is_dir()} != expected:
                raise ValueError('ZIP-Inhalt stimmt nicht mit Dateiliste überein.')
            for rel, digest in manifest['files'].items():
                data = z.read('farm-manager/' + rel)
                if hashlib.sha256(data).hexdigest() != digest:
                    raise ValueError('Prüfsumme stimmt nicht: ' + rel)
                out = dest / rel
                out.parent.mkdir(parents=True, exist_ok=True)
                out.write_bytes(data)
            (dest / 'release-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
            print('ZIP geprüft: Ackerzeit ' + str(manifest.get('version', '?')))
    elif mode == 'apply':
        src = pathlib.Path(source)
        manifest = load_manifest(json.loads((src / 'release-manifest.json').read_text()))
        previous = dest / 'release-manifest.json'
        no_links(dest, 'release-manifest.json')
        old = load_manifest(json.loads(previous.read_text()))['files'] if previous.exists() else {}
        if not old:
            permitted = {'.git', 'README.md', 'LICENSE', '.gitignore'}
            if any(p.name not in permitted for p in dest.iterdir()):
                raise ValueError('Ziel enthält ein anderes Projekt. Verwende ein eigenes leeres Ackerzeit-Repository.')
        all_paths = set(old) | set(manifest['files']) | {'release-manifest.json'}
        for rel in all_paths:
            no_links(dest, rel)
            p = dest / rel
            if p.exists() and not p.is_file():
                raise ValueError('Ziel ist keine reguläre Datei: ' + rel)
        # Only files explicitly owned by a previous Ackerzeit release may be removed.
        for rel in set(old) - set(manifest['files']):
            (dest / rel).unlink(missing_ok=True)
        for rel in set(manifest['files']) | {'release-manifest.json'}:
            out = dest / rel
            out.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(src / rel, out)
        (dest / 'update.sh').chmod(0o755)
        print('Projektdateien übernommen.')
    else:
        raise ValueError('Unbekannter Modus.')
except Exception as error:
    print('Paketprüfung fehlgeschlagen: ' + str(error), file=sys.stderr)
    sys.exit(1)
PY
mkdir "$task_tmp/package"
python3 "$task_tmp/package.py" extract "$archive" "$task_tmp/package"
[[ $mode != check ]] || exit 0
for task_command in git gh; do command -v "$task_command" >/dev/null || fail "$task_command fehlt. In Termux: pkg install git python gh"; done
config_dir="${XDG_CONFIG_HOME:-$HOME/.config}/ackerzeit-uploader"
repo=${2:-}
if [[ -z $repo && -f $config_dir/config.json ]]; then
  repo=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["repo"])' "$config_dir/config.json")
fi
if [[ -z $repo ]]; then read -r -p 'GitHub-Repository (BESITZER/REPOSITORY): ' repo; fi
repo=${repo#https://github.com/}
repo=${repo%.git}
[[ $repo =~ ^[A-Za-z0-9][A-Za-z0-9-]*/[A-Za-z0-9_][A-Za-z0-9_.-]*$ ]] || fail 'Bitte BESITZER/REPOSITORY angeben, ohne Token oder Zugangsdaten.'
[[ ${repo#*/} != . && ${repo#*/} != .. ]] || fail 'Ungültiger Repositoryname.'
gh auth status --hostname github.com >/dev/null 2>&1 || fail 'Bitte zuerst ausführen: gh auth login --hostname github.com --git-protocol https --web'
gh auth setup-git --hostname github.com
branch=$(gh repo view "$repo" --json defaultBranchRef --jq '.defaultBranchRef.name // "main"') || fail 'GitHub-Repository nicht gefunden oder keine Berechtigung.'
branch=${branch:-main}
git check-ref-format --branch "$branch" >/dev/null || fail 'Ungültiger Standardbranch.'
repo_dir="$HOME/ackerzeit-repos/$repo"
remote_url="https://github.com/$repo.git"
if [[ ! -e $repo_dir ]]; then
  mkdir -p "$(dirname "$repo_dir")"
  git clone -- "$remote_url" "$repo_dir"
fi
[[ -d $repo_dir/.git && ! -L $repo_dir ]] || fail 'Der Zielordner ist kein reguläres Git-Repository.'
[[ $(git -C "$repo_dir" remote get-url origin) == "$remote_url" ]] || fail 'Der lokale Ordner gehört zu einem anderen Remote-Repository.'
[[ -z $(git -C "$repo_dir" status --porcelain) ]] || fail "Lokale Änderungen vorhanden: $repo_dir. Bitte zuerst sichern oder committen."
git -C "$repo_dir" fetch origin
if git -C "$repo_dir" show-ref --verify --quiet "refs/remotes/origin/$branch"; then
  git -C "$repo_dir" checkout "$branch"
  git -C "$repo_dir" merge --ff-only "origin/$branch" || fail 'Git-Verläufe sind auseinander gelaufen. Kein Update durchgeführt.'
elif git -C "$repo_dir" rev-parse --verify HEAD >/dev/null 2>&1; then
  fail 'Remote-Standardbranch fehlt. Bitte Repository prüfen.'
else
  git -C "$repo_dir" symbolic-ref HEAD "refs/heads/$branch"
fi
if [[ -z $(git -C "$repo_dir" config user.name || true) ]]; then
  author_name=$(gh api user --jq '.name // .login')
  git -C "$repo_dir" config user.name "$author_name"
fi
if [[ -z $(git -C "$repo_dir" config user.email || true) ]]; then
  author_email=$(gh api user --jq '(.id | tostring) + "+" + .login + "@users.noreply.github.com"')
  git -C "$repo_dir" config user.email "$author_email"
fi
python3 "$task_tmp/package.py" apply "$task_tmp/package" "$repo_dir"
git -C "$repo_dir" add -A
if ! git -C "$repo_dir" diff --cached --quiet; then
  version=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["version"])' "$repo_dir/release-manifest.json")
  git -C "$repo_dir" commit -m "Ackerzeit $version"
else
  printf 'Dateien bereits aktuell. Prüfe ausstehenden Push.\n'
fi
git -C "$repo_dir" push --set-upstream origin "$branch" || fail 'Push nicht abgeschlossen. Der lokale Commit bleibt erhalten. Starte denselben Befehl nach Behebung des Git-/Netzwerkfehlers erneut.'
mkdir -p "$config_dir"
python3 -c 'import json,sys; from pathlib import Path; Path(sys.argv[1]).write_text(json.dumps({"repo":sys.argv[2]})+"\n")' "$config_dir/config.json" "$repo"
printf '\nAckerzeit wurde in %s hochgeladen.\n' "$repo"
printf 'Branch: %s\n' "$branch"
printf 'GitHub Pages einmalig aktivieren: Settings -> Pages -> Deploy from a branch -> %s -> / (root).\n' "$branch"
printf 'Lokales Projekt: %s\n' "$repo_dir"
