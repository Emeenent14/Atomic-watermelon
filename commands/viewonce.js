const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { channelInfo } = require('../config/messageConfig');
const settings = require('../settings');

async function viewOnceCommand(sock, chatId, message) {
    try {
        // Check if the message is a reply
        const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quotedMessage) {
            await sock.sendMessage(chatId, { 
                text: 'Please reply to a ViewOnce message with .vv command!',
                ...channelInfo 
            });
            return;
        }

        // Check for ViewOnce message in different possible formats
        const viewOnceMessage = quotedMessage.viewOnceMessage || 
                              quotedMessage.viewOnceMessageV2 || 
                              quotedMessage.viewOnceImageMessage || 
                              quotedMessage.viewOnceVideoMessage;

        if (!viewOnceMessage) {
            await sock.sendMessage(chatId, { 
                text: 'This is not a ViewOnce message!',
                ...channelInfo 
            });
            return;
        }

        // Get the actual message content
        const messageContent = viewOnceMessage.message || viewOnceMessage;
        const messageType = Object.keys(messageContent)[0];
        const mediaContent = messageContent[messageType];
        const caption = mediaContent?.caption || '';
        const sender = message.key.participant || message.key.remoteJid;

        // Download media content
        const stream = await downloadContentFromMessage(
            mediaContent,
            messageType.replace('Message', '').toLowerCase()
        );
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // Identify media type
        const mediaTypeMap = {
            imageMessage: { type: 'Image 📸', extension: '.jpg' },
            videoMessage: { type: 'Video 📹', extension: '.mp4' },
            audioMessage: { type: 'Audio 🎵', extension: '.mp3' },
        };

        const { type: mediaType } = mediaTypeMap[messageType] || {};

        if (!mediaType || !buffer) {
            throw new Error('Unsupported media type or failed to download content.');
        }

        // Send the media back without ViewOnce restriction
        await sock.sendMessage(chatId, {
            [messageType.replace('Message', '')]: buffer,
            caption: `*💀 KnightBot Anti ViewOnce 💀*\n\n*Type:* ${mediaType}\n*Sender:* @${sender.split('@')[0]}\n${
                caption ? `*Caption:* ${caption}` : ''
            }`,
            mentions: [sender],
            ...channelInfo
        });

    } catch (error) {
        console.error('Error processing ViewOnce message:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Error processing ViewOnce media. Please try again later.',
            ...channelInfo 
        });
    }
}

module.exports = viewOnceCommand; 