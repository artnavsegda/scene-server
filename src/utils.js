import fs from "fs";

export function tryRead (filename, template) {
    try {
        return JSON.parse(fs.readFileSync(filename, 'utf8'));
    } catch(err) {
        console.log("no file " + filename);
        return template;
    }
}