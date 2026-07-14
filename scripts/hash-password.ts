import { hashPassword } from "../src/lib/password";

const plain = process.argv[2];
if (!plain) {
  console.error("Usage: npm run hash-password -- <mot-de-passe>");
  process.exit(1);
}

console.log(hashPassword(plain));
