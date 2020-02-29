import TreeNode from "./TreeNode";
import Log from "../Util";
import { ResultTooLargeError } from "./IInsightFacade";
import Dataset from "./Dataset";

export default class ParsingTree {
    constructor() {
        Log.trace("ParsingTree::init()");
    }

    public MFIELD_MAP: Record<string, string> = {
        avg: "Avg",
        pass: "Pass",
        fail: "Fail",
        audit: "Audit",
        year: "Year",
        lat: "lat",
        lon: "lon"
    };

    public SFIELD_MAP: Record<string, string> = {
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

    public createTreeNode(query: any): TreeNode {
        let root: TreeNode;

        if (typeof query === "string" || typeof query === "number") {
            return new TreeNode(query);
        } else if (!Array.isArray(query) && typeof query === "object" && Object.keys(query).length === 0) {
            return null;
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

    public searchSections(
        dataset: Dataset,
        tree: TreeNode
    ): any[] {
        let result: any[] = [];

        if (tree === null) {
            return dataset.sections;
        }

        for (let section of dataset.sections) {
            if (this.meetsTreeCriteria(section, tree)) {
                result.push(section);
                if (result.length > 5000) {
                    throw new ResultTooLargeError();
                }
            }
        }

        return result;
    }

}
