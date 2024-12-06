const fs = require('fs/promises');
const path = require('path');

async function convertJson(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        const jsonData = JSON.parse(data);
        const messages = jsonData.messages;

        const codes = messages
            .map(message => message.text || null)
            .filter(code => code !== null);

        console.log("Các mã quay tìm được:", codes.length);

        for (const code of codes) {
            if (code.startsWith('YE')) {
                await fs.appendFile('./data/quatangyogurt.txt', code + '\n');
            } else if (code.startsWith('TY')) {
                await fs.appendFile('./data/quatangtopkid.txt', code + '\n');
            } else if (code.startsWith('MY')) {
                await fs.appendFile('./data/quatangmistori.txt', code + '\n');
            }
        }

        console.log("Hoàn thành ghi tệp");

    } catch (err) {
        // Xử lý lỗi
        console.error("Lỗi trong quá trình xử lý:", err);
    }
}

async function classifyGiftFile(inputFilePath) {
    try {
        const data = await fs.readFile(inputFilePath, 'utf8');
        const codes = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        console.log(`Đã đọc được ${codes.length} mã từ file ${inputFilePath}`);

        for (const code of codes) {
            if (code.startsWith('YE')) {
                await fs.appendFile('./data/quatangyogurt.txt', code + '\n');
            } else if (code.startsWith('TY')) {
                await fs.appendFile('./data/quatangtopkid.txt', code + '\n');
            } else if (code.startsWith('MY')) {
                await fs.appendFile('./data/quatangmistori.txt', code + '\n');
            }
        }

        console.log("Hoàn thành phân loại mã từ file quà tặng!");

    } catch (err) {
        console.error("Lỗi khi xử lý file quà tặng:", err);
    }
}
async function main() {
    const jsonFilePath = path.resolve('./ChatExport_2024-12-02/result.json'); // Đường dẫn file JSON
    await convertJson(jsonFilePath);

    // const giftFilePath = path.resolve('./data/gift.txt'); // Đường dẫn file gift txt
    // await classifyGiftFile(giftFilePath);
}

main();
