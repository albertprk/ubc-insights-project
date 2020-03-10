import Log from "../Util";
import QueryValidator from "./QueryValidator";
import Constants from "./Constants";

export default class ValidateTransformations {

    constructor() {
        Log.trace("ValidateTransformations::init()");
    }

    private static APPLY_TOKENS: string[] = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
    private static NUMERIC_KEYS: string[] = ["lat", "lon", "seats", "avg", "pass",
    "fail", "audit", "year"];

    public static getTransformationValues(query: any): string[] {
        let result: string[] = this.transformTransformationValues(query["GROUP"]);
        query["APPLY"].map((applyRule: any) => {
            Object.keys(applyRule).forEach((rule: string) => {
              result.push(rule);
            });
        });
        return result;
    }

    // TODO: repetitive code, refactor
    private static transformTransformationValues(query: any[]): string[] {
        let result: string[] = [];

        query.forEach((val) => {
            const index = val.indexOf("_");
            const rule = val.substring(index + 1, val.length);

            if (typeof Constants.SFIELD_MAP[rule] !== "undefined") {
                result.push(Constants.SFIELD_MAP[rule]);
            } else {
                result.push(Constants.MFIELD_MAP[rule]);
            }
        });

        return result;
    }

    public static isValidTransformations(query: any, dataset: string): boolean {
        if (!QueryValidator.isValidObject(query) || Object.keys(query).length !== 2) {
            return false;
        }

        let result = true;

        Object.keys(query).map((key) => {
          if (key === "GROUP") {
              result = result && this.isValidGroup(query["GROUP"], dataset);
          } else if (key === "APPLY") {
              result = result && this.isValidApply(query["APPLY"], dataset);
          } else {
              result = false;
          }
        });

        return result;
    }

    private static isValidGroup(query: any, dataset: string): boolean {
        if (!Array.isArray(query) || query.length === 0) {
            return false;
        }

        let result = true;

        query.forEach((key) => {
          if (!QueryValidator.isValidKey(key, dataset)) {
              result = false;
          }
        });

        return result;
    }

    private static isValidApply(query: any, dataset: string): boolean {
        if (!Array.isArray(query) || query.length === 0) {
            return false;
        }

        let applyRules: string[] = [];

        let result = true;

        query.forEach((rule) => {
          let currentApplyRules: string[] = [];
          result = result && this.isValidApplyRule(rule, dataset, currentApplyRules);

          currentApplyRules.forEach((currentRule: string) => {
            if (applyRules.includes(currentRule)) {
              result = false;
            }

            applyRules.push(currentRule);
          });
        });

        return result;
    }

    private static isValidApplyRule(query: any, dataset: string, applyRules: string[]): boolean {
        if (!QueryValidator.isValidObject(query) || Object.keys(query).length !== 1) {
            return false;
        }

        let result = true;

        Object.keys(query).forEach((key) => {
          if (!QueryValidator.isValidApplyKey(key)) {
              result = false;
          } else {
              applyRules.push(key);
              result = result && this.isValidApplyTokenObject(query[key], dataset);
          }
        });
        return result;
    }

    private static isValidApplyTokenObject(query: any, dataset: string): boolean {
        if (!QueryValidator.isValidObject(query) || Object.keys(query).length !== 1) {
            return false;
        }

        let result: boolean;

        Object.keys(query).forEach((key) => {
          result = QueryValidator.isValidKey(query[key], dataset) &&
          this.isValidApplyToken(key, dataset, query[key]);
        });

        return result;
    }

    private static isValidApplyToken(query: any, dataset: string, value: any) {
        if (!this.APPLY_TOKENS.includes(query)) {
            return false;
        } else if (query !== "COUNT") {
            return this.isNumericKey(value);
        } else {
            return true;
        }
    }

    private static isNumericKey(value: any): boolean {
      const index = value.indexOf("_") + 1;
      return this.NUMERIC_KEYS.includes(value.substring(index, value.length));
    }
}
