import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { UserRole, UserStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth/middleware";
import { handleApiError } from "@/lib/errors/error-handler";
import { z } from "zod";

const updateLawyerSchema = z.object({
  status: z.enum(["ACTIVO", "RECHAZADO", "SUSPENDIDO"]),
});

// PUT /api/admin/lawyers/{id} - Aprobar/Rechazar/Suspender abogado
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(req);

    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();
    const validated = updateLawyerSchema.parse(body);

    // Verificar que existe y es abogado
    const lawyer = await prisma.user.findFirst({
      where: { id, role: UserRole.ABOGADO },
    });

    if (!lawyer) {
      return NextResponse.json({ success: false, error: "Abogado no encontrado" }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status: validated.status as UserStatus },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Abogado ${validated.status.toLowerCase()} exitosamente`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
