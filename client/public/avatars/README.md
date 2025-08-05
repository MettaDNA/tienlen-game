# Custom Avatar Upload Guide

## 📁 Avatar Files Location
Place your custom avatar images in this folder: `client/public/avatars/`

## 🖼️ Supported File Formats
- **JPG/JPEG**: Best for photos
- **PNG**: Best for graphics with transparency
- **WebP**: Modern, efficient format
- **SVG**: Scalable vector graphics

## 📏 Recommended Image Specifications
- **Size**: 200x200 pixels or larger
- **Aspect Ratio**: Square (1:1) works best
- **File Size**: Keep under 1MB for fast loading
- **Quality**: High quality for best appearance

## 🎮 Player Avatar Files
The game expects these files (you can rename your files to match):

- `player1.jpg` - Player 1 (You) - Blue theme
- `player2.jpg` - Player 2 (Bot) - Red theme  
- `player3.jpg` - Player 3 (Bot) - Green theme
- `player4.jpg` - Player 4 (Bot) - Purple theme

## 📝 How to Upload
1. Copy your avatar images to this folder
2. Rename them to match the expected filenames above
3. The game will automatically load your custom avatars

## 🔄 Fallback System
If an avatar file is missing or fails to load, the game will show:
- A colored background matching the player's theme
- The player's initial (P1, P2, P3, P4)

## 💡 Tips
- Use square images for best results
- Keep file sizes small for faster loading
- Test your avatars by refreshing the game
- You can use different file formats for different players

## 🎨 Example File Structure
```
avatars/
├── player1.jpg  (Your avatar)
├── player2.jpg  (Bot avatar)
├── player3.jpg  (Bot avatar)
└── player4.jpg  (Bot avatar)
``` 