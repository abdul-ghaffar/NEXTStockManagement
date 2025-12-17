import "server-only";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev_jwt_secret_change_me";

export function signToken(user: any) {
  // include minimal safe payload
  const payload = {
    ID: user.ID,
    Name: user.Name,
    IsAdmin: !!user.IsAdmin,
  };
  return jwt.sign(payload as any, SECRET, { expiresIn: "8h" });
}

export function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, SECRET) as any;
    return decoded;
  } catch (err) {
    return null;
  }
}
