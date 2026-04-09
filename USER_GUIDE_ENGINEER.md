# Site Survey Tool - Field Engineer Guide

Welcome to the field force application! This application is optimized for tablet and mobile viewing while you are on-site conducting network property surveys.

## Getting Started
1. Obtain your login credentials from your administrator.
2. Log in through the application landing page.
3. Upon login, you will see a list of **Properties** assigned to you dynamically.

## Uploading Floor Plans
If a floor does not yet have an architecture blueprint:
1. Tap on the specific Property -> Building -> Floor.
2. Select **Upload Floor Plan**.
3. Choose an image (PNG/JPEG) or PDF from your device storage.
4. The file will upload securely.

## Using the Interactive Canvas
Once a floor plan is uploaded, you can view the map layer:
- **Draw Spaces**: Select the polygon tool to highlight specific areas on a map (e.g., Telecom Server Room, Conference Room).
- **Log Equipment**: Tap anywhere on the floor plan to drop a marker representing a physical router, switch, or splice point. Enter the details in the popup dialog.
- **Save Layout**: Don't forget to commit layout modifications so they persist on the backend.

## RF Scan Integration (Optional)
If your operations utilize RF surveying:
- Select "Upload RF File" from the top navigation when viewing the Floor plan.
- Upload a Kismet or Vistumbler CSV log.
- A dynamically generated color map (Heatmap) will overlay the signal intensity on top of the physical layout to pinpoint dead zones.

## Filling Checklists & Attaching Photos
1. Switch to the **Checklists** view.
2. Select the room/space you are surveying to begin its respective tasks.
3. If an anomaly is located (e.g., broken conduits), tap "Add Attachment" in the checklist dialog to take a picture or select an existing photo. This metadata links directly to the specific room space.
