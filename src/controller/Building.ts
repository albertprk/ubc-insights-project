import {InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import Room from "./Room";
import * as JSZip from "jszip";
import Dataset from "./Dataset";
import Log from "../Util";

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

    public getRooms(): Promise<Room[]> {
        const parse5 = require("parse5");
        return new Promise((resolve, reject) => {
            let zipFile: JSZip = new JSZip();
            let rooms: Room[] = [];
            let parsedHTML: any;
            let buildingLink = this.link;
            buildingLink = buildingLink.replace(".", "rooms");
            zipFile.loadAsync(this.content, {base64: true}).then((files) => {
                files.file(buildingLink).async("text").then((html: string) => {
                    parsedHTML = parse5.parse(html);
                }).then(() => {
                    let table = this.findTable(parsedHTML);
                    resolve(rooms);
                });
            }).catch((err) => {
                reject(err);
            });
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
}
