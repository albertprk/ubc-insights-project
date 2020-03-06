import Log from "../Util";
import TreeNode from "./TreeNode";
import Constants from "./Constants";

export default class FilterTree {
  private root: TreeNode;

  constructor(sections: any[], transformations: any[]) {
    this.root = new TreeNode("Parent");
    let newTransformations = this.reformatTransformations(transformations);
    this.buildTree(this.root, sections, newTransformations);
    Log.trace("FilterTree::init()");
  }

  private reformatTransformations(transformations: any[]): any {
    let result: any[] = [];

    transformations.forEach((rule) => {
      let index = rule.indexOf("_");
      const field: string = rule.substring(index + 1, rule.length);

      if (typeof Constants.MFIELD_MAP[field] !== "undefined") {
        result.push(Constants.MFIELD_MAP[field]);
      } else if (typeof Constants.SFIELD_MAP[field] !== "undefined") {
        result.push(Constants.SFIELD_MAP[field]);
      }
    });

    return result;
  }

// TODO: deal with missing sections
  private buildTree(root: TreeNode, sections: any[], transformations: any[]): void {
    sections.forEach((section) => {
      let currentRoot = this.root;
      transformations.forEach((rule) => {
        let child: TreeNode = currentRoot.getChild(section[rule]);

        if (child === null) {
          currentRoot.addChild(section[rule]);
          child = currentRoot.getChild(section[rule]);
        }

        currentRoot = child;
      });
    });
  }

  private buildListOfFilters(): any[][] {
    let currentList: any[] = [];
    let result: any[] = [];

    this.buildPath(this.root, currentList, result);

    return result;
  }

  private buildPath(node: TreeNode, currentPath: any[], result: any[]): any[][] {
    if (node.value !== "Parent") {
      currentPath.push(node.value);
    }

    if (node.children.length === 0) {
      result.push([...currentPath]);
    } else {
      node.children.forEach((child) => {
        // TODO: might be a weird copy
        this.buildPath(child, currentPath, result);
        currentPath.pop();
      });
    }

    return result;
  }

  private filterSections(sections: any[], filters: any[][], transformations: any[]): any[][] {
    let result: any[][] = [];
    let newTransformations = this.reformatTransformations(transformations);

    filters.forEach((filter) => {
      let filtered = [...sections];

      for (let i = 0; i < newTransformations.length; i++) {
          filtered = filtered.filter((section) => section[newTransformations[i]] === filter[i]);
      }

      result.push([...filtered]);
    });

    return result;
  }

  public getFilteredGroup(sections: any[], transformations: any[]): any[][] {
    let listOfFilters: any[][] = this.buildListOfFilters();
    return this.filterSections(sections, listOfFilters, transformations);
  }
}
