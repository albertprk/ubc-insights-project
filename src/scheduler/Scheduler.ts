import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";
import Log from "../Util";

export default class Scheduler implements IScheduler {

    public TIME_SLOTS: TimeSlot[] = ["MWF 0800-0900", "MWF 0900-1000", "MWF 1000-1100",
    "MWF 1100-1200", "MWF 1200-1300", "MWF 1300-1400",
    "MWF 1400-1500", "MWF 1500-1600", "MWF 1600-1700",
    "TR  0800-0930", "TR  0930-1100", "TR  1100-1230",
    "TR  1230-1400", "TR  1400-1530", "TR  1530-1700"];

    public schedule(sections: SchedSection[],
                    rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        sections.sort((a: SchedSection, b: SchedSection) => {
          return this.getClassSize(b) - this.getClassSize(a);
        });

        rooms.sort((a: SchedRoom, b: SchedRoom) => {
          return b.rooms_seats - a.rooms_seats;
        });

        let roomTracker: Record<TimeSlot, Record<string, any[]>> = {
          "MWF 0800-0900": {classes : [], rooms: []},
          "MWF 0900-1000": {classes : [], rooms: []},
          "MWF 1000-1100": {classes : [], rooms: []},
          "MWF 1100-1200": {classes : [], rooms: []},
          "MWF 1200-1300": {classes : [], rooms: []},
          "MWF 1300-1400": {classes : [], rooms: []},
          "MWF 1400-1500": {classes : [], rooms: []},
          "MWF 1500-1600": {classes : [], rooms: []},
          "MWF 1600-1700": {classes : [], rooms: []},
          "TR  0800-0930": {classes : [], rooms: []},
          "TR  0930-1100": {classes : [], rooms: []},
          "TR  1100-1230": {classes : [], rooms: []},
          "TR  1230-1400": {classes : [], rooms: []},
          "TR  1400-1530": {classes : [], rooms: []},
          "TR  1530-1700": {classes : [], rooms: []}};

        // TODO: Error checking if no rooms
        let result: Array<[SchedRoom, SchedSection, TimeSlot]> = [];
        return this.backtrackingSearch(sections, rooms, result, rooms[0], roomTracker);
    }

    private backtrackingSearch(sections: SchedSection[], rooms: SchedRoom[],
                               result:  Array<[SchedRoom, SchedSection, TimeSlot]>,
                               currentRoom: SchedRoom,
                               roomTracker: Record<TimeSlot, Record<string, any[]>>):
                               Array<[SchedRoom, SchedSection, TimeSlot]> {

        if (sections.length === 0 || rooms.length === 0) {
          Log.info(result);
          return result;
        }

        Log.info(sections);

        const currentSection = sections[0];
        const validRooms: SchedRoom[] = rooms.filter((room) => {
          return room.rooms_seats >= this.getClassSize(currentSection);
        });

        validRooms.sort((a: SchedRoom, b: SchedRoom) => {
          return this.getDistance(currentRoom, a) - this.getDistance(currentRoom, b);
        });

        for (let room of validRooms) {
          for (let slot of this.TIME_SLOTS) {
            if (this.isValidSectionTime(currentSection, slot, roomTracker)
                && this.isValidRoomSlot(room, slot, roomTracker)) {
                  let currentResult: [SchedRoom, SchedSection, TimeSlot] =
                  [room, currentSection, slot];
                  result.push(currentResult);

                  roomTracker[slot]["classes"].push(this.getClassName(currentSection));
                  roomTracker[slot]["rooms"].push(this.getRoomName(room));
                  let schedule = this.backtrackingSearch(sections.slice(1),
                                 rooms, result, room, roomTracker);

                  if (schedule.length !== 0) {
                    Log.info("My schedule is not length 0");
                    return schedule;
                  } else {
                    result.pop();
                    roomTracker[slot]["classes"].pop();
                    roomTracker[slot]["rooms"].pop();
                  }
                }
          }
        }

        return [];
    }

    private isValidRoomSlot(room: SchedRoom, slot: TimeSlot, roomTracker: any): boolean {
      if (roomTracker[slot]["rooms"].indexOf(this.getRoomName(room)) > -1) {
        return false;
      } else {
        return true;
      }
    }

    private isValidSectionTime(section: SchedSection,
                               slot: TimeSlot, roomTracker: any): boolean {
      if (roomTracker[slot]["classes"].indexOf(this.getClassName(section)) > -1) {
        return false;
      } else {
        return true;
      }
    }

    private getClassSize(section: SchedSection): number {
      return section.courses_audit + section.courses_fail + section.courses_pass;
    }

    private getClassName(section: SchedSection): string {
      return section.courses_dept + section.courses_id;
    }

    private getRoomName(room: SchedRoom): string {
      return room.rooms_shortname + room.rooms_number;
    }

    private getDistance(origin: SchedRoom, destination: SchedRoom): number {
      const metres: number = 6371e3;
      const originLat: number = this.toRadians(origin.rooms_lat);
      const destLat: number = this.toRadians(destination.rooms_lat);
      const combinedLat: number = this.toRadians(destination.rooms_lat - origin.rooms_lat);
      const combinedLon: number = this.toRadians(destination.rooms_lon - origin.rooms_lon);

      const a = Math.sin(combinedLat / 2) * Math.sin(combinedLat / 2) +
            Math.cos(originLat) * Math.cos(destLat) *
            Math.sin(combinedLon / 2) * Math.sin(combinedLon / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return metres * c;
    }

    private toRadians(address: number): number {
      return address * (Math.PI / 180);
    }


}
