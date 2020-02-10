import Log from "../Util";

export default class QueryValidator {
    constructor() {
        Log.trace("ParsingTree::init()");
    }

    private LOGIC: string[] = ["AND", "OR"];
    private MCOMPARATOR: string[] = ["LT", "GT", "EQ"];
    private SFIELD: string[] = ["dept", "id", "instructor", "title", "uuid"];
    private MFIELD: string[] = ["avg", "pass", "fail", "audit", "year"];

    private isValidObject(query: any): boolean {
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

    public isValidQuery(query: any, dataset: string): boolean {
        if (!this.isValidObject(query) || Object.keys(query).length < 2) {
            return false;
        }

        for (let key of Object.keys(query)) {
            if (key !== "WHERE" && key !== "OPTIONS") {
                return false;
            }
        }

        let result: boolean = true;

        try {
            result = result && this.isValidBody(query["WHERE"], dataset);
            result = result && this.isValidOptions(query["OPTIONS"], dataset);
        } catch {
            return false;
        }

        return result;
    }

    private isValidBody(query: any, dataset: string): boolean {
        if (!this.isValidObject(query) || Object.keys(query).length > 1) {
            return false;
        }

        return (
            Object.keys(query).length === 0 ||
            this.isValidFilter(query, dataset)
        );
    }

    private isValidFilter(query: any, dataset: string): boolean {
        if (!this.isValidObject(query)) {
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

    // WOKRING
    private isValidMComparison(query: any, dataset: string): boolean {
        if (!this.isValidObject(query) || Object.keys(query).length !== 1) {
            return false;
        }

        for (let key of Object.keys(query)) {
            return (
                this.isValidMKey(key, dataset) && typeof query[key] === "number"
            );
        }
    }

    private isValidWildcard(key: string): boolean {
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

    private isValidSComparison(query: any, dataset: string): boolean {
        if (!this.isValidObject(query) || Object.keys(query).length !== 1) {
            return false;
        }

        for (let key of Object.keys(query)) {
            return (
                this.isValidSKey(key, dataset) &&
                this.isValidWildcard(query[key])
            );
        }
    }

    private isValidNegation(query: any, dataset: string): boolean {
        if (!this.isValidObject(query) || Object.keys(query).length !== 1) {
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

        for (let key of Object.keys(query)) {
            if (key !== "COLUMNS" && key !== "ORDER") {
                return false;
            } else if (key === "COLUMNS") {
                hasColumns = true;
                result = result && this.isValidColumns(query[key], dataset);

                if (result) {
                    columnValues = this.getColumnValues(query[key]);
                }
            }
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

    private isValidOrder(
        query: any,
        dataset: string,
        columnValues: string[],
    ): boolean {
        if (!(typeof query === "string") || !columnValues.includes(query)) {
            Log.info("String; " + !(typeof query === "string"));
            Log.info("COLS: " + !columnValues.includes(query));
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
        return (
            idString.length >= 1 &&
            !idString.includes("_") &&
            idString === dataset
        );
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
            return (
                this.isValidIdString(inputs[0], dataset) &&
                this.SFIELD.includes(inputs[1])
            );
        }
    }

    public determineDataset(query: any): string {
        if (!this.isValidObject(query)) {
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
