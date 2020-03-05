import Log from "../Util";
import TreeNode from "./TreeNode";

export default class FilterTree {
  private root: TreeNode;

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

      if (typeof this.MFIELD_MAP[field] !== "undefined") {
        result.push(this.MFIELD_MAP[field]);
      } else if (typeof this.SFIELD_MAP[field] !== "undefined") {
        result.push(this.SFIELD_MAP[field]);
      }
    });

    return result;
  }

// TODO: deal with missing sections
  private buildTree(root: TreeNode, sections: any[], transformations: any[]): void {
    Log.info("BUILDING TREE");
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
    Log.info("BUILT TREE");
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
