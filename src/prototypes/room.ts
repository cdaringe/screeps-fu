import { Plan } from "../plan/mod";

declare global {
  interface Room {
    // properties
    plan: Plan;

    // methods
    getRecentEnergyRate(): number;
    getRoomEnergyConsumption(): number;
    unharvestedEnergy(): number;
    updateEnergyRateHistory(): void;
  }
}

Room.prototype.unharvestedEnergy = function () {
  return this.find(FIND_SOURCES)
    .map(v => v.energy)
    .sum();
};

Room.prototype.getRoomEnergyConsumption = function () {
  // active creeps rate (creeps don't actively use energy)
  // room.find(FIND_MY_CREEPS).map(v => v.)
  // spawn rate
  const spawnEnergy = this.find(FIND_MY_SPAWNS)
    .map(s => {
      const spawning = s.spawning;
      if (spawning) {
        // 3 ticks per body part
        // spawning.name
        return 1; // @todo no idea
      } else {
        return 0;
      }
    })
    .sum();
  // weapons rate
  const weaponsEnergy = 0;
  return spawnEnergy + weaponsEnergy;
};

Room.prototype.getRecentEnergyRate = function () {
  const rmem = Memory.rooms[this.name];
  return rmem ? rmem.energyRateHistory.sum() / rmem.energyRateHistory.length : 0;
};

Room.prototype.updateEnergyRateHistory = function () {
  this.memory.energyRateHistory.push(this.getRoomEnergyConsumption());
  if (this.memory.energyRateHistory.length > 120) {
    this.memory.energyRateHistory.shift();
  }
};

export {};
