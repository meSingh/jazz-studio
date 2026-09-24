/**
 * Things to make from what is already in the recycling.
 *
 * Each one says what to find, how big a wrap it needs, and the steps. The
 * sizes are common ones, and every one of them can be changed, because boxes
 * are not all the same and measuring is part of making. These are a start:
 * the list is meant to grow with the things Jazz actually makes.
 */

export interface Project {
  id: string;
  title: string;
  find: string;
  /** Centimetres: across (or the way round, for a tube), and the height. */
  width: number;
  /** What to call the first measurement. A tube has a way round; a box has an across. */
  across?: string;
  height: number;
  tab: boolean;
  measure: string;
  steps: string[];
}

export const PROJECTS: Project[] = [
  {
    id: 'pencil-pot',
    title: 'Pencil pot',
    find: 'A toilet roll tube and a bit of card for the bottom',
    width: 15.5,
    across: 'Way round',
    height: 10,
    tab: true,
    measure: 'Wrap a strip of paper round the tube, mark where it meets, and measure it. That is the way round.',
    steps: [
      'Print the wrap and cut along the dotted line.',
      'Put glue on the back and wrap it round the tube.',
      'Glue the tab down over the other end.',
      'Draw round the tube on card, cut out the circle and glue it on the bottom.'
    ]
  },
  {
    id: 'desk-tidy',
    title: 'Desk tidy',
    find: 'A cereal box, cut down to the height you want',
    width: 19,
    height: 12,
    tab: false,
    measure: 'Measure across the front of the box, and how tall you cut it. Print one for the front and one for the back.',
    steps: [
      'Ask a grown-up to help cut the top off the box.',
      'Print a wrap for the front and one for the back.',
      'Glue them on, smoothing out the bubbles as you go.',
      'Stand toilet roll pencil pots inside to make sections.'
    ]
  },
  {
    id: 'notebook',
    title: 'Notebook cover',
    find: 'The front of a cereal box and some paper folded in half',
    width: 15,
    height: 21,
    tab: false,
    measure: 'Fold your paper in half and measure the folded size. That is the size of your cover.',
    steps: [
      'Cut a piece from the cereal box a little bigger than your folded paper.',
      'Print the cover and glue it on the plain side of the card.',
      'Fold the card in half with the pages inside.',
      'Staple, sew or tie along the fold to hold the pages in.'
    ]
  },
  {
    id: 'treasure-box',
    title: 'Treasure box',
    find: 'A small box with a lid, like a tea bag or tissue box',
    width: 12,
    height: 8,
    tab: false,
    measure: 'Measure the top of the lid, across and from front to back.',
    steps: [
      'Print the lid wrap and cut it out.',
      'Glue it to the top of the lid.',
      'Print some stickers to decorate the sides.',
      'Fill it with treasure.'
    ]
  },
  {
    id: 'own',
    title: 'My own idea',
    find: 'Anything you like',
    width: 10,
    height: 10,
    tab: false,
    measure: 'Measure the part you want to cover, in centimetres.',
    steps: [
      'Measure the thing you are covering.',
      'Type in the numbers and pick a pattern.',
      'Print it, cut it out and stick it on.',
      'Take a photo and keep it in My makes.'
    ]
  }
];
