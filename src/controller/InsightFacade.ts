import Log from "../Util";
import * as fs from "fs";
import * as path from "path";
import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import QueryValidator from "./QueryValidator";
import ParsingTree from "./ParsingTree";
import TreeNode from "./TreeNode";
import { InsightError, NotFoundError, ResultTooLargeError } from "./IInsightFacade";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */

const dataFolder: string = path.join(__dirname, "/data");
export default class InsightFacade implements IInsightFacade {
    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        return Promise.reject("Not implemented.");
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
