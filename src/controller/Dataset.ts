import { InsightDataset, InsightDatasetKind } from "./IInsightFacade";

export default class Dataset {
    public sections: any[];
    public id: string;
    public kind: InsightDatasetKind;
    public numRows: number;

    public constructor(id: string, kind: InsightDatasetKind) {
        this.sections = [];
        this.id = id;
        this.kind = kind;
        this.numRows = 0;
    }

    public addSection(section: any): void {
        this.sections.push(section);
        this.numRows++;
    }

    public getNumRows() {
        return this.numRows;
    }
}
