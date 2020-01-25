import { expect } from "chai";
import TreeNode from "../src/controller/TreeNode";
import ParsingTree from "../src/controller/ParsingTree";

describe("ParsingTree: matchesTreeCriteria", function () {
  let parsingTree: ParsingTree;
  let isNode: TreeNode;
  let courseNode: TreeNode;
  let yearNode: TreeNode;
  let andNode: TreeNode;
  let orNode: TreeNode;
  let gtNode: TreeNode;

  beforeEach(function () {
    parsingTree = new ParsingTree();
    isNode = new TreeNode("IS");
    andNode = new TreeNode("AND");
    orNode = new TreeNode("OR");
    courseNode = new TreeNode("courses_dept");
    yearNode = new TreeNode("courses_year");
    gtNode = new TreeNode("GT");
  });


  it("Should pass exact is", () => {
    let valueNode = new TreeNode("bota");
    courseNode.children.push(valueNode);
    isNode.children.push(courseNode);

    const section: Record<string, string> = {Section: "001", Campus: "ubc", Subject: "bota"};
    expect(parsingTree.meetsTreeCriteria(section, isNode)).to.equal(true);
  });

  it("Should fail exact is", () => {
    let valueNode = new TreeNode("bota");
    courseNode.children.push(valueNode);
    isNode.children.push(courseNode);

    const section: Record<string, string> = {Section: "001", Campus: "ubc", Subject: "booota"};
    expect(parsingTree.meetsTreeCriteria(section, isNode)).to.equal(false);
  });

  it("Should fail front wildcard", () => {
    let valueNode = new TreeNode("i*");
    courseNode.children.push(valueNode);
    isNode.children.push(courseNode);

    const section: Record<string, string> = {Section: "001", Campus: "ubc", Subject: "booota"};
    expect(parsingTree.meetsTreeCriteria(section, isNode)).to.equal(false);
  });

  it("Should fail end wildcard", () => {
    let valueNode = new TreeNode("*b");
    courseNode.children.push(valueNode);
    isNode.children.push(courseNode);

    const section: Record<string, string> = {Section: "001", Campus: "ubc", Subject: "booota"};
    expect(parsingTree.meetsTreeCriteria(section, isNode)).to.equal(false);
  });

  it("Should pass one wildcard in front", () => {
    let valueNode = new TreeNode("*a");
    courseNode.children.push(valueNode);
    isNode.children.push(courseNode);

    const section: Record<string, string> = {Section: "001", Campus: "ubc", Subject: "bota"};
    expect(parsingTree.meetsTreeCriteria(section, isNode)).to.equal(true);
  });

  it("Should pass one wildcard in back", () => {
    let valueNode = new TreeNode("a*");
    courseNode.children.push(valueNode);
    isNode.children.push(courseNode);

    const section: Record<string, string> = {Section: "001", Campus: "ubc", Subject: "aadhe"};
    expect(parsingTree.meetsTreeCriteria(section, isNode)).to.equal(true);
  });

  it("Should pass one wildcard in back with multiple letters", () => {
    let valueNode = new TreeNode("aa*");
    courseNode.children.push(valueNode);
    isNode.children.push(courseNode);

    const section: Record<string, string> = {Section: "001", Campus: "ubc", Subject: "aadhe"};
    expect(parsingTree.meetsTreeCriteria(section, isNode)).to.equal(true);
  });

  it("Should pass one wildcard in both ends with multiple letters", () => {
    let valueNode = new TreeNode("*aa*");
    courseNode.children.push(valueNode);
    isNode.children.push(courseNode);

    const section: Record<string, string> = {Section: "001", Campus: "ubc", Subject: "baadhe"};
    expect(parsingTree.meetsTreeCriteria(section, isNode)).to.equal(true);
  });

  it("Shoud accept AND tree", () => {
    let valueNode = new TreeNode("a*");
    courseNode.children.push(valueNode);
    isNode.children.push(courseNode);

    let gtValueNode = new TreeNode(1950);
    yearNode.children.push(gtValueNode);
    gtNode.children.push(yearNode);
    andNode.children.push(isNode, gtNode);

    const section = {Title: "intr modern asia", Section: "001", Year: 2015,
     Avg: 65.29, Campus: "ubc", Subject: "asia"};

    expect(parsingTree.meetsTreeCriteria(section, andNode)).to.equal(true);
  });

  it("Shoud accept OR tree", () => {
    let valueNode = new TreeNode("a*");
    courseNode.children.push(valueNode);
    isNode.children.push(courseNode);

    let gtValueNode = new TreeNode(1950);
    yearNode.children.push(gtValueNode);
    gtNode.children.push(yearNode);
    orNode.children.push(isNode, gtNode);

    const section1 = {Title: "intr modern asia", Section: "001", Year: 2015,
      Avg: 65.29, Campus: "ubc", Subject: "bota"};
    const section2 = {Title: "intr modern asia", Section: "001", Year: 1900,
      Avg: 65.29, Campus: "ubc", Subject: "asia"};

    expect(parsingTree.meetsTreeCriteria(section1, orNode)).to.equal(true);
    expect(parsingTree.meetsTreeCriteria(section2, orNode)).to.equal(true);
  });
});

describe("ParsingTree: createParsingTree", () => {
  let parsingTree: ParsingTree;

  beforeEach(() => {
    parsingTree = new ParsingTree();
  });

  it("Should create a tree with one child", () => {
    const query = {courses_dept: "*a"};
    const tree: TreeNode = parsingTree.createTreeNode(query);
    expect(tree.value).to.equal("courses_dept");
    expect(tree.children.length).to.equal(1);
    expect(tree.children[0].value).to.equal("*a");
  });

  it("Should create a tree with one child and one grandchild", () => {
    const query = {IS : {courses_dept: "*a"}};
    const tree: TreeNode = parsingTree.createTreeNode(query);
    expect(tree.value).to.equal("IS");
    expect(tree.children.length).to.equal(1);
    expect(tree.children[0].value).to.equal("courses_dept");
  });

  it("Should create a tree with two children", () => {
    const query = {AND : [
      {IS : {courses_dept: "*a"}}, {GT : {courses_year : 2000}}]
    };
    const tree: TreeNode = parsingTree.createTreeNode(query);
    expect(tree.value).to.equal("AND");
    expect(tree.children.length).to.equal(2);
    expect(tree.children[0].value).to.equal("IS");
    expect(tree.children[1].value).to.equal("GT");
  });
});
