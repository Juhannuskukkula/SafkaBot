import puppeteer from "puppeteer";

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

export const sourceURL = "https://www.turkuai.fi/turun-ammatti-instituutti/opiskelijalle/ruokailu-ja-ruokalistat/ruokalista-juhannuskukkula-topseli";


export const getMenu = async() => {
  const browser = await puppeteer.launch({ headless: true, devtools: false });
  const page = await browser.newPage();

  await page.goto(sourceURL);

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
        for (const food of dayMenuRaw.foods) {
            let foodName = food;
            let diets: Diet[] = [];
            const matchIndex = food.search(/ ((L|M|G)( {0,}, {0,}|$))+/g);

            if (matchIndex > -1) {
                const dietsRaw = food.substring(matchIndex).split(",") as string[];

                console.log(dietsRaw)

                dietsRaw.forEach(dietLetter => {
                    for (const [name, letter] of Object.entries(Diet)) {
                        if (dietLetter == letter) {
                            diets.push(Diet[name as keyof typeof Diet]);
                        }
                    }
                });

                foodName = food.substring(0, matchIndex);
            }

            dayMenu.foods.push({ name: foodName, diets })
        }

        fullMenu.days.push(dayMenu);
    }

    await browser.close();

    return fullMenu;
}