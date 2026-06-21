# Demo 3D Dish Design

## Goal

Add one bundled demonstration 3D dish to the tablet menu so a guest can rotate it freely and zoom with touch gestures.

## Experience

- The existing video menu remains the default presentation.
- The demo dish receives a `Смотреть в 3D` action.
- The action opens a full-screen dark modal.
- One-finger drag rotates the model horizontally and vertically.
- Pinch zooms the camera.
- A visible `Закрыть` action returns to the video.

## Implementation

Use an Expo DOM component containing Google `<model-viewer>`. On Android it runs in the app's WebView; on web it renders directly. The GLB asset is bundled with the application so the demo does not depend on an external model host.

The first menu dish is the demo target. This phase does not add owner uploads or a database field for 3D models.

## Asset

Use Khronos `IridescentDishWithOlives.glb`, credited to Wayfair LLC under CC BY 4.0. Store the model and attribution in `assets/models/`.

## Verification

- Expo Doctor passes.
- TypeScript passes.
- Web export passes.
- The 3D action appears only for the demo dish.
- The modal can be opened and dismissed.
- Android production configuration includes the WebView dependency.
