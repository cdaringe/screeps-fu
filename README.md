# screeps-fu

A poorly performing screeps bot.

## Design

```mermaid
flowchart TD;
    _((start))-->GAME_STATE;
    GAME_STATE-->OBSERVABLE_STATE;
    OBSERVABLE_STATE-- combineLatest --->ACTIONS;
    ACTIONS-->COMMANDS;
    COMMANDS-- flush_commands -->__((end))
```

## Contributing

[.github/contributing.md](./.github/contributing.md)

## Dev-Fu

- https://esbuild.github.io/api/#target
- forget build/push, just do a watcher and sync to `/mnt/c/Users/cdaringe/AppData/Local/Screeps/scripts/screeps.com`
