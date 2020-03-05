import {InsightDataset, InsightDatasetKind} from "./IInsightFacade";

export default class Room {
    public roomsFullName: string;
    public roomsShortName: string;
    public roomsNumber: number;
    public roomsName: string;
    public roomsAddress: string;
    public roomsLat: number;
    public roomsLon: number;
    public roomsSeats: number;
    public roomsType: string;
    public roomsFurniture: string;
    public roomsHref: string;

    public constructor(roomsFullName: string, roomsShortName: string, roomsNumber: number, roomsName: string,
                       roomsAddress: string, roomsSeats: number, roomsType: string,
                       roomsFurniture: string, roomsHref: string) {
        this.roomsFullName = roomsFullName;
        this.roomsShortName = roomsShortName;
        this.roomsNumber = roomsNumber;
        this.roomsName = roomsName;
        this.roomsAddress = roomsAddress;
        this.roomsSeats = roomsSeats;
        this.roomsType = roomsType;
        this.roomsFurniture = roomsFurniture;
        this.roomsHref = roomsHref;
    }

    public addLonLat(lat: number, lon: number) {
        this.roomsLat = lat;
        this.roomsLon = lon;
    }
}
