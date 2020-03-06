export default class Constants {
  public static MFIELD_MAP: Record<string, string> = {
      avg: "Avg",
      pass: "Pass",
      fail: "Fail",
      audit: "Audit",
      year: "Year",
      lat: "lat",
      lon: "lon",
      seats: "seats"
  };

  public static SFIELD_MAP: Record<string, string> = {
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

  public static INDEX_TABLE_CLASSES: string[] = [
    "views-field-field-building-image",
    "views-field-field-building-code",
    "views-field-field-building-address",
    "views-field-nothing"
  ];

  public static BUILDING_TABLE_CLASS: string[] = [
    "views-field-nothing",
    "views-field-field-building-code",
    "views-field-title",
    "views-field-field-building-address"
  ];
}
