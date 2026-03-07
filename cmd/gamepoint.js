const { renderKey, getKey, setKey } = require('../utils/db'); //
const { verifyIcon, errorIcon } = require('../utils/icon.js'); //

module.exports = {
    name: 'point',
    description: 'Quản lý và kiểm tra điểm người chơi.',
    async execute(message, args) {
        const action = args[0]?.toLowerCase();
        
        // --- CHỨC NĂNG CHECK (Dành cho tất cả người dùng) ---
        if (action === 'check' || !action) {
            const targetUser = message.mentions.users.first() || message.author;
            const pointKey = renderKey("game_point", targetUser.id);
            const points = (await getKey(pointKey)) || 0;

            const isSelf = targetUser.id === message.author.id;
            const msg = isSelf 
                ? `Bạn đang có **${points.toLocaleString()}** điểm.` 
                : `Người dùng **${targetUser.username}** đang có **${points.toLocaleString()}** điểm.`;

            return message.reply(`${msg}`);
        }

        // --- CHỨC NĂNG QUẢN LÝ (Chỉ dành cho Developer) ---
        const managerIds = ['1182987381662556253',"1446889473374683400"]; // Thay bằng ID thực tế của bạn
        if (!managerIds.includes(message.author.id)) {
            return message.reply(`${errorIcon} Bạn không có quyền sử dụng lệnh quản lý điểm.`);
        }

        const targetUser = message.mentions.users.first();
        const amount = parseInt(args[2]);

        if (!['add', 'remove'].includes(action)) {
            return message.reply(`${errorIcon} Cú pháp: \`.point check [@user]\` hoặc \`.point add/remove @user <số>\``);
        }

        if (!targetUser) {
            return message.reply(`${errorIcon} Vui lòng tag người dùng cần thực hiện.`);
        }

        if (isNaN(amount) || amount <= 0) {
            return message.reply(`${errorIcon} Vui lòng nhập số điểm hợp lệ.`);
        }

        const pointKey = renderKey("game_point", targetUser.id);
        const currentPoints = (await getKey(pointKey)) || 0;
        
        let newPoints;
        let resultMsg;

        if (action === 'add') {
            newPoints = currentPoints + amount;
            resultMsg = `Đã cộng **${amount.toLocaleString()}** điểm cho **${targetUser.username}**.`;
        } else if (action === 'remove') {
            newPoints = Math.max(0, currentPoints - amount);
            resultMsg = `Đã trừ **${amount.toLocaleString()}** điểm của **${targetUser.username}**.`;
        }

        await setKey(pointKey, newPoints);
        return message.reply(`${verifyIcon} ${resultMsg}\nSố điểm hiện tại: **${newPoints.toLocaleString()}** điểm.`);
    }
};