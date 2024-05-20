# screeps-fu

cdaringe screeps ai.

## usage

- `pnpm install`
- `pnpm build`
- prep an auth file
  - `cp .screeps.yml.example .screeps.yml`
  - add your token for the screeps.com server
- `pnpm run deploy`

## Reminders

- we need to spawn creeps, but spawning costs energy, which is a wee bit sparse
- you need to snap each screep into action on each tick. use `creep.memory` to do so
- a creep needs to be upgrading the controller using energy
- extensions pimp creeps
-
