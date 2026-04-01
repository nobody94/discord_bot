const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { ADMIN_CHANNEL_ID, DEVELOPER_IDS } = require('../utils/constant.js');
const { verifyIcon, errorIcon } = require('../utils/icon.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('baocao')
        .setDescription('Gửi báo cáo ẩn danh đến Developer.')
        .addStringOption(option => 
            option.setName('noidung')
                .setDescription('Nội dung bạn muốn báo cáo')
                .setRequired(true))
        .addAttachmentOption(option => 
            option.setName('hinhanh')
                .setDescription('Hình ảnh minh chứng (nếu có)')),

    async execute(interaction) {
        const reportContent = interaction.options.getString('noidung');
        const attachment = interaction.options.getAttachment('hinhanh');
        const { user, guild, channel } = interaction;

        try {
            const adminChannel = interaction.client.channels.cache.get(ADMIN_CHANNEL_ID);
            if (!adminChannel) return interaction.reply({ content: 'Lỗi cấu hình kênh Admin.', ephemeral: true });

            // --- 1. Tạo Embed gửi cho Developer (Kênh kín) ---
            const adminEmbed = new EmbedBuilder()
                .setTitle('📩 BÁO CÁO MỚI')
                .setColor(0xFF0000)
                .addFields(
                    { name: '👤 Người báo cáo', value: `<@${user.id}>`, inline: true },
                    { name: '📝 Nội dung', value: reportContent }
                )
                .setTimestamp();

            const adminFiles = [];
            if (attachment) {
                adminFiles.push({ attachment: attachment.url, name: attachment.name });
                if (attachment.contentType?.startsWith('image/')) {
                    adminEmbed.setImage(`attachment://${attachment.name}`);
                }
            }

            await adminChannel.send({
                content: `🔔 <@${DEVELOPER_IDS.join('>, <@')}>`,
                embeds: [adminEmbed],
                files: adminFiles
            });

            // --- 2. Phản hồi ẩn (Ephemeral) cho người gửi tại kênh hiện tại ---
            // Chỉ người gửi mới thấy tin nhắn này, những người khác không thấy gì
            const userEmbed = new EmbedBuilder()
                .setTitle(`${verifyIcon} Gửi báo cáo thành công`)
                .setDescription('Nội dung báo cáo của bạn đã được gửi đến đội ngũ Developer.')
                .addFields({ name: 'Nội dung đã gửi:', value: reportContent })
                .setColor(0x00FF00)
                .setFooter({ text: 'Tin nhắn này chỉ mình bạn nhìn thấy.' });

            await interaction.reply({
                embeds: [userEmbed],
                ephemeral: true // QUAN TRỌNG: Dòng này giúp chỉ người gửi thấy
            });

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Có lỗi xảy ra khi gửi báo cáo.', ephemeral: true });
        }
    }
};