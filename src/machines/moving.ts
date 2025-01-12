import { setup, assign, createActor, Actor, AnyStateMachine } from "xstate";

interface ContextMoving {
  isNear: (it: RoomPosition) => boolean;
  moveTo: (it: RoomPosition) => number;
  stop: () => number;
  destination: RoomPosition;
}
enum State {
  Moving = "Moving",
  Stopped = "Stopped",
  AtDestination = "AtDestination",
  Halted = "Halted",
  StoppedNotAtDestination = "StoppedNotAtDestination",
  StoppedAtDestination = "StoppedAtDestination",
}

enum Event {
  Stop = "0",
  Move = "1",
}

export const machine = setup({
  types: {
    context: {} as ContextMoving,
    input: {} as ContextMoving,
    events: {} as
      | { type: Event.Stop; reason: number }
      | { type: Event.Move; destination: RoomPosition },
  },
  guards: {},
}).createMachine({
  context: ({ input }) => input,
  id: "movement",
  initial: State.Moving,
  states: {
    [State.Moving]: {
      entry: ({ context: { moveTo, isNear, destination }, event, self }) => {
        if (isNear(destination)) {
          self.send({ type: Event.Stop, reason: 0 });
          return;
        }
        if (event.type === Event.Move) {
          const reason = moveTo(event.destination);
          if (reason !== 0) {
            self.send({ type: Event.Stop, reason });
          }
          return;
        }
      },
      on: {
        [Event.Stop]: [
          {
            target: `#movement.${State.Stopped}.${State.StoppedAtDestination}`,
            guard: ({ context: { destination, isNear } }) =>
              isNear(destination),
          },
          {
            target: `#movement.${State.Stopped}.${State.StoppedNotAtDestination}`,
          },
        ],
      },
    },
    [State.Stopped]: {
      initial: State.StoppedNotAtDestination,
      on: {
        [Event.Move]: {
          target: State.Moving,
          actions: assign({
            destination: ({ event }) => event.destination,
          }),
        },
      },
      states: {
        [State.StoppedNotAtDestination]: {},
        [State.StoppedAtDestination]: {
          type: "final",
        },
      },
      onDone: State.Halted,
    },
    [State.Halted]: {
      type: "final",
    },
  },
});

let isNear = false;
const actor = createActor(machine, {
  input: {
    isNear: (_it: RoomPosition) => {
      return isNear;
    },
    moveTo: (_it: RoomPosition) => {
      return 0;
    },
    stop: () => 0,
    destination: {} as any,
  },
});

actor.start();

actor.send({ type: Event.Move, destination: "foo" as any });
console.log(report(actor));
actor.send({ type: Event.Stop, reason: 0 });
console.log(report(actor));
actor.send({ type: Event.Move, destination: "foo" as any });
console.log(report(actor));
actor.getPersistedSnapshot();
isNear = true;
actor.send({ type: Event.Stop, reason: 1 });
console.log(report(actor));

//

function report(actor: Actor<AnyStateMachine>) {
  const snapshot = actor.getSnapshot();
  const stateValue =
    typeof snapshot.value === "string"
      ? snapshot.value
      : Object.values(snapshot.value)[0]!;
  return `State: ${JSON.stringify(
    State[stateValue as keyof typeof State],
  )}, Status: ${snapshot.status}`;
}
