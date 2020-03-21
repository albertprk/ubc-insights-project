/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */

CampusExplorer.buildQuery = function() {
    let query = {};
    let courseProcessor = new CourseQueryProcessor();
    let roomsProcessor = new RoomsQueryProcessor();
    let activeTab = document.getElementsByClassName("tab-panel active");
    if (typeof activeTab.namedItem("tab-courses") !== "undefined") {
        query = courseProcessor.processCourses(activeTab);
    } else {
        query = roomsProcessor.processRooms(activeTab);
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
        let conditions = {};
        const conditionTypes = ["courses-conditiontype-all", "courses-conditiontype-any", "courses-conditiontype-none"];
        let condition = "";
        for (let conditionType of conditionTypes) {
            if (document.getElementById(conditionType).checked) {
                condition = conditionType;
            }
        }
        switch(condition) {
            case "courses-conditiontype-all":
                conditions["AND"] = {};
                break;
            case "courses-conditiontype-any":
                conditions["OR"] = {};
                break;
            case "courses-conditiontype-none":
                conditions["NOT"] = {"OR": {}};
                break;
            default:
                console.log("error");
        }
        this.getControlGroupConditions(conditions);
        console.log(conditions);
    }

    getControlGroupConditions(conditions) {
        let cgConditions = {};
        const values = ["audit", "avg", "selected", "fail", "id", "instructor", "pass", "title", "uuid", "year"];
        const operators = ["EQ", "GT", "IS", "LT"];
        let selectedValue = "";
        for (let curr = 0; curr < document.getElementsByClassName("control-group condition").length; curr++) {
            let not = false;
            // let notCheckBox = document.getElement;
            let currContainer = document.getElementsByClassName("control-group condition")[curr];
            console.log(currContainer);
            for (let value of values) {
                let currentColl = currContainer.item(value);
                console.log(currentColl);
                if (currentColl.item(value).selected) {
                    selectedValue = "courses_" + value;
                }
            }
            console.log(selectedValue);
            for (let operator of operators) {

            }
        }
    }
}

class RoomsQueryProcessor {
    constructor() {
        console.log("Course processor created");
        this.query = {"WHERE": {}, "OPTIONS": {"COLUMNS": {}, "ORDER": ""}};
    }
}
