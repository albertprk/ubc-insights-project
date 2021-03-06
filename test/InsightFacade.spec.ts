import { expect } from "chai";
import * as fs from "fs-extra";
import InsightFacade from "../src/controller/InsightFacade";
import TreeNode from "../src/controller/TreeNode";
import ParsingTree from "../src/controller/ParsingTree";
import {
    InsightError,
    NotFoundError,
    InsightDataset,
    InsightDatasetKind,
} from "../src/controller/IInsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";

// test that fails because there are no datasets
// idstring that has white space is considered valid

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any; // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string; // This is injected when reading the file
}

describe("InsightFacade Add/Remove Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        unzippedFile: "./test/data/notAZipFile.txt",
        emptyFile: "./test/data/emptyZip.zip",
        secondCourses: "./test/data/courses2.zip",
        noCourses: "./test/data/noCourses.zip",
        invalidJson: "./test/data/invalidJson.zip",
        hasInvalidJson: "./test/data/hasInvalidJson.zip",
        notInCourses: "./test/data/notInCourses.zip",
        emptySections: "./test/data/onlyEmptySections.zip",
        invalidSections: "./test/data/allInvalidSections.zip",
        rooms: "./test/data/rooms.zip"
    };
    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs
                .readFileSync(datasetsToLoad[id])
                .toString("base64");
        }
    });

    beforeEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs before each test, which should make each test independent from the previous one
        Log.test(`BeforeTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    it("Should add a valid dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect(result).to.deep.equal(expected);
            })
            .catch((err: any) => {
                expect.fail(err, expected, "Should not have rejected");
            });
    });

    it("Should add a valid rooms dataset", function () {
        const id: string = "rooms";
        const expected: string[] = [id];
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Rooms)
            .then((result: string[]) => {
                expect(result).to.deep.equal(expected);
            })
            .catch((err: any) => {
                Log.trace(err);
                expect.fail(err, expected, "Should not have rejected");
            });
    });

    it("Should add a valid rooms and coursers dataset", function () {
        const id: string = "rooms";
        const id2: string = "courses";
        const expected: string[] = [id, id2];
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Rooms)
            .then((result: string[]) => {
                return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Courses);
            }).then((result2) => {
              expect(result2).to.deep.equal(expected);
            })
            .catch((err: any) => {
                Log.trace(err);
                expect.fail(err, expected, "Should not have rejected");
            });
    });

    it("Should fail because file is persisted to disk", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                return insightFacade.datasets.delete(id);
            }).then((result2: boolean) => {
                return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
            }).then((result3: string[]) => {
              expect.fail(result3, InsightError, "Failed to catch insightError");
            }).catch((err: any) => {
                return expect(err).to.be.an.instanceOf(InsightError);
            });
    });

    it("Should fail because files aren't in courses", function () {
        const id: string = "notInCourses";
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, InsightError, "Should not have accepted");
            })
            .catch((err: any) => {
                return expect(err).to.be.an.instanceOf(InsightError);
            });
    });

    it("Should because all sections are missing one of the needed parsed values", function () {
        const id: string = "invalidSections";
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, InsightError, "Should not have accepted");
            })
            .catch((err: any) => {
                return expect(err).to.be.an.instanceOf(InsightError);
            });
    });

    it("Should fail because all sections are empty", function () {
        const id: string = "emptySections";
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(
                    result,
                    InsightError,
                    "Should not have been accepted",
                );
            })
            .catch((err: any) => {
                return expect(err).to.be.an.instanceOf(InsightError);
            });
    });

    it("Should fail because it only has invalid JSON", function () {
        const id: string = "invalidJson";
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, InsightError, "Should not have accepted");
            })
            .catch((err: any) => {
                return expect(err).to.be.an.instanceOf(InsightError);
            });
    });

    it("Should pass because it only has one instance of invalid JSON", function () {
        const id: string = "hasInvalidJson";
        const expected: string[] = [id];
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect(result).to.deep.equal(expected);
            })
            .catch((err: any) => {
                Log.trace(err);
                expect.fail(err, expected, "Should not have rejected");
            });
    });

    it("Should still keep original datasets when an invalid one is added", function () {
        const id1: string = "courses";
        const id2: string = "any_Id";
        const id3: string = "secondCourses";
        const expected: string[] = [id1, id3];

        return insightFacade
            .addDataset(id1, datasets[id1], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                return insightFacade.addDataset(
                    id2,
                    datasets[id1],
                    InsightDatasetKind.Courses,
                );
            })
            .catch((err: any) => {
                return expect(err).to.be.an.instanceOf(InsightError);
            })
            .then((result2: string[]) => {
                return insightFacade.addDataset(
                    id3,
                    datasets[id3],
                    InsightDatasetKind.Courses,
                );
            })
            .then((result3) => {
                expect(result3.length).to.equal(expected.length);
                return insightFacade.listDatasets();
            })
            .then((result4: InsightDataset[]) => {
                expect(result4.length).to.equal(expected.length);
            })
            .catch((err: any) => {
                expect.fail(err, expected, "Should not have been rejected");
            });
    });

    it("Should be be able to store multiple different datasets", function () {
        const id1: string = "courses";
        const id2: string = "secondCourses";
        const id3: string = "rooms";
        const expected: string[] = [id1, id2];
        return insightFacade
            .addDataset(id1, datasets[id1], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                return insightFacade.addDataset(
                    id2,
                    datasets[id2],
                    InsightDatasetKind.Courses,
                );
            })
            .then((result2: string[]) => {
                return expect(result2).to.deep.eq(expected);
            })
            .then((result3) => {
                return insightFacade.listDatasets();
            })
            .then((result4: InsightDataset[]) => {
                expect(result4.length).to.equal(expected.length);
                return insightFacade.addDataset(id3, datasets[id3], InsightDatasetKind.Rooms);
            }).then((result5) => {
                return insightFacade.listDatasets();
            }).then((result6) => {
              expect(result6.length).to.deep.equal(3);
            })
            .catch((err: any) => {
                Log.trace(err);
                expect.fail(err, expected, "Should not have rejected");
            });
    });

    it("Should be able to remove first dataset added", function () {
        const id1: string = "courses";
        const id2: string = "secondCourses";
        const id3: string = "thirdCourses";

        const expected: string[] = [id2, id3];

        return insightFacade
            .addDataset(id1, datasets[id1], InsightDatasetKind.Courses)
            .then((res: string[]) => {
                return insightFacade.addDataset(
                    id2,
                    datasets[id1],
                    InsightDatasetKind.Courses,
                );
            })
            .then((res2: string[]) => {
                return insightFacade.addDataset(
                    id3,
                    datasets[id1],
                    InsightDatasetKind.Courses,
                );
            })
            .catch((err: any) => {
                // Log.trace(err);
                expect.fail(err, expected, "Should not have rejected");
            })
            .then((res3: string[]) => {
                return insightFacade.removeDataset(id1);
            })
            .then((res4: string) => {
                expect(res4).to.equal(id1);
                return insightFacade.listDatasets();
            })
            .then((res5: InsightDataset[]) => {
                let names: string[] = [];
                res5.map((dataset: InsightDataset) => {
                    names.push(dataset.id);
                });
                expect(names).to.deep.equal(expected);
            })
            .catch((err: any) => {
                expect.fail(err, "Should not have failed");
            });
    });

    it("Should be be able to remove multiple different datasets", function () {
        const id1: string = "courses";
        const id2: string = "secondCourses";
        const expected: string[] = [id1, id2];
        return insightFacade
            .addDataset(id1, datasets[id1], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                return insightFacade.addDataset(
                    id2,
                    datasets[id1],
                    InsightDatasetKind.Courses,
                );
            })
            .then((result2: string[]) => {
                expect(result2).to.deep.eq(expected);
                return insightFacade.removeDataset(id1);
            })
            .then((result4: string) => {
                expect(result4).to.equal(id1);
                return insightFacade.removeDataset(id2);
            })
            .then((result5: string) => {
                expect(result5).to.equal(id2);
                return insightFacade.listDatasets();
            })
            .then((result6: InsightDataset[]) => {
                expect(result6.length).to.equal(0);
            })
            .catch((err: any) => {
                expect.fail(err, expected, "Should not have rejected");
            });
    });

    it("addDataSet Should fail due to invalid id", function () {
        const id: string = "invalid_id";
        return insightFacade
            .addDataset(id, datasets["courses"], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                return expect(result).to.be.an.instanceOf(InsightError);
            })
            .catch((err: any) => {
                return expect(err).to.be.an.instanceOf(InsightError);
            })
            .then((result2) => {
                return insightFacade.listDatasets();
            })
            .then((result3: InsightDataset[]) => {
                expect(result3.length).to.equal(0);
            })
            .catch((err: any) => {
                expect.fail(err, "Should not have rejected");
            });
    });

    it("addDataSet Should fail due to an empty string id", function () {
        const id: string = "     ";
        return insightFacade
            .addDataset(id, datasets["courses"], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, "Should not rejected");
            })
            .catch((err: any) => {
                expect(err).to.be.an.instanceOf(InsightError);
            });
    });

    it("addDataSet Should fail due to null id", function () {
        const id: string = null;
        return insightFacade
            .addDataset(id, datasets["courses"], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, "Should have been rejected");
            })
            .catch((err: any) => {
                expect(err).to.be.an.instanceOf(InsightError);
            });
    });

    it("addDataSet Should fail due to an empty string id", function () {
        const id: string = "";
        return insightFacade
            .addDataset(id, datasets["courses"], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, "Should not rejected");
            })
            .catch((err: any) => {
                expect(err).to.be.an.instanceOf(InsightError);
            });
    });

    it("Should reject dataset because it already exists", function () {
        const id: string = "courses";
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .catch((err: any) => {
                expect.fail(err, "Shouldn't have failed");
            })
            .then((result: string[]) => {
                return insightFacade.addDataset(
                    id,
                    datasets[id],
                    InsightDatasetKind.Courses,
                );
            })
            .then((result2: string[]) => {
                expect(result2).to.be.an.instanceOf(InsightError);
            })
            .catch((err: any) => {
                expect(err).to.be.an.instanceOf(InsightError);
            });
    });

    it("addDataSet should fail due to no zip file", function () {
        const id: string = "anyId";
        return insightFacade
            .addDataset(
                id,
                datasets["unzippedFile"],
                InsightDatasetKind.Courses,
            )
            .then((result: string[]) => {
                expect.fail(result, "Should not rejected");
            })
            .catch((err: any) => {
                expect(err).to.be.an.instanceOf(InsightError);
            });
    });

    it("addDataSet should fail due to no empty courses file", function () {
        const id: string = "anyId";
        return insightFacade
            .addDataset(id, datasets["noCourses"], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, "Should not rejected");
            })
            .catch((err: any) => {
                expect(err).to.be.an.instanceOf(InsightError);
            });
    });

    // make an invalid file within courses

    it("addDataSet should fail due to no file found", function () {
        const id: string = "anyId";
        return insightFacade
            .addDataset(
                id,
                datasets["fileNotFound"],
                InsightDatasetKind.Courses,
            )
            .then((result: string[]) => {
                expect.fail(result, "Should not rejected");
            })
            .catch((err: any) => {
                expect(err).to.be.an.instanceOf(InsightError);
            });
    });

    it("Should only remove dataset with given Id", function () {
        let allDataSets: string[] = [];
        const id1: string = "courses";
        const id2: string = "secondCourses";
        const expected: string[] = [id1];

        return insightFacade
            .addDataset(id1, datasets[id1], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                return insightFacade.addDataset(
                    id2,
                    datasets[id2],
                    InsightDatasetKind.Courses,
                );
            })
            .then((result2: string[]) => {
                return insightFacade.removeDataset(id2);
            })
            .then((result3: string) => {
                return insightFacade.listDatasets();
            })
            .then((result4: InsightDataset[]) => {
                expect(result4.length).to.equal(1);
            })
            .catch((err: any) => {
                expect.fail(err, expected, "Should not have rejected");
            });
    });
    //
    // it("addDataSet should fail due to corrupted zip file", function () {
    // });

    it("addDataSet should fail due to empty zip file", function () {
        const id: string = "anyId";
        return insightFacade
            .addDataset(id, datasets["emptyFile"], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect.fail(result, "Should not rejected");
            })
            .catch((err: any) => {
                expect(err).to.be.an.instanceOf(InsightError);
            });
    });

    // there's another version of empty to test

    it("addDataSet should fail due to invalid kind", function () {
        const id: string = "anyId";
        return insightFacade
            .addDataset(id, datasets["coursers"], null)
            .then((result: string[]) => {
                expect.fail(result, "Should not rejected");
            })
            .catch((err: any) => {
                expect(err).to.be.an.instanceOf(InsightError);
            });
    });

    it("removeDataSet Should fail due to null id", function () {
        const id: string = null;
        return insightFacade
            .removeDataset(null)
            .then((result) => {
                expect.fail(result, "Should not rejected");
            })
            .catch((err: any) => {
                expect(err).to.be.an.instanceOf(InsightError);
            });
    });

    it("Should successfully remove dataSet that exists in memory", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((res1: string[]) => {
                return insightFacade.removeDataset(id);
            })
            .then((res2: string) => {
                expect(res2).to.eq(id);
            })
            .catch((err: any) => {
                expect.fail(err, expected, "Should not have rejected");
            });
    });

    it("Should successfully remove rooms dataSet that exists in memory", function () {
        const id: string = "rooms";
        const expected: string[] = [id];
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Rooms)
            .then((res1: string[]) => {
                return insightFacade.removeDataset(id);
            })
            .then((res2: string) => {
                expect(res2).to.eq(id);
                return insightFacade.listDatasets();
            }).then((res3) => {
                expect(res3.length).to.equal(0);
            })
            .catch((err: any) => {
                expect.fail(err, expected, "Should not have rejected");
            });
    });

    it("Should fail because dataSet does not exist", function () {
        return insightFacade
            .removeDataset("anyid")
            .then((result) => {
                expect.fail(result, "Should not rejected");
            })
            .catch((err: any) => {
                expect(err).to.be.an.instanceOf(NotFoundError);
            });
    });

    it("addDataSet should succeed because removeDataset has been called", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                return insightFacade.removeDataset(id);
            })
            .catch((err: any) => {
                expect.fail(err, expected, "Should not have rejected");
            })
            .then((result2: string) => {
                return insightFacade.addDataset(
                    id,
                    datasets[id],
                    InsightDatasetKind.Courses,
                );
            })
            .then((result2: string[]) => {
                expect(result2).to.deep.equal(expected);
            })
            .catch((err: any) => {
                expect.fail(err, expected, "Should not have rejected");
            });
    });

    it("removeData should fail because it has been called twice", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((res1: string[]) => {
                return insightFacade.removeDataset(id);
            })
            .catch((err: any) => {
                expect.fail(err, expected, "Should not have rejected");
            })
            .then((res2: any) => {
                return insightFacade.removeDataset(id);
            })
            .then((result) => {
                expect.fail(result, "Should not have resolved");
            })
            .catch((err: any) => {
                expect(err).to.be.an.instanceOf(NotFoundError);
            });
    });

    it("should fail because removeData has been call multiple times", function () {
        const id: string = "courses";
        return insightFacade
            .removeDataset(id)
            .then((res1: string) => {
                expect.fail(res1, NotFoundError, "Should've failed");
            })
            .catch((err: any) => {
                return insightFacade.removeDataset(id);
            })
            .then((res2) => {
                expect.fail(res2, NotFoundError, "Should've failed");
            })
            .catch((err: any) => {
                return insightFacade.removeDataset(id);
            })
            .then((res3) => {
                expect.fail(res3, NotFoundError, "Should've failed");
            })
            .catch((err: any) => {
                return insightFacade.listDatasets();
            })
            .then((res4: InsightDataset[]) => {
                expect(res4.length).to.equal(0);
            })
            .catch((err: any) => {
                expect.fail("Should not have failed");
            });
    });

    it("Should correctly list id, and kind of datasets", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                return insightFacade.listDatasets();
            })
            .then((result2: InsightDataset[]) => {
                const firstEntry: InsightDataset = result2[0];
                expect(firstEntry.id).to.equal(id);
                expect(firstEntry.kind).to.equal(InsightDatasetKind.Courses);
            })
            .catch((err: any) => {
                expect.fail(err, expected, "Should not have rejected");
            });
    });

    it("Should correctly list numRows", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade
            .addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                return insightFacade.listDatasets();
            })
            .then((result2: InsightDataset[]) => {
                const firstEntry: InsightDataset = result2[0];
                expect(firstEntry.numRows).to.equal(64612);
            })
            .catch((err: any) => {
                expect.fail(err, expected, "Should not have rejected");
            });
    });
});


/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
//  */
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: {
        [id: string]: { path: string; kind: InsightDatasetKind };
    } = {
        courses: {
            path: "./test/data/courses.zip",
            kind: InsightDatasetKind.Courses,
        }
    };
    let insightFacade: InsightFacade;
    let testQueries: ITestQuery[] = [];

    // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    before(function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = TestUtil.readTestQueries();
        } catch (err) {
            expect.fail(
                "",
                "",
                `Failed to read one or more test queries. ${err}`,
            );
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Will fail* if there is a problem reading ANY dataset.
        const loadDatasetPromises: Array<Promise<string[]>> = [];
        insightFacade = new InsightFacade();
        for (const id of Object.keys(datasetsToQuery)) {
            Log.info("MY QUERYING ID IS: " + id);
            const ds = datasetsToQuery[id];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(
                insightFacade.addDataset(id, data, ds.kind),
            );
        }
        return Promise.all(loadDatasetPromises).catch((err) => {
            Log.info("I cAUGHT AN ERROR!!!");
            Log.trace(err);
            /* *IMPORTANT NOTE: This catch is to let this run even without the implemented addDataset,
             * for the purposes of seeing all your tests run.
             * TODO For C1, remove this catch block (but keep the Promise.all)
             */
            return Promise.resolve("HACK TO LET QUERIES RUN");
        });
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Dynamically create and run a test for each query in testQueries
    // Creates an extra "test" called "Should run test queries" as a byproduct. Don't worry about it
    // Dynamically create and run a test for each query in testQueries.
    // Creates an extra "test" called "Should run test queries" as a byproduct.
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function (done) {
                    const resultChecker = TestUtil.getQueryChecker(test, done);
                    insightFacade
                        .performQuery(test.query)
                        .then(resultChecker)
                        .catch(resultChecker);
                });
            }
        });
    });
});
