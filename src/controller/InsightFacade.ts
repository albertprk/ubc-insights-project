import Log from "../Util";
import * as fs from "fs";
import * as path from "path";
import * as JSZip from "jszip";
import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import QueryValidator from "./QueryValidator";
import ParsingTree from "./ParsingTree";
import TreeNode from "./TreeNode";
import { InsightError, NotFoundError, ResultTooLargeError } from "./IInsightFacade";
import Dataset from "./Dataset";
import Section from "./Section";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */

export default class InsightFacade implements IInsightFacade {
    public datasets: Map<string, Dataset>;

const dataFolder: string = path.join(__dirname, "/data");
export default class InsightFacade implements IInsightFacade {
    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.datasets = new Map();
    }

    public addDataset(
        id: string,
        content: string,
        kind: InsightDatasetKind,
    ): Promise<string[]> {
        if (id === null || typeof id === "undefined" || content === null ||
        typeof content === "undefined" || kind === null || typeof kind === "undefined") {
            return new Promise((resolve, reject) => {
                reject(new InsightError("Error: function parameters can not be null or undefined"));
            });
        }
        if (id.includes("_") || !id.replace(/\s/g, "").length) {
            return new Promise((resolve, reject) => {
                reject(new InsightError("Error: ID must not contain underscore or be whitespace"));
            });
        }
        if (Array.from(Object.keys(this.datasets)).includes(id)) {
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

    // Todo: <PROJECT_DIRECTORY>/DATA
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
      // return new Promise((resolve, reject) => {
      //   let validator: QueryValidator = new QueryValidator();
      //   const dataSetName: string = validator.determineDataset(query);
      //   if (dataSetName === null || !validator.isValidQuery(query, dataSetName)) {
      //       reject(new InsightError("Invalid query"));
      //   }
      //
      //   let content: string;
      //
      //   try {
      //     const filePath = path.join(dataFolder, "/" + dataSetName);
      //     content = fs.readFileSync(filePath).toString();
      //   } catch {
      //     reject(new InsightError("Invalid query"));
      //   }
      //
      //   this.addDataset(dataSetName, content, InsightDatasetKind.Courses)
      //     .catch((err: any) => {
      //       if (typeof this.datasets[dataSetName] === "undefined") {
      //           reject(new InsightError("Invalid dataset"));
      //       }
      //     }).then((result: string[]) => {
      //       try {
      //         result = this.findQueryResults(query);
      //         resolve(result);
      //       } catch {
      //         reject(new ResultTooLargeError())
      //       }
      //
      //     });
      // });
        return Promise.reject("Not implemented.");
    }

    // private findQueryResults(query: any): any[] {
    //   try {
    //       let parsingTree: ParsingTree = new ParsingTree();
    //       const tree: TreeNode = parsingTree.createTreeNode(query);
    //       let result: any[] = parsingTree.searchSections(this.datasets[dataSetName],
    //                                                         tree, query["OPTIONS"]["COLUMNS"]);
    //       result = parsingTree.sortSections(result, query);
    //       return result;
    //     } catch {
    //       throw new ResultTooLargeError();
    //     }
    // }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.reject("Not implemented.");
    }
}
