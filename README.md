# LiteMapper
LiteMapper is a website that automatically generates lights for Beat Saber maps. It incentivizes creative mapping, as maps with better pacing, emphasis, and block choices will receive a more detailed lightshow than maps of lower quality.

[Preview Video](https://www.youtube.com/watch?v=S7duRjJlXBc)

## Basic Usage
1. Visit https://litemapper.net.
2. Upload your beatmap and press the **Generate** button.
3. Wait for it to finish compiling, then press the **Download Map** button.

## Behind The Scenes
You may be wondering, how do we manage to incentivize more creative mapping? Rather than just placing events based on time and location, we run a multitude of different checks to decide on where to place our events.
- Beats with a high pace (more than 1 block per beat) receive a red center light, beats with a medium pace (at least 2 block per two beats) receive a blue center light, and beats with a slow pace (one block or less per two beats) receive a fading blue center light.
- A change in pace results in a ring zoom.
- Timestamps with more than one block at a time results in a ring rotation.
- Beats with more than one block per two beats receive a ring light every beat.
- Any-direction blocks and bombs result in the back lights turning on and the center lights turning off.
- The laser opposite of the last (starting on the left) will flash, but the other laser will deactivate.
- Both lasers activate on double notes with two beats or more of padding
