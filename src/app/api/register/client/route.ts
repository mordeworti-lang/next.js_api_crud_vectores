import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ValidationError } from "@/lib/errors/errors";
import { handleApiError } from "@/lib/errors/error-handler";

const registerClientSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().min(2, "Nombre mínimo 2 caracteres"),
  nickname: z.string().optional(),
  password: z.string().min(6, "Contraseña mínimo 6 caracteres"),
  accessKey: z.string().length(16, "La clave debe tener 16 caracteres"),
});

// POST /api/register/client
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = registerClientSchema.parse(body);

    // Verificar si email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      throw new ValidationError("El email ya está registrado");
    }

    // Buscar la clave de acceso
    const clientKey = await prisma.clientKey.findUnique({
      where: { key: validated.accessKey.toUpperCase() },
      include: { lawyer: true },
    });

    if (!clientKey) {
      throw new ValidationError("Clave de acceso inválida");
    }

    if (clientKey.used) {
      throw new ValidationError("Esta clave ya fue utilizada");
    }

    if (clientKey.clientEmail.toLowerCase() !== validated.email.toLowerCase()) {
      throw new ValidationError(
        `Esta clave solo puede usarse con el email: ${clientKey.clientEmail}`
      );
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    // Crear cliente vinculado al abogado
    const client = await prisma.$transaction(async (tx) => {
      // Crear el cliente
      const newClient = await tx.user.create({
        data: {
          email: validated.email,
          name: validated.name,
          nickname: validated.nickname || null,
          password: hashedPassword,
          role: "CLIENTE",
          status: "ACTIVO", // Clientes quedan activos inmediatamente (no necesitan aprobación)
          lawyerId: clientKey.lawyerId,
          emailVerified: false, // Por ahora sin verificación de email
        },
      });

      // Marcar clave como usada
      await tx.clientKey.update({
        where: { id: clientKey.id },
        data: {
          used: true,
          usedById: newClient.id,
        },
      });

      return newClient;
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: client.id,
          email: client.email,
          name: client.name,
          nickname: client.nickname,
          role: client.role,
          status: client.status,
          lawyer: {
            id: clientKey.lawyer.id,
            name: clientKey.lawyer.name,
          },
          message: "Registro exitoso. Ahora puedes iniciar sesión.",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
