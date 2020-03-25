import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";
import Log from "../Util";

export default class Scheduler implements IScheduler {

    public TIME_SLOTS: TimeSlot[] = ["MWF 0800-0900", "MWF 0900-1000", "MWF 1000-1100",
    "MWF 1100-1200", "MWF 1200-1300", "MWF 1300-1400",
    "MWF 1400-1500", "MWF 1500-1600", "MWF 1600-1700",
    "TR  0800-0930", "TR  0930-1100", "TR  1100-1230",
    "TR  1230-1400", "TR  1400-1530", "TR  1530-1700"];

    private usedRooms: Record<string, TimeSlot[]> = {};
    private usedSectionTimes: Record<string, TimeSlot[]> = {};

    public schedule(sections: SchedSection[],
                    rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        sections.sort((a: SchedSection, b: SchedSection) => {
          return this.getClassSize(b) - this.getClassSize(a);
        });

        rooms.sort((a: SchedRoom, b: SchedRoom) => {
          return b.rooms_seats - a.rooms_seats;
        });

        let result: Array<[SchedRoom, SchedSection, TimeSlot]> = [];
        return this.backtrackingSearch(sections, rooms, result, rooms[0]);
    }

    private backtrackingSearch(sections: SchedSection[], rooms: SchedRoom[],
                               result:  Array<[SchedRoom, SchedSection, TimeSlot]>,
                               currentRoom: SchedRoom):
                               Array<[SchedRoom, SchedSection, TimeSlot]> {

        if (sections.length === 0 || rooms.length === 0) {
          return result;
        }

        const currentSection = sections[0];
        const classSize: number = this.getClassSize(currentSection);

        for (let room of rooms) {
          if (room.rooms_seats >= classSize && this.isValidRoom(room)
          && this.isValidTime(currentSection)) {
            let timeSlot = this.getTimeSlot(currentSection, room);
            if (timeSlot !== null) {
              let currentResult: [SchedRoom, SchedSection, TimeSlot] =
              [room, currentSection, timeSlot];
              result.push(currentResult);
              let schedule = this.backtrackingSearch(sections.slice(1),
                                                     rooms,
                                                     result,
                                                     room);
              if (schedule.length !== 0) {
                return schedule;
              } else {
                result.pop();
                this.addTimesBack(currentSection, room, timeSlot);
              }
            }
          }
        }

        // for (let room of rooms) {
        //   for (let slot of this.TIME_SLOTS) {
        //     if (this.isValidSectionTime(currentSection, slot, roomTracker)
        //         && this.isValidRoomSlot(room, slot, roomTracker)
        //         && room.rooms_seats >= classSize) {
        //           let currentResult: [SchedRoom, SchedSection, TimeSlot] =
        //           [room, currentSection, slot];
        //           result.push(currentResult);
        //
        //           roomTracker[slot]["classes"].push(this.getClassName(currentSection));
        //           roomTracker[slot]["rooms"].push(this.getRoomName(room));
        //           let schedule = this.backtrackingSearch(sections.slice(1),
        //                          rooms, result, room, roomTracker);
        //
        //           if (schedule.length !== 0) {
        //             return schedule;
        //           } else {
        //             result.pop();
        //             roomTracker[slot]["classes"].pop();
        //             roomTracker[slot]["rooms"].pop();
        //           }
        //         }
        //   }
        // }

        return [];
    }

    private addTimesBack(section: SchedSection, room: SchedRoom, slot: TimeSlot): void {
      this.usedRooms[this.getRoomName(room)].push(slot);
      this.usedSectionTimes[this.getClassName(section)].push(slot);
    }

    private isValidRoom(room: SchedRoom): boolean {
      let name: string = room.rooms_shortname + room.rooms_number;

      if (typeof this.usedRooms[name] === "undefined") {
        this.usedRooms[name] = [...this.TIME_SLOTS];
        return true;
      } else if (this.usedRooms[name].length === 0) {
        return false;
      } else {
        return true;
      }
    }

    private isValidTime(section: SchedSection): boolean {
      let name: string = this.getClassName(section);
      if (typeof this.usedSectionTimes[name] === "undefined") {
        this.usedSectionTimes[name] = [...this.TIME_SLOTS];
        return true;
      } else if (this.usedSectionTimes[name].length === 0) {
        return false;
      } else {
        return true;
      }
    }

    private getTimeSlot(section: SchedSection, room: SchedRoom): TimeSlot {
      let sectionName = this.getClassName(section);
      let roomName = this.getRoomName(room);
      let index: number = null;

      for (let i = 0; i < this.usedRooms[roomName].length; i++) {
        index = this.usedSectionTimes[sectionName].indexOf(this.usedRooms[roomName][i]);
        if (index > -1) {
          let result: TimeSlot = this.usedRooms[roomName][i];
          this.usedSectionTimes[sectionName].splice(index, 1);
          this.usedRooms[roomName].splice(i, 1);
          return result;
        }
      }

      return null;
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
