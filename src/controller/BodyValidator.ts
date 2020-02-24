import Log from "../Util";
import QueryValidator from "./QueryValidator";

export default class BodyValidator {

    constructor() {
        Log.trace("BodyValidator::init()");
    }

    private static MCOMPARATOR: string[] = ["LT", "GT", "EQ"];
    private static SFIELD: string[] = [
        "dept",
        "id",
        "instructor",
        "title",
        "uuid",
        "fullname",
        "shortname",
        "number",
        "name",
        "address",
        "type",
        "furniture",
        "href",
    ];

    private static MFIELD: string[] = [
        "avg",
        "pass",
        "fail",
        "audit",
        "year",
        "lat",
        "lon",
        "seats",
    ];

    private static LOGIC: string[] = ["AND", "OR"];

    public static isValidBody(query: any, dataset: string): boolean {
        if (
            !QueryValidator.isValidObject(query) ||
            Object.keys(query).length > 1
        ) {
            return false;
        }

        return (
            Object.keys(query).length === 0 ||
            this.isValidFilter(query, dataset)
        );
    }

    private static isValidFilter(query: any, dataset: string): boolean {
        if (!QueryValidator.isValidObject(query)) {
            return false;
        }

        for (let key of Object.keys(query)) {
            if (this.LOGIC.includes(key)) {
                return this.isValidLogicComparison(query[key], dataset);
            } else if (this.MCOMPARATOR.includes(key)) {
                return this.isValidMComparison(query[key], dataset);
            } else if (key === "IS") {
                return this.isValidSComparison(query[key], dataset);
            } else if (key === "NOT") {
                return this.isValidNegation(query[key], dataset);
            } else {
                return false;
            }
        }
    }

    private static isValidMComparison(query: any, dataset: string): boolean {
        if (
            !QueryValidator.isValidObject(query) ||
            Object.keys(query).length !== 1
        ) {
            return false;
        }

        for (let key of Object.keys(query)) {
            return (
                this.isValidMKey(key, dataset) && typeof query[key] === "number"
            );
        }
    }

    private static isValidWildcard(key: string): boolean {
        const firstAsterick: number = key.indexOf("*");
        if (firstAsterick === -1) {
            return this.isValidInputString(key);
        } else if (firstAsterick > 0 && firstAsterick !== key.length - 1) {
            return false;
        }

        const secondAsterick: number = key.indexOf("*", firstAsterick + 1);

        if (secondAsterick === -1) {
            return this.isValidInputString(
                key.substring(firstAsterick + 1, key.length),
            );
        } else if (secondAsterick === key.length - 1) {
            return this.isValidInputString(
                key.substring(firstAsterick + 1, key.length - 1),
            );
        } else {
            return false;
        }
    }

    private static isValidInputString(inputString: string): boolean {
        return !inputString.includes("*");
    }

    private static isValidSComparison(query: any, dataset: string): boolean {
        if (
            !QueryValidator.isValidObject(query) ||
            Object.keys(query).length !== 1
        ) {
            return false;
        }

        for (let key of Object.keys(query)) {
            return (
                this.isValidSKey(key, dataset) &&
                this.isValidWildcard(query[key])
            );
        }
    }

    private static isValidNegation(query: any, dataset: string): boolean {
        if (
            !QueryValidator.isValidObject(query) ||
            Object.keys(query).length !== 1
        ) {
            return false;
        }

        return this.isValidFilter(query, dataset);
    }

    private static isValidLogicComparison(query: any, dataset: string): boolean {
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

    public static isValidMKey(mKey: string, dataset: string): boolean {
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

    private static isValidIdString(idString: string, dataset: string): boolean {
        return (
            idString.length >= 1 &&
            !idString.includes("_") &&
            idString === dataset
        );
    }

    public static isValidSKey(mKey: string, dataset: string): boolean {
        if (mKey.indexOf("_") <= 0) {
            return false;
        } else {
            const inputs: string[] = mKey.split("_");
            return (
                this.isValidIdString(inputs[0], dataset) &&
                this.SFIELD.includes(inputs[1])
            );
        }
    }
}
