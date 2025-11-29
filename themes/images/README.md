# Bentobox Wallpaper Collection

A curated collection of **67 stunning 4K wallpapers** sourced from [Unsplash](https://unsplash.com/s/photos/wallpaper-4k) and [Pexels](https://www.pexels.com).

## 📸 Collection Overview

This directory contains high-quality wallpapers featuring:
- 🏔️ **Mountains & Landscapes** - Dramatic peaks, valleys, and scenic vistas
- 🌅 **Sunsets & Sunrises** - Golden hour photography
- 🌊 **Water & Oceans** - Serene lakes, rivers, and coastal scenes
- 🌌 **Space & Astronomy** - Celestial and cosmic imagery
- 🎨 **Abstract & Minimal** - Modern geometric and gradient designs
- 🏙️ **Urban & Architecture** - City skylines and structures
- 🌲 **Nature & Forests** - Trees, trails, and natural beauty

## 🖼️ Default Wallpaper

The default wallpaper is:
**`pexels-pok-rie-33563-2049422.jpg`** ⭐

A stunning mountain landscape with dramatic clouds, perfect for any desktop.

## 📦 Installation

During Bentobox installation, all wallpapers are automatically:
1. Copied to `~/Pictures/Wallpapers/` (primary location)
2. Copied to `~/.local/share/backgrounds/` (GNOME backgrounds)

This ensures your wallpapers **persist across Bentobox updates**.

## 🎨 Changing Wallpaper

### Via Bentobox GUI:
1. Open **Bentobox Installer**
2. Go to **Wallpapers** tab
3. Browse the collection as thumbnails
4. Click on any wallpaper to apply it

### Via GNOME Settings:
1. Open **Settings**
2. Go to **Appearance** → **Background**
3. Click **Add Picture**
4. Navigate to `~/Pictures/Wallpapers/`
5. Select your preferred wallpaper

### Via Command Line:
```bash
# Set a specific wallpaper
WALLPAPER="$HOME/Pictures/Wallpapers/daniel-leone-g30P1zcOzXo-unsplash.jpg"
gsettings set org.gnome.desktop.background picture-uri "file://$WALLPAPER"
gsettings set org.gnome.desktop.background picture-uri-dark "file://$WALLPAPER"
gsettings set org.gnome.desktop.background picture-options 'zoom'
```

## 🔧 Wallpaper Display Options

The wallpapers are set to **zoom** mode by default, which scales the image to fit your screen while maintaining aspect ratio.

Available options:
```bash
# Change display mode
# Options: 'none', 'wallpaper', 'centered', 'scaled', 'stretched', 'zoom', 'spanned'
gsettings set org.gnome.desktop.background picture-options 'zoom'
```

## ➕ Adding Your Own Wallpapers

1. Add your `.jpg` or `.png` files to the `wallpaper/` directory
2. Run Bentobox installation (or re-run `install/desktop/set-wallpaper.sh`)
3. Your wallpapers will be automatically copied to persistent locations
4. Access them from Settings → Appearance → Background

## 📋 Complete Wallpaper List

### Unsplash Collection (60 images)

All from https://unsplash.com/s/photos/wallpaper-4k

- ameer-basheer-Xrx3WWyrwes-unsplash.jpg
- andreas-gucklhorn-mawU2PoJWfU-unsplash.jpg
- andrew-ridley-jR4Zf-riEjI-unsplash.jpg
- aniket-deole-M6XC789HLe8-unsplash.jpg
- aperture-vintage-NrAvSjyW3D4-unsplash.jpg
- ashim-d-silva-WeYamle9fDM-unsplash.jpg
- axel-ruffini-cVNocf2UtbY-unsplash.jpg
- bailey-zindel-NRQV-hBF10M-unsplash.jpg
- benjamin-voros-phIFdC6lA4E-unsplash.jpg
- cihad-dagli-oRruoqIaaDQ-unsplash.jpg
- clay-banks-u27Rrbs9Dwc-unsplash.jpg
- cristina-gottardi-CSpjU6hYo_0-unsplash.jpg
- daniel-leone-g30P1zcOzXo-unsplash.jpg
- daniel-leone-v7daTKlZzaw-unsplash.jpg
- daniel-stiel-6ak7qFiLhpE-unsplash.jpg
- garrett-parker-DlkF4-dbCOU-unsplash.jpg
- ian-dooley-DuBNA1QMpPA-unsplash.jpg
- jeremy-bishop-B2Q7UC6QGLE-unsplash.jpg
- jeremy-thomas-E0AHdsENmDg-unsplash.jpg
- john-fowler-RsRTIofe0HE-unsplash.jpg
- john-lee-oMneOBYhJxY-unsplash.jpg
- john-towner-JgOeRuGD_Y4-unsplash.jpg
- jonatan-pie-3l3RwQdHRHg-unsplash.jpg
- jonatan-pie-3N5ccOE3wGg-unsplash.jpg
- kalen-emsley-Bkci_8qcdvQ-unsplash.jpg
- lance-asper-3P3NHLZGCp8-unsplash.jpg
- li-zhang-18qm9W6eZ-8-unsplash.jpg
- li-zhang-K-DwbsTXliY-unsplash.jpg
- luca-bravo-4yta6mU66dE-unsplash.jpg
- mark-basarab-1OtUkD_8svc-unsplash.jpg
- martin-martz-OR8DEvVhym0-unsplash.jpg
- martin-martz-VDKA7N_v_hI-unsplash.jpg
- matthew-feeney-WeR4O6zoedA-unsplash.jpg
- maxim-berg-3E2xgrlNXq4-unsplash.jpg
- maxim-berg-EirX0QN4-Sk-unsplash.jpg
- maxim-berg-fKPZGJI4dXU-unsplash.jpg
- maxim-berg-JiM_eFf2O3M-unsplash.jpg
- maxim-berg-Tba7ds4aF_k-unsplash.jpg
- maxim-berg-TcE45yIzJA0-unsplash.jpg
- maxim-berg-wOVUjOGc9Oo-unsplash.jpg
- mike-l-lSh6vd87jTs-unsplash.jpg
- milad-fakurian-0_8gAoFrzbw-unsplash.jpg
- milad-fakurian-CdAmQAko9As-unsplash.jpg
- mohammad-alizade-4wzRuAb-KWs-unsplash.jpg
- moren-hsu-VLaKsTkmVhk-unsplash.jpg
- nattu-adnan-Ai2TRdvI6gM-unsplash.jpg
- nitish-meena-RbbdzZBKRDY-unsplash.jpg
- patrick-fore-850jTF12RSQ-unsplash.jpg
- pawel-czerwinski-PvgqqicSLvA-unsplash.jpg
- pawel-czerwinski-YAtspJ-HV2E-unsplash.jpg
- philip-oroni-1aF8IIHMHm8-unsplash.jpg
- philip-oroni-3er4tNSPPoc-unsplash.jpg
- philip-oroni-gftMuFt8vNk-unsplash.jpg
- redd-francisco-gdQnsMbhkUs-unsplash.jpg
- ricky-kharawala-6s8GtWMjT3I-unsplash.jpg
- sebastian-svenson-d2w-_1LJioQ-unsplash.jpg
- silas-baisch-OCzvgBqCJKY-unsplash.jpg
- sven-van-der-pluijm-W7EgqYJdQOE-unsplash.jpg
- tiago-wolf-W4CTDtL2LQo-unsplash.jpg
- yasintha-perera-nfRoLVaX3P8-unsplash.jpg

### Pexels Collection (7 images)

All from https://www.pexels.com

- pexels-eberhardgross-1062249.jpg
- pexels-eberhardgross-443446.jpg
- pexels-eberhardgross-640781.jpg
- pexels-felix-mittermeier-956981.jpg
- pexels-philippedonn-1169754.jpg
- pexels-pok-rie-33563-2049422.jpg ⭐ (Default)
- pexels-pok-rie-33563-982263.jpg

## 📜 License & Credits

All wallpapers are free to use under their respective licenses:

### Unsplash License
✅ Free for commercial and non-commercial use  
✅ No permission or attribution required  
✅ Modify and redistribute freely  

Full license: https://unsplash.com/license

### Pexels License
✅ Free for personal and commercial use  
✅ No attribution required (but appreciated)  
✅ Modify, copy, and distribute  

Full license: https://www.pexels.com/license/

See [`LICENSE.md`](./LICENSE.md) for complete license terms and photographer credits.

## 🙏 Thank You

A huge thank you to:
- **Unsplash** - For providing 3M+ free high-resolution images: https://unsplash.com
- **Pexels** - For making quality photography accessible to everyone: https://www.pexels.com
- **All 50+ photographers** who contributed to this collection
- **The creative community** that supports open-source photography

Your generosity makes projects like Bentobox beautiful! 🎨✨

---

**Collection Size**: 67 wallpapers  
**Sources**: Unsplash + Pexels  
**Last Updated**: November 24, 2025  
**Maintained by**: Bentobox Project
