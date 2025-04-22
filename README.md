# EVE Starmap

Mimics the in-game Starmap, displaying each system in New Eden on a three-dimensional map. Uses Three.js for 3D rendering.

Based on data from [https://developers.eveonline.com/docs/services/sde/](https://developers.eveonline.com/docs/services/sde/)

### Features

- Stargate routes/lines can be toggled on and off with a button.
- Interactive camera controls
- Systems and lines are colored by system security level.
- Colors of lines between two systems with a different security status are blended together.
- Shows the name of each region.

## Demo

[https://eve-starmap.vercel.app/](https://eve-starmap.vercel.app/)

## About the project

This was just a fun experiment. As of writing the code is a mess, but hopefully there's little enough of it to groq.

## Interesting Facts

- Merges systems and stargate lines into one mesh each to maximize performanxe

## Potential Improvements/Additions

The list is mostly based on the actual Starmap feature in eve:

- Show names of system when camera is close enough
- Being able to select a system
  - Highlight system node and routes when selected
  - Set camera focus on selected system
  - Show information about system and stargates
  - Render 3D models within system (Sun, stars, orbit arcs)
- Making the camera controls smoother
