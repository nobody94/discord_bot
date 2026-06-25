const { Client, GatewayIntentBits } = require('discord.js');
require("dotenv").config();

// Khởi tạo bot với quyền lấy danh sách Guilds
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});


const TOKEN = process.env.BOT_TOKEN; 

client.once('ready', async () => {
    console.log(`🤖 Đã đăng nhập dưới tên: ${client.user.tag}`);
    console.log('🔄 Đang lấy danh sách các server...');

    try {
        // Lấy danh sách tất cả server bot đang tham gia
        const guilds = await client.guilds.fetch();
        
        if (guilds.size === 0) {
            console.log('❌ Bot hiện không nằm trong server nào.');
            client.destroy();
            process.exit(0);
        }

        console.log(`⚠️ Phát hiện bot đang ở trong ${guilds.size} server. Bắt đầu rời đi...`);

        // Duyệt qua từng server để rời bỏ
        for (const [id, oauth2Guild] of guilds) {
            try {
                // Fetch chi tiết server để lấy tên chính xác
                const guild = await oauth2Guild.fetch();
                await guild.leave();
                console.log(`✅ Đã rời khỏi server: ${guild.name} (${id})`);
            } catch (err) {
                console.error(`❌ Không thể rời server ID ${id}:`, err.message);
            }
        }

        console.log('🎉 Hoàn thành! Đã rời khỏi toàn bộ server.');
    } catch (error) {
        console.error('❌ Đã xảy ra lỗi hệ thống:', error);
    } finally {
        // Tắt bot và đóng file node hoàn toàn
        client.destroy();
        process.exit(0);
    }
});

// Đăng nhập vào bot
client.login(TOKEN).catch(err => {
    console.error('❌ Lỗi đăng nhập Bot (Token có thể sai):', err.message);
});