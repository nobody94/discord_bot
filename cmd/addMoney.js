const { addMoney, getIcon } = require('../utils/currency.js'); 
const { errorIcon, verifyIcon } = require('../utils/icon.js');
const { DEVELOPER_IDS } = require('../utils/constant.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType } = require('discord.js');

module.exports = {
    name: 'addmoney',
    description: 'Thêm tiền cho người dùng bằng Modal (chỉ dành cho Developer).',  
    
    async execute(message, args) {
        // 1. Kiểm tra quyền hạn
        const isDeveloper = DEVELOPER_IDS.includes(message.author.id);
        if (!isDeveloper) {
            return message.reply({ content: `${errorIcon} | Bạn không có quyền sử dụng lệnh này.`, ephemeral: true });
        }

        // 2. Lấy ID người nhận từ đối số đầu tiên
        let targetId = args[0];
        if (!targetId) {
            return message.reply(`Sử dụng: \`.addmoney <@user hoặc UserID>\``);
        }

        if (targetId.startsWith('<@') && targetId.endsWith('>')) {
            targetId = targetId.slice(2, -1).replace(/[!&]/g, '');
        }

        // 3. Gửi nút bấm để mở Modal (Vì Modal không thể mở trực tiếp từ tin nhắn text thường)
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`open_addmoney_modal_${targetId}`)
                .setLabel('Nhập số tiền cần thêm')
                .setStyle(ButtonStyle.Primary)
        );

        const msg = await message.reply({
            content: `Bấm nút bên dưới để nhập số tiền cho người dùng <@${targetId}>:`,
            components: [row]
        });

        // 4. Lắng nghe sự kiện tương tác nút bấm và gửi Modal
        const filter = (i) => i.user.id === message.author.id && i.customId === `open_addmoney_modal_${targetId}`;
        const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (interaction) => {
            const modal = new ModalBuilder()
                .setCustomId(`addmoney_modal_${targetId}`)
                .setTitle(`Thêm tiền cho ID: ${targetId}`);

            const moraInput = new TextInputBuilder()
                .setCustomId('mora_amount')
                .setLabel("Số lượng Mora")
                .setPlaceholder("Nhập số Mora hoặc để trống")
                .setStyle(TextInputStyle.Short)
                .setRequired(false);

            const primoInput = new TextInputBuilder()
                .setCustomId('primo_amount')
                .setLabel("Số lượng Primo")
                .setPlaceholder("Nhập số Primo hoặc để trống")
                .setStyle(TextInputStyle.Short)
                .setRequired(false);

            modal.addComponents(
                new ActionRowBuilder().addComponents(moraInput),
                new ActionRowBuilder().addComponents(primoInput)
            );

            await interaction.showModal(modal);

            // Chờ nhận dữ liệu từ Modal
            const submitted = await interaction.awaitModalSubmit({
                time: 60000,
                filter: i => i.user.id === message.author.id && i.customId === `addmoney_modal_${targetId}`,
            }).catch(err => { return null; });

            if (submitted) {
                const moraVal = submitted.fields.getTextInputValue('mora_amount') || "0";
                const primoVal = submitted.fields.getTextInputValue('primo_amount') || "0";
                
                const moraAmount = parseInt(moraVal);
                const primoAmount = parseInt(primoVal);

                let responseContent = [];

                // Xử lý cộng Mora
                if (moraAmount > 0) {
                    await addMoney(targetId, moraAmount, 'mora');
                    responseContent.push(`+**${moraAmount.toLocaleString()}** ${getIcon('mora')}`);
                }

                // Xử lý cộng Primo
                if (primoAmount > 0) {
                    await addMoney(targetId, primoAmount, 'primo');
                    responseContent.push(`+**${primoAmount.toLocaleString()}** ${getIcon('primo')}`);
                }

                if (responseContent.length === 0) {
                    return submitted.reply({ content: `${errorIcon} | Bạn không nhập số tiền nào hợp lệ.`, ephemeral: true });
                }

                await submitted.reply({
                    content: `${verifyIcon} | Đã thêm thành công vào tài khoản <@${targetId}>:\n${responseContent.join(' và ')}`
                });
                
                // Xóa nút bấm sau khi xong
                await msg.delete().catch(() => {});
            }
        });
    },
};