import { Parser } from "json2csv";
import fs from "fs";

export const exportCSV = (data, filePath = "contacts.csv") => {
  try {
    const fields = Object.keys(data[0]);
    const parser = new Parser({ fields });
    const csv = parser.parse(data);

    fs.writeFileSync(filePath, csv);
    return filePath;
  } catch (err) {
    throw new Error("CSV export failed");
  }
};
