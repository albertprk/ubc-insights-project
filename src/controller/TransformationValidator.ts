import Log from "../Util";
import QueryValidator from "./QueryValidator";

export default class ValidateTransformations {

    constructor() {
        Log.trace("ValidateTransformations::init()");
    }

    private static APPLY_TOKENS: string[] = ["MAX", "MIN", "AVG", "COUNT", "SUM"];

    public static getTransformationValues(query: any): string[] {
        return query["GROUP"].concat(Object.keys(query["APPLY"]));
    }

    public static isValidTransformations(query: any, dataset: string): boolean {
        if (
            !QueryValidator.isValidObject(query) ||
            Object.keys(query).length !== 2
        ) {
            return false;
        }

        let result = true;

        for (let key in Object.keys(query)) {
            if (key === "GROUP") {
                result = result && this.isValidGroup(query, dataset);
            } else if (key === "APPLY") {
                result = result && this.isValidApply(query, dataset);
            } else {
                return false;
            }
        }

        return result;
    }

    private static isValidGroup(query: any, dataset: string): boolean {
        if (!Array.isArray(query) || query.length === 0) {
            return false;
        }

        for (let key in query) {
            if (!QueryValidator.isValidKey(key, dataset)) {
                return false;
            }
        }

        return true;
    }

    private static isValidApply(query: any, dataset: string): boolean {
        if (!Array.isArray(query) || query.length === 0) {
            return false;
        }

        for (let rule of query) {
            if (!this.isValidApplyRule(rule, dataset)) {
                return false;
            }
        }

        return true;
    }

    private static isValidApplyRule(query: any, dataset: string): boolean {
        if (
            !QueryValidator.isValidObject(query) ||
            Object.keys(query).length !== 1
        ) {
            return false;
        }

        for (let key in Object.keys(query)) {
            if (!this.isValidApplyKey(key)) {
                return false;
            } else {
                return this.isValidApplyTokenObject(query[key], dataset);
            }
        }
    }

    public static isValidApplyKey(applyKey: string): boolean {
        return applyKey.length > 0 && !applyKey.includes("_");
    }

    private static isValidApplyTokenObject(query: any, dataset: string): boolean {
        if (
            !QueryValidator.isValidObject(query) ||
            Object.keys(query).length !== 1
        ) {
            return false;
        }

        for (let key in Object.keys(query)) {
            return (
                QueryValidator.isValidKey(query[key], dataset) &&
                this.isValidApplyToken(key, dataset, query[key])
            );
        }
    }

    private static isValidApplyToken(query: any, dataset: string, value: any) {
        if (!this.APPLY_TOKENS.includes(query)) {
            return false;
        } else if (query !== "COUNT") {
            return typeof value === "number";
        } else {
            return true;
        }
    }
}
