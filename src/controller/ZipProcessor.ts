import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import * as JSZip from "jszip";
import Dataset from "./Dataset";
import Log from "../Util";
import {stringify} from "querystring";
import Room from "./Room";
import * as fs from "fs";


export default class ZipProcessor {
    public id: string;
    public content: string;
    public kind: InsightDatasetKind;

    constructor(id: string, content: string, kind: InsightDatasetKind) {
        this.id = id;
        this.content = content;
        this.kind = kind;
    }

    public processZipContent(): Promise<Dataset> {
        return new Promise((resolve, reject) => {
            let zipFile: JSZip = new JSZip();
            zipFile.loadAsync(this.content, {base64: true}).then((files) => {
                    let promises: Array<Promise<string>> = [];
                    files.folder("courses").forEach((file) => {
                        promises.push(
                            files
                                .folder("courses")
                                .file(file)
                                .async("text"),
                        );
                    });
                    return Promise.all(promises);
                }).then((sectionPromises: string[]) => {
                    if (sectionPromises.length === 0) {
                        reject(new InsightError("No courses files in dataset."));
                    }

                    let dataset: Dataset = new Dataset(this.id, this.kind);
                    sectionPromises.forEach((sectionPromise: string) => {
                        try {
                            let jsonFile = JSON.parse(sectionPromise);
                            let results = jsonFile["result"];
                            for (let section of results) {
                                if (this.isValidSection(section)) {
                                    dataset.addSection(section);
                                }
                            }
                        } catch (err) {
                            Log.info("Caught invalid JSON file");
                        }
                    });

                    if (dataset.sections.length === 0) {
                        reject(new InsightError("No valid course sections"));
                    }
                    resolve(dataset);
                });
        });
    }

    public processRoomsZipContent(id: string, content: string, kind: InsightDatasetKind): Promise<Dataset> {
        const parse5 = require("parse5");
        return new Promise((resolve, reject) => {
            let zipFile: JSZip = new JSZip();
            let dataset = new Dataset(id, kind);
            let parsedHTML: any;
            zipFile.loadAsync(content, {base64: true}).then((files) => {
                files.folder("rooms").file("index.htm").async("text").then((html: string) => {
                    parsedHTML = parse5.parse(html);
                }).then(() => {
                    let htmlTable = this.findTable(parsedHTML);
                    this.obtainBuildingData(htmlTable);
                    resolve(dataset);
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

    private obtainBuildingData(table: any): any {
        const rooms = table["childNodes"];
        for (let room of rooms) {
            if (room["nodeName"] !== "#text") {
                const data = room["childNodes"];
                let buildingCode = data[3]["childNodes"][0]["value"];
                let buildingName = data[5]["childNodes"][1]["childNodes"][0]["value"];
                let address = data[7]["childNodes"][0]["value"];
                let link = data[9]["childNodes"][1]["attrs"][0]["value"];
                let newRoom = this.obtainRoomInfo(buildingCode, buildingName, address, link);
            }
        }
    }

    private obtainRoomInfo(buildingCode: string, buildingName: string, address: string, link: string): Room {
        return null;
    }

    private isValidSection(section: any): boolean {
        const keys: string[] = ["Avg", "Audit", "Fail", "Pass", "Subject", "Course",
            "Professor", "Title", "id"];
        for (let key of keys) {
            if (typeof section[key] === "undefined") {
                return false;
            }
        }
        return true;
    }
}
