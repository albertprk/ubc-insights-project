import { expect } from "chai";
import TreeNode from "../src/controller/TreeNode";
import ParsingTree from "../src/controller/ParsingTree";
import Log from "../src/Util";

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

        const section: Record<string, string> = {
            Section: "001",
            Campus: "ubc",
            Subject: "bota",
        };
        expect(parsingTree.meetsTreeCriteria(section, isNode)).to.equal(true);
    });

    it("Should fail exact is", () => {
        let valueNode = new TreeNode("bota");
        courseNode.children.push(valueNode);
        isNode.children.push(courseNode);

        const section: Record<string, string> = {
            Section: "001",
            Campus: "ubc",
            Subject: "booota",
        };
        expect(parsingTree.meetsTreeCriteria(section, isNode)).to.equal(false);
    });

    it("Should fail front wildcard", () => {
        let valueNode = new TreeNode("i*");
        courseNode.children.push(valueNode);
        isNode.children.push(courseNode);

        const section: Record<string, string> = {
            Section: "001",
            Campus: "ubc",
            Subject: "booota",
        };
        expect(parsingTree.meetsTreeCriteria(section, isNode)).to.equal(false);
    });

    it("Should fail end wildcard", () => {
        let valueNode = new TreeNode("*b");
        courseNode.children.push(valueNode);
        isNode.children.push(courseNode);

        const section: Record<string, string> = {
            Section: "001",
            Campus: "ubc",
            Subject: "booota",
        };
        expect(parsingTree.meetsTreeCriteria(section, isNode)).to.equal(false);
    });

    it("Should pass one wildcard in front", () => {
        let valueNode = new TreeNode("*a");
        courseNode.children.push(valueNode);
        isNode.children.push(courseNode);

        const section: Record<string, string> = {
            Section: "001",
            Campus: "ubc",
            Subject: "bota",
        };
        expect(parsingTree.meetsTreeCriteria(section, isNode)).to.equal(true);
    });

    it("Should pass one wildcard in back", () => {
        let valueNode = new TreeNode("a*");
        courseNode.children.push(valueNode);
        isNode.children.push(courseNode);

        const section: Record<string, string> = {
            Section: "001",
            Campus: "ubc",
            Subject: "aadhe",
        };
        expect(parsingTree.meetsTreeCriteria(section, isNode)).to.equal(true);
    });

    it("Should pass one wildcard in back with multiple letters", () => {
        let valueNode = new TreeNode("aa*");
        courseNode.children.push(valueNode);
        isNode.children.push(courseNode);

        const section: Record<string, string> = {
            Section: "001",
            Campus: "ubc",
            Subject: "aadhe",
        };
        expect(parsingTree.meetsTreeCriteria(section, isNode)).to.equal(true);
    });

    it("Should pass one wildcard in both ends with multiple letters", () => {
        let valueNode = new TreeNode("*aa*");
        courseNode.children.push(valueNode);
        isNode.children.push(courseNode);

        const section: Record<string, string> = {
            Section: "001",
            Campus: "ubc",
            Subject: "baadhe",
        };
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

        const section = {
            Title: "intr modern asia",
            Section: "001",
            Year: 2015,
            Avg: 65.29,
            Campus: "ubc",
            Subject: "asia",
        };

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

        const section1 = {
            Title: "intr modern asia",
            Section: "001",
            Year: 2015,
            Avg: 65.29,
            Campus: "ubc",
            Subject: "bota",
        };
        const section2 = {
            Title: "intr modern asia",
            Section: "001",
            Year: 1900,
            Avg: 65.29,
            Campus: "ubc",
            Subject: "asia",
        };

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
        const query = { courses_dept: "*a" };
        const tree: TreeNode = parsingTree.createTreeNode(query);
        expect(tree.value).to.equal("courses_dept");
        expect(tree.children.length).to.equal(1);
        expect(tree.children[0].value).to.equal("*a");
    });

    it("Should create a tree with one child and one grandchild", () => {
        const query = { IS: { courses_dept: "*a" } };
        const tree: TreeNode = parsingTree.createTreeNode(query);
        expect(tree.value).to.equal("IS");
        expect(tree.children.length).to.equal(1);
        expect(tree.children[0].value).to.equal("courses_dept");
    });

    it("Should create a tree with two children", () => {
        const query = {
            AND: [
                { IS: { courses_dept: "*a" } },
                { GT: { courses_year: 2000 } },
            ],
        };
        const tree: TreeNode = parsingTree.createTreeNode(query);
        expect(tree.value).to.equal("AND");
        expect(tree.children.length).to.equal(2);
        expect(tree.children[0].value).to.equal("IS");
        expect(tree.children[1].value).to.equal("GT");
    });
});

