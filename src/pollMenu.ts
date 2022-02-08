import axios from "axios";
import path from "path";
import fs from "fs";
import { SOURCE_URL } from "./constants";

interface Cache {
  date: string
}

const cacheDirPath = path.join(process.cwd(), "cache");
const cachePath = path.join(process.cwd(), "cache", "date.json");

export const poller = async() => {
  const res = await axios.get(SOURCE_URL.href);

  if (res.status == 200 && res.headers["last-modified"]) {
    const lastModified = new Date(res.headers["last-modified"]);

    const cachedLastModified = await loadCache();

    if (cachedLastModified) {
      if (cachedLastModified.getTime() != lastModified.getTime()) {
        return true;
      }
    }else {
      await writeCache(lastModified);
    }
  }else {
    return true;
  }
  return false;
}


const loadCache = async(): Promise<Date | null> => {
  try {
    const content = await fs.promises.readFile(cachePath, { encoding: "utf8" });
    const parsed = JSON.parse(content) as Cache;

    if (parsed.date) {
      return new Date(parsed.date);
    }
  }catch(err) {
    console.log(err);
  }
  return null;
}
const writeCache = async(lastModified: Date) => {
  const content = { lastModified: lastModified.toISOString() }
  await fs.promises.mkdir(cacheDirPath, { recursive: true });
  await fs.promises.writeFile(cachePath, JSON.stringify(content), { encoding: "utf8" });
}