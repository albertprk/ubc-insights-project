// TODO: refactor with get and set

export default class TreeNode {
  public value: any;
  public type: string;
  public children: TreeNode[];

  constructor(value: any, type: string) {
    this.value = value;
    this.type = type;
  }
}
