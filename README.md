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

```bash
# node ./src/scripts/getData.js <repo1path> ... <repoNpath>
# Example, for the site above the following command was invoked
node ./src/scripts/getData.js ../acceptum ../arduino-remote-temperature ../breakout-clone ../cadre ../canicve.com ../charon ../enigma ../f4.9 ../fsort ../isocrypt ../janus ../joiner ../mailpipe ../mailpipe-gui ../mkdocs-canicve-plugin ../montage ../packet-maze ../rootme ../services ../skilz ../textsafe
```