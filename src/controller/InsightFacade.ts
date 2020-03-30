import Log from "../Util";
import * as fs from "fs";
import * as parse5 from "parse5";
import * as path from "path";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError,
    NotFoundError, ResultTooLargeError} from "./IInsightFacade";
import QueryValidator from "./QueryValidator";
import ParsingTree from "./ParsingTree";
import ReformattedDataset from "./ReformattedDataset";
import TreeNode from "./TreeNode";
import Dataset from "./Dataset";
import ZipProcessor from "./ZipProcessor";
import * as JSZip from "jszip";

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

    private loadDatasetFromMemory(filePath: string, id: string): Promise<string[][]> {
      return new Promise((resolve, reject) => {
          let promises: Array<Promise<string[]>> = [];
          const content = fs.readFileSync(filePath);
          this.findKind(content).then((kind) => {
          if (kind === InsightDatasetKind.Courses) {
            promises.push(this.returnCourses(id, content.toString("base64"), kind));
          } else {
            promises.push(this.returnRooms(id, content.toString("base64"), kind));
          }
          resolve(Promise.all(promises));
          });
      });
    }

    public findKind(content: Buffer): Promise<InsightDatasetKind> {
      return new Promise((resolve, reject) => {
        let zipFile: JSZip = new JSZip();
        zipFile.loadAsync(content, { base64: true }).then((files) => {
              let result: InsightDatasetKind;
              try {
                files.folder("courses").forEach((file) => {
                  throw new Error();
                });
                result = InsightDatasetKind.Rooms;
              } catch {
                result = InsightDatasetKind.Courses;
              }
              return result;
            }).then((res) => {
              resolve(res);
            }).catch((err) => {
              Log.error(err);
            });
      });
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        if (id === null || typeof id === "undefined" || content === null ||
            typeof content === "undefined" || kind === null || typeof kind === "undefined") {
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
                reject(new InsightError("Error: " + id + " already exists"));
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
                    if (data.sections.length === 0) {
                      reject(new InsightError("Error: No valid files"));
                    }
                    this.datasets.set(id, data);
                    return this.listIds();
                }).then((promise) => {
                  resolve(promise);
                }).catch((err: any) => {
                    reject(new InsightError("Error: Problem processing the data zip."));
                });
        });
    }

    private returnRooms(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        let zipProcessor = new ZipProcessor(id, content, kind);
        return new Promise((resolve, reject) => {
          let zipFile: JSZip = new JSZip();
          let dataset = new Dataset(id, kind);
          zipFile.loadAsync(content, {base64: true}).then((files) => {
              return files.folder("rooms").file("index.htm").async("text");
          }).then((html) => {
              let parsedHTML = parse5.parse(html);
              let htmlTable = zipProcessor.findTable(parsedHTML);
              zipProcessor.createIndexTable(htmlTable["childNodes"]);
              return zipProcessor.getLatAndLong();
              return htmlTable;
          }).catch((llErr) => {
              Log.trace(llErr);
              return zipProcessor.getRooms();
          }).then((result) => {
              return zipProcessor.getRooms();
          }).then((data) => {
              this.datasets.set(id, data);
              return this.listIds();
          }).then((prom) => {
              resolve(prom);
          }).catch((err) => {
              reject(err);
          });
        });
    }

    public removeDataset(id: string): Promise<string> {
        return new Promise((resolve, reject) => {
            if (id === null) {
                reject(new InsightError("Invalid input: cannot have a null dataset"));
            }
            let filePath: string = path.join(this.dataFolder, "/" + id + ".zip");
            if (!fs.existsSync(filePath)) {
                reject(new NotFoundError("Unable to find error"));
            } else if (!(typeof this.datasets.get(id) === "undefined")) {
              this.datasets.delete(id);
            }
            fs.unlink(filePath, (err) => {
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
            let filePath: string = path.join(this.dataFolder, "/" + dataSetName + ".zip");
            if (dataSetName === null || !QueryValidator.isValidQuery(query, dataSetName)) {
                reject(new InsightError("Invalid query."));
            } else if (typeof this.datasets.get(dataSetName) === "undefined" &&
                !fs.existsSync(filePath)) {
                  reject(new InsightError("Unable to find dataset"));
            } else if (typeof this.datasets.get(dataSetName) === "undefined") {
              this.loadDatasetFromMemory(filePath, dataSetName).then((loaded) => {
                return this.findQueryResults(query, dataSetName);
              }).then((results) => {
                resolve(results);
              }).catch((err) => {
                reject(new ResultTooLargeError());
              });
            } else {
              try {
                  const result: any[] = this.findQueryResults(query, dataSetName);
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
            let reformattedDataset: ReformattedDataset = new ReformattedDataset();
            const tree: TreeNode = parsingTree.createTreeNode(query["WHERE"]);
            let result: any[] = parsingTree.searchSections(
                this.datasets.get(dataSetName),  tree
            );
            if (result.length > 5000 && typeof query["TRANSFORMATIONS"] === "undefined") {
                throw new ResultTooLargeError();
            } else if (result.length === 0) {
              return result;
            }
            result = reformattedDataset.reformatSections(result, query);
            if (result.length > 5000) {
                throw new ResultTooLargeError();
            }
            result = reformattedDataset.sortSections(result, query);
            return result;
        } catch (err) {
            Log.trace(err);
            throw new ResultTooLargeError();
        }
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return new Promise((resolve, reject) => {
            let promises: Array<Promise<string[][]>> = [];
            try {
                fs.readdir(this.dataFolder, (err, files) => {
                  let results: InsightDataset[] = [];
                  for (let file of files) {
                    let index = file.indexOf(".zip");
                    let id = file.substring(0, index);
                    if (typeof this.datasets.get(id) === "undefined") {
                      promises.push(this.loadDatasetFromMemory(this.dataFolder + "/" + file, id));
                    }
                  }
                  Promise.all(promises).then(() => {
                    for (let entry of this.datasets.entries()) {
                      results.push(entry[1].insightDataset);
                    }
                  }).then(() => {
                    resolve(results);
                  });
                });
            } catch {
                reject(new InsightError());
            }
        });
    }

    public listIds(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            try {
                fs.readdir(this.dataFolder, (err, files) => {
                  let results: string[] = [];
                  for (let file of files) {
                    let index = file.indexOf(".zip");
                    let id = file.substring(0, index);
                    results.push(id);
                  }
                  resolve(results);
                });
            } catch {
                reject(new InsightError());
            }
        });
    }
}
