import {InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import Room from "./Room";
import * as JSZip from "jszip";
import Dataset from "./Dataset";
import Log from "../Util";

export default class Building {
    public content: string;
    public buildingCode: string;
    public buildingName: string;
    public address: string;
    public link: string;

    public constructor(content: string, buildingCode: string, buildingName: string, address: string, link: string) {
        this.content = content;
        this.buildingCode = buildingCode;
        this.buildingName = buildingName;
        this.address = address;
        this.link = link;
    }

    public getRooms(): any {
        const parse5 = require("parse5");
        let zipFile: JSZip = new JSZip();
        let parsedHTML: any;
        zipFile.loadAsync(this.content, {base64: true}).then((files) => {
            files.folder("rooms").file(this.link).async("text").then((html: string) => {
                parsedHTML = parse5.parse(html);
            }).then(() => {
                Log.trace(parsedHTML);
            });
        }).catch((err) => {
            throw err;
        });
    }
}
