import puppeteer from "puppeteer";
import { SOURCE_URL } from "./constants";

enum Diet {
  LactoseFree = "L",
  Milkless = "M",
  GlutenFree = "G"
}

export interface Food {
  name: string
  diets: Diet[]
}

export interface DayMenu {
  day: string
  foods: Food[]
}

export interface Menu {
  week: number
  days: DayMenu[]
}

type Day = "maanantai" | "tiistai" | "keskiviikko" | "torstai" | "perjantai" | "lauantai" | "sunnuntai";


export const getMenu = async () => {
  const browser = await puppeteer.launch({ headless: true, devtools: false });
  const page = await browser.newPage();

  await page.goto(SOURCE_URL.href);

  const header = await page.waitForSelector(".field__item > h2:nth-child(9)");

  const menu = await page.evaluate(() => {
    const weekElement = document.querySelector(".field__item > h2:nth-child(9)");
    const weekContent = weekElement?.textContent;

    if (!weekContent) return;

    if (!weekContent.startsWith("Ruokalista vko")) return;

    const matches = weekContent.match(/[0-9]{1,2}/);
    if (!matches) return;

    let week = parseInt(matches[0]);

    const table = document.querySelector(".table-mobilize-processed > tbody");

    if (!table) return;


    let weekMenu = {
      week,
      days: [] as any[]
    };

    for (const days of table.children) {
      const day = days!.children[0].textContent!.trim().toLowerCase();
      const foods = Array.from(days.children[1].children).map(e => e.textContent!.trim());

      weekMenu.days.push({ day, foods });
    }
    return weekMenu;
  });

  if (!menu) {
    throw new Error("Unable to load menu data");
  }

  let fullMenu: Menu = {
    week: menu.week,
    days: []
  }

  for (const dayMenuRaw of menu.days) {
    let dayMenu: DayMenu = {
      day: dayMenuRaw.day,
      foods: []
    }
    for (const food of dayMenuRaw.foods as string[]) {
      if (food.length == 0) continue;

      let foodName = food;
      let diets: Diet[] = [];
      const matchIndex = food.search(/ ((L|M|G)( {0,}, {0,}|$))+/g);

      if (matchIndex > -1) {
        diets = food.substring(matchIndex).split(",") as Diet[];

        foodName = food.substring(0, matchIndex);
      }

      dayMenu.foods.push({ name: foodName, diets })
    }

    fullMenu.days.push(dayMenu);
  }

  await browser.close();

  return fullMenu;
}