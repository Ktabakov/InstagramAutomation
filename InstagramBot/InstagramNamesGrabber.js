const { chromium } = require(`playwright-chromium`);
var excel = require('excel4node');
var workbook = new excel.Workbook();
var worksheet = workbook.addWorksheet('Sheet 1');

const xlsx = require("xlsx");
const spreadsheet = xlsx.readFile('./InstagramDetections.xlsx');
const sheets = spreadsheet.SheetNames;
const firstScheet = spreadsheet.Sheets[sheets[0]]; //sheet 1 is index 0

(async () => {

    let links = [];

    for (let i = 1; ; i++) {
        const firstColumn = firstScheet['A' + i];
        if (!firstColumn) {
            break;
        }
        links.push(firstColumn.h);
    }
    let names = [];
    let dates = [];
    let titles = [];

    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto("https://www.instagram.com/");
    await page.click('text=Accept All');

    await page.click('[aria-label="Phone number, username, or email"]');
    await page.fill('[aria-label="Phone number, username, or email"]', '********@gmx.de');
    await page.click('[aria-label="Password"]');
    await page.fill('[aria-label="Password"]', '*******');

    await Promise.all([
        page.waitForNavigation(/*{ url: 'https://www.instagram.com/accounts/onetap/?next=%2F' }*/),
        page.click('button:has-text("Log In")')
    ]);

    await Promise.all([
        page.waitForNavigation(/*{ url: 'https://www.instagram.com/' }*/),
        page.click('text=Not Now')
    ]);

    await page.click('text=Not Now');

    for (let index = 0; index < links.length; index++) {
        if(links[index] === links[index - 1]){
            names[index] = names[index - 1]
            dates[index] = dates[index - 1]
            titles[index] = titles[index - 1]
            continue;
        }
        await page.goto(links[index]);
        await page.waitForTimeout(1000);

        let items = await page.evaluate(() => {
            try {
                const heading = document.querySelectorAll(".sqdOP.yWX7d._8A5w5.ZIAjV");
                const uploadDate = document.querySelectorAll("._1o9PC.Nzb55");
                const videoTitle = document.querySelectorAll("#react-root > section > main > div > div.ltEKP > article > div.eo2As > div.EtaWk > ul > div > li > div > div > div.C4VMK > span");

                if (heading === undefined) {
                    return `UNAVAILABLE`;
                }
                if (uploadDate === undefined) {
                    return `UNAVAILABLE`;
                }
                let item = heading[0].textContent;
                let date = uploadDate[0].textContent;
                let title = videoTitle[0].textContent;
                return { item, date, title };
            } catch (error) {
                return `UNAVAILABLE`;
            }
        });
        names.push(items.item);
        dates.push(items.date);
        titles.push(items.title);
    }
    worksheet.cell(1, 1).string(`Channel`)
    worksheet.cell(1, 2).string(`Dates`)
    worksheet.cell(1, 3).string(`Titles`)
    worksheet.cell(1, 4).string(`Links`)

    for (let index = 0; index < names.length; index++) {
        worksheet.cell(index + 2, 1).string(names[index])
        worksheet.cell(index + 2, 2).string(dates[index])
        worksheet.cell(index + 2, 3).string(titles[index])
        worksheet.cell(index + 2, 4).string(links[index])
    }
    
    workbook.write('Instagram-Names.xlsx');

    browser.close();
})();