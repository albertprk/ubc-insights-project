import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import { InsightError, NotFoundError } from "./IInsightFacade";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    private LOGIC: string[] = ["and", "or"];
    private MCOMPARATOR: string[] = ["lt", "gt", "eq"];
    private SFIELD: string[] = ["dept", "id", "instructor", "title", "uuid"];
    private MFIELD: string[] = ["avg", "pass", "fail", "audit", "year"];

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        return Promise.reject("Not implemented.");
    }

    public removeDataset(id: string): Promise<string> {
        return Promise.reject("Not implemented.");
    }

    private isValidObject(query: any): boolean {
      if (query === null || typeof query === "undefined" || Array.isArray(query) ||
      !(query instanceof Object)) {
        return false;
      } else {
        return true;
      }
    }

    private isValidQuery(query: any, dataset: string): boolean {
        if (!this.isValidObject(query) || Object.keys(query).length < 2) {
            return false;
        }

        let result: boolean = true;

        Object.keys(query).forEach((key: string) => {
          const currentKey: string = key.toLowerCase();
          if (currentKey === "where") {
            result = result && this.isValidBody(query[key], dataset);
          } else if (currentKey === "options") {
            result = result && this.isValidOptions(query[key], dataset);
          } else {
            return false;
          }
        });

        return result;
    }

    private isValidBody(query: any, dataset: string): boolean {
        if (!this.isValidObject(query) || Object.keys(query).length > 1) {
            return false;
        }

        return Object.keys(query).length === 0 || this.isValidFilter(query, dataset);
    }

    private isValidFilter(query: any, dataset: string): boolean {
        if (!this.isValidObject(query)) {
            return false;
        }

        Object.keys(query).forEach((key: string) => {
            const currentKey: string = key.toLowerCase();

            if (this.LOGIC.includes(currentKey)) {
                return this.isValidLogicComparison(query[key], dataset);
            } else if (this.MCOMPARATOR.includes(currentKey)) {
                return this.isValidMComparison(query[key], dataset);
            } else if (currentKey === "is") {
                return this.isValidSComparison(query[key], dataset);
            } else if (currentKey === "not") {
                return this.isValidNegation(query[key], dataset);
            } else {
                return false;
            }
        });
    }

    private isValidMComparison(query: any, dataset: string): boolean {
        if (!this.isValidObject(query) || Object.keys(query).length !== 1) {
            return false;
        }

        Object.keys(query).forEach((key: string) => {
            return this.isValidMKey(key, dataset) && query[key] instanceof Number;
        });
    }

    private isValidWildcard(key: string): boolean {
        const firstAsterick: number = key.indexOf("*");
        if (firstAsterick !== -1) {
            return this.isValidInputString(key);
        } else if (firstAsterick > 0) {
            return false;
        }

        const secondAsterick: number = key.indexOf("*", firstAsterick + 1);

        if (secondAsterick === -1) {
            return this.isValidInputString(key.substring(firstAsterick + 1, key.length));
        } else if (secondAsterick === key.length - 1) {
            return this.isValidInputString(key.substring(firstAsterick + 1, key.length - 1));
        } else {
            return false;
        }
    }

    private isValidSComparison(query: any, dataset: string): boolean {
        if (!this.isValidObject(query) || Object.keys(query).length !== 1) {
            return false;
        }

        Object.keys(query).forEach((key: string) => {
            return this.isValidSKey(key, dataset) && this.isValidWildcard(query[key]);
        });
    }

    private isValidNegation(query: any, dataset: string): boolean {
        if (this.isValidObject(query) || Object.keys(query).length !== 1) {
            return false;
        }

        return this.isValidFilter(query, dataset);
    }

    private isValidLogicComparison(query: any, dataset: string): boolean {
        if (
            query === null ||
            typeof query === "undefined" ||
            !Array.isArray(query) ||
            query.length === 0
        ) {
            return false;
        }

        let result: boolean = true;

        query.forEach((filter: any) => {
            result = result && this.isValidFilter(filter, dataset);
        });

        return result;
    }

    private isValidOptions(query: any, dataset: string): boolean {
        if (!this.isValidObject(query) || Object.keys(query).length < 1) {
            return false;
        }

        let hasColumns: boolean = false;
        let result: boolean = true;
        let columnValues: string[] = [];

        Object.keys(query).forEach((key: string) => {
            const currentKey: string = key.toLowerCase();
            if (currentKey !== "columns" && currentKey !== "order") {
                return false;
            } else if (currentKey === "columns") {
                hasColumns = true;
                result = result && this.isValidColumns(query[key], dataset);

                if (result) {
                    columnValues = this.getColumnValues(query[key]);
                }
            }
        });

        if (!result || !hasColumns) {
            return false;
        }

        Object.keys(query).forEach((key: string) => {
            if (key.toLowerCase() === "order") {
                result = result && this.isValidOrder(query[key], dataset, columnValues);
            }
        });

        return result;
    }

    private isValidOrder(query: any, dataset: string, columnValues: string[]): boolean {
        if (!(query instanceof String) || !columnValues.includes(query.toString())) {
            return false;
        }
        return this.isValidKey(query.toString(), dataset);
    }

    private getColumnValues(query: any): string[] {
        let result: string[] = [];

        query.forEach((val: string) => {
            result.push(val);
        });

        return result;
    }

    private isValidColumns(query: any, dataset: string): boolean {
        if (
            query === null ||
            typeof query === "undefined" ||
            !Array.isArray(query) ||
            query.length === 0
        ) {
            return false;
        }

        let result: boolean = true;

        query.forEach((val: string) => {
            result = result && this.isValidKey(val, dataset);
        });

        return result;
    }

    private isValidIdString(idString: string, dataset: string): boolean {
        return idString.length >= 1 && !idString.includes("_") && idString === dataset;
    }

    private isValidInputString(inputString: string): boolean {
        return !inputString.includes("*");
    }

    private isValidKey(key: string, dataset: string): boolean {
        return this.isValidMKey(key, dataset) || this.isValidSKey(key, dataset);
    }

    private isValidMKey(mKey: string, dataset: string): boolean {
        if (mKey.indexOf("_") <= 0) {
            return false;
        } else {
            const inputs: string[] = mKey.split("_");
            return (
                this.isValidIdString(inputs[0], dataset) &&
                this.MFIELD.includes(inputs[1])
            );
        }
    }

    private isValidSKey(mKey: string, dataset: string): boolean {
        if (mKey.indexOf("_") <= 0) {
            return false;
        } else {
            const inputs: string[] = mKey.split("_");
            return this.isValidIdString(inputs[0], dataset) && this.SFIELD.includes(inputs[1]);
        }
    }

    private determineDataset(query: any): string {
        if (!this.isValidObject(query)) {
            return null;
        }

        try {
          Object.keys(query).forEach((options: any) => {
            if (options.toLowerCase() === "options") {
              Object.keys(query[options]).forEach((col: string) => {
                if (col.toLowerCase() === "columns") {
                  let result: string = query[options][col][0];
                  const index: number = result.indexOf("_");
                  return index > 0 ? result.substring(0, index) : null;
                }
              });
            }
          });
        } catch {
            return null;
        }
    }

    public performQuery(query: any): Promise<any[]> {
        const dataSet: string = this.determineDataset(query);
        if (dataSet === null || !this.isValidQuery(query, dataSet)) {
            return Promise.reject(new InsightError());
        }
        return Promise.reject("Not implemented.");
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.reject("Not implemented.");
    }
}
