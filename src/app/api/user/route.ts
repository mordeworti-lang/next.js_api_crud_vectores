import { NextRequest, NextResponse } from "next/server";
import * as UserRepo from "@/repository/user.repository";
import { prisma } from "@/lib/db/prisma";
import { requireAnyRole } from "@/lib/auth/middleware";
import { ValidationError, NotFoundError } from "@/lib/errors/errors";
import { handleApiError } from "@/lib/errors/error-handler";
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().min(2, "Nombre mínimo 2 caracteres"),
  nickname: z.string().optional(),
  password: z.string().min(6, "Contraseña mínimo 6 caracteres"),
});

const updateUserSchema = z.object({
  id: z.coerce.number(),
  name: z.string().min(2).optional(),
  nickname: z.string().optional(),
  password: z.string().min(6).optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const validated = createUserSchema.parse(body);

    // Verificar si email ya existe
    const existing = await UserRepo.findByEmail(validated.email);
    if (existing) {
      throw new ValidationError("El email ya está registrado");
    }

    // TODO: Hash password con bcrypt antes de guardar
    const user = await UserRepo.create(validated);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          nickname: user.nickname,
          createdAt: user.createdAt,
        },
        message: "Usuario registrado exitosamente",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const id = searchParams.get("id");

    if (email) {
      const user = await UserRepo.findByEmail(email);
      if (!user) throw new NotFoundError("Usuario", email);
      return NextResponse.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          nickname: user.nickname,
          createdAt: user.createdAt,
        },
      });
    }

    if (id) {
      const user = await UserRepo.findById(parseInt(id));
      if (!user) throw new NotFoundError("Usuario", id);
      return NextResponse.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          nickname: user.nickname,
          createdAt: user.createdAt,
        },
      });
    }

    throw new ValidationError("Proporciona email o id para buscar usuario");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const validated = updateUserSchema.parse(body);

    const user = await UserRepo.update(validated.id, {
      name: validated.name,
      nickname: validated.nickname,
      password: validated.password,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        nickname: user.nickname,
        updatedAt: user.updatedAt,
      },
      message: "Usuario actualizado exitosamente",
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    // Requiere autenticación - usuario solo puede borrar su propia cuenta
    const user = requireAnyRole(req);

    // Cascade delete: Chats y mensajes se borran automáticamente por onDelete: Cascade
    // ClientKey no se borra (se marca como usedById pero conserva el registro del abogado)
    await prisma.user.delete({
      where: { id: user.userId },
    });

    return NextResponse.json({
      success: true,
      message: "Cuenta eliminada exitosamente. Todos tus datos han sido borrados.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
