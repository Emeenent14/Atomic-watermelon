async function shipCommand(sock, chatId, msg, groupMetadata) {
    try {
        // Get all participants from the group
        const participants = await sock.groupMetadata(chatId);
        const ps = participants.participants.map(v => v.id);
        
        // Get sender's ID
        const sender = msg.key.participant || msg.key.remoteJid;
        
        // Get random participant (different from sender)
        let randomParticipant;
        do {
            randomParticipant = ps[Math.floor(Math.random() * ps.length)];
        } while (randomParticipant === sender);

        // Format the mentions
        const formatMention = id => '@' + id.split('@')[0];

        // Create and send the ship message
        await sock.sendMessage(chatId, {
            text: `${formatMention(sender)} ❤️ ${formatMention(randomParticipant)}\nCongratulations 💖🍻`,
            mentions: [sender, randomParticipant]
        });

    } catch (error) {
        console.error('Error in ship command:', error);
        await sock.sendMessage(chatId, { text: 'Failed to ship! Make sure this is a group.' });
    }
}

module.exports = shipCommand; 