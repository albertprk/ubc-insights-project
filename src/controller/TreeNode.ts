// TODO: refactor with get and set

export default class TreeNode {
    public value: any;
    public children: TreeNode[];

    constructor(value: any) {
        this.value = value;
        this.children = [];
    }

    public getValue(): any {
        return this.value;
    }

    public getChild(value: any) {
      let result: TreeNode = null;

      this.children.forEach((child) => {
        if (child.value === value) {
          result = child;
        }
      });

      return result;
    }

    public addChild(value: any): void {
      let newChild = new TreeNode(value);
      this.children.push(newChild);
    }
}
