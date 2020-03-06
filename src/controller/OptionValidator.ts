import Log from "../Util";
import QueryValidator from "./QueryValidator";

export default class OptionValidator {

    constructor() {
        Log.trace("OptionValidator::init()");
    }

    public static FIELD_MAP: Record<string, string> = {
        avg: "Avg",
        pass: "Pass",
        fail: "Fail",
        audit: "Audit",
        year: "Year",
        lat: "lat",
        lon: "lon",
        dept: "Subject",
        id: "Course",
        instructor: "Professor",
        title: "Title",
        uuid: "id",
        fullname: "fullname",
        shortname: "shortname",
        number: "number",
        name: "name",
        address: "address",
        type: "type",
        furniture: "furniture",
        href: "href"
    };

    public static isValidOptions(query: any,
                                 dataset: string,
                                 hasTransformations: boolean,
                                 transformationValues: string[]): boolean {
        if (!QueryValidator.isValidObject(query) || Object.keys(query).length < 1) {
            return false;
        }

        let hasColumns: boolean = false;
        let result: boolean = true;
        let columnValues: string[] = [];

        for (let key of Object.keys(query)) {
            if (key !== "COLUMNS" && key !== "ORDER") {
                return false;
            } else if (key === "COLUMNS" && !hasTransformations) {
                hasColumns = true;
                result = result && this.isValidColumns(query[key], dataset);
            } else if (key === "COLUMNS" && hasTransformations) {
                hasColumns = true;
                result =
                    result &&
                    this.isValidColumnsWithTransformations(query[key], dataset, transformationValues);
            }
        }

        if (result) {
            columnValues = this.getColumnValues(query["COLUMNS"]);
        }

        if (!result || !hasColumns) {
            return false;
        }

        if (typeof query["ORDER"] !== "undefined") {
            result =
                result &&
                this.isValidOrder(query["ORDER"], dataset, columnValues);
        }

        return result;
    }

    private static isValidColumnsWithTransformations(
        query: any,
        dataset: string,
        transformationValues: string[],
    ) {
        if (query === null || typeof query === "undefined" ||
            !Array.isArray(query) || query.length === 0) {
            return false;
        }

        let result: boolean = true;

        query.forEach((val: string) => {
            const index = val.indexOf("_");
            let value: string = (typeof this.FIELD_MAP[val.substring(index + 1, val.length)] === "undefined") ?
                val : this.FIELD_MAP[val.substring(index + 1, val.length)];

            result =
                result &&
                QueryValidator.isValidAnyKey(val, dataset) &&
                transformationValues.includes(value);
        });

        return result;
    }

    private static isValidOrder(
        query: any,
        dataset: string,
        columnValues: string[],
    ): boolean {
        let result: boolean = this.isValidAnyKeyOrder(query, dataset, columnValues) ||
        this.isValidDirectionOrder(query, dataset, columnValues);

        return result;
    }

    private static isValidAnyKeyOrder(
        query: any,
        dataset: string,
        columnValues: string[],
    ): boolean {
        if (!(typeof query === "string") || !columnValues.includes(query)) {
            return false;
        }
        return QueryValidator.isValidAnyKey(query, dataset);
    }

    private static isValidDirectionOrder(
        query: any,
        dataset: string,
        columnValues: string[],
    ): boolean {
        let result = true;
        if (typeof query["dir"] === "undefined" || typeof query["keys"] === "undefined") {
          return false;
        } else if (query["keys"].length === 0) {
          return false;
        }

        Object.keys(query).forEach((key: any) => {
          if (key === "dir") {
              result = result && this.isValidDirection(query["dir"]);
          } else if (key === "keys") {
              result =
                  result &&
                  this.isValidSortKeys(query["keys"], dataset, columnValues);
          } else {
              result = false;
          }
        });

        return result;
    }

    private static isValidDirection(direction: string): boolean {
        return direction === "UP" || direction === "DOWN";
    }

    private static isValidSortKeys(
        query: any,
        dataset: string,
        columnValues: string[],
    ): boolean {
        if (!Array.isArray(query) || query.length === 0) {
            return false;
        }

        let result: boolean = true;

        query.forEach((key: string) => {
          result = result && (QueryValidator.isValidAnyKey(key, dataset) ||
          columnValues.includes(key));
        });

        return result;
    }

    private static getColumnValues(query: any): string[] {
        let result: string[] = [];

        query.forEach((val: string) => {
            result.push(val);
        });

        return result;
    }

    private static isValidColumns(query: any, dataset: string): boolean {
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
            result = result && QueryValidator.isValidAnyKey(val, dataset);
        });

        return result;
    }
}
