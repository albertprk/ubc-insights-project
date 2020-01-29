import Log from "../Util";
import * as fs from "fs";
import * as path from "path";
import * as JSZip from "jszip";
import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
} from "./IInsightFacade";
import QueryValidator from "./QueryValidator";
import ParsingTree from "./ParsingTree";
import TreeNode from "./TreeNode";
import {
    InsightError,
    NotFoundError,
    ResultTooLargeError,
} from "./IInsightFacade";
import Dataset from "./Dataset";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */

export default class InsightFacade implements IInsightFacade {
    public datasets: Map<string, Dataset>;
    private dataFolder: string = path.join(__dirname, "/data");
    private dataSet: Dataset;

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.datasets = new Map();
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        if (id === null || typeof id === "undefined" || content === null || typeof content === "undefined" ||
            kind === null || typeof kind === "undefined") {
            return new Promise((resolve, reject) => {
                reject(new InsightError(
                        "Error: function parameters can not be null or undefined")
                );
            });
        }
        if (id.includes("_") || !id.replace(/\s/g, "").length) {
            return new Promise((resolve, reject) => {
                reject(new InsightError(
                        "Error: ID must not contain underscore or be whitespace",
                    ),
                );
            });
        }
        if (Array.from(Object.keys(this.datasets)).includes(id)) {
            return new Promise((resolve, reject) => {
                reject(new InsightError(
                        "Error: A dataset with the given ID has already been added.",
                    ),
                );
            });
        }
        if (kind === InsightDatasetKind.Rooms) {
            return new Promise((resolve, reject) => {
                reject(new InsightError(
                        "Error: InsightDatasetKind of rooms is not currently supported",
                    ),
                );
            });
        }
        return new Promise((resolve, reject) => {
            let datasetNames: string[] = [];
            try {
                let dataset: Dataset;
                this.processZipContent(id, content, kind).then((result) => {
                  dataset = result;
                });
            } catch {
                throw new InsightError(
                    "Error: Problem processing the data zip. Ensure the content given" +
                        "is a valid ZIP file.",
                );
            }
            resolve(Array.from(this.datasets.keys()));
        });
    }

    // Todo: <PROJECT_DIRECTORY>/DATA
    // TODO: Add guard
    private processZipContent(id: string, content: string, kind: InsightDatasetKind): Promise<Dataset> {
      return new Promise((resolve, reject) => {
        let zipFile: JSZip = new JSZip();
        zipFile
            .loadAsync(content, { base64: true })
            .then((files) => {
                let promises: Array<Promise<string>> = [];
                files.folder("courses").forEach((file) => {
                        promises.push(files
                            .folder("courses")
                            .file(file)
                            .async("text")
                            );
                });

                return Promise.all(promises);
            }).then((sectionPromises: string[]) => {
                  let dataset: Dataset = new Dataset(id, kind);
                  sectionPromises.forEach((sectionPromise: string) => {
                    let jsonFile = JSON.parse(sectionPromise);
                    let results = jsonFile["result"];
                    for (let section of results) {
                        dataset.addSection(section);
                    }
                  });

                  return dataset;
            }).then((data: Dataset) => {
              this.datasets.set(id, data);
              resolve(data);
            })

            .catch((err) => {
                reject(err);
            });
          });
    }

    private processSection(object: string) {
        Log.trace(object);
    }

    public removeDataset(id: string): Promise<string> {
        return Promise.reject("Not implemented.");
    }

    // TO DO: validQuery not catching everything
    public performQuery(query: any): Promise<any[]> {
        let dataFolder: string = path.join(__dirname, "/data");
        return new Promise((resolve, reject) => {
            let validator: QueryValidator = new QueryValidator();
            const dataSetName: string = validator.determineDataset(query);
            if (dataSetName === null || !validator.isValidQuery(query, dataSetName)) {
                reject(new InsightError("Invalid query name"));
            }

            let content: Buffer;
            let fileContent: string;

            try {
                const filePath = path.join(
                    dataFolder,
                    "/" + dataSetName + ".zip",
                );
                content = fs.readFileSync(filePath);
                fileContent = content.toString("base64");
            } catch (err) {
                reject(new InsightError("Unable to load file"));
            }

            this.addDataset(dataSetName, fileContent, InsightDatasetKind.Courses)
                .catch((err: any) => {
                    if (!Array.from(this.datasets.keys()).includes(dataSetName)) {
                        reject(new InsightError("Invalid dataset"));
                    }
                })
                .then((result: string[]) => {
                    try {
                        result = this.findQueryResults(query, dataSetName);
                        resolve(result);
                    } catch {
                        reject(new ResultTooLargeError());
                    }
                });
        });
    }

    private findQueryResults(query: any, dataSetName: string): any[] {
        try {
            let parsingTree: ParsingTree = new ParsingTree();
            const tree: TreeNode = parsingTree.createTreeNode(query["WHERE"]);
            let result: any[] = parsingTree.searchSections(
                this.datasets.get(dataSetName),
                tree,
                query["OPTIONS"]["COLUMNS"],
            );
            result = parsingTree.sortSections(result, query);
            return result;
        } catch {
            throw new ResultTooLargeError();
        }
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.reject("Not implemented.");
    }
}
