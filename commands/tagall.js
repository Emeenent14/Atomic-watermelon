// Improved version with better error handling and formatting
async function tagAllCommand(sock, chatId) {
    try {
        // Check if it's a group chat
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, {
                text: '❌ This command only works in group chats!'
            });
            return;
        }

        const metadata = await sock.groupMetadata(chatId);
        
        // Filter out banned/kicked members and bots if needed
        const activeParticipants = metadata.participants.filter(p => 
            p.admin !== null || p.admin !== 'admin' // Include admins and regular members
        );

        if (activeParticipants.length === 0) {
            await sock.sendMessage(chatId, {
                text: '❌ No members found to tag!'
            });
            return;
        }

        // Limit to prevent spam (WhatsApp has limits)
        const maxTags = 1000; // Adjust based on your needs
        const participantsToTag = activeParticipants.slice(0, maxTags);
        
        // Extract numbers for display
        const numbers = participantsToTag.map(p => p.id.split('@')[0]);
        
        // Create mention text
        const mentionText = numbers.map(n => `@${n}`).join(' ');
        
        await sock.sendMessage(chatId, {
            text: `📢 Attention everyone!\n\n${mentionText}`,
            mentions: participantsToTag.map(p => p.id)
        });

        // If there were more members than the limit, notify
        if (activeParticipants.length > maxTags) {
            await sock.sendMessage(chatId, {
                text: `⚠️ Only tagged first ${maxTags} members due to limits. Total members: ${activeParticipants.length}`
            });
        }

    } catch (error) {
        console.error('TagAll Error:', error);
        
        // More specific error messages
        let errorMessage = '❌ Failed to tag members. ';
        
        if (error.message.includes('not-admin')) {
            errorMessage += 'Bot needs admin privileges.';
        } else if (error.message.includes('rate-limit')) {
            errorMessage += 'Too many requests. Try again later.';
        } else if (error.message.includes('forbidden')) {
            errorMessage += 'Not allowed to perform this action.';
        } else {
            errorMessage += `Error: ${error.message}`;
        }

        await sock.sendMessage(chatId, {
            text: errorMessage
        });
    }
}

// Alternative version that shows names instead of numbers
async function tagAllWithNames(sock, chatId) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, {
                text: '❌ This command only works in group chats!'
            });
            return;
        }

        const metadata = await sock.groupMetadata(chatId);
        const participants = metadata.participants;

        if (participants.length === 0) {
            await sock.sendMessage(chatId, {
                text: '❌ No members found!'
            });
            return;
        }

        // Get contact info for names (optional)
        let mentionText = '';
        const mentions = [];

        for (let i = 0; i < Math.min(participants.length, 50); i++) {
            const participant = participants[i];
            const number = participant.id.split('@')[0];
            
            // Try to get contact name, fallback to number
            try {
                const contact = await sock.onWhatsApp(participant.id);
                const name = contact[0]?.name || number;
                mentionText += `@${name} `;
            } catch {
                mentionText += `@${number} `;
            }
            
            mentions.push(participant.id);
        }

        await sock.sendMessage(chatId, {
            text: `📢 Everyone:\n\n${mentionText}`,
            mentions: mentions
        });

    } catch (error) {
        console.error('TagAll Error:', error);
        await sock.sendMessage(chatId, {
            text: `❌ Tagging failed: ${error.message}`
        });
    }
}

// Usage in your message handler
async function handleMessage(sock, message) {
    const chatId = message.key.remoteJid;
    const messageText = message.message?.conversation || 
                       message.message?.extendedTextMessage?.text || '';

    if (messageText.toLowerCase() === '.tagall') {
        await tagAllCommand(sock, chatId);
    }
}
