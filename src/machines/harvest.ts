// import { setup, assign } from "xstate";
// import { machine as movingMachine } from "./moving";

// type ContextHarvester = {
//   tries: number;
// };

// export const machine = setup({
//   types: {
//     context: {} as ContextHarvester,
//     events: {} as
//       // | { type: "MOVE" },
//         | { type: "TRY" }
//         | { type: "ERR_FAR" }
//         | { type: "ERR_FULL" }
//         | { type: "ERR_NEAR" }
//         | { type: "ERR_EMPTY" }
//         | { type: "ERR_NO_RECYCLE" },
//   },
//   actions: {
//     resetTries: assign({
//       tries: 3,
//     }),
//   },
//   guards: {
//     TRIES_LT_3: ({ context, event }, params) => {
//       if (context.tries) {
//         return {
//           count: --context.tries,
//         };
//       }
//       context.tries = 0;
//       return false;
//     },
//   },
// }).createMachine({
//   context: {
//     tries: 3,
//   },
//   id: "harvester",
//   initial: "idling",
//   states: {
//     idling: {
//       on: {
//         TRY: {
//           target: "harvesting",
//         },
//       },
//     },
//     harvesting: {
//       on: {
//         ERR_EMPTY: {
//           target: "depositing",
//         },
//       },
//     },
//     depositing: {
//       on: {
//         ERR_FAR: {
//           target: "moving",
//         },
//         ERR_FULL: [
//           {
//             target: "depositing",
//             guard: {
//               type: "TRIES_LT_3",
//             },
//           },
//           {
//             target: "recycling",
//           },
//         ],
//         ERR_EMPTY: {
//           target: "idling",
//         },
//       },
//       entry: {
//         type: "resetTries",
//       },
//       exit: {
//         type: "resetTries",
//       },
//     },
//     moving: {
//       on: {
//         move: {},
//       },
//     },
//     recycling: {
//       on: {
//         ERR_NO_RECYCLE: {
//           target: "ded",
//         },
//       },
//     },
//     ded: {},
//   },
// });
