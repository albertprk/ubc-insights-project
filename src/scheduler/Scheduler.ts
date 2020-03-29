import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";
import Log from "../Util";

export default class Scheduler implements IScheduler {

    public TIME_SLOTS: TimeSlot[] = ["MWF 0800-0900", "MWF 0900-1000", "MWF 1000-1100",
    "MWF 1100-1200", "MWF 1200-1300", "MWF 1300-1400",
    "MWF 1400-1500", "MWF 1500-1600", "MWF 1600-1700",
    "TR  0800-0930", "TR  0930-1100", "TR  1100-1230",
    "TR  1230-1400", "TR  1400-1530", "TR  1530-1700"];

    private allRooms: Array<Record<string, Record<string, any>>> = [];
    private usedSectionTimes: Record<string, TimeSlot[]> = {};

    public schedule(sections: SchedSection[],
                    rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        sections.sort((a: SchedSection, b: SchedSection) => {
          return this.getClassSize(b) - this.getClassSize(a);
        });

        rooms.sort((a: SchedRoom, b: SchedRoom) => {
          return b.rooms_seats - a.rooms_seats;
        });

        rooms.forEach((room: SchedRoom) => {
          let roomName: string = this.getRoomName(room);
          let object: Record<string, Record<string, any>> = {};
          object[roomName] = {};
          object[roomName]["times"] = [...this.TIME_SLOTS];
          object[roomName]["room"] = room;
          this.allRooms.push(Object.assign({}, object));
        });

        let result: Array<[SchedRoom, SchedSection, TimeSlot]> = [];

        if (rooms.length === 0) {
          return result;
        }

        for (let section of sections) {
          let currentResult: [SchedRoom, SchedSection, TimeSlot] =
          this.getTimeSlot(section);

          if (currentResult !== null) {
            result.push(currentResult);
          }
        }

        return result;
    }

    private getTimeSlot(section: SchedSection): [SchedRoom, SchedSection, TimeSlot] {
      for (let j = 0; j < this.allRooms.length; j++) {
        let record = this.allRooms[j];
        let key = Object.keys(record)[0];
        for (let i = 0; i < record[key]["times"].length; i++) {
          if (this.isValidTime(section, record[key]["times"][i])) {
            let currentResult: [SchedRoom, SchedSection, TimeSlot] = [
              record[key]["room"], section, record[key]["times"][i]
            ];

            record[key]["times"].splice(i, 1);
            if (record[key]["times"].length === 0) {
              this.allRooms.splice(j, 1);
            }

            return currentResult;
          }
        }
        return null;

      }
    }

    private isValidTime(section: SchedSection, slot: TimeSlot): boolean {
      let name: string = this.getClassName(section);
      if (typeof this.usedSectionTimes[name] === "undefined") {
        this.usedSectionTimes[name] = [slot];
        return true;
      } else if (this.usedSectionTimes[name].indexOf(slot) > -1) {
        return false;
      } else {
        this.usedSectionTimes[name].push(slot);
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
