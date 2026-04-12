import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { generateToken } from "@/lib/auth/jwt";
import { UnauthorizedError } from "@/lib/errors/errors";
import { handleApiError } from "@/lib/errors/error-handler";

// Schema de login
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

// POST /api/auth/login
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedError("Credenciales inválidas");
    }

    // Verificar estado
    if (user.status === "PENDIENTE") {
      throw new UnauthorizedError("Cuenta pendiente de aprobación");
    }

    if (user.status === "RECHAZADO") {
      throw new UnauthorizedError("Cuenta rechazada");
    }

    if (user.status === "SUSPENDIDO") {
      throw new UnauthorizedError("Cuenta suspendida");
    }

    // Verificar contraseña
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedError("Credenciales inválidas");
    }

    // Generar token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    });

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          nickname: user.nickname,
          role: user.role,
          status: user.status,
          emailVerified: user.emailVerified,
        },
      },
      message: "Login exitoso",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
