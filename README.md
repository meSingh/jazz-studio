# Jazz's Studio

A studio for Jazz, who is ten, loves stationery, and wanted something of her
own after her brother got Sukhi Play. She designs and prints her own
stationery with her own character on it, makes a brand, plays with secret
codes and story ideas, and keeps a shelf of what she made.

Dark by default and nothing girly, because that is what she asked for.

## The rooms

| Room | What it does |
| --- | --- |
| Stationery | Me stickers, pattern stickers, name labels, bookmarks, a diary cover and diary pages, a week planner, to-do lists, gift tags, door signs and letter paper, all on A4 |
| Make from a box | Pick a project, measure it with a drawing showing exactly what to measure, and print a wrap that fits, with her pattern, words and face on it and the steps to make it |
| My brand | Her logo in four styles (badge, stamp, ribbon, initial), business cards and logo stickers. The logo goes on her diary cover and letter paper too |
| Play | A name poster, secret codes in pigpen with a key for a friend, story sparks that go straight onto a diary page, and a doodle pad |
| My makes | Photos of finished things and kept doodles, on this device |
| Make it yours | Which pose says hello and which goes on her stationery, her name, lettering, colours, favourite pattern and background |

The colour strip sits on top of the preview in every tool, so a colour can be
tried where it shows instead of in another room. It changes the same colours
Make it yours does.

## Her character

Six poses of the same girl, drawn from a photo of Jazz: smiling, waving,
drawing, big idea, wink and cool. Drawing is the app icon; waving says hello
on Home; smiling goes on her stationery. She can change the last two in
Make it yours.

Each pose was rendered on flat magenta and cut out locally:

```
python3 scripts/cutout.py pose.jpg --name hello
python3 scripts/cutout.py pose.jpg --name draw --icon   # also rebuilds the app icons
```

Magenta appears nowhere on her, so it keys out cleanly, and the script takes
the magenta light the render bounces onto her hair back out as well.

**The character artwork is not covered by the code's licence.** It is a
likeness of a real child. `src/assets/jazz/`, `public/*.png` and
`scripts/icon-1024.png` are © Mandeep Singh, all rights reserved, and are not
to be reused, modified or redistributed.

## Printing

Sheets are drawn in millimetres on an A4 page. Print at **actual size**
(100%, not "fit to page"): most sheets have a line that should measure
exactly 5 cm, so a ruler can check. Nothing is closer than 10 mm to the edge.

## Rules it keeps

Works offline. Nothing leaves the device: no accounts, no tracking, nothing
fetched. No emoji in the interface. British English. Works on a 320px phone.

## Running it

```
npm install
npm run dev      # http://localhost:5178
npm run build    # into dist/
```

## Licence

The code is under the Sukhi Play Personal Use Licence 1.0. See
[LICENSE](LICENSE). The character artwork is not; see above.