describe("ParsingTree: reformattingSection", () => {
    let parsingTree: ParsingTree;
    let columns: string[];

    beforeEach(() => {
        parsingTree = new ParsingTree();
        columns = ["courses_dept", "courses_id", "courses_year"];
    });

    it("Should return null, because fields are missing", () => {
        const section = {
            Title: "intr modern asia",
            Section: "001",
            Avg: 65.29,
            Campus: "ubc",
            Subject: "bota",
        };

        expect(parsingTree.reformatSection(section, columns)).to.equal(null);
    });

    it("Should return list because all values are present", () => {
        const section = {
            Title: "intr modern asia",
            Section: "001",
            Avg: 65.29,
            Campus: "ubc",
            Subject: "bota",
            Course: "304",
            Year: 2020,
        };

        const expected = {
            courses_dept: "bota",
            courses_id: "304",
            courses_year: 2020,
        };

        expect(parsingTree.reformatSection(section, columns)).to.deep.equal(
            expected,
        );
    });

    it("Should have 1900 listed as the year", () => {
        const section = {
            Title: "intr modern asia",
            Section: "overall",
            Avg: 65.29,
            Campus: "ubc",
            Subject: "bota",
            Course: "304",
            Year: 2020,
        };

        const expected = {
            courses_dept: "bota",
            courses_id: "304",
            courses_year: 1900,
        };

        expect(parsingTree.reformatSection(section, columns)).to.deep.equal(
            expected,
        );
    });
});

describe("ParsingTree: reformattingSection", () => {
    let parsingTree: ParsingTree;
    let query: any;
    let sections: any[];

    beforeEach(() => {
        parsingTree = new ParsingTree();
        query = {
            WHERE: {
                AND: [
                    {
                        GT: {
                            courses_year: 1950,
                        },
                    },
                    {
                        IS: {
                            courses_dept: "*a",
                        },
                    },
                ],
            },
            OPTIONS: {
                COLUMNS: ["courses_dept", "courses_id", "courses_year"],
                ORDER: "courses_year",
            },
        };

        sections = [
            { courses_dept: "bota", courses_id: "304", courses_year: 1900 },
            { courses_dept: "aadhe", courses_id: "304", courses_year: 2000 },
        ];
    });

    it("Should sort according to order", () => {
        const expected = [
            { courses_dept: "bota", courses_id: "304", courses_year: 1900 },
            { courses_dept: "aadhe", courses_id: "304", courses_year: 2000 },
        ];
        expect(parsingTree.sortSections(sections, query)).to.deep.equal(
            expected,
        );
    });

    it("Should sort according to column[0]", () => {
        const noOrderQuery = {
            WHERE: {
                AND: [
                    {
                        GT: {
                            courses_year: 1950,
                        },
                    },
                    {
                        IS: {
                            courses_dept: "*a",
                        },
                    },
                ],
            },
            OPTIONS: {
                COLUMNS: ["courses_dept", "courses_id", "courses_year"],
            },
        };

        const expected = [
            { courses_dept: "aadhe", courses_id: "304", courses_year: 2000 },
            { courses_dept: "bota", courses_id: "304", courses_year: 1900 },
        ];
        expect(parsingTree.sortSections(sections, noOrderQuery)).to.deep.equal(
            expected,
        );
    });

    it("Should sort in order numbers correctly", () => {
        sections = [
            { courses_dept: "aadhe", courses_id: "304", courses_year: 2000 },
            { courses_dept: "bota", courses_id: "304", courses_year: 1900 },
        ];

        const expected = [
            { courses_dept: "bota", courses_id: "304", courses_year: 1900 },
            { courses_dept: "aadhe", courses_id: "304", courses_year: 2000 },
        ];
        expect(parsingTree.sortSections(sections, query)).to.deep.equal(
            expected,
        );
    });
});

