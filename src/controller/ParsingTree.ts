import TreeNode from "./TreeNode";
import Log from "../Util";
import { ResultTooLargeError } from "./IInsightFacade";
import Dataset from "./Dataset";

export default class ParsingTree {
    constructor() {
        Log.trace("ParsingTree::init()");
    }

    // TODO: update map, Albert has already reformatted names. This isn't needed
    // Also to do: section is a type, need to redo how to access
    public MFIELD_MAP: Record<string, string> = {
        avg: "Avg",
        pass: "Pass",
        fail: "Fail",
        audit: "Audit",
        year: "Year",
    };

    public SFIELD_MAP: Record<string, string> = {
        dept: "Subject",
        id: "Course",
        instructor: "Professor",
        title: "Title",
        uuid: "id",
    };

    public createTreeNode(query: any): TreeNode {
        let root: TreeNode;

        if (typeof query === "string" || typeof query === "number") {
            return new TreeNode(query);
        }

        const key: string = Object.keys(query)[0];
        root = new TreeNode(key);

        if (Array.isArray(query[key])) {
            query[key].forEach((obj: any) => {
                root.children.push(this.createTreeNode(obj));
            });
        } else {
            root.children.push(this.createTreeNode(query[key]));
        }

        return root;
    }

    public meetsTreeCriteria(section: any, tree: TreeNode): boolean {
        let result: boolean;
        if (tree.value === "NOT") {
            return !this.meetsTreeCriteria(section, tree.children[0]);
        } else if (tree.value === "AND") {
            result = true;
            tree.children.forEach((node: TreeNode) => {
                result = result && this.meetsTreeCriteria(section, node);
            });
            // Log.info("AND" + result);
        } else if (tree.value === "OR") {
            result = false;
            tree.children.forEach((node: TreeNode) => {
                result = result || this.meetsTreeCriteria(section, node);
            });
        } else if (tree.value === "EQ") {
            // Log.info("eq" + this.isEqual(section, tree.children[0]));
            return this.isEqual(section, tree.children[0]);
        } else if (tree.value === "GT") {
            // Log.info("gt" + this.isGreaterThan(section, tree.children[0]));
            return this.isGreaterThan(section, tree.children[0]);
        } else if (tree.value === "LT") {
            // Log.info("lt" + this.isLessThan(section, tree.children[0]));
            return this.isLessThan(section, tree.children[0]);
        } else if (tree.value === "IS") {
            // Log.info("is" + this.matchesIs(section, tree.children[0]));
            return this.matchesIs(section, tree.children[0]);
        } else {
          return false;
        }

        return result;
    }

    // Todo: fix year int rounding
    private isEqual(section: any, tree: TreeNode): boolean {
        const mKey: string = tree.value.split("_")[1];
        const value: number = tree.children[0].value;

        try {
            // Log.info(this.MFIELD_MAP[mKey]);
            const sectionKey = this.MFIELD_MAP[mKey];
            if (mKey === "year" && section["Section"] === "overall") {
                return value === 1900;
            } else if (typeof section[sectionKey] === "undefined") {
                return false;
            } else {
                return value === parseFloat(section[sectionKey]);
            }
        } catch {
            return false;
        }
    }

    private isGreaterThan(section: any, tree: TreeNode): boolean {
        const mKey: string = tree.value.split("_")[1];
        const value: any = tree.children[0].value;
        try {
            const sectionKey = this.MFIELD_MAP[mKey];
            if (mKey === "year" && section["Section"] === "overall") {
                return value < 1900;
            } else if (typeof section[sectionKey] === "undefined") {
                // Log.info("GT");
                return false;
            } else {
                return value < parseFloat(section[sectionKey]);
            }
        } catch {
            return false;
        }
    }

    private isLessThan(section: any, tree: TreeNode): boolean {
        const mKey: string = tree.value.split("_")[1];
        const value: number = tree.children[0].value;
        try {
            const sectionKey = this.MFIELD_MAP[mKey];
            if (mKey === "year" && section["Section"] === "overall") {
                return value > 1900;
            } else if (typeof section[sectionKey] === "undefined") {
                // Log.info("LT");
                return false;
            } else {
                return value > parseFloat(section[sectionKey]);
            }
        } catch {
            return false;
        }
    }

    private matchesIs(section: any, tree: TreeNode): boolean {
        const sKey: string = tree.value.split("_")[1];
        const value: string = tree.children[0].value;
        try {
            const sectionKey: string = this.SFIELD_MAP[sKey];

            if (typeof section[sectionKey] === "undefined") {
                return false;
            }

            if (!value.includes("*")) {
                return section[sectionKey] === value;
            }

            const firstWildcard: number = value.indexOf("*");
            const secondWildcard: number = value.indexOf(
                "*",
                firstWildcard + 1,
            );

            if (firstWildcard > -1 && secondWildcard > -1) {
                return section[sectionKey].includes(
                    value.substring(1, value.length - 1),
                );
            } else if (firstWildcard === 0) {
                const ending: string = value.substring(1, value.length);
                return (
                    section[sectionKey].substring(
                        section[sectionKey].length - ending.length,
                        section[sectionKey].length,
                    ) === ending
                );
            } else {
                const beginning: string = value.substring(0, firstWildcard);
                return (
                    section[sectionKey].substring(0, firstWildcard) ===
                    beginning
                );
            }
        } catch {
            return false;
        }
    }

    public reformatSection(
        section: any,
        columns: string[],
    ): Record<string, any> {
        let reformattedSection: Record<string, any> = {};

        try {
            for (let col of columns) {
                const key: string = col.split("_")[1];

                // TODO: EDIT TO MATCH ALBERT's IMPLEMENTATION
                if (typeof section[this.MFIELD_MAP[key]] !== "undefined" && key === "year") {
                    reformattedSection[col] =
                        key === "year" && section["Section"] === "overall"
                            ? 1900
                            : parseInt(section[this.MFIELD_MAP[key]], 10);
                } else if (typeof section[this.MFIELD_MAP[key]] !== "undefined") {
                    reformattedSection[col] = section[this.MFIELD_MAP[key]];
                } else if (typeof section[this.SFIELD_MAP[key]] !== "undefined") {
                    reformattedSection[col] = (key === "uuid") ?
                                              section[this.SFIELD_MAP[key]].toString() :
                                              section[this.SFIELD_MAP[key]];
                } else {
                    Log.info("WRONG WRONG WRONG");
                    return null;
                }
            }
            return reformattedSection;
        } catch {
            Log.info("BAD BAd BAD");
            return null;
        }
    }

    public sortSections(sections: any[], query: any): any[] {
        let orderKey: string;
        if (typeof query["OPTIONS"]["ORDER"] !== "undefined") {
            orderKey = query["OPTIONS"]["ORDER"];
        } else {
            orderKey = query["OPTIONS"]["COLUMNS"][0];
        }

        sections.sort((a: any, b: any) => {
            if (typeof a[orderKey] === "string" && a[orderKey] < b[orderKey]) {
                return -1;
            } else if (
                typeof a[orderKey] === "string" &&
                a[orderKey] > b[orderKey]
            ) {
                return 1;
            } else if (typeof a[orderKey] === "string") {
                return 0;
            } else {
                return a[orderKey] - b[orderKey];
            }
        });

        return sections;
    }

    public searchSections(
        dataset: Dataset,
        tree: TreeNode,
        columns: string[],
    ): any[] {
        let result: any[] = [];
        for (let section of dataset.sections) {
            // Log.info(section);
            // Log.info("Criteria: " + this.meetsTreeCriteria(section, tree));
            if (this.meetsTreeCriteria(section, tree)) {
                // Log.info("Met criteria");
                result.push(this.reformatSection(section, columns));
                if (result.length > 5000) {
                    throw new ResultTooLargeError();
                }
            }
        }

        return result;
    }
}
