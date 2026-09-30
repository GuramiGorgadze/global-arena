import bcrypt from "bcrypt";

const temporaryPassword = "enter-password";
const newHash = await bcrypt.hash(temporaryPassword, 10);

console.log(newHash);

// node scripts/tempPass.js
