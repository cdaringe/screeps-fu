#!/usr/bin/env bash
set -exo pipefail
export PIPENV_VENV_IN_PROJECT=1
pipenv install --python=2
pipenv shell
fnm use
npm i -g pnpm
pnpm install
