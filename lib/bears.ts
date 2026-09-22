export type Bear = {
  id: string;
  name: string;
  nickname: string;
  group: "families" | "subadults" | "females" | "males";
  blurb: string;
  photo: string;
};

export const BEARS: Record<string, Bear> = {
  "132": {
    id: "132",
    name: "132 & Spring Cubs",
    nickname: "132",
    group: "families",
    blurb:
      "A large, experienced mother with a chevron of fur on her forehead. First Fat Bear Week, with her fourth known litter of three spring cubs.",
    photo: "/bears/132.png"
  },
  "284": {
    id: "284",
    name: "284 & Spring Cubs",
    nickname: "Electra",
    group: "families",
    blurb:
      "Daughter of 708 Amelia and mother of 901. Bold, space-defending sow raising two spring cubs — a multi-generation Brooks River family.",
    photo: "/bears/284.png"
  },
  "806": {
    id: "806",
    name: "806 & Mixed-Age Cubs",
    nickname: "806",
    group: "families",
    blurb:
      "First Fat Bear Week. Raising her own spring cub plus an adopted 2.5-year-old, Biggie, who left 128 Grazer earlier this year.",
    photo: "/bears/806.png"
  },
  "901": {
    id: "901",
    name: "901 & Spring Cub",
    nickname: "901",
    group: "families",
    blurb:
      "Blond-rimmed triangle ears. Lost one of two cubs in June; the surviving cub is one of the largest at the river this year.",
    photo: "/bears/901.png"
  },
  "909": {
    id: "909",
    name: "909",
    nickname: "909",
    group: "females",
    blurb:
      "Daughter of champion 409 Beadnose. Lost both spring cubs this summer and still packed on fat with quiet resilience.",
    photo: "/bears/909.png"
  },
  "428": {
    id: "428",
    name: "428 Studious",
    nickname: "Studious",
    group: "females",
    blurb:
      "Daughter of two-time champ 128 Grazer. Nickname comes from her focused fishing on the lip of Brooks Falls.",
    photo: "/bears/428.png"
  },
  "131": {
    id: "131",
    name: "131 Marshmallow",
    nickname: "Marshmallow",
    group: "females",
    blurb:
      "Blond ears, dark eye rings, and a short muzzle. First Fat Bear Week. Looks proportionally fatter than ever this September.",
    photo: "/bears/131.png"
  },
  "910": {
    id: "910",
    name: "910",
    nickname: "910",
    group: "females",
    blurb:
      "Sister of 909, daughter of Beadnose. Single this year after raising cubs (including adopted niece 609). Courted by Walker and Bucky.",
    photo: "/bears/910.png"
  },
  "694": {
    id: "694",
    name: "694",
    nickname: "694",
    group: "subadults",
    blurb:
      "Youngest bear in the field — a playful four-year-old male still discovering Brooks Falls, with a faint natal collar on his neck.",
    photo: "/bears/694.png"
  },
  "620": {
    id: "620",
    name: "620",
    nickname: "620",
    group: "subadults",
    blurb:
      "Four-year-old daughter of 910. Grew up in a rare bonded family with aunt 909. Independent since spring 2025.",
    photo: "/bears/620.png"
  },
  "610": {
    id: "610",
    name: "610 & Spring Cubs",
    nickname: "610",
    group: "families",
    blurb:
      "Small adult female with a hip scar from a young-age attack. First known litter, first Fat Bear Week — a lot of heart in a smaller frame.",
    photo: "/bears/610.png"
  },
  "89": {
    id: "89",
    name: "89 Backpack",
    nickname: "Backpack",
    group: "males",
    blurb:
      "Son of 2019 champion 435 Holly. Earned his nickname riding mom’s back as a cub. Quiet toughness, few scars for a bear his size.",
    photo: "/bears/89.png"
  },
  "32": {
    id: "32",
    name: "32 Chunk",
    nickname: "Chunk",
    group: "males",
    blurb:
      "Defending 2025 champion. Broken jaw from 2025, muzzle scar, protruding canine — and still one of the largest bears at Brooks River.",
    photo: "/bears/32.png"
  },
  "164": {
    id: "164",
    name: "164 Bucky",
    nickname: "Bucky Dent",
    group: "males",
    blurb:
      "Young upstart who fishes the plunge pool under the falls like nobody else. Dark line of fur near his eyes. Only about nine years old.",
    photo: "/bears/164.png"
  },
  "151": {
    id: "151",
    name: "151 Walker",
    nickname: "Walker",
    group: "males",
    blurb:
      "Brooks River regular with a pear-shaped body and a legendary rear end. Playful as a subadult; more willing to challenge rivals in 2026.",
    photo: "/bears/151.png"
  },
  "903": {
    id: "903",
    name: "903 Gully",
    nickname: "Gully",
    group: "males",
    blurb:
      "Believed son of 128 Grazer. Nickname from hunting gulls during a huge salmon run. Now large enough to crowd Walker off the lip.",
    photo: "/bears/903.png"
  }
};

export function getBear(id: string | undefined): Bear | null {
  if (!id) return null;
  return BEARS[id] ?? null;
}
