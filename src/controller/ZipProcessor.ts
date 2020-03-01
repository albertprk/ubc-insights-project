import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import * as JSZip from "jszip";
import Dataset from "./Dataset";
import Log from "../Util";
import {stringify} from "querystring";


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
            const parsedHTML = parse5.parse(content);
            const table = this.findTable(parsedHTML);
            const dataset = this.processTable(table);
            resolve(dataset);
        });
    }

    // TODO: This function isn't quite right I'm missing something. Welp.
    private findTable(parsedHTML: any): any {
        let current = parsedHTML;
        if (parsedHTML["nodeName"] === "tbody") {
            Log.trace(current["nodeName"]);
            return current;
        } else {
            Log.trace(parsedHTML);
            let next = parsedHTML["childNodes"];
            for (let node of next) {
                this.findTable(node);
            }
        }
    }

    private processTable(table: any): any {
        // TODO
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