describe("ParsingTree: Sorting sections", () => {
    let results;
    let sections: any[];
    let query: any;
    let parsingTree: ParsingTree;

    beforeEach(() => {
        parsingTree = new ParsingTree();
        sections = [
            {
                courses_dept: "apbi", courses_avg: 52.08, courses_fail: 5, courses_pass: 8,
                courses_audit: 0, courses_year: 1900, courses_id: "351", courses_instructor: "",
                courses_title: "plnt phys", courses_uuid: "4205",
            },
            {
                courses_dept: "apbc", courses_avg: 52.08, courses_fail: 5, courses_pass: 8,
                courses_audit: 0, courses_year: 2014, courses_id: "352",
                courses_instructor: "mansfield, shawn", courses_title: "plnt phys",
                courses_uuid: "41155",
            }
        ];
        query = {
            WHERE: {
                AND: [{ LT: { courses_avg: 90 } },
                { IS: { courses_dept: "aanb" } }]
            }, OPTIONS: {
                COLUMNS: [
                    "courses_dept",
                    "courses_avg",
                    "courses_fail",
                    "courses_pass",
                    "courses_audit",
                    "courses_year",
                    "courses_id",
                    "courses_instructor",
                    "courses_title",
                    "courses_uuid"
                ],
                ORDER: "courses_dept"
            }
        };
    });

    it("Should sort by dept", () => {
        query["OPTIONS"]["ORDER"] = "courses_dept";
        let result = [
            {
                courses_dept: "apbc", courses_avg: 52.08, courses_fail: 5, courses_pass: 8,
                courses_audit: 0, courses_year: 2014, courses_id: "352",
                courses_instructor: "mansfield, shawn", courses_title: "plnt phys",
                courses_uuid: "41155",
            },
            {
                courses_dept: "apbi", courses_avg: 52.08, courses_fail: 5, courses_pass: 8,
                courses_audit: 0, courses_year: 1900, courses_id: "351", courses_instructor: "",
                courses_title: "plnt phys", courses_uuid: "4205",
            }
        ];
        let sortedSection = parsingTree.sortSections(sections, query);
        expect(sortedSection).to.deep.equal(result);
    });

    it("Should sort with no order", () => {
        let insideQuery = {
            WHERE: {
                AND: [{ LT: { courses_avg: 90 } },
                { IS: { courses_dept: "aanb" } }]
            }, OPTIONS: {
                COLUMNS: [
                    "courses_dept",
                    "courses_avg",
                    "courses_fail",
                    "courses_pass",
                    "courses_audit",
                    "courses_year",
                    "courses_id",
                    "courses_instructor",
                    "courses_title",
                    "courses_uuid"
                ]
            }
        };

        let result = [
            {
                courses_dept: "apbc", courses_avg: 52.08, courses_fail: 5, courses_pass: 8,
                courses_audit: 0, courses_year: 2014, courses_id: "352",
                courses_instructor: "mansfield, shawn", courses_title: "plnt phys",
                courses_uuid: "41155",
            },
            {
                courses_dept: "apbi", courses_avg: 52.08, courses_fail: 5, courses_pass: 8,
                courses_audit: 0, courses_year: 1900, courses_id: "351", courses_instructor: "",
                courses_title: "plnt phys", courses_uuid: "4205",
            }
        ];
        let sortedSection = parsingTree.sortSections(sections, query);
        expect(sortedSection).to.deep.equal(result);
    });

    it("Should sort by instructor", () => {
        query["OPTIONS"]["ORDER"] = "courses_instructor";
        let sortedSection = parsingTree.sortSections(sections, query);
        let result = [
            {
                courses_dept: "apbi", courses_avg: 52.08, courses_fail: 5, courses_pass: 8,
                courses_audit: 0, courses_year: 1900, courses_id: "351", courses_instructor: "",
                courses_title: "plnt phys", courses_uuid: "4205"
            },
            {
                courses_dept: "apbc", courses_avg: 52.08, courses_fail: 5, courses_pass: 8,
                courses_audit: 0, courses_year: 2014, courses_id: "352",
                courses_instructor: "mansfield, shawn", courses_title: "plnt phys",
                courses_uuid: "41155",
            }
        ];
        expect(sortedSection).to.deep.equal(result);
    });

    it("Should sort by uuid", () => {
        query["OPTIONS"]["ORDER"] = "courses_uuid";
        let sortedSection = parsingTree.sortSections(sections, query);
        let result = [
            {
                courses_dept: "apbc", courses_avg: 52.08, courses_fail: 5, courses_pass: 8,
                courses_audit: 0, courses_year: 2014, courses_id: "352",
                courses_instructor: "mansfield, shawn", courses_title: "plnt phys",
                courses_uuid: "41155",
            },
            {
                courses_dept: "apbi", courses_avg: 52.08, courses_fail: 5, courses_pass: 8,
                courses_audit: 0, courses_year: 1900, courses_id: "351", courses_instructor: "",
                courses_title: "plnt phys", courses_uuid: "4205",
            }
        ];
        expect(sortedSection).to.deep.equal(result);
    });

    it("Should sort by year", () => {
        query["OPTIONS"]["ORDER"] = "courses_year";
        let sortedSection = parsingTree.sortSections(sections, query);
        let result = [
            {
                courses_dept: "apbi", courses_avg: 52.08, courses_fail: 5, courses_pass: 8,
                courses_audit: 0, courses_year: 1900, courses_id: "351", courses_instructor: "",
                courses_title: "plnt phys", courses_uuid: "4205",
            },
            {
                courses_dept: "apbc", courses_avg: 52.08, courses_fail: 5, courses_pass: 8,
                courses_audit: 0, courses_year: 2014, courses_id: "352",
                courses_instructor: "mansfield, shawn", courses_title: "plnt phys",
                courses_uuid: "41155",
            }
        ];
        expect(sortedSection).to.deep.equal(result);
    });
});
