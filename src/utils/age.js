// src/utils/age.js

// "2023-03-14" -> "2 years 7 months"
export const getAge = (birthDate) => {
    if (!birthDate) return "";
    const birth = new Date(birthDate);
    const now = new Date();
  
    let months =
      (now.getFullYear() - birth.getFullYear()) * 12 +
      (now.getMonth() - birth.getMonth());
    if (now.getDate() < birth.getDate()) months -= 1;
    if (months < 0) return "";
  
    const years = Math.floor(months / 12);
    const rest = months % 12;
    const parts = [];
    if (years) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
    if (rest || !years) parts.push(`${rest} ${rest === 1 ? "month" : "months"}`);
    return parts.join(" ");
  };
  
  // "2023-03-14" -> "March 14, 2023"
  export const formatBirthDate = (birthDate) =>
    birthDate
      ? new Date(`${birthDate}T00:00:00`).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "";