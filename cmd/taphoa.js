const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType,
    ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType } = require('discord.js');
const { getKey, setKey, renderKey } = require('../utils/db');
const {managerIds,giftManagerIds} = require('../utils/constant.js');

const cooldowns = new Map();

module.exports = {
    name: 'taphoa',
    description: 'Xem và mua vật phẩm từ cửa hàng.',
    async execute(message, args) {
        const userId = message.author.id;

        const now = Date.now();
        const cooldownAmount = 5000;
        // --- KIỂM TRA CHỐNG SPAM ---
        if (cooldowns.has(userId)) {
            const expirationTime = cooldowns.get(userId) + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
                return message.reply(`🛑 **Chậm lại một chút!** Vui lòng đợi **${timeLeft}s** để tiếp tục sử dụng lệnh.`)
                    .then(msg => {
                        setTimeout(() => msg.delete().catch(() => null), 2000); // Tự xóa thông báo cảnh báo
                    });
            }
        }
        // Đặt dấu thời gian cooldown cho người dùng
        cooldowns.set(userId, now);
        setTimeout(() => cooldowns.delete(userId), cooldownAmount);

        const shopKey = renderKey('taphoa');
        const allData = (await getKey(shopKey)) || {};
        let title = '🛒 CỬA HÀNG TRAO ĐỔI';
        let color = 0xFFAA00;
        let filterType = 'exchange';
        let description = 'Sử dụng lệnh `.taphoa mua <ID>` để đổi đồ.';

        // --- XỬ LÝ LỆNH THÊM ĐỒ (.taphoa themdo HOẶC .taphoa gift themdo) ---
        const isGiftThemdo = args[0]?.toLowerCase() === 'gift' && args[1]?.toLowerCase() === 'themdo';
        const isNormalThemdo = args[0]?.toLowerCase() === 'themdo';

        if (isGiftThemdo || isNormalThemdo) {
            // Kiểm tra quyền tương ứng
            const allowedIds = isGiftThemdo ? giftManagerIds : managerIds;
            if (!allowedIds.includes(message.author.id)) {
                return message.reply("❌ Bạn không có quyền sử dụng lệnh này.");
            }

            const itemType = isGiftThemdo ? 'gift' : 'exchange';

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`taphoa_${itemType}`)
                    .setLabel(`Thêm đồ (${itemType == 'gift' ? 'cửa hàng đồ tặng' : 'cửa hàng trao đổi'})`)
                    .setStyle(ButtonStyle.Success)
            );

            return message.reply({
                content: `Nhấn nút để thêm vật phẩm:`,
                components: [row]
            });
        }

        // --- LOGIC MUA ĐỒ (.taphoa mua <ID> [số lượng]) ---
        if (args[0] && args[0].toLowerCase() === 'mua') {
            const itemId = args[1];

            if (!itemId) return message.reply("Vui lòng nhập ID vật phẩm cần mua! (Ví dụ: `.taphoa mua dui_cui_dien`) ");

            const item = allData[itemId];

            // 1. Kiểm tra vật phẩm có tồn tại và đúng loại exchange không
            if (!item || item.type !== 'exchange') {
                return message.reply("Vật phẩm không tồn tại hoặc không thể mua bằng điểm!");
            }

            // 2. Thiết lập mặc định số lượng là 1 và tính giá            
            const totalPrice = item.price; // Giá của 1 món

            const pointKey = renderKey("game_point", userId); // Key lưu điểm
            const userPoints = (await getKey(pointKey)) || 0;

            // 3. Kiểm tra số dư điểm
            if (userPoints < totalPrice) {
                return message.reply(`Bạn không đủ điểm! Vật phẩm này giá **${totalPrice}** điểm nhưng bạn chỉ có **${userPoints}**.`);
            }

            // 4. Thực hiện trừ điểm
            await setKey(pointKey, userPoints - totalPrice);

            // 5. Thêm vật phẩm vào túi đồ (Chỉ push 1 lần duy nhất)
            const bagKey = renderKey("game_inventory", userId);
            let inventory = (await getKey(bagKey)) || [];

            inventory.push(itemId); // Chỉ thêm 1 ID vào mảng

            await setKey(bagKey, inventory);

            return message.reply(`✅ Bạn đã mua thành công **${item.name}** với giá **${totalPrice}** điểm!`);
        }

        if (args[0] && args[0].toLowerCase() === 'give') {
            if (!giftManagerIds.includes(message.author.id)) {
                return;
            }
            const targetUser = message.mentions.users.first();
            const itemId = args[2]; // Cú pháp: .taphoa give @user <ID>

            if (!targetUser) return message.reply(`${errorIcon} Vui lòng tag người bạn muốn cấp đồ!`);
            if (!itemId) return message.reply(`${errorIcon} Vui lòng nhập ID vật phẩm cần cấp.`);

            const item = allData[itemId];
            if (!item) return message.reply(`${errorIcon} Vật phẩm không tồn tại trong hệ thống.`);

            // 2. Lấy túi đồ của người nhận
            const targetBagKey = renderKey("game_inventory", targetUser.id);
            let targetInv = (await getKey(targetBagKey)) || [];

            // 3. Chỉ thêm vật phẩm vào túi người nhận (Không thao tác trên túi người tặng)
            targetInv.push(itemId);

            // 4. Lưu lại vào Database
            await setKey(targetBagKey, targetInv);

            return message.reply(`🎁 Đã cấp thành công vật phẩm **${item.name}** vào túi đồ của **${targetUser.username}**!`);
        }

        if (args[0] && args[0].toLowerCase() === 'gift') {
            if (!giftManagerIds.includes(message.author.id)) {
                return;
            }

            filterType = 'gift';
            title = '🎁 CỬA HÀNG ĐỒ TẶNG';
            color = 0xFF69B4; // Màu hồng cho đồ tặng
            description = 'Sử dụng lệnh `.taphoa give @user <ID>` để cung cấp vật phẩm.';
        }

        // --- LOGIC HIỂN THỊ SHOP ---   
        const availableItems = Object.entries(allData).filter(([id, item]) => {
            return item && item.type === filterType;
        });

        if (availableItems.length === 0) {
            return message.reply("Hiện tại không có vật phẩm nào trong cửa hàng.");
        }

        const itemsPerPage = 5;
        const totalPages = Math.ceil(availableItems.length / itemsPerPage);
        let currentPage = 0;

        const createEmbed = (page) => {
            const embed = new EmbedBuilder()
                .setTitle(title)
                .setColor(color)
                .setDescription(description) // Cập nhật hướng dẫn
                .setFooter({ text: `Trang ${page + 1}/${totalPages}` });

            const start = page * itemsPerPage;
            const end = start + itemsPerPage;
            const pageItems = availableItems.slice(start, end);

            pageItems.forEach(([id, item]) => {
                embed.addFields({
                    name: `**${item.name}** (ID: \`${id}\`)`,
                    value: `${filterType == 'gift' ? '' : `Giá: **${item.price.toLocaleString()}** Điểm\n`}*${item.description}*`,
                    inline: false
                });
            });

            return embed;
        };

        const createButtons = (page) => {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('prev_page_th')
                    .setLabel('Trang trước')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === 0),
                new ButtonBuilder()
                    .setCustomId('next_page_th')
                    .setLabel('Trang sau')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === totalPages - 1)
            );
        };

        const response = await message.reply({
            embeds: [createEmbed(currentPage)],
            components: [createButtons(currentPage)]
        });

        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000
        });

        collector.on('collect', async (interaction) => {
            if (interaction.user.id !== message.author.id) {
                return interaction.reply({ content: "Bạn không thể điều khiển bảng này!", ephemeral: true });
            }

            if (interaction.customId === 'prev_page_th') {
                currentPage--;
            } else if (interaction.customId === 'next_page_th') {
                currentPage++;
            }

            await interaction.update({
                embeds: [createEmbed(currentPage)],
                components: [createButtons(currentPage)]
            });
        });

        collector.on('end', () => {
            const disabledButtons = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('p').setLabel('Trang trước').setStyle(ButtonStyle.Secondary).setDisabled(true),
                new ButtonBuilder().setCustomId('n').setLabel('Trang sau').setStyle(ButtonStyle.Secondary).setDisabled(true)
            );
            response.edit({ components: [disabledButtons] }).catch(() => null);
        });
    },
    async handleInteraction(interaction) {
        if (interaction.isButton()) {
            const itemType = interaction.customId.replace('taphoa_', '');

            const modal = new ModalBuilder()
                .setCustomId(`modal_taphoa_${itemType}`)
                .setTitle(`Thêm Đồ (${itemType == 'gift' ? 'cửa hàng đồ tặng' : 'cửa hàng trao đổi'})`);

            const fields = [
                { id: 'item_id', label: 'ID đồ vật (không dấu)', style: TextInputStyle.Short, placeholder: 'ví dụ: kiem_go' },
                { id: 'item_name', label: 'Tên vật phẩm', style: TextInputStyle.Short },                
                { id: 'item_desc', label: 'Mô tả vật phẩm', style: TextInputStyle.Paragraph }
            ];

            if(itemType === 'exchange'){
                fields.push({ id: 'item_price', label: 'Giá (Điểm)', style: TextInputStyle.Short, placeholder: '5' })
            }

            fields.forEach(f => {
                modal.addComponents(new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId(f.id).setLabel(f.label).setStyle(f.style).setPlaceholder(f.placeholder || '').setRequired(true)
                ));
            });

            await interaction.showModal(modal);
        }

        if (interaction.type === InteractionType.ModalSubmit) {
            const itemType = interaction.customId.replace('modal_taphoa_', '');
            const id = interaction.fields.getTextInputValue('item_id');
            const name = interaction.fields.getTextInputValue('item_name');
            const desc = interaction.fields.getTextInputValue('item_desc');

            // Ép kiểu số và kiểm tra ngay lập tức
            const rawPrice = itemType === 'gift' ? 0 : interaction.fields.getTextInputValue('item_price');
            const price = parseInt(rawPrice);

            // KIỂM TRA LỖI NHẬP LIỆU (Chống lỗi VALUE_MUST_BE_NUMBER)
            if (isNaN(price)) {
                return interaction.reply({
                    content: `❌ Lỗi: Giá vật phẩm phải là một con số (Bạn đã nhập: "${rawPrice}")`,
                    ephemeral: true
                });
            }

            const shopKey = renderKey('taphoa');

            // 1. Lấy dữ liệu hiện tại từ DB
            const currentShop = (await getKey(shopKey)) || {};

            // 2. Thêm vật phẩm mới vào Object (Dùng ID làm khóa để dễ quản lý)
            currentShop[id] = {
                name: name,
                price: price, // Đảm bảo là kiểu Number
                description: desc,
                type: itemType
            };

            // 3. Lưu đè lại toàn bộ danh sách đã cập nhật
            await setKey(shopKey, currentShop);

            await interaction.reply({
                content: `✅ Đã thêm thành công: **${name}**\nID: \`${id}\` ${ itemType === 'gift' ? '' : `| Giá: \`${price}\``}`,
                ephemeral: true
            });
        }
    }
};