import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import QueryValidator from "./QueryValidator";
import { InsightError, NotFoundError } from "./IInsightFacade";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        return Promise.reject("Not implemented.");
    }

    public removeDataset(id: string): Promise<string> {
        return Promise.reject("Not implemented.");
    }

    public performQuery(query: any): Promise<any[]> {
        let validator: QueryValidator = new QueryValidator();
        const dataSet: string = validator.determineDataset(query);
        if (dataSet === null || !validator.isValidQuery(query, dataSet)) {
            return Promise.reject(new InsightError());
        }
        return Promise.reject("Not implemented.");
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.reject("Not implemented.");
    }
}
