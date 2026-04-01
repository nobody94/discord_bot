const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require("dotenv").config();

// 1. Thu thập danh sách lệnh từ thư mục 'cmd'
const commands = [];
const commandsPath = path.join(__dirname, 'cmd');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));


for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    // Chỉ đăng ký những file có thuộc tính 'data' (Slash Commands)
    if (command.data && command.execute) {
        commands.push(command.data.toJSON());
    }
}

// 2. Khởi tạo REST để kết nối với Discord API
// const Token = process.env.BOT_TOKEN;
// APPPLICATION_ID="1448209620203208807"
// APPPLICATION_TEST_ID="1450702705788977306"
const rest = new REST().setToken(process.env.BOT_TOKEN);

// 3. Thực hiện quá trình Deploy
(async () => {
    try {
        console.log(`🚀 Đang bắt đầu đăng ký ${commands.length} lệnh Slash...`);

        // Routes.applicationCommands sẽ đăng ký lệnh cho toàn bộ Server mà Bot tham gia
        await rest.put(
            Routes.applicationCommands("1448209620203208807"), 
            { body: commands },
        );

        console.log('✅ Đăng ký lệnh Slash thành công!');
    } catch (error) {
        console.error('❌ Lỗi khi đăng ký lệnh:', error);
    }
})();