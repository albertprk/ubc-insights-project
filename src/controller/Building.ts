import {InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import Room from "./Room";
import * as JSZip from "jszip";
import Dataset from "./Dataset";
import Log from "../Util";
import * as http from "http";
import ZipProcessor from "./ZipProcessor";

export default class Building {

    public constructor() {
      Log.trace("Building::init()");
    }

    public static dealWithRoomCell(obj: any, cell: any): void {
      if (cell["attrs"].length === 0 || cell["childNodes"].length === 0) {
        return;
      }
      let classes = ZipProcessor.buildClassList(cell);

      if (classes.indexOf("views-field-field-room-number") > - 1) {
        let roomNumber = "";
        cell["childNodes"].forEach((c: any) => {
          if (c["nodeName"] === "a") {
            c["childNodes"].forEach((cn: any) => {
              if (cn["nodeName"] === "#text") {
                roomNumber = roomNumber + cn["value"];
              }
            });
          }
        });
        obj["number"] = roomNumber;
      } else if (classes.indexOf("views-field-field-room-capacity") > - 1) {
        let capacity: number = 0;

        cell["childNodes"].forEach((c: any) => {
          if (c["nodeName"] === "#text") {
            let amountOfseats = c["value"].trim();
            capacity = parseInt(amountOfseats, 10);
          }
        });
        obj["seats"] = capacity;
      } else if (classes.indexOf("views-field-field-room-furniture") > - 1) {
        let furniture = "";
        cell["childNodes"].forEach((c: any) => {
          if (c["nodeName"] === "#text") {
            furniture = c["value"].trim();
          }
        });

        obj["furniture"] = furniture;
      } else if (classes.indexOf("views-field-field-room-type") > - 1) {
        let type = "";
        cell["childNodes"].forEach((c: any) => {
          if (c["nodeName"] === "#text") {
            type = c["value"].trim();
          }
        });

        obj["type"] = type;
      }
    }
  }
