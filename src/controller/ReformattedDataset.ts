import Log from "../Util";
import FilterTree from "./FilterTree";
import Constants from "./Constants";
import {Decimal} from "decimal.js";

export default class ReformattedDataset {
    constructor() {
        Log.trace("ReformattedDataset::init()");
    }

    public reformatSections(sections: any[], query: any): any[] {
      if (typeof query["TRANSFORMATIONS"] === "undefined") {
        return this.reformattedSectionsNoTransformation(sections, query);
      } else {
        return this.reformattedSectionsWithTransformation(sections, query);
      }
    }

    private reformattedSectionsNoTransformation(sections: any[], query: any): any[] {
      let result: any[] = [];

      sections.forEach((section) => {
        result.push(this.reformatSection(section, query["OPTIONS"]["COLUMNS"]));
      });

      return result;
    }

    private reformattedSectionsWithTransformation(sections: any[], query: any): any[] {
        let result: any[] = [];
        let groupedSections: any[][] = this.groupSections(sections, query);
        groupedSections = this.applyApplyRules(groupedSections, query["TRANSFORMATIONS"]["APPLY"]);
        let flattenedGroup = this.flattenSections(groupedSections, query["OPTIONS"]["COLUMNS"]);
        flattenedGroup.forEach((section) => {
            let newSection = this.reformatSection(section, query["OPTIONS"]["COLUMNS"]);
            result.push(newSection);
        });
        return result;
    }

    private flattenSections(groupedSections: any[][], columns: string[]): any[] {
      let result: any = [];

      groupedSections.forEach((section) => {
        result.push(section[0]);
      });

      return result;
    }

    private applyApplyRules(sections: any[][], applyRules: any[]): any[][] {
      applyRules.forEach((applyRule) => {
        sections.forEach((section) => {
          let applyKey: string = Object.keys(applyRule)[0];
          let applyValue = this.getApplyFieldValue(section, applyRule);
          section[0][applyKey] = applyValue;
        });
      });

      return sections;
    }

    private groupSections(sections: any[], query: any): any[][] {
      let filterTree: FilterTree = new FilterTree(sections, query["TRANSFORMATIONS"]["GROUP"]);
      return filterTree.getFilteredGroup(sections, query["TRANSFORMATIONS"]["GROUP"]);
    }

    public sortSections(sections: any[], query: any): any[] {
        let order = query["OPTIONS"]["ORDER"];
        if (typeof order === "undefined") {
            return sections;
        } else if  (typeof order === "string") {
            return this.sortWithOrderString(sections, order);
        } else {
            return this.sortWithOrderObject(sections, order);
        }
    }

    private sortWithOrderString(sections: any[], order: string): any[] {
        sections.sort((a, b) => {
            return this.sortSectionHelper(a, b, order);
        });

        return sections;
    }

    private sortWithOrderObject(sections: any[], order: any): any[] {
        sections.sort((a, b) => {
            let result = 0;
            let counter = 0;

            while (result === 0 && counter < order["keys"].length)  {
                if (order["keys"].length === 0) {
                    return 0;
                }

                result = this.sortSectionHelper(a, b, order["keys"][counter]);
                counter++;
            }

            result = (order["dir"] === "DOWN") ? result * (-1) : result;
            return result;
        });

        return sections;
    }

    private sortSectionHelper(a: any, b: any, order: string): number {
        if (typeof a[order] === "string" && a[order] < b[order]) {
            // return (a === "") ? 1 : -1;
            return - 1;
        } else if (typeof a[order] === "string" && a[order] > b[order]) {
            // return (b === "") ? -1 : 1;
            return 1;
        } else if (typeof a[order] === "string") {
            return 0;
        } else {
            return a[order] - b[order];
        }
    }

    public reformatSection(
        section: any,
        columns: string[],
    ): Record<string, any> {
        let reformattedSection: Record<string, any> = {};

        try {
            for (let col of columns) {
                const key: string = col.split("_")[1];

                if (
                    typeof section[Constants.MFIELD_MAP[key]] !== "undefined" &&
                    key === "year"
                ) {
                    reformattedSection[col] =
                        key === "year" && section["Section"] === "overall"
                            ? 1900
                            : parseInt(section[Constants.MFIELD_MAP[key]], 10);
                } else if (
                    typeof section[Constants.MFIELD_MAP[key]] !== "undefined"
                ) {
                    reformattedSection[col] = section[Constants.MFIELD_MAP[key]];
                } else if (
                    typeof section[Constants.SFIELD_MAP[key]] !== "undefined"
                ) {
                    reformattedSection[col] =
                        key === "uuid"
                            ? section[Constants.SFIELD_MAP[key]].toString()
                            : section[Constants.SFIELD_MAP[key]];
                } else if (col.indexOf("_") === -1) {
                    reformattedSection[col] = section[col];
                } else {
                    return null;
                }
            }
            return reformattedSection;
        } catch {
            return null;
        }
    }

    private getApplyFieldValue(sections: any[], applyRule: any): any {
      const applyKey = Object.keys(applyRule)[0];
      const rule: string = Object.keys(applyRule[applyKey])[0];
      let value: any = applyRule[applyKey][rule];
      let index: number = value.indexOf("_");
      value = value.substring(index + 1, value.length);

      if (rule === "MAX") {
        return this.calculateMax(sections, value);
      } else if (rule === "MIN") {
        return this.calculateMin(sections, value);
      } else if (rule === "AVG") {
        return this.calculateAvg(sections, value);
      } else if (rule === "COUNT") {
        return this.calculateCount(sections, value);
      } else {
        return this.calculateSum(sections, value);
      }
    }

    private calculateCount(sections: any[], value: any): number {
      let count = 0;
      let uniqueFields: any[] = [];
      let field = this.determineField(value);

      sections.forEach((section) => {
        let val = section[field];
        if (section["Section"] === "overall" && value === "year") {
          val = 1900;
        }

        if (!uniqueFields.includes(val)) {
          count++;
          uniqueFields.push(val);
        }
      });

      return count;
    }

    private calculateAvg(sections: any[], value: any): number {
      let field = this.determineField(value);
      let total = new Decimal(0);
      sections.forEach((section) => {
          total = Decimal.add(total, new Decimal(section[field]));
      });

      let avg = total.toNumber() / sections.length;
      return Number(avg.toFixed(2));
    }

    private calculateSum(sections: any[], value: any): number {
      let field = this.determineField(value);
      let sum = new Decimal(0);

      sections.forEach((section) => {
        let val = new Decimal(section[field]);
        if (section["Section"] === "overall" && value === "year") {
          val = new Decimal(1900);
        }
        sum = Decimal.add(sum, val);
      });

      return Number(sum.toFixed(2));
    }

    private calculateMax(sections: any[], value: any): number {
      let field = this.determineField(value);
      let max = Number.MIN_VALUE;

      sections.forEach((section) => {
        if (section[field] > max) {
          max = section[field];
        }
      });

      return max;
    }

    private calculateMin(sections: any[], value: any): number {
      let field = this.determineField(value);
      let min = Number.MAX_VALUE;

      sections.forEach((section) => {
        let val = section[field];
        if (section["Section"] === "overall" && value === "year") {
          val = 1900;
        }
        if (section[field] < min) {
          min = val;
        }
      });

      return min;
    }

    private determineField(value: any): string {
      if (typeof Constants.SFIELD_MAP[value] === "undefined") {
        return Constants.MFIELD_MAP[value];
      } else {
        return Constants.SFIELD_MAP[value];
      }
    }

  }
