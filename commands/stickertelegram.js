const fetch = require('node-fetch');
const { writeExifImg } = require('../lib/exif');
const delay = time => new Promise(res => setTimeout(res, time));
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const webp = require('node-webpmux');
const crypto = require('crypto');

async function stickerTelegramCommand(sock, chatId, msg) {
    try {
        // Get the URL from message
        const text = msg.message?.conversation?.trim() || 
                    msg.message?.extendedTextMessage?.text?.trim() || '';
        
        const args = text.split(' ').slice(1);
        
        if (!args[0]) {
            await sock.sendMessage(chatId, { 
                text: '⚠️ Please enter the Telegram sticker URL!\n\nExample: .tg https://t.me/addstickers/Porcientoreal' 
            });
            return;
        }

        // Validate URL format
        if (!args[0].match(/(https:\/\/t.me\/addstickers\/)/gi)) {
            await sock.sendMessage(chatId, { 
                text: '❌ Invalid URL! Make sure it\'s a Telegram sticker URL.' 
            });
            return;
        }

        // Get pack name from URL
        const packName = args[0].replace("https://t.me/addstickers/", "");

        // Using working bot token
        const botToken = '7801479976:AAGuPL0a7kXXBYz6XUSR_ll2SR5V_W6oHl4';
        
        try {
            // Fetch sticker pack info
            const response = await fetch(
                `https://api.telegram.org/bot${botToken}/getStickerSet?name=${encodeURIComponent(packName)}`,
                { 
                    method: "GET",
                    headers: {
                        "Accept": "application/json",
                        "User-Agent": "Mozilla/5.0"
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const stickerSet = await response.json();
            
            if (!stickerSet.ok || !stickerSet.result) {
                throw new Error('Invalid sticker pack or API response');
            }

            // Send initial message with sticker count
            await sock.sendMessage(chatId, { 
                text: `📦 Found ${stickerSet.result.stickers.length} stickers\n⏳ Starting download...` 
            });

            // Create temp directory if it doesn't exist
            const tmpDir = path.join(process.cwd(), 'tmp');
            if (!fs.existsSync(tmpDir)) {
                fs.mkdirSync(tmpDir, { recursive: true });
            }

            // Process each sticker
            let successCount = 0;
            for (let i = 0; i < stickerSet.result.stickers.length; i++) {
                try {
                    const fileId = stickerSet.result.stickers[i].file_id;
                    
                    // Get file path
                    const fileInfo = await fetch(
                        `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`
                    );
                    
                    if (!fileInfo.ok) continue;
                    
                    const fileData = await fileInfo.json();
                    if (!fileData.ok || !fileData.result.file_path) continue;

                    // Download sticker
                    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
                    const imageResponse = await fetch(fileUrl);
                    const imageBuffer = await imageResponse.buffer();

                    // Convert to WebP using sharp
                    const webpBuffer = await sharp(imageBuffer)
                        .resize(512, 512, { 
                            fit: 'contain', 
                            background: { r: 0, g: 0, b: 0, alpha: 0 } 
                        })
                        .webp()
                        .toBuffer();

                    // Add metadata using webpmux
                    const img = new webp.Image();
                    await img.load(webpBuffer);

                    // Create metadata
                    const metadata = {
                        'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
                        'sticker-pack-name': global.packname || 'WhatsApp Bot',
                        'sticker-pack-publisher': global.author || '@bot',
                        'emojis': ['🤖']
                    };

                    // Create exif buffer
                    const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
                    const jsonBuffer = Buffer.from(JSON.stringify(metadata), 'utf8');
                    const exif = Buffer.concat([exifAttr, jsonBuffer]);
                    exif.writeUIntLE(jsonBuffer.length, 14, 4);

                    // Set the exif data
                    img.exif = exif;

                    // Get the final buffer
                    const finalBuffer = await img.save(null);

                    // Send sticker without reply or mention
                    await sock.sendMessage(chatId, { 
                        sticker: finalBuffer 
                    });

                    successCount++;
                    await delay(1000); // Reduced delay

                } catch (err) {
                    console.error(`Error processing sticker ${i}:`, err);
                    continue;
                }
            }

            // Only send completion message at the end
            await sock.sendMessage(chatId, { 
                text: `✅ Successfully downloaded ${successCount}/${stickerSet.result.stickers.length} stickers!` 
            });

        } catch (error) {
            throw new Error(`Failed to process sticker pack: ${error.message}`);
        }

    } catch (error) {
        console.error('Error in stickertelegram command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Failed to process Telegram stickers!\nMake sure:\n1. The URL is correct\n2. The sticker pack exists\n3. The sticker pack is public' 
        });
    }
}

module.exports = stickerTelegramCommand; 