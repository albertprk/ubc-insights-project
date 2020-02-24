import Log from "../Util";
import * as fs from "fs";
import * as path from "path";
import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError,
    ResultTooLargeError
} from "./IInsightFacade";
import QueryValidator from "./QueryValidator";
import ParsingTree from "./ParsingTree";
import TreeNode from "./TreeNode";
import Dataset from "./Dataset";
import ZipProcessor from "./ZipProcessor";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */

export default class InsightFacade implements IInsightFacade {
    public datasets: Map<string, Dataset>;
    private dataFolder: string;

    constructor() {
        this.dataFolder = __dirname + "/../../data";
        if (!fs.existsSync(this.dataFolder)) {
            try {
                fs.mkdirSync(this.dataFolder);
            } catch (err) {
                Log.error(err);
            }
        }
        this.datasets = new Map();
        Log.trace("InsightFacadeImpl::init()");
    }

    private loadDatasetsFromMemory(): Promise<string[][]> {
        const allFiles = fs.readdirSync(this.dataFolder);
        let promises: Array<Promise<string[]>> = [];
        allFiles.forEach((file) => {
            const content = fs.readFileSync(
                path.join(this.dataFolder, "/", file),
            );
            const index: number = file.indexOf(".zip");
            promises.push(
                this.addDataset(file.substring(0, index),
                    content.toString("base64"),
                    InsightDatasetKind.Courses,
                ),
            );
        });

        return new Promise((resolve, reject) => {
            resolve(Promise.all(promises));
        });
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        if (id === null || typeof id === "undefined" || content === null || typeof content === "undefined" ||
            kind === null || typeof kind === "undefined") {
            return new Promise((resolve, reject) => {
                reject(new InsightError("Error: function parameters can not be null or undefined"));
            });
        }
        if (id.includes("_") || id.trim().length === 0) {
            return new Promise((resolve, reject) => {
                reject(new InsightError("Error: ID must not contain underscore or be whitespace"));
            });
        }
        if (Array.from(Object.keys(this.datasets)).includes(id)) {
            return new Promise((resolve, reject) => {
                reject(new InsightError("Error: A dataset with the given ID has already been added."));
            });
        }
        let filePath: string = path.join(this.dataFolder, "/" + id + ".zip");
        if (fs.existsSync(filePath)) {
            return new Promise((resolve, reject) => {
                reject(new InsightError("Error: Already exists"));
            });
        }
        if (typeof this.datasets.get(id) === "undefined" && !fs.existsSync(filePath)) {
            fs.writeFile(filePath, content, "base64", (err) => {
                if (err) {
                    return new Promise((resolve, reject) => {
                        reject(new InsightError("Unable to persist dataset"));
                    });
                }
            });
        }
        if (kind === InsightDatasetKind.Courses) {
            return this.returnCourses(id, content, kind);
        } else if (kind === InsightDatasetKind.Rooms) {
            return this.returnRooms(id, content, kind);
        } else {
            return new Promise((resolve, reject) => {
                reject(new InsightError("Invalid InsightDatasetsKind parameter: must be Courses OR Rooms"));
            });
        }
    }

    private returnCourses(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        let zipProcessor = new ZipProcessor(id, content, kind);
        return new Promise((resolve, reject) => {
            zipProcessor.processZipContent()
                .then((data: Dataset) => {
                    this.datasets.set(id, data);
                    resolve(Array.from(this.datasets.keys()));
                }).catch((err: any) => {
                    reject(new InsightError("Error: Problem processing the data zip. Ensure the content given" +
                            "is a valid ZIP file.")
                    );
                });
        });
    }

    private returnRooms(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        let zipProcessor = new ZipProcessor(id, content, kind);
        return new Promise((resolve, reject) => {
            zipProcessor.processRoomsZipContent(id, content, kind)
                .then((result: any) => {
                    resolve(result);
                }).catch((err) => {
                    reject(
                        new InsightError(
                            "Error: Problem processing the data zip. Ensure the content given" +
                            "is a valid ZIP file.")
                    );
                });
        });
    }

    public removeDataset(id: string): Promise<string> {
        return new Promise((resolve, reject) => {
            if (id === null) {
                reject(
                    new InsightError("Invalid input: cannot have a null dataset")
                );
            } else if (typeof this.datasets.get(id) === "undefined") {
                reject(new NotFoundError("Unable to find error"));
            }

            this.datasets.delete(id);
            const file: string = path.join(this.dataFolder, "/" + id + ".zip");

            fs.unlink(file, (err) => {
                if (err) {
                    reject(new InsightError("Unable to remove dataset"));
                } else {
                    resolve(id);
                }
            });
        });
    }

    public performQuery(query: any): Promise<any[]> {
        return new Promise((resolve, reject) => {
            let validator: QueryValidator = new QueryValidator();
            const dataSetName: string = validator.determineDataset(query);
            let filePath: string = path.join(
                this.dataFolder,
                "/" + dataSetName + ".zip",
            );
            if (dataSetName === null || !validator.isValidQuery(query, dataSetName)) {
                reject(new InsightError("Invalid query."));
            } else if (typeof this.datasets.get(dataSetName) === "undefined" &&
                !fs.existsSync(filePath)) {
                reject(new InsightError("Unable to find dataset"));
            }

            if (typeof this.datasets.get(dataSetName) === "undefined") {
                const content = fs.readFileSync(filePath);
                let zipProcessor = new ZipProcessor(dataSetName, content.toString("base64"),
                    InsightDatasetKind.Courses);
                zipProcessor.processZipContent().then((result: Dataset) => {
                    resolve(Array.from(this.datasets.keys()));
                })
                    .then((result) => {
                        resolve(this.findQueryResults(query, dataSetName));
                    })
                    .catch((err) => {
                        if (err instanceof ResultTooLargeError) {
                            reject(new ResultTooLargeError());
                        } else {
                            reject(
                                new InsightError(
                                    "Unable to load file from memory",
                                ),
                            );
                        }
                    });
            } else {
                try {
                    const result: any[] = this.findQueryResults(
                        query,
                        dataSetName,
                    );
                    resolve(result);
                } catch {
                    reject(new ResultTooLargeError());
                }
            }
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
        return new Promise((resolve, reject) => {
            let results: InsightDataset[] = [];

            try {
                this.datasets.forEach((value: Dataset, key: string) => {
                    results.push(value.insightDataset);
                });
                resolve(results);
            } catch {
                reject(new InsightError());
            }
        });
    }
}
