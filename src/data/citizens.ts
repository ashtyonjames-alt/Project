import type { Citizen } from "@/types";

export const citizens: Citizen[] = [
  { id: "SU-00045812", firstName: "Aleksander", lastName: "Volkov", dateOfBirth: "1985-03-14", district: "Novagrad Central", status: "active", registrationDate: "2003-06-01" },
  { id: "SU-00018273", firstName: "Elena", lastName: "Marova", dateOfBirth: "1972-09-22", district: "Novagrad West", status: "active", registrationDate: "1990-11-15" },
  { id: "SU-00091034", firstName: "Tobias", lastName: "Grenfeld", dateOfBirth: "1969-01-07", district: "Ostmark", status: "active", registrationDate: "1987-04-20" },
  { id: "SU-00033561", firstName: "Ira", lastName: "Desskov", dateOfBirth: "1978-06-30", district: "Velikov", status: "active", registrationDate: "1996-08-12" },
  { id: "SU-00072419", firstName: "Marta", lastName: "Szymańska", dateOfBirth: "1990-12-05", district: "Kradova", status: "active", registrationDate: "2008-07-03" },
  { id: "SU-00054780", firstName: "Dmitri", lastName: "Ankov", dateOfBirth: "1963-07-18", district: "Zarevka", status: "inactive", registrationDate: "1981-03-28" },
  { id: "SU-00066123", firstName: "Natalya", lastName: "Petrikova", dateOfBirth: "1995-02-11", district: "Novagrad East", status: "active", registrationDate: "2013-05-19" },
  { id: "SU-00029847", firstName: "Boris", lastName: "Halvic", dateOfBirth: "1988-08-29", district: "Mirova", status: "active", registrationDate: "2006-09-09" },
  { id: "SU-00083302", firstName: "Sonja", lastName: "Krech", dateOfBirth: "2000-04-17", district: "Ostmark", status: "pending", registrationDate: "2018-04-17" },
  { id: "SU-00011596", firstName: "Pavel", lastName: "Radenko", dateOfBirth: "1975-11-03", district: "Velikov", status: "active", registrationDate: "1993-12-01" },
  { id: "SU-00048903", firstName: "Katrin", lastName: "Vohlberg", dateOfBirth: "1982-05-25", district: "Kradova", status: "active", registrationDate: "2000-06-15" },
  { id: "SU-00037214", firstName: "Yuri", lastName: "Stepanov", dateOfBirth: "1967-10-08", district: "Zarevka", status: "inactive", registrationDate: "1985-10-10" },
];

export function findCitizenById(id: string): Citizen | undefined {
  return citizens.find((c) => c.id.toUpperCase() === id.toUpperCase());
}
