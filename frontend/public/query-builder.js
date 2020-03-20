/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */

CampusExplorer.buildQuery = function() {
    let query = {};
    let processor = new CourseQueryProcessor();
    let activeTab = document.getElementsByClassName("tab-panel active");
    if (typeof activeTab.namedItem("tab-courses") !== "undefined") {
        query = processor.processCourses(activeTab);
    } else {
        query = processor.processRooms(activeTab);
    }
    return query;
};

class CourseQueryProcessor {
    constructor() {
        console.log("Course processor created");
        this.query = {"WHERE": {}, "OPTIONS": {"COLUMNS": {}, "ORDER": ""}};
    }

    processCourses(activeTab) {
        this.query["WHERE"] = this.getCourseConditions(activeTab);
        this.query["OPTIONS"]["COLUMNS"] = this.getCourseColumns(activeTab);
        console.log(this.query);
        console.log(this.query["OPTIONS"]["COLUMNS"]);
    }

    processRooms(controlFields) {
        let audit = document.getElementById("courses-columns-field-audit").checked;
        console.log(audit);
    }

    getCourseColumns(controlFields) {
        let columns = [];
        const fieldsList = ["courses-columns-field-audit", "courses-columns-field-avg", "courses-columns-field-dept",
            "courses-columns-field-fail", "courses-columns-field-id", "courses-columns-field-instructor",
            "courses-columns-field-pass", "courses-columns-field-title", "courses-columns-field-uuid",
            "courses-columns-field-year"];
        for (let field of fieldsList) {
            if (document.getElementById(field).checked) {
                console.log(document.getElementById(field).value);
                columns.push("courses_" + document.getElementById(field).value);
            }
        }
        return columns;
    }

    getCourseConditions(controlFields) {
        const conditionTypes = ["courses-conditiontype-all", "courses-conditiontype-any", "courses-conditiontype-none"];
        let condition = "";
        for (let conditionType of conditionTypes) {
            if (document.getElementById(conditionType).checked) {
                condition = conditionType;
            }
        }
    }
}
