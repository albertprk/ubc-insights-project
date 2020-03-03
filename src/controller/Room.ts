import {InsightDataset, InsightDatasetKind} from "./IInsightFacade";

export default class Room {
    public buildingCode: string;
    public buildingName: string;
    public roomNumber: string;
    public address: string;
    public furniture: string;
    public capacity: number;
    public photo: string;

    public constructor(buildingCode: string, buildingName: string, address: string, roomNumber: string,
                       furniture: string, capacity: number, photo: string) {
        this.buildingCode = buildingCode;
        this.buildingName = buildingName;
        this.roomNumber = roomNumber;
        this.furniture = furniture;
        this.capacity = capacity;
        this.photo = photo;
    }
}
