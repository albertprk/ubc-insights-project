import Log from "../Util";
import FilterTree from "./FilterTree";

export default class ReformattedDataset {
    constructor() {
        Log.trace("ReformattedDataset::init()");
    }

    public MFIELD_MAP: Record<string, string> = {
        avg: "Avg",
        pass: "Pass",
        fail: "Fail",
        audit: "Audit",
        year: "Year",
        lat: "lat",
        lon: "lon"
    };

    public SFIELD_MAP: Record<string, string> = {
        dept: "Subject",
        id: "Course",
        instructor: "Professor",
        title: "Title",
        uuid: "id",
        fullname: "fullname",
        shortname: "shortname",
        number: "number",
        name: "name",
        address: "address",
        type: "type",
        furniture: "furniture",
        href: "href"
    };

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
        Log.info("APPLIED RULES");
        let flattenedGroup = this.flattenSections(groupedSections, query["OPTIONS"]["COLUMNS"]);
        Log.info("FLATTENED STUFF");
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
      Log.info("IN APPLY RULES");
      applyRules.forEach((applyRule) => {
        sections.forEach((section) => {
          let applyKey: string = Object.keys(applyRule)[0];
          let applyValue = this.getApplyFieldValue(section, applyRule);
          section[0][applyKey] = applyValue;
        });
      });
      Log.info("OUT OF APPLY RULES");

      return sections;
    }

    private groupSections(sections: any[], query: any): any[][] {
      let filterTree: FilterTree = new FilterTree(sections, query["TRANSFORMATIONS"]["GROUP"]);
      return filterTree.getFilteredGroup(sections, query["TRANSFORMATIONS"]["GROUP"]);
    }

    public sortSections(sections: any[], query: any): any[] {
        let orderKey: string;
        if (typeof query["OPTIONS"]["ORDER"] !== "undefined") {
            orderKey = query["OPTIONS"]["ORDER"];
        } else {
            return sections;
        }

        sections.sort((a: any, b: any) => {
            if (
                typeof a[orderKey] === "string" &&
                a[orderKey].toLowerCase() < b[orderKey].toLowerCase()
            ) {
                return -1;
            } else if (
                typeof a[orderKey] === "string" &&
                a[orderKey].toLowerCase() > b[orderKey].toLowerCase()
            ) {
                return 1;
            } else if (typeof a[orderKey] === "string") {
                return 0;
            } else if (typeof a[orderKey] === "number") {
                let result: number = a[orderKey] - b[orderKey];
                return isNaN(a[orderKey]) ? 1 : isNaN(result) ? -1 : result;
            } else {
                return 1;
            }
        });

        return sections;
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
                    typeof section[this.MFIELD_MAP[key]] !== "undefined" &&
                    key === "year"
                ) {
                    reformattedSection[col] =
                        key === "year" && section["Section"] === "overall"
                            ? 1900
                            : parseInt(section[this.MFIELD_MAP[key]], 10);
                } else if (
                    typeof section[this.MFIELD_MAP[key]] !== "undefined"
                ) {
                    reformattedSection[col] = section[this.MFIELD_MAP[key]];
                } else if (
                    typeof section[this.SFIELD_MAP[key]] !== "undefined"
                ) {
                    reformattedSection[col] =
                        key === "uuid"
                            ? section[this.SFIELD_MAP[key]].toString()
                            : section[this.SFIELD_MAP[key]];
                } else {
                    reformattedSection[col] = section[col];
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
        if (!uniqueFields.includes(section[field])) {
          count++;
          uniqueFields.push(section[field]);
        }
      });

      return count;
    }

    private calculateAvg(sections: any[], value: any): number {
      let field = this.determineField(value);
      let values: any[] = [];
      Log.info("IN AVERAGE");
      sections.forEach((section) => {
        values.push(section[field]);
      });

      let result = values.reduce((a, b) => {
        return a + b;
      },
      0) / values.length;

      Log.info("GOT RESULT");
      return result;
    }

    private calculateSum(sections: any[], value: any): number {
      let field = this.determineField(value);
      let values: any[] = [];

      sections.forEach((section) => {
        values.push(section[field]);
      });

      return values.reduce((a, b) => {
        return a + b;
      },
      0);
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
        if (section[field] > min) {
          min = section[field];
        }
      });

      return min;
    }

    private determineField(value: any): string {
      if (typeof this.SFIELD_MAP[value] === "undefined") {
        return this.MFIELD_MAP[value];
      } else {
        return this.SFIELD_MAP[value];
      }
    }

  }
