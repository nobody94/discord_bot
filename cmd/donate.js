const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { errorIcon } = require('../utils/icon.js');
const { DEVELOPER_IDS } = require('../utils/constant.js');

module.exports = {
    name: 'donate',
    aliases: ['camon'],
    description: 'Cảm ơn người ủng hộ Server',

    async execute(message, args) {
        // 1. Kiểm tra quyền (Chỉ Admin hoặc Developer mới được dùng)
        const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator) || DEVELOPER_IDS.includes(message.author.id);
        
        if (!isAdmin) {
            return message.reply(`${errorIcon} | Bạn không có quyền sử dụng lệnh này.`);
        }

        // 2. Kiểm tra đối tượng được tag
        const target = message.mentions.users.first();
        if (!target) {
            return message.reply(`${errorIcon} | Vui lòng tag người đã ủng hộ: \`.donate @user\``);
        }

        // Mảng hình ảnh GIF cảm ơn ngẫu nhiên
        const thankYouGifs = [
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjBoOHl0aGVsMXo4d3FzcmsybXVmYzQ1ZTcxamJkd3cwaTJiNHNjMCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/7tXmRetra2vpFyrYpe/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3ZzJrZmx0MjdhNmJmNXVidTc3aWF3YmdlNHBscHdlMGh5Yjh3Z3NlayZlcD12MV9naWZzX3NlYXJjaCZjdD1n/tfmJ8ebKXh7IUpN7hD/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3bG5zNmY3dmNqZmc5M2psdjFxMjRoZDlpMWp3ZG4ydWlwaGIwbzJnYyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/gKVdeHpwce7TdHDyaK/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYThvaGl2ODc1NXZ6Y3dta2Jqa3liMDhkZGd4eWRqcGw3Z2syNXc2YSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/amV3739vmqc8eYMkhR/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeGx5b2phZjAwNjVlejh3MTFvdWJ2OXduMnNoNWRjdHk2dnhwZjhicCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/xeU9rH43ig91VEGoNC/giphy.gif"
        ];
        const randomGif = thankYouGifs[Math.floor(Math.random() * thankYouGifs.length)];

        const heartGifs = [
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMG1wcGl5anRwdjE3em80MXJ6MzNuajhzeWt5aHNud2QxZ3llZnIyeCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/1x0Te26OsnrRw7rlo2/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMG1wcGl5anRwdjE3em80MXJ6MzNuajhzeWt5aHNud2QxZ3llZnIyeCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3PtzgNmZ0t2Nd7aOvj/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3czYxaXl1NWVyZjRtc2l0a2dpbnZ5NW9ybnI2MGlsdnh3ejVzZGUxcCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/CaUKBleO61fbVaJVtu/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3MnczemZ1bWludjJwZGdvNTdkOHFzZHFoOTA1NDd3N21oZHZhcml2YyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/xqSZQ6JpgXekKvs5JL/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3dHBndnZ0c3BtcDJtYmQxMms1d3o3YWZ2amo4MGJ4cW83aHNjcXQwdyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/5bdhq6YF0szPaCEk9Y/giphy.gif",
            "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3MDRlcmE3ejc0YzN6bWljODh0eWUwbmlpemtsdGo5am1ya2ZlcHp6OSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/xHrX3BKkreRXMztblz/giphy.gif"
        ]
        const randomHeart = heartGifs[Math.floor(Math.random() * heartGifs.length)];

        try {
            // 3. Tạo Embed thông báo gửi đến toàn Server
            const embed = new EmbedBuilder()
                .setColor('#F1C40F') 
                .setTitle('💖 TRÂN TRỌNG CẢM ƠN FUONG/FUBA 💖')
                .setThumbnail(randomGif)
                .setDescription(`Xin gửi ngàn lời tri ân đến vị đại gia **<@${target.id}>** đã âm thầm tài trợ thêm một xe gạch chất lượng cao cho server`)                
                .setImage(randomHeart)                
                .setTimestamp();
            // 4. Gửi Embed kèm tag tên người đó     
            await message.channel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Lỗi khi thực hiện lệnh donate:', error);
            message.reply(`${errorIcon} | Có lỗi xảy ra trong quá trình hiển thị Embed tri ân.`);
        }
    }
};