import {InsightDataset, InsightDatasetKind} from "./IInsightFacade";

export default class RoomsDataset {
    public sections: any[];
    public insightDataset: InsightDataset;

    public constructor(id: string, kind: InsightDatasetKind) {
        this.sections = [];
        this.insightDataset = { id: id, kind: kind, numRows: 0 };
    }

    public addSection(section: any): void {
        this.sections.push(section);
        this.insightDataset.numRows++;
    }

    public getNumRows() {
        return this.insightDataset.numRows;
    }
}
