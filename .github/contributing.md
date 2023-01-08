# contributing

## pre-reqs

- clone && cd ./screeps-fu
- shortcut: `./dev-shell.sh` (you may need to install some of the invoked executables). longcut: ...read on
- `screeps`/`screeps-server-mockup` uses node-gyp, which needs a lame old version python. we do this with a python virtual environment
  - `brew install pyenv pipenv`, or
    - install `pyenv`: https://github.com/pyenv/pyenv#installation
    - install `pipenv`
  - `pyenv install 2`
  - `pipenv shell`
- install `fnm`
- `fnm use`
- `npm i -g pnpm`
- `pnpm install`
