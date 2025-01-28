const os = require('os');

async function pingCommand(sock, chatId) {
    try {
        const start = Date.now();
        
        // Get system info
        const uptime = process.uptime();
        const ram = (os.totalmem() - os.freemem()) / (1024 * 1024 * 1024);
        const platform = os.platform();
        
        // Calculate ping
        await sock.sendMessage(chatId, { text: '📊 *Calculating...*' });
        const end = Date.now();
        const ping = end - start;

        const message = `*🤖 Bot Status*\n\n` +
                       `*⚡ Response Time:* ${ping}ms\n` +
                       `*💻 Platform:* ${platform}\n` +
                       `*🔄 Uptime:* ${formatTime(uptime)}\n` +
                       `*💾 RAM Usage:* ${ram.toFixed(2)}GB`;

        await sock.sendMessage(chatId, {
            text: message,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363161513685998@newsletter',
                    newsletterName: 'KnightBot MD',
                    serverMessageId: -1
                }
            }
        });
    } catch (error) {
        console.error('Error in ping command:', error);
        await sock.sendMessage(chatId, { text: 'Failed to get ping status.' });
    }
}

function formatTime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds = seconds % (24 * 60 * 60);
    const hours = Math.floor(seconds / (60 * 60));
    seconds = seconds % (60 * 60);
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);

    let time = '';
    if (days > 0) time += `${days}d `;
    if (hours > 0) time += `${hours}h `;
    if (minutes > 0) time += `${minutes}m `;
    if (seconds > 0) time += `${seconds}s`;

    return time.trim();
}

module.exports = pingCommand;