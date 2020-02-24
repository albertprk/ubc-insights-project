import Log from "../Util";
import TransformationValidator from "./TransformationValidator";
import OptionValidator from "./OptionValidator";
import BodyValidator from "./BodyValidator";

export default class QueryValidator {

    constructor() {
        Log.trace("QueryValidator::init()");
    }

    public static isValidObject(query: any): boolean {
        if (
            query === null ||
            typeof query === "undefined" ||
            Array.isArray(query) ||
            !(query instanceof Object)
        ) {
            return false;
        } else {
            return true;
        }
    }

    public static isValidQuery(query: any, dataset: string): boolean {
        if (!this.isValidObject(query) || Object.keys(query).length < 2) {
            return false;
        }

        for (let key of Object.keys(query)) {
            if (key !== "WHERE" && key !== "OPTIONS" && key !== "TRANSFORMATIONS") {
                return false;
            }
        }

        let result: boolean = true;

        try {
            result =
                result && BodyValidator.isValidBody(query["WHERE"], dataset);

            if (typeof query["TRANSFORMATIONS"] !== "undefined") {
                result =
                    result && TransformationValidator.isValidTransformations(
                        query["TRANSFORMATIONS"], dataset);

                if (!result) {
                    return false;
                }

                const transformationValues: string[] = TransformationValidator.getTransformationValues(
                    query["TRANSFORMATIONS"],
                );
                result =
                    result && OptionValidator.isValidOptions(query["OPTIONS"],
                        dataset, true, transformationValues);
            } else {
                result =
                    result &&
                    OptionValidator.isValidOptions(query["OPTIONS"],
                        dataset, false, []);
            }
        } catch {
            return false;
        }

        return result;
    }

    public static isValidKey(key: string, dataset: string): boolean {
        return (
            BodyValidator.isValidMKey(key, dataset) ||
            BodyValidator.isValidSKey(key, dataset)
        );
    }

    public static isValidAnyKey(anyKey: string, dataset: string): boolean {
        return (
            this.isValidKey(anyKey, dataset) ||
            TransformationValidator.isValidApplyKey(anyKey)
        );
    }

    public determineDataset(query: any): string {
        if (!QueryValidator.isValidObject(query)) {
            return null;
        }

        try {
            for (let options of Object.keys(query)) {
                if (options === "OPTIONS") {
                    for (let col of Object.keys(query[options])) {
                        if (col === "COLUMNS") {
                            let result: string = query[options][col][0];
                            const index: number = result.indexOf("_");
                            return index > 0
                                ? result.substring(0, index)
                                : null;
                        }
                    }
                }
            }
        } catch {
            return null;
        }
    }
}
