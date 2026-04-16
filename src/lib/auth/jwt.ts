import jwt, { SignOptions } from "jsonwebtoken"; // usamos la tecnologia que devuelve un string token para validar sesiones y signoptions que es un objeto con la configuracion de expiracion es decir una interface
import { JwtPayload } from "@/types";

// Tipo extraído para mayor claridad
type JwtExpiresIn = `${number}${"s" | "m" | "h" | "d"}` | number; // tipo para la expiracion del token

function validateEnv() {
  const JWT_SECRET = process.env.JWT_SECRET;
  const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

  // Validamos que las variables de entorno estén definidas
  if (!JWT_SECRET || typeof JWT_SECRET !== "string") {
    throw new Error("JWT_SECRET is not defined");
  }

  if (!JWT_EXPIRES_IN || typeof JWT_EXPIRES_IN !== "string") {
    throw new Error("JWT_EXPIRES_IN is not defined");
  }
  return { JWT_SECRET, JWT_EXPIRES_IN };
}

// validamos apenas se inicia la aplicacion
const ENV = validateEnv();

export function generateToken(payload: JwtPayload): string {
  const signOptions: SignOptions = {
    expiresIn: ENV.JWT_EXPIRES_IN as JwtExpiresIn,
  };
  // genreamoseltoken con sign que recibe 3 parametros y retorna un string o token generado
  return jwt.sign(payload, ENV.JWT_SECRET, signOptions);
}

export function verifyToken(token: string): JwtPayload {
  //esta fuction hace la verificacion del token con su clave, su estructura y su fecha de expiracion
  return jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    // decode() no verifica la firma, solo lee el contenido.
    // Retorna null si el token está completamente malformado.
    return jwt.decode(token) as JwtPayload | null;
  } catch {
    return null;
  }
}
