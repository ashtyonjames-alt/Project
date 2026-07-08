import type { Leader } from "@/types";

export const history = [
  {
    period: "1920–1945: The Divided Territories",
    text: "The lands of what is now the Slavakian Union were, throughout the early twentieth century, a patchwork of autonomous regions, petty states, and contested territories. The Great Division of 1920 formalised separate administrations across six major regions, each governed by different political factions and, in some cases, under the influence of neighbouring powers. Economic disparity, border disputes, and periodic armed conflicts characterised this era, leaving deep scars in the collective memory of the Slavakian people.",
  },
  {
    period: "1945–1951: The Path to Unification",
    text: "The aftermath of the Second Continental War (1939–1944) left the divided territories economically devastated and politically exhausted. A series of inter-regional conferences, beginning with the Velikov Talks of 1947, gradually built the consensus that only through political union could lasting peace and prosperity be achieved. Visionary statespeople from all six regions — most notably Chancellor Rada Mirova of Novagrad and Premier Stepan Halvic of Ostmark — negotiated the terms of what would become the founding document of the new nation.",
  },
  {
    period: "1951: The Novagrad Accord",
    text: "On the 14th of June 1951, representatives of all six territories gathered in Novagrad's Grand Hall of Unification and signed the Novagrad Accord, formally establishing the Slavakian Union as a federal republic. The Accord created a National Assembly, a federal executive headed by a President and Prime Minister, an independent judiciary, and guaranteed a suite of fundamental rights to all citizens. The 14th of June is observed annually as Unification Day, the nation's most important public holiday.",
  },
  {
    period: "1951–Present: Building a Nation",
    text: "The seventy-five years since unification have seen the Slavakian Union transform from a largely agrarian economy into a modern, diversified, and outward-looking society. Successive governments have invested in education, healthcare, and infrastructure. The nation joined the Continental Trade Area in 1978, adopted the Euro as its currency in 2003, and has consistently ranked in the top tier of continental indices for quality of life, press freedom, and government transparency. Today, the Slavakian Union stands as a proud example of what unity, democratic values, and sustained investment in public good can achieve.",
  },
];

export const branches = [
  {
    name: "Executive",
    description: "The executive branch is led by the President, who serves as Head of State, and the Prime Minister, who serves as Head of Government. The Cabinet, appointed by the Prime Minister and approved by the National Assembly, oversees the day-to-day administration of the federal government.",
    icon: "🏛️",
  },
  {
    name: "Legislative",
    description: "The National Assembly is the supreme legislative body of the Slavakian Union, comprising 240 members elected for four-year terms from single-member constituencies. The Assembly debates and passes legislation, scrutinises the executive, and approves the annual national budget.",
    icon: "📜",
  },
  {
    name: "Judicial",
    description: "The judiciary is fully independent of the executive and legislature. The Supreme Court of the Slavakian Union is the highest court of appeal. The Constitutional Tribunal adjudicates on questions of constitutional law, including the validity of legislation and the protection of fundamental rights.",
    icon: "⚖️",
  },
];

export const leaders: Leader[] = [
  {
    name: "Elena Marova",
    title: "President of the Slavakian Union",
    role: "Head of State",
    bio: "Elena Marova was elected President in 2020, becoming the first woman to hold the office. A former Professor of Constitutional Law at the University of Novagrad, she is known for her commitment to digital modernisation, environmental protection, and strengthening the rule of law. She was re-elected in 2025 with 61% of the popular vote.",
    termStart: "2020-09-01",
  },
  {
    name: "Tobias Grenfeld",
    title: "Prime Minister of the Slavakian Union",
    role: "Head of Government",
    bio: "Tobias Grenfeld has served as Prime Minister since 2022, leading the Democratic Progress coalition. Previously Minister for Economic Development, he oversaw the Slavakian Union's post-pandemic recovery. A native of Ostmark, he is a vocal advocate for regional investment and rural development.",
    termStart: "2022-03-15",
  },
  {
    name: "Ira Desskov",
    title: "Speaker of the National Assembly",
    role: "Presiding Officer of the Legislature",
    bio: "Ira Desskov has served as Speaker since 2021, widely respected across party lines for her impartiality and procedural expertise. She previously represented the Velikov South constituency for twelve years, serving on the Finance and Foreign Affairs committees.",
    termStart: "2021-01-20",
  },
  {
    name: "Alena Vorcek",
    title: "Minister of Finance",
    role: "Cabinet Minister",
    bio: "Alena Vorcek, a former central banker and economist, has held the Finance portfolio since 2022. She is the architect of the 2027 tax reform package and has overseen three consecutive years of balanced federal budgets.",
    termStart: "2022-03-15",
  },
  {
    name: "Dr. Oskar Brennan",
    title: "Minister of Health",
    role: "Cabinet Minister",
    bio: "Dr. Oskar Brennan is a practising physician and academic who entered politics in 2018. As Health Minister, he has championed the expansion of rural primary care and the implementation of universal mental health coverage under the 2024 Health Reform Act.",
    termStart: "2022-03-15",
  },
];
