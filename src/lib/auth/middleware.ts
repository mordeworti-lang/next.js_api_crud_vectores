import { NextRequest } from "next/server";
import { verifyToken, JwtPayload } from "./jwt";
import { UnauthorizedError } from "@/lib/errors/errors";

export function requireAuth(req: NextRequest): JwtPayload {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Token de autenticación requerido");
  }

  const token = authHeader.substring(7);
  return verifyToken(token);
}

export function requireRole(req: NextRequest, allowedRoles: string[]): JwtPayload {
  const user = requireAuth(req);

  if (!allowedRoles.includes(user.role)) {
    throw new UnauthorizedError(`Requiere rol: ${allowedRoles.join(" o ")}`);
  }

  if (user.status !== "ACTIVO") {
    throw new UnauthorizedError("Tu cuenta debe estar activa");
  }

  return user;
}

export function requireAdmin(req: NextRequest): JwtPayload {
  return requireRole(req, ["ADMIN"]);
}

export function requireLawyer(req: NextRequest): JwtPayload {
  return requireRole(req, ["ABOGADO"]);
}

export function requireClient(req: NextRequest): JwtPayload {
  return requireRole(req, ["CLIENTE"]);
}

export function requireAnyRole(req: NextRequest): JwtPayload {
  return requireRole(req, ["ADMIN", "ABOGADO", "CLIENTE"]);
}
