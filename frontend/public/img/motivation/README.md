# Motivational Images

Add your motivational images to this folder. Name them numerically:

- `1.jpg`
- `2.jpg`
- `3.jpg`
- `4.jpg`
- `5.jpg`
- `6.jpg`
- ... (add more as needed)

## Supported formats

- `.jpg` / `.jpeg`
- `.png`
- `.webp`
- `.gif`

## Notes

- Images will be displayed at a fixed size (96px x 128px)
- Use `object-fit: cover` so any aspect ratio works
- Recommended: use images that look good when cropped
- The component will randomly select 6 images (3 per side)
- Images are shuffled on page load

## Updating the image list

If you add more images, update the `AVAILABLE_IMAGES` array in:
`frontend/src/components/MotivationalSidePanels.tsx`

```typescript
const AVAILABLE_IMAGES = [
  '/img/motivation/1.jpg',
  '/img/motivation/2.jpg',
  // ... add your new images here
];
```

