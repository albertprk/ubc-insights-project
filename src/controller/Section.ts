export default class Section {
    public dept: string;
    public id: string;
    public avg: number;
    public instructor: string;
    public title: string;
    public pass: number;
    public fail: number;
    public audit: number;
    public uuid: string;
    public year: number;

    public constructor(result: any) {
        this.dept = result["subject"];
        this.id = result["Course"];
        this.avg = result["Avg"];
        this.instructor = result["Professor"];
        this.title = result["Title"];
        this.pass = result["Pass"];
        this.fail = result["Fail"];
        this.audit = result["Audit"];
        this.uuid = result["id"];
        this.year = result["Year"];
    }
}
