# Skilz
playing with mithril.js

see: https://archimoebius.github.io/ for an example

# Requirements
cloc must be installed

On Fedora:
```bash
sudo dnf install cloc git npm
```

# To generate

1) Create a .skilz file in the root of your repos
The on for this repo looks like:

```json
{
  "branch": "master",
  "description": "A web application to vizualize git based projects and their code stats as reported by CLOC.",
  "title": "Skilz",
  "links": [
    {
      "title": "View Source",
      "href": "https://github.com/ArchiMoebius/skilz/"
    }
  ]
}
```

2) Generate the data for the static site
```bash
# node ./src/scripts/getData.js <repo1path> ... <repoNpath>
# Example, for the site above the following command was invoked
node ./src/scripts/getData.js ../acceptum ../arduino-remote-temperature ../breakout-clone ../cadre ../canicve.com ../charon ../enigma ../f4.9 ../fsort ../isocrypt ../janus ../joiner ../mailpipe ../mailpipe-gui ../mkdocs-canicve-plugin ../montage ../packet-maze ../rootme ../services ../skilz ../textsafe ../oneword/ ../bae ../../11.01_Games/BarClick/ ../zippy/
```

3) Review it
```bash
npm run start
```

4) Build it
```bash
npm run build
```
