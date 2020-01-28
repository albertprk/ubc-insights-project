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
}
