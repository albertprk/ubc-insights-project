import {InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import Room from "./Room";
import * as JSZip from "jszip";
import Dataset from "./Dataset";
import Log from "../Util";
import * as http from "http";

export default class Building {
    public content: string;
    public buildingCode: string;
    public buildingName: string;
    public address: string;
    public link: string;

    public constructor(content: string, buildingCode: string, buildingName: string, address: string, link: string) {
        this.content = content;
        this.buildingCode = buildingCode;
        this.buildingName = buildingName;
        this.address = address;
        this.link = link;
    }

    public getRooms(): any {
        const parse5 = require("parse5");
        return new Promise((resolve, reject) => {
            let zipFile: JSZip = new JSZip();
            let parsedHTML: any;
            let buildingLink = this.link;
            buildingLink = buildingLink.replace(".", "rooms");
            zipFile.loadAsync(this.content, {base64: true}).then((files) => {
                files.file(buildingLink).async("text").then((html: string) => {
                    parsedHTML = parse5.parse(html);
                }).then(() => {
                    let table = this.findTable(parsedHTML);
                    resolve(this.processRooms(table));
                });
            }).catch((err) => {
                reject(err);
            });
        }).catch((err) => {
            throw err;
        });
    }

    private findTable(parsedHTML: any): any {
        if (parsedHTML["nodeName"] === "tbody") {
            return parsedHTML;
        } else {
            if (!parsedHTML.hasOwnProperty("childNodes") || parsedHTML["childNodes"].length === 0 ||
                typeof parsedHTML["childNodes"] === undefined) {
                return null;
            }
            let count = 0;
            while (count < parsedHTML["childNodes"].length) {
                let result = this.findTable(parsedHTML["childNodes"][count]);
                if ((result !== null) && (result !== undefined)) {
                    return result;
                }
                count++;
            }
        }
    }

    private processRooms(table: any): Promise<Room[]> {
        try {
            let roomsReturn: Room[] = [];
            let roomsList: any = [];
            roomsList = table["childNodes"];
            for (let room of roomsList) {
                try {
                    if (room["nodeName"] !== "#text") {
                        let newRoom: Room;
                        let roomNum: number = room["childNodes"][1]["childNodes"][1]["childNodes"][0]["value"];
                        let roomCap: number = room["childNodes"][3]["childNodes"][0]["value"].substring(2).trim();
                        let furniture: string = room["childNodes"][5]["childNodes"][0]["value"].substring(2).trim();
                        let roomType: string = room["childNodes"][7]["childNodes"][0]["value"].substring(2).trim();
                        let roomsName: string = this.buildingCode + "_" + roomNum;
                        let lon: number;
                        let lat: number;
                        let queryAddress: string = this.address;
                        newRoom = new Room(this.buildingName, this.buildingCode, roomNum, roomsName, this.address,
                            roomCap, roomType, furniture, this.link);
                        while (queryAddress.includes(" ")) {
                            queryAddress = queryAddress.replace(" ", "%");
                        }
                        http.get("http://cs310.students.cs.ubc.ca:11316/api/v1/project_team136/" +
                                "1822%East%Mall%V6T&1Z1", (res: any) => {
                                    Log.trace("!!!!!!");
                        });
                        roomsReturn.push(newRoom);
                    }
                } catch {
                    //
                }
            }
            return Promise.resolve(roomsReturn);
        } catch (err) {
            //
        }
    }
}
