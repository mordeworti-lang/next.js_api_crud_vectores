import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ValidationError } from "@/lib/errors/errors";
import { handleApiError } from "@/lib/errors/error-handler";

const registerLawyerSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().min(2, "Nombre mínimo 2 caracteres"),
  nickname: z.string().optional(),
  password: z.string().min(6, "Contraseña mínimo 6 caracteres"),
});

// POST /api/register/lawyer
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = registerLawyerSchema.parse(body);

    // Verificar si email ya existe
    const existing = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existing) {
      throw new ValidationError("El email ya está registrado");
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    // Crear abogado con estado PENDIENTE (requiere aprobación del admin)
    const lawyer = await prisma.user.create({
      data: {
        email: validated.email,
        name: validated.name,
        nickname: validated.nickname || null,
        password: hashedPassword,
        role: "ABOGADO",
        status: "PENDIENTE",
        emailVerified: false,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: lawyer.id,
          email: lawyer.email,
          name: lawyer.name,
          nickname: lawyer.nickname,
          role: lawyer.role,
          status: lawyer.status,
          message: "Registro exitoso. Tu cuenta está pendiente de aprobación por el administrador.",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
