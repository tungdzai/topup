const axios = require("axios");
const {getRandomTime} = require('./handlers');
const {promises: fs} = require("fs");
const cheerio = require('cheerio');
const xlsx = require('xlsx');
const {Agent} = require("node:https");
const agent = new Agent({
    rejectUnauthorized: false,
});
async function readCodesFromFile(path) {
    try {
        const data = await fs.readFile(path, 'utf-8');
        return data.split('\n').map(code => code.trim()).filter(code => code);
    } catch (error) {
        console.error('Lỗi khi đọc file:', error);
        return [];
    }
}
async function rewardMistories(phone, retries = 2) {
    if (retries <2) {
        return null;
    }
    try {
        const phoneNumber = `0${phone}`;
        const campaignType = 0;
        const page = 1;

        const response = await axios.get(`https://quatangmistori.thmilk.vn/customer`, {
            params: {
                campaign_type: campaignType,
                phone: phoneNumber,
                page: page
            },
            httpsAgent: agent,
        });
        const html = response.data;
        const $ = cheerio.load(html);
        const winners = [];
        $('table tbody tr').each((index, element) => {
            const row = $(element);
            const winner = {
                stt: row.find('td').eq(0).text().trim(),
                prize: row.find('td').eq(1).text().trim(),
                name: row.find('td').eq(3).text().trim(),
                phone: row.find('td').eq(4).text().trim()
            };
            winners.push(winner);
        });
       return winners;
    } catch (error) {
        console.error('Error in histories Reward:', error.response ? error.response.data : error.message);
        return null

    }
}


async function checkDeposit(phone, reties = 2) {

    const dataHeader = [
        {
            url: 'https://quatangtopkid.thmilk.vn/Home/CheckCode',
            lucky: 'https://quatangtopkid.thmilk.vn/Home/IndexAjax',
            host: 'quatangtopkid.thmilk.vn',
            origin: 'https://quatangtopkid.thmilk.vn',
            referer: 'https://quatangtopkid.thmilk.vn/'
        },
        {
            url: 'https://quatangyogurt.thmilk.vn/Home/CheckCode',
            lucky: 'https://quatangyogurt.thmilk.vn/Home/IndexAjax',
            host: 'quatangyogurt.thmilk.vn',
            origin: 'https://quatangyogurt.thmilk.vn',
            referer: 'https://quatangyogurt.thmilk.vn/'
        }
    ]
    if (reties < 0) {
        return null
    }
    if (reties < 2) {
        await getRandomTime(1000, 2000)
    }
    const result = {
        phone: phone,
        quatangtopkid: [],
        quatangyogurt: [],
        quatangmistories:[]
    };
    try {
        for (const header of dataHeader){
            const response = await axios.get(`${header.origin}/Home/ListGiai?SearchString=${phone}`, {
                headers: {
                    'Host': header.host,
                    'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                    'accept': '*/*',
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'x-requested-with': 'XMLHttpRequest',
                    'sec-ch-ua-mobile': '?1',
                    'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
                    'sec-ch-ua-platform': '"Android"',
                    'origin': header.origin,
                    'sec-fetch-site': 'same-origin',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-dest': 'empty',
                    'referer': header.referer,
                    'accept-encoding': 'gzip, deflate, br, zstd',
                    'accept-language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
                    'priority': 'u=1'
                }
            });
            const $ = cheerio.load(response.data);
            const winners = [];
            $('.table-responsive.d-none.d-lg-block table tbody tr').each((index, element) => {
                const row = $(element);
                const winner = {
                    stt: row.find('td').eq(0).text().trim(),
                    prize: row.find('td').eq(1).text().trim(),
                    name: row.find('td').eq(2).text().trim(),
                    phone: row.find('td').eq(3).text().trim(),
                    address: row.find('td').eq(4).text().trim(),
                };
                winners.push(winner);
            });
            if (header.host === 'quatangtopkid.thmilk.vn') {
                result.quatangtopkid = winners;
            } else if (header.host === 'quatangyogurt.thmilk.vn') {
                result.quatangyogurt = winners;
            }
        }
        // const responseMistories= await rewardMistories(phone);
        // if (responseMistories){
        //     result.quatangmistories = responseMistories;
        // }
        return result
    } catch (error) {
        console.error("Lỗi khi gọi API cho số:", phone, error.response?.data || error.message);
    }
}

async function createExcel(data) {
    const worksheetData = [["Phone", "Quà tặng Yogurt", "Quà tặng Topkid","Quà tặng Mistories"]];

    data.forEach(item => {
        console.log(item)
        const maxRows = Math.max(item.quatangyogurt.length, item.quatangtopkid.length,item.quatangmistories.length);
        for (let i = 0; i < maxRows; i++) {
            worksheetData.push([
                i === 0 ? item.phone : "",
                item.quatangyogurt[i] ? item.quatangyogurt[i].stt : "",
                item.quatangtopkid[i] ? item.quatangtopkid[i].prize : "",
                item.quatangmistories[i] ? item.quatangmistories[i].prize : "",
            ]);
        }
    });
    console.log(worksheetData)

    const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Results");
    xlsx.writeFile(workbook, "ResultData.xlsx");
    console.log("File Excel đã được tạo thành công!");
}
async function handleDeposit() {
    const listPhone = await readCodesFromFile('./data/dataDeposit.txt');
    const dataDeposit = [];

    for (const phone of listPhone) {
        const phoneNumber = `0${phone}`;
        const result = await checkDeposit(phoneNumber);
        if (result) {
            dataDeposit.push(result);
        }
    }

    await createExcel(dataDeposit);
}


handleDeposit()