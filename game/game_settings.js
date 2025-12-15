// Trong môi trường Node.js không có database, chúng ta dùng một Object đơn giản 
// để lưu trữ cấu hình theo Server ID (Guild ID).
// Cấu trúc: { 'guildId1': 'channelId1', 'guildId2': 'channelId2', ... }
const gameChannels = {};

// Hàm lấy Channel ID cho một Server cụ thể
function getGameChannelId(guildId) {
    return gameChannels[guildId];
}

/**
 * Thiết lập Kênh chơi game cho một Server.
 * @param {string} guildId - ID của Server.
 * @param {string} channelId - ID của Kênh văn bản.
 */
function setGameChannelId(guildId, channelId) {
    gameChannels[guildId] = channelId;
}

module.exports = {
    getGameChannelId,
    setGameChannelId
};