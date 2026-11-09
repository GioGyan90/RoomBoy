import type {RoomLayout} from "../../../game/rooms";
export const cruiseLayout:RoomLayout={
 half:6.1,
 spawn:{x:.5,z:2.85,rot:Math.PI},
 desk:{stand:{x:3.3,z:2.55,rot:Math.PI},sit:{x:3.55,z:.94,rot:Math.PI,bodyY:.59}},
 bed:{stand:{x:-1.05,z:1.18,rot:0},sit:{x:-1.05,z:.45,rot:0,bodyY:.88},lie:{x:-1.05,z:-1.85,rot:0,bodyY:.88}},
 toilet:{stand:{x:-2.82,z:2.56,rot:0},sit:{x:-3.35,z:3.1,rot:0,bodyY:.71}}
};
