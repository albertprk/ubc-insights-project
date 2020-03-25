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
    //console.log(activeTab[0]);
    if (activeTab[0].id === "tab-courses") {
        let courseProcessor = new queryProcessor("courses");
        query = courseProcessor.processQuery(activeTab);
    } else {
        let roomsProcessor = new queryProcessor("rooms");
        query = roomsProcessor.processQuery(activeTab);
    }
    console.log(query);
    return query;
};

class queryProcessor {
    constructor(queryType) {
        this.query = {"WHERE": {}, "OPTIONS": {"COLUMNS": {}, "ORDER": ""}};
        this.queryType = queryType;
        this.transformations = [];
        this.group = [];
    }

    processQuery(activeTab, preString) {
        console.log(this.queryType);
        this.createTransformations(activeTab);
        if (this.transformations.length > 0) {
            this.query["TRANSFORMATIONS"] = {};
            this.createGroups(activeTab);
            this.buildQueryTransformations();
        }
        this.query["WHERE"] = this.getCourseConditions(activeTab);
        this.query["OPTIONS"]["COLUMNS"] = this.getCourseColumns(activeTab);
        this.createCourseOrder(activeTab);
        return this.query;
    }

    getCourseConditions(activeTab) {
        let conditions = {};
        let selectedConditionType = "";
        let conditionTypes = this.findClass("control-group condition-type", activeTab[0]);
        console.log(conditionTypes.childNodes);
        for (let index = 1; index < conditionTypes.childNodes.length; index += 2) {
            if (conditionTypes.childNodes[index].childNodes[1].checked) {
                selectedConditionType = conditionTypes.childNodes[index].childNodes[1].value;
            }
        }
        switch(selectedConditionType) {
            case "all":
                if (this.findClass("conditions-container", activeTab[0]).childNodes.length > 1) {
                    conditions["AND"] = {};
                    conditions["AND"] = this.getSelectedConditions(activeTab, conditions);
                } else {
                    conditions = this.getSelectedConditions(activeTab, conditions)[0];
                }
                return conditions;
            case "any":
                if (this.findClass("conditions-container", activeTab[0]).childNodes.length > 1) {
                    conditions["OR"] = {};
                    conditions["OR"] = this.getSelectedConditions(activeTab, conditions);
                } else {
                    conditions = this.getSelectedConditions(activeTab, conditions)[0];
                }
                return conditions;
            case "none":
                if (this.findClass("conditions-container", activeTab[0]).childNodes.length > 1) {
                    conditions["NOT"] = {};
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
        //if (activeTab.length === 1) {
            let conditionss = this.findClass("conditions-container", activeTab[0]);
            let conditionsList = conditionss.childNodes;
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
                        let fieldValue = this.findClass("control term", curr).childNodes[1].value;
                        if (isNaN(parseInt(fieldValue))) {
                            field[fieldName] = fieldValue;
                        } else {
                            field[fieldName] = parseInt(fieldValue);
                        }
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
                conditionsToAdd.push(conditionToAdd);
            }
        //} else {
        //    console.log("Error: Active Tab object length > 1")
        //}
        return conditionsToAdd;
    }

    getCourseColumns(controlFields) {
        let columns = [];
        let fieldsList = [];
        if (this.queryType === "courses") {
            fieldsList = ["courses-columns-field-audit", "courses-columns-field-avg", "courses-columns-field-dept",
                "courses-columns-field-fail", "courses-columns-field-id", "courses-columns-field-instructor",
                "courses-columns-field-pass", "courses-columns-field-title", "courses-columns-field-uuid",
                "courses-columns-field-year"];
        } else {
            fieldsList = ["rooms-columns-field-address", "rooms-columns-field-fullname",
                "rooms-columns-field-furniture", "rooms-columns-field-href", "rooms-columns-field-lat",
                "rooms-columns-field-lon", "rooms-columns-field-name", "rooms-columns-field-number",
                "rooms-columns-field-seats", "rooms-columns-field-shortname", "rooms-columns-field-type"];
        }
        for (let field of fieldsList) {
            if (document.getElementById(field).checked) {
                columns.push(this.queryType + "_" + document.getElementById(field).value);
            }
        }
        let columnOptions = this.findClass("control-group", controlFields[0]).childNodes;
        for (let index = 0; index < columnOptions.length; index++) {
            if (columnOptions[index].className === "control transformation") {
                let transformation = columnOptions[index].childNodes[1];
                if (transformation.checked) {
                    columns.push(transformation.value);
                }
            }
        }
        return columns;
    }

    createCourseOrder(activeTab) {
        let orderReturn = [];
        let order = this.findClass("form-group order", activeTab[0]);
        let order2 = this.findClass("control order fields", order);
        let orderOptions = order2.childNodes[1].childNodes;
        for (let index = 0; index < orderOptions.length; index++) {
            if (orderOptions[index].selected) {
                let newElement = orderOptions[index].value;
                let verifyTransformations = [];
                for (let transformation of this.transformations) {
                    verifyTransformations.push(Object.keys(transformation)[0]);
                }
                if (verifyTransformations.includes(newElement)) {
                    orderReturn.push(newElement);
                } else {
                    orderReturn.push(this.queryType + "_" + newElement);
                }
            }
        }
        let descending = this.findClass("control descending", order);
        if (descending.childNodes[1].checked) {
            this.query["OPTIONS"]["ORDER"] = {"dir": "DOWN"};
            if (orderReturn.length === 1) {
                this.query["OPTIONS"]["ORDER"]["keys"] = orderReturn;
            } else {
                this.query["OPTIONS"]["ORDER"]["keys"] = orderReturn;
            }
        } else {
            if (orderReturn.length === 1) {
                this.query["OPTIONS"]["ORDER"] = orderReturn[0];
            } else {
                this.query["OPTIONS"]["ORDER"] = {"dir": "UP"};
                this.query["OPTIONS"]["ORDER"]["keys"] = orderReturn;
            }
        }
        return orderReturn;
    }

    createGroups(activeTab) {
        let allGroups = this.findClass("control-group", this.findClass("form-group groups", activeTab[0]));
        for (let index = 1; index < allGroups.childNodes.length; index += 2) {
            let potential = allGroups.childNodes[index].childNodes[1];
            if (potential.checked) {
                this.group.push(this.queryType + "_" + potential.value);
            }
        }
    }

    createTransformations(activeTab) {
        let allTransformations = this.findClass("transformations-container", activeTab[0]).childNodes;
        for (let index = 0; index < allTransformations.length; index++) {
            let transformationToAdd = {};
            let transformationTerm = "";
            let transformationOperator = "";
            let transformationField = "";
            let transformation = allTransformations[index];
            transformationTerm = this.findClass("control term", transformation).childNodes[1].value;
            let controlOperators = this.findClass("control operators", transformation);
            let operators = controlOperators.childNodes[1].childNodes;
            for (let operator of operators) {
                if (operator.selected) {
                    transformationOperator = operator.value;
                }
            }
            let controlFields = this.findClass("control fields", transformation);
            let fields = controlFields.childNodes[1].childNodes;
            for (let field of fields) {
                if (field.selected) {
                    transformationField = this.queryType + "_" + field.value;
                }
            }
            transformationToAdd[transformationTerm] = {};
            transformationToAdd[transformationTerm][transformationOperator] = transformationField;
            this.transformations.push(transformationToAdd);
        }
    }

    buildQueryTransformations() {
        this.query["TRANSFORMATIONS"] = {};
        this.query["TRANSFORMATIONS"]["GROUP"] = this.group;
        this.query["TRANSFORMATIONS"]["APPLY"] = this.transformations;
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
