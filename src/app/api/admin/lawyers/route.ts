import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { UserRole, UserStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth/middleware";
import { handleApiError } from "@/lib/errors/error-handler";

// GET /api/admin/lawyers?status=PENDIENTE|ACTIVO|RECHAZADO
export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as any;

    const where: { role: UserRole; status?: UserStatus } = status
      ? { role: UserRole.ABOGADO, status: status as UserStatus }
      : { role: UserRole.ABOGADO };

    const lawyers = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: lawyers,
      count: lawyers.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
