/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */

CampusExplorer.buildQuery = function() {
    let query = {};
    let activeTab = document.getElementsByClassName("tab-panel active");
    if (typeof activeTab.namedItem("tab-courses") !== "undefined") {
        let courseProcessor = new queryProcessor("courses");
        query = courseProcessor.processQuery(activeTab);
    } else {
        let roomsProcessor = new queryProcessor("rooms");
        query = roomsProcessor.processQuery(activeTab);
    }
    return query;
};

class queryProcessor {
    constructor(queryType) {
        this.query = {"WHERE": {}, "OPTIONS": {"COLUMNS": {}, "ORDER": ""}};
        this.queryType = queryType;
    }

    processQuery(activeTab, preString) {
        this.query["WHERE"] = this.getCourseConditions(activeTab);
        this.query["OPTIONS"]["COLUMNS"] = this.getCourseColumns(activeTab);
        this.query["OPTIONS"]["ORDER"] = this.getCourseOrder(activeTab);
        console.log(this.query);
        return this.query;
    }

    getCourseConditions(activeTab) {
        let conditions = {};
        const possibleConditionTypes = ["courses-conditiontype-all", "courses-conditiontype-any",
                                        "courses-conditiontype-none"];
        let selectedConditionType = "";
        for (let possibleConditionType of possibleConditionTypes) {
            if (document.getElementById(possibleConditionType).checked) {
                selectedConditionType = possibleConditionType;
            }
        }
        switch(selectedConditionType) {
            case "courses-conditiontype-all":
                if (this.findClass("conditions-container", activeTab[0]).childNodes.length > 1) {
                    conditions["AND"] = {};
                    conditions["AND"] = this.getSelectedConditions(activeTab, conditions);
                } else {
                    conditions = this.getSelectedConditions(activeTab, conditions)[0];
                }
                return conditions;
            case "courses-conditiontype-any":
                if (this.findClass("conditions-container", activeTab[0]).childNodes.length > 1) {
                    conditions["OR"] = {};
                    conditions["OR"] = this.getSelectedConditions(activeTab, conditions);
                } else {
                    conditions = this.getSelectedConditions(activeTab, conditions)[0];
                }
                return conditions;
            case "courses-conditiontype-none":
                if (this.findClass("conditions-container", activeTab[0]).childNodes.length > 1) {
                    conditions["NOT"]["OR"] = {};
                    conditions["NOT"]["OR"] = this.getSelectedConditions(activeTab, conditions);
                } else {
                    conditions["NOT"] = {};
                    conditions["NOT"] = this.getSelectedConditions(activeTab, conditions)[0];
                }
                return conditions;
            default:
                console.log("error");
        }
        return conditions
    }

    getSelectedConditions(activeTab, conditions) {
        let cgConditions = conditions;
        let conditionsToAdd = [];
        if (activeTab.length === 1) {
            let conditions = this.findClass("conditions-container", activeTab[0]);
            let conditionsList = conditions.childNodes;
            for (let index = 0; index < conditionsList.length; index++) {
                let conditionToAdd = {};
                let field = {};
                let fieldName = "";
                let operator = "";
                let curr = conditionsList[index];
                let fields = this.findClass("control fields", curr).childNodes[1].childNodes;
                for (let index = 0; index < fields.length; index++) {
                    if (fields[index].selected) {
                        fieldName = this.queryType + "_" + fields[index].value;
                        field[fieldName] = this.findClass("control term", curr).childNodes[1].value;
                    }
                }
                let operators = this.findClass("control operators", curr).childNodes[1].childNodes;
                for (let index = 0; index < operators.length; index++) {
                    if (operators[index].selected) {
                        operator = operators[index].value;
                    }
                }
                let controlNot = this.findClass("control not", curr);
                if (controlNot.childNodes[1].checked) {
                    conditionToAdd = {"NOT": {}};
                    conditionToAdd["NOT"][operator] = field;
                } else {
                    conditionToAdd[operator] = field;
                }
                console.log(conditionToAdd);
                conditionsToAdd.push(conditionToAdd);
            }
        } else {
            console.log("Error: Active Tab object length > 1")
        }
        return conditionsToAdd;
    }

    getCourseColumns(controlFields) {
        let columns = [];
        const fieldsList = ["courses-columns-field-audit", "courses-columns-field-avg", "courses-columns-field-dept",
            "courses-columns-field-fail", "courses-columns-field-id", "courses-columns-field-instructor",
            "courses-columns-field-pass", "courses-columns-field-title", "courses-columns-field-uuid",
            "courses-columns-field-year"];
        for (let field of fieldsList) {
            if (document.getElementById(field).checked) {
                columns.push(this.queryType + "_" + document.getElementById(field).value);
            }
        }
        return columns;
    }

    getCourseOrder(activeTab) {
        let orderReturn = "";
        let order = this.findClass("form-group order", activeTab[0]);
        let order2 = this.findClass("control order fields", order);
        let orderOptions = order2.childNodes[1].childNodes;
        for (let index = 0; index < orderOptions.length; index++) {
            if (orderOptions[index].selected) {
                orderReturn = this.queryType + "_" + orderOptions[index].value;
            }
        }
        return orderReturn;
    }

    findClass(name, htmlObject) {
        let childNodes = htmlObject["childNodes"];
        if (typeof htmlObject == "undefined" || htmlObject === '') {
            return null;
        } else if (typeof childNodes == "undefined") {
            return null;
        } else if (htmlObject.className === name) {
            return htmlObject;
        } else {
            for (let child of childNodes) {
                let result = this.findClass(name, child);
                if (result !== null && typeof result !== "undefined") {
                    return result;
                }
            }
        }
    }
}
