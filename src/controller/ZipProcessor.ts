import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import * as JSZip from "jszip";
import * as parse5 from "parse5";
import * as http from "http";
import Dataset from "./Dataset";
import Log from "../Util";
import {stringify} from "querystring";
import Room from "./Room";
import * as fs from "fs";
import Building from "./Building";

export default class ZipProcessor {
    public id: string;
    public content: string;
    public kind: InsightDatasetKind;

    constructor(id: string, content: string, kind: InsightDatasetKind) {
        this.id = id;
        this.content = content;
        this.kind = kind;
    }

    public indexTable: any = {};
    private studentLink: string = "http://students.ubc.ca";

    public processZipContent(): Promise<Dataset> {
        return new Promise((resolve, reject) => {
            let zipFile: JSZip = new JSZip();
            zipFile.loadAsync(this.content, {base64: true}).then((files) => {
                    let promises: Array<Promise<string>> = [];
                    files.folder("courses").forEach((file) => {
                        promises.push(files.folder("courses").file(file).async("text"));
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
                }).catch((err) => {
                    reject(err);
            });
        });
    }

    public processRoomsZipContent(): Promise<Dataset> {
        return new Promise((resolve, reject) => {
            let zipFile: JSZip = new JSZip();
            let dataset = new Dataset(this.id, this.kind);
            let parsedHTML: any;
            zipFile.loadAsync(this.content, {base64: true}).then((files) => {
                let promises: Array<Promise<string>> = [];
                promises.push(files.folder("rooms").file("index.htm").async("text"));
                return Promise.all(promises);
            }).then((html) => {
                parsedHTML = parse5.parse(html[0]);
                let htmlTable = this.findTable(parsedHTML);
                this.createIndexTable(htmlTable["childNodes"]);
                return this.getLatAndLong();
            }).then((result) => {
                return this.getRooms();
            }).then((datasetResult) => {
                resolve(datasetResult);
            }).catch((err) => {
                reject(err);
            });
        });
    }

    public async getLatAndLong(): Promise<string[]> {
      let promises: Array<Promise<string>> = [];
      Object.keys(this.indexTable).forEach((key: string) => {
          promises.push(this.resolveLatAndLong(key));
      });

      return Promise.all(promises);
    }

    private resolveLatAndLong(address: string): Promise<string> {
      return new Promise((resolve, reject) => {
        try {
          http.get("http://cs310.students.cs.ubc.ca:11316/api/v1/project_team136/" +
          encodeURIComponent(address), (response) => {
            const {statusCode} = response;

            if (statusCode !== 200) {
              throw new Error("Unable to connect");
            }

            response.setEncoding("utf8");
            let rawData = "";
            response.on("data", (chunk) => {
              rawData += chunk;
            });

            response.on("end", () => {
              try {
                const parsedData = JSON.parse(rawData);
                if (typeof parsedData["error"] !== "undefined") {
                  throw new Error("Unable to get lat and long");
                }
                this.indexTable[address]["lon"] = parsedData["lon"];
                this.indexTable[address]["lat"] = parsedData["lat"];
                resolve(parsedData["lon"]);
              } catch (e) {
              // Log.error(e.message);
                resolve("");
                Log.trace(e);
              }
            });
          });
      } catch (err) {
        Log.trace(err);
        resolve("");
      }
      });
    }

    public createIndexTable(html: any): void {
      html.forEach((row: any) => {
        if (row["nodeName"] === "tr") {
          let rowObject = {};
          let address: string = "";
          row["childNodes"].forEach((cell: any) => {
            if (cell["nodeName"] === "td" && cell["attrs"].length !== 0) {
              this.processCell(cell, rowObject);
              address = this.checkForAddress(address, cell);
            }
          });

          this.indexTable[address] = {...rowObject};
        }
      });
    }

    private processCell(cell: any, rowObject: any): void {
      let classes = ZipProcessor.buildClassList(cell);

      if (classes.indexOf("views-field-field-building-code") > -1) {
        rowObject["shortname"] = cell["childNodes"][0]["value"].trim();

      } else if (classes.indexOf("views-field-nothing") > - 1) {
        let href = "";

        cell["childNodes"].forEach((c: any) => {
          if (c["nodeName"] === "a") {
            c["attrs"].forEach((attr: any) => {
              if (attr["name"] === "href") {
                href = attr["value"];
              }
            });
          }
        });
        rowObject["href"] = href;
      } else if (classes.indexOf("views-field-title") > - 1) {
        let fullname = "";

        cell["childNodes"].forEach((c: any) => {
          if (c["nodeName"] === "a") {
            c["childNodes"].forEach((cn: any) => {
              if (cn["nodeName"] === "#text") {
                fullname = cn["value"];
              }
            });
          }
        });
        rowObject["fullname"] = fullname;
      }
    }

    private checkForAddress(address: string, cell: any): string {
      let classes = ZipProcessor.buildClassList(cell);

      if (classes.indexOf("views-field-field-building-address") > -1) {
        return cell["childNodes"][0]["value"].trim();
      } else {
        return address;
      }
    }

    public findTable(parsedHTML: any): any {
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

    public async getRooms(): Promise<Dataset> {
      let keys = Object.keys(this.indexTable);
      return new Promise((resolve: any, reject: any) => {
        let zipFile: JSZip = new JSZip();
        zipFile.loadAsync(this.content, {base64: true}).then((files) => {
          let promises: Array<Promise<string>> = [];
          keys.forEach((obj: any) => {
            let path: string = "rooms" + this.indexTable[obj]["href"]
                                        .substring(1, this.indexTable[obj]["href"].length);
            promises.push(files.file(path).async("text"));
          });

          return Promise.all(promises);
        }).then((buildings: any[]) => {
          if (buildings.length === 0) {
            reject(new InsightError("No room files in dataset."));
          }

          let dataset: Dataset = new Dataset(this.id, this.kind);
          buildings.forEach((building: any, index: number) => {
            let html = parse5.parse(building);
            let table = this.findTable(html);
            if (typeof table !== "undefined") {
              this.addRoomsToDataset(dataset, table, keys[index]);
            }
          });

          resolve(dataset);
        });
      });
    }

    private addRoomsToDataset(dataset: Dataset, table: any, address: string): void {
      table["childNodes"].forEach((row: any) => {
        if (row["nodeName"] === "tr") {
          let obj = {};
          row["childNodes"].forEach((cell: any) => {
            if (cell["nodeName"] === "td") {
              Building.dealWithRoomCell(obj, cell);
            }
          });

          let newSection = this.addExistingFields(obj, address);
          dataset.addSection(newSection);
        }
      });
    }

    private addExistingFields(obj: any, address: string): any {
      let result: any = Object.assign({}, obj, this.indexTable[address]);
      result["address"] = address;
      result["href"] = this.studentLink + result["href"].substring(1, result["href"].length);
      result["name"] = result["shortname"] + "_" + result["number"];
      return result;
    }

    public static buildClassList(cell: any): string[] {
      let classString = "";

      cell["attrs"].forEach((attr: any) => {
        if (attr["name"] === "class") {
          classString = classString + attr["value"];
        }
      });

      return classString.split(" ");
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
