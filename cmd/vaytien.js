const { 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ComponentType 
} = require('discord.js');
const { addMoney, removeMoney, getIcon, getBalance } = require('../utils/currency.js'); 
const { errorIcon, verifyIcon } = require('../utils/icon.js');
const { renderKey, pushKey, getKey } = require('../utils/db.js');

// --- CẤU HÌNH GIỚI HẠN ---
const MAX_LOAN_COUNT = 3;          // Tối đa 3 lần nợ
const MAX_LOAN_AMOUNT = 1000000;  // Tối đa 1 triệu Mora tổng cộng
const MIN_LOAN_AMOUNT = 10000;

module.exports = {
    name: 'vay',
    description: 'Gửi yêu cầu vay tiền từ người chơi khác với giới hạn nợ.',
    
    async execute(message, args) {
        const targetUser = message.mentions.users.first();
        const amount = parseInt(args[1]);
        const currencyType = 'mora';

        if (!targetUser || isNaN(amount) || amount <= 0) {
            return message.reply(`⚠️ Cách dùng: \`.vay @user <số tiền>\``);
        }

        // 1. Kiểm tra các điều kiện cơ bản
        if (targetUser.id === message.author.id) return message.reply(`${errorIcon} | Bạn không thể tự vay chính mình.`);
        if (targetUser.bot) return message.reply(`${errorIcon} | Bot không có tiền cho bạn vay.`);

        try {
            // 2. KIỂM TRA GIỚI HẠN NỢ CỦA NGƯỜI VAY
            const loanKey = renderKey("loan", message.guild.id);
            const allLoans = (await getKey(loanKey)) || [];
            
            // Lọc các khoản nợ hiện tại của người nhập lệnh
            const myLoans = allLoans.filter(l => l.nguoi_vay === message.author.id);
            const currentTotalDebt = myLoans.reduce((sum, loan) => sum + loan.money, 0);

            // Kiểm tra số lần nợ
            if (myLoans.length >= MAX_LOAN_COUNT) {
                return message.reply(`${errorIcon} | Bạn đã đạt giới hạn nợ tối đa (**${MAX_LOAN_COUNT}** khoản). Hãy trả bớt nợ trước khi vay tiếp.`);
            }

            // Kiểm tra tổng số tiền nợ
            if(amount < MIN_LOAN_AMOUNT){
                return message.reply(`${errorIcon} | Số tiền vay không được nhỏ hơn **${MIN_LOAN_AMOUNT.toLocaleString()}** ${getIcon(currencyType)}`);
            }
            if (currentTotalDebt + amount > MAX_LOAN_AMOUNT) {
                return message.reply(`${errorIcon} | Tổng nợ của bạn không được vượt quá **${MAX_LOAN_AMOUNT.toLocaleString()}** ${getIcon(currencyType)}.\n> Nợ hiện tại: **${currentTotalDebt.toLocaleString()}**`);
            }

            // 3. Kiểm tra số dư người cho vay
            const lenderBalance = await getBalance(targetUser.id, currencyType);
            if (lenderBalance < amount) {
                return message.reply(`${errorIcon} | **${targetUser.username}** không đủ tiền để cho bạn vay.`);
            }

            // 4. Tạo nút bấm xác nhận (giữ nguyên logic cũ)
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId('accept_loan').setLabel('Đồng ý').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('decline_loan').setLabel('Từ chối').setStyle(ButtonStyle.Danger),
                );

            const response = await message.channel.send({
                content: `<@${targetUser.id}>`,
                embeds: [{
                    title: "💰 YÊU CẦU VAY TIỀN",
                    description: `${message.author} muốn vay **${amount.toLocaleString()}** ${getIcon(currencyType)} từ bạn.\n\n*Số khoản nợ hiện tại của họ: ${myLoans.length}/${MAX_LOAN_COUNT}*`,
                    color: 0xFFAA00
                }],
                components: [row]
            });

            const collector = response.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 60000 
            });

            collector.on('collect', async (interaction) => {
                if (interaction.user.id !== targetUser.id) return;

                if (interaction.customId === 'accept_loan') {
                    // Thực hiện giao dịch và lưu vào DB
                    await removeMoney(targetUser.id, amount, currencyType);
                    await addMoney(message.author.id, amount, currencyType);

                    const loanData = {
                        nguoi_vay: message.author.id,
                        nguoi_cho_vay: targetUser.id,
                        date: new Date().toISOString(), // Dùng ISO để tính lãi chuẩn
                        money: amount
                    };
                    
                    await pushKey(loanKey, loanData);

                    await interaction.update({
                        content: `${verifyIcon} | Giao dịch thành công!`,
                        components: [],
                        embeds: [{ description: `${targetUser} đã cho ${message.author} vay tiền.`, color: 0x00FF00 }]
                    });
                } else {
                    await interaction.update({ content: `${errorIcon} | Yêu cầu bị từ chối.`, components: [], embeds: [] });
                }
            });

        } catch (error) {
            console.error(error);
            message.reply("Lỗi hệ thống.");
        }
    },
};