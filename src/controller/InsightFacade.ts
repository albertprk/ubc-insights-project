import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import * as JSZip from "jszip";
import Dataset from "./Dataset";
import Section from "./Section";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    public datasets: Map<string, Dataset>;

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.datasets = new Map();
    }

    public addDataset(
        id: string,
        content: string,
        kind: InsightDatasetKind,
    ): Promise<string[]> {
        if (id === null || id === undefined || content === null || content === undefined || kind === null ||
            kind === undefined) {
            return new Promise((resolve, reject) => {
                reject(new InsightError("Error: function parameters can not be null or undefined"));
            });
        }
        if (id.includes("_") || !id.replace(/\s/g, "").length) {
            return new Promise((resolve, reject) => {
                reject(new InsightError("Error: ID must not contain underscore or be whitespace"));
            });
        }
        if (Array.from(this.datasets.keys()).includes(id)) {
            return new Promise((resolve, reject) => {
                reject(new InsightError("Error: A dataset with the given ID has already been added."));
            });
        }
        if (kind === InsightDatasetKind.Rooms) {
            return new Promise((resolve, reject) => {
                reject(new InsightError("Error: InsightDatasetKind of rooms is not currently supported"));
            });
        }
        return new Promise((resolve, reject) => {
            let datasetNames: string[] = [];
            try {
                let dataset: Dataset = this.processZipContent(id, content, kind);
                this.datasets.set(id, dataset);
            } catch {
                throw new InsightError("Error: Problem processing the data zip. Ensure the content given" +
                    "is a valid ZIP file.");
            }
            resolve(Array.from(this.datasets.keys()));
        });
    }

    private processZipContent(id: string, content: string, kind: InsightDatasetKind): Dataset {
        let zipFile: JSZip = new JSZip();
        let dataset: Dataset = new Dataset(id, kind);
        zipFile.loadAsync(content, {base64: true}).then((files) => {
            files.folder("courses").forEach((file) => {
                if (/^[\],:{}\s]*$/.test(file.replace(/\\["\\\/bfnrtu]/g, "@").
                replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]").
                replace(/(?:^|:|,)(?:\s*\[)+/g, ""))) {
                    files.folder("courses").file(file).async("text").then((result: string) => {
                        let jsonFile = JSON.parse(result);
                        let results = jsonFile["result"];
                        for (let section of results) {
                            let newSection: Section = new Section(section);
                            dataset.addSection(newSection);
                        }
                    });
                } else {
                    throw new InsightError("Error: file is not valid JSON");
                }
            });
        }).catch((err) => {
            return err;
        });
        return dataset;
    }

    private processSection(object: string) {
        Log.trace(object);
    }

    public removeDataset(id: string): Promise<string> {
        return Promise.reject("Not implemented.");
    }

    public performQuery(query: any): Promise<any[]> {
        return Promise.reject("Not implemented.");
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.reject("Not implemented.");
    }
}

