#!/bin/bash
# Rebuilds both playable pages from the source in src/:
#   index.html  (desktop)  <- src/ui.html
#   mobile.html (phone)    <- src/ui_mobile.html, generated from src/ui.html by src/make_mobile.py
# Game logic, artwork code and sound engine are inlined into each page.
set -e
cd "$(dirname "$0")"
python3 src/make_mobile.py
python3 - <<'EOF'
E = open('src/engine.js').read()
A = open('src/art.js').read()
S = open('src/sound.js').read()
for src, out in [('src/ui.html', 'index.html'), ('src/ui_mobile.html', 'mobile.html')]:
    page = open(src).read().replace('/*ENGINE*/', E).replace('/*ART*/', A).replace('/*SOUND*/', S)
    open(out, 'w').write(page)
    print('built', out, len(page), 'bytes')
EOF
