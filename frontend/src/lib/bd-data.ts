/**
 * Sample data for the autofill buttons.
 *
 * Real Bangladeshi institution names and common Bengali names, so a demo looks
 * like a real exam roster instead of "Candidate 0001". Everything here is
 * fictional data about real-sounding places — no real student records.
 */

export interface CollegeSample {
  name: string;
  code: string;
}

export const COLLEGES: CollegeSample[] = [
  { name: "Notre Dame College, Dhaka", code: "NDC" },
  { name: "Dhaka College", code: "DHC" },
  { name: "Holy Cross College, Tejgaon", code: "HCC" },
  { name: "Rajuk Uttara Model College", code: "RUMC" },
  { name: "Viqarunnisa Noon College", code: "VNC" },
  { name: "Government Tolaram College", code: "GTC" },
  { name: "Adamjee Cantonment College", code: "ACC" },
  { name: "BAF Shaheen College, Kurmitola", code: "BSC" },
  { name: "Government Bangla College, Mirpur", code: "GBC" },
  { name: "Titumir College, Dhaka", code: "TTC" },
  { name: "Siddheswari Boys' College", code: "SBC" },
  { name: "Eden Mohila College", code: "EMC" },
  { name: "Chittagong College", code: "CTC" },
  { name: "Rajshahi College", code: "RJC" },
  { name: "Carmichael College, Rangpur", code: "CRC" },
  { name: "Government Azizul Haque College, Bogura", code: "AHC" },
  { name: "M C College, Sylhet", code: "MCC" },
  { name: "Brojomohun College, Barishal", code: "BMC" },
  { name: "Ananda Mohan College, Mymensingh", code: "AMC" },
  { name: "Kabi Nazrul Government College", code: "KNC" }
];

export const MALE_NAMES = [
  "Rafi Ahmed", "Tanvir Hasan", "Mehedi Hasan", "Arif Hossain", "Sabbir Rahman",
  "Rakib Hasan", "Shakib Al Hasan", "Hasan Mahmud", "Fahim Shahriar", "Mahin Khan",
  "Zahid Hasan", "Imran Kabir", "Ayan Chowdhury", "Sajid Hossain", "Rubel Mia",
  "Nazmul Islam", "Touhidul Islam", "Ashraful Alam", "Mamun Hossain", "Shahriar Kabir",
  "Rifat Hossain", "Nayeem Ahmed", "Jubayer Hossain", "Sohel Rana", "Anisur Rahman"
];

export const FEMALE_NAMES = [
  "Nusrat Jahan", "Sumaiya Islam", "Farhana Akter", "Jannatul Ferdous", "Mim Akter",
  "Tasnim Rahman", "Anika Tabassum", "Nabila Sultana", "Sadia Afrin", "Rima Khatun",
  "Priya Das", "Shorna Akter", "Mitu Rani", "Tania Islam", "Laboni Akter",
  "Sanjida Akter", "Rumana Islam", "Faria Tasnim", "Ayesha Siddika", "Marzia Sultana",
  "Sharmin Akter", "Rupali Das", "Nazia Sultana", "Tahmina Akter", "Sultana Razia"
];

export const EXAM_TITLES = [
  "HSC Admission Test 2026",
  "Degree Honours Admission 2026",
  "Class XI Selection Test 2026",
  "Combined Admission Test 2026",
  "Honours First Year Final Examination"
];

export const EXAM_DESCRIPTIONS = [
  "Session 2026–27, morning shift",
  "Session 2026–27, afternoon shift",
  "Combined merit test across all units",
  "Held across Dhaka and Chattogram centres",
  "Semester final, all departments"
];

export const SUBJECT_GROUPS = ["Science", "Commerce", "Arts", "Humanities"];

export const HALL_NAMES = [
  "Main Hall", "Academic Building A", "Academic Building B", "Science Block",
  "Exam Hall 1", "Exam Hall 2", "Auditorium", "Library Hall"
];

/** Deterministic-ish pick: rotates through a list by call count, so repeated clicks vary. */
export function pick<T>(list: readonly T[], offset = 0): T {
  const index = Math.floor(Math.random() * list.length) + offset;
  return list[index % list.length] as T;
}

export function randomFullName(): string {
  const pool = Math.random() < 0.5 ? MALE_NAMES : FEMALE_NAMES;
  return pick(pool);
}

export function randomCollege(): CollegeSample {
  return pick(COLLEGES);
}

/** Unique-ish 5-digit roll, e.g. R48213. */
export function randomRoll(): string {
  return `R${String(Math.floor(Math.random() * 90_000) + 10_000)}`;
}

export function randomDob(): string {
  const year = 1999 + Math.floor(Math.random() * 6);
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/** Turns "Notre Dame College, Dhaka" into "notre-dame-college". */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 38);
}
