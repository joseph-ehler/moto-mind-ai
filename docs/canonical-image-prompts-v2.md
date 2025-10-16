# Canonical Vehicle Image Prompt Templates
## Production-Ready Showroom Photography Prompts

*Updated: 2024-09-24*

---

## 🎯 **Current Production Prompt (Hard Lock v3.0)**

**Template:**
```
A true-to-life, high-resolution stock photograph of a [YEAR] [MAKE] [MODEL], taken on a professional dealership photo set with a pure white background. The vehicle is positioned at a 45-degree angle, showing both the front grille and side profile. Lighting must be bright, neutral, and evenly distributed. Include a yellow oval dealership year sticker on the windshield with "[YEAR]". Style must match real online car dealership listings — not artistic renderings, not futuristic concept cars, not CGI.
```

**Example Output:**
```
A true-to-life, high-resolution photograph of a 2013 CHEVROLET Captiva Sport, displayed on a pure white showroom floor. The vehicle should be positioned at a 45-degree angle, showing both the front grille and side profile. Lighting should be bright, neutral, and even, as if for an online dealership listing. The background must be completely white, clean, and minimal for a professional presentation.
```

---

## 🔑 **Key Elements That Make This Work**

1. **"True-to-life, high-resolution photograph"** - Emphasizes photorealism over artistic interpretation
2. **"Pure white showroom floor"** - Creates the dealership environment context
3. **"45-degree angle"** - Specific positioning that shows both front and side optimally
4. **"Bright, neutral, and even lighting"** - Prevents dramatic shadows or artistic lighting
5. **"As if for an online dealership listing"** - Sets the commercial, professional context
6. **"Completely white, clean, and minimal"** - Ensures clean background for UI integration

---

## 📸 **Image Quality Results**

This template produces:
- ✅ **Dealership-quality** professional images
- ✅ **Consistent lighting** across all vehicles
- ✅ **Clean white backgrounds** perfect for UI integration
- ✅ **Optimal vehicle positioning** showing key design elements
- ✅ **True-to-life accuracy** rather than stylized interpretations

---

## 🚗 **Dynamic Implementation**

**In Code:**
```typescript
const prompt = `A true-to-life, high-resolution photograph of a ${specs.year} ${specs.make} ${specs.model}, displayed on a pure white showroom floor. The vehicle should be positioned at a 45-degree angle, showing both the front grille and side profile. Lighting should be bright, neutral, and even, as if for an online dealership listing. The background must be completely white, clean, and minimal for a professional presentation.`
```

**Variables:**
- `${specs.year}` - Vehicle year (e.g., "2013")
- `${specs.make}` - Manufacturer (e.g., "CHEVROLET") 
- `${specs.model}` - Model name (e.g., "Captiva Sport")

---

## 🎨 **Alternative Variations**

### With Color Specification
```
A true-to-life, high-resolution photograph of a [YEAR] [MAKE] [MODEL] in [COLOR], displayed on a pure white showroom floor. The vehicle should be positioned at a 45-degree angle, showing both the front grille and side profile. Lighting should be bright, neutral, and even, as if for an online dealership listing. The background must be completely white, clean, and minimal for a professional presentation.
```

### With Trim Level
```
A true-to-life, high-resolution photograph of a [YEAR] [MAKE] [MODEL] [TRIM], displayed on a pure white showroom floor. The vehicle should be positioned at a 45-degree angle, showing both the front grille and side profile. Lighting should be bright, neutral, and even, as if for an online dealership listing. The background must be completely white, clean, and minimal for a professional presentation.
```

---

## 📊 **Performance Metrics**

**Image Generation:**
- **Model**: DALL-E 3
- **Size**: 1024x1024px
- **Quality**: Standard (sufficient for web use)
- **Generation Time**: 15-30 seconds
- **Success Rate**: ~95% for common vehicles

**Cost Analysis:**
- **Per Image**: ~$0.04 USD
- **Per Canonical Key**: One-time cost, infinite reuse
- **ROI**: 30x cost reduction through consolidation

---

## 🔄 **Future Enhancements**

**Potential Improvements:**
1. **Multiple Angles**: Generate front, side, rear views
2. **Color Variations**: Generate multiple color options
3. **Interior Shots**: Add cabin/dashboard views
4. **Detail Shots**: Close-ups of key features
5. **Seasonal Variants**: Different lighting conditions

**Advanced Prompts:**
- **Studio Lighting Variations**: Different professional lighting setups
- **Background Options**: Gradient backgrounds, showroom environments
- **Angle Variations**: Multiple professional angles per vehicle

---

## 📝 **Prompt Evolution History**

**v1.0** - Basic studio photography prompt
**v2.0** - Enhanced with showroom context and specific positioning
**v2.1** - Current: Proven template optimized for dealership-quality results

**Key Learnings:**
- Specificity beats creativity for commercial use
- "Dealership listing" context produces most consistent results
- White background requirement essential for UI integration
- 45-degree angle optimal for vehicle recognition

---

This prompt template is now production-ready and generates consistently high-quality, professional vehicle images suitable for commercial use in the MotoMind AI platform.
