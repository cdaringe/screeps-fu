export function initIds() {
  global.lastWorkerId = 0;
  global.getNextWorkerId = function getNextWorkerId() {
    ++global.lastWorkerId;
    return global.lastWorkerId;
  };
}

export function maybeUpdateLastId(name: string) {
  const [_, idString] = name.match(/(\d+)$/) || [];
  if (idString) {
    const id = parseInt(idString, 10);
    global.lastWorkerId = Math.max(id, global.lastWorkerId);
  }
}
