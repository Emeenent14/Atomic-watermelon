const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const USER_GROUP_DATA = path.join(__dirname, '../data/userGroupData.json');

// Load user group data
function loadUserGroupData() {
    try {
        return JSON.parse(fs.readFileSync(USER_GROUP_DATA));
    } catch (error) {
        console.error('❌ Error loading user group data:', error.message);
        return { groups: [], chatbot: {} };
    }
}

// Save user group data
function saveUserGroupData(data) {
    try {
        fs.writeFileSync(USER_GROUP_DATA, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('❌ Error saving user group data:', error.message);
    }
}

// Add random delay between 2-5 seconds
function getRandomDelay() {
    return Math.floor(Math.random() * 3000) + 2000;
}

// Add typing indicator
async function showTyping(sock, chatId) {
    try {
        await sock.presenceSubscribe(chatId);
        await sock.sendPresenceUpdate('composing', chatId);
        await new Promise(resolve => setTimeout(resolve, getRandomDelay()));
    } catch (error) {
        console.error('Typing indicator error:', error);
    }
}


async function handleChatbotCommand(sock, chatId, message, match) {
    if (!match) {
        await showTyping(sock, chatId);
        return sock.sendMessage(chatId, {
            text: `*CHATBOT SETUP*\n\n*.chatbot on*\nEnable chatbot\n\n*.chatbot off*\nDisable chatbot in this group`,
            quoted: message
        });
    }

    const data = loadUserGroupData();

    if (match === 'on') {
        await showTyping(sock, chatId);
        if (data.chatbot[chatId]) {
            return sock.sendMessage(chatId, {
                text: '*Chatbot is already enabled for this group*',
                quoted: message
            });
        }
        data.chatbot[chatId] = true;
        saveUserGroupData(data);
        console.log(`✅ Chatbot enabled for group ${chatId}`);
        return sock.sendMessage(chatId, {
            text: '*Chatbot has been enabled for this group*',
            quoted: message
        });
    }

    if (match === 'off') {
        await showTyping(sock, chatId);
        if (!data.chatbot[chatId]) {
            return sock.sendMessage(chatId, {
                text: '*Chatbot is already disabled for this group*',
                quoted: message
            });
        }
        delete data.chatbot[chatId];
        saveUserGroupData(data);
        console.log(`✅ Chatbot disabled for group ${chatId}`);
        return sock.sendMessage(chatId, {
            text: '*Chatbot has been disabled for this group*',
            quoted: message
        });
    }

    await showTyping(sock, chatId);
    return sock.sendMessage(chatId, {
        text: '*Invalid command. Use .chatbot to see usage*',
        quoted: message
    });
}

async function handleChatbotResponse(sock, chatId, message, userMessage, senderId) {
    const data = loadUserGroupData();
    if (!data.chatbot[chatId]) return;

    try {
        // Get bot's ID
        const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        // Check for mentions and replies
        let isBotMentioned = false;
        let isReplyToBot = false;

        // Check if message is a reply and contains bot mention
        if (message.message?.extendedTextMessage) {
            const mentionedJid = message.message.extendedTextMessage.contextInfo?.mentionedJid || [];
            const quotedParticipant = message.message.extendedTextMessage.contextInfo?.participant;

            // Check if bot is mentioned in the reply
            isBotMentioned = mentionedJid.some(jid => jid === botNumber);

            // Check if replying to bot's message
            isReplyToBot = quotedParticipant === botNumber;
        }
        // Also check regular mentions in conversation
        else if (message.message?.conversation) {
            isBotMentioned = userMessage.includes(`@${botNumber.split('@')[0]}`);
        }

        if (!isBotMentioned && !isReplyToBot) return;

        // Clean the message
        let cleanedMessage = userMessage;
        if (isBotMentioned) {
            cleanedMessage = cleanedMessage.replace(new RegExp(`@${botNumber.split('@')[0]}`, 'g'), '').trim();
        }

        // Show typing indicator
        await showTyping(sock, chatId);

        // Get AI response
        const response = await getAIResponse(cleanedMessage || "hi");
        if (!response) {
            await sock.sendMessage(chatId, {
                text: "Hmm, let me think about that... 🤔\nI'm having trouble processing your request right now.",
                quoted: message
            });
            return;
        }

        // Add human-like delay before sending response
        await new Promise(resolve => setTimeout(resolve, getRandomDelay()));

        // Send response as a reply with proper context
        await sock.sendMessage(chatId, {
            text: response
        }, {
            quoted: message
        });

    } catch (error) {
        console.error('❌ Error in chatbot response:', error.message);
        await sock.sendMessage(chatId, {
            text: "Oops! 😅 I got a bit confused there. Could you try asking that again?",
            quoted: message
        });
    }
}

async function getAIResponse(userMessage) {
    try {
        const prompt = `
You are chatting casually on WhatsApp like a real human. 
Reply in the same tone and language the user uses (Hinglish, Hindi, or English). 
Don’t say you're an AI or assistant. 
Be friendly, emotional, funny, or flirty when needed.
Talk like a real person chatting on WhatsApp — short, real, expressive.

User: ${userMessage}
You:
        `.trim();

        const response = await fetch("https://api.dreaded.site/api/chatgpt?text=" + encodeURIComponent(prompt));
        if (!response.ok) throw new Error("API call failed");

        const data = await response.json();
        if (!data.success || !data.result?.prompt) throw new Error("Invalid API response");

        return data.result.prompt.trim();
    } catch (error) {
        console.error("AI API error:", error);
        return null;
    }
}


module.exports = {
    handleChatbotCommand,
    handleChatbotResponse
}; 