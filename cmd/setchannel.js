const { setGameChannelId } = require('../game/game_settings');
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'setwordchain-vi',
    description: 'Thiết lập kênh hiện tại làm kênh chơi trò chơi nối từ.',
    // Yêu cầu người dùng có quyền quản lý kênh để chạy lệnh này
    userPermissions: [PermissionFlagsBits.ManageChannels], 
    
    async execute(message, args) {
        // Kênh được thiết lập là kênh mà lệnh được gửi đến
        const selectedChannel = message.channel;
        const guildId = message.guildId;

        setGameChannelId(guildId, selectedChannel.id);

        await message.reply({
            content: `✅ Đã thiết lập **${selectedChannel}** làm kênh chơi trò chơi nối từ chính thức.`,
            allowedMentions: { repliedUser: false }
        });
    }
};