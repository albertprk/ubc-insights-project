import TreeNode from "./TreeNode";

export default class ParsingTree {

// TODO: if the secion is set to overall, the year should be 1900
  public MFIELD_MAP: Record<string, string> = {avg: "Avg", pass: "Pass", fail: "Fail",
  audit: "Audit", year: "Year"};

  public SFIELD_MAP: Record<string, string> = {dept: "Subject", id: "id", instructor: "Professor",
   title: "Title", uuid: "Course"};

  public createParsingTree(query: any): TreeNode {
    let value: string;
    Object.keys(query).forEach((val: string) => {
      value = val;
    });

    let root: TreeNode = new TreeNode(value, "LOGIC");
    Object.keys((newRoot: string) => {
      root.children.push(this.createTreeNode(query[newRoot]));
    });

    return root;
  }

  private createTreeNode(query: any): TreeNode {
    let root: TreeNode;

    if (query instanceof Number) {
      return new TreeNode(query, "Number");
    } else if (query instanceof String) {
      return new TreeNode(query, "String");
    }

    const key: string = Object.keys(query)[0];
    root = new TreeNode(key, "Logic");

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
      return !(this.meetsTreeCriteria(section, tree.children[0]));
    } else if (tree.value === "AND") {
      result = true;
      tree.children.forEach((node: TreeNode) => {
        result = result && this.meetsTreeCriteria(section, node);
      });
    } else if (tree.value === "OR") {
      result = false;
      tree.children.forEach((node: TreeNode) => {
        result = result || this.meetsTreeCriteria(section, node);
      });
    } else if (tree.value === "EQ") {
      return this.isEqual(section, tree.children[0]);
    } else if (tree.value === "GT") {
      return this.isGreaterThan(section, tree.children[0]);
    } else if (tree.value === "LT") {
      return this.isLessThan(section, tree.children[0]);
    } else if (tree.value === "IS") {
      return this.matchesIs(section, tree.children[0]);
    }

    return false;
  }

  private isEqual(section: any, tree: TreeNode): boolean {
    const mKey: string = tree.value.split("_")[1];
    const value: number = tree.children[0].value;

    try {
      const sectionKey = this.MFIELD_MAP[mKey];
      if (mKey === "year" && section["Section"] === "overall") {
        return value === 1900;
      } else {
        return value === section[sectionKey];
      }
    } catch {
      return false;
    }
  }

  private isGreaterThan(section: any, tree: TreeNode): boolean {
    const mKey: string = tree.value.split("_")[1];
    const value: number = tree.children[0].value;
    try {
      const sectionKey = this.MFIELD_MAP[mKey];
      if (mKey === "year" && section["Section"] === "overall") {
        return value > 1900;
      } else {
        return value > section[sectionKey];
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
        return value < 1900;
      } else {
        return value < section[sectionKey];
      }
    } catch {
      return false;
    }
  }

  private matchesIs(section: any, tree: TreeNode): boolean {
    const sKey: string = tree.value.split("_")[1];
    const value: string = tree.children[0].value;
    try {
      const sectionKey: string = this.MFIELD_MAP[sKey];

      if (!value.includes("*")) {
        return value === section[sectionKey];
      }

      const firstWildcard: number = value.indexOf("*");
      const secondWildcard: number = value.indexOf("*", firstWildcard + 1);

      if (firstWildcard > -1 && secondWildcard > -1) {
        return section[sectionKey].includes(value.substring(1, value.length - 1));
      } else if (firstWildcard === 0) {
        const ending: string = value.substring(1, value.length);
        return section[sectionKey].substring(section[sectionKey].length - ending.length,
           section[sectionKey].length) === ending;
      } else {
        const beginning: string = value.substring(0, firstWildcard);
        return section[sectionKey].substring(0, firstWildcard) === beginning;
      }
    } catch {
      return false;
    }
  }
}
