# Kanji Subs

Chrome extension that redraws Japanese YouTube captions as clear kanji text with furigana, so you can read along. It draws real page text, so [Yomitan](https://github.com/yomidevs/yomitan) works on it for lookups.

## Install (Chrome or Edge)
1. Download this repo: green **Code** button -> **Download ZIP**, then unzip it.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and choose the unzipped `kanji-subs` folder.
4. Open a YouTube video and turn on its Japanese captions. The first caption takes a moment while the dictionary loads.

To update later, download the ZIP again, replace the folder, and press the reload icon on the extension.

## Settings
Click the toolbar icon: show overlay, furigana, pause on hover, resume when the mouse leaves, size.

## Notes
- Needs Japanese captions on the video (uploaded or auto-generated).
- Readings come from kuromoji's dictionary and are occasionally wrong for names or unusual words.

## Credits
[kuromoji.js](https://github.com/takuyaa/kuromoji.js) (Apache 2.0) with its IPAdic dictionary. See `lib/NOTICE.md` and `lib/LICENSE-2.0.txt`.
