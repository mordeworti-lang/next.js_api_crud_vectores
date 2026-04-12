import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireLawyer } from "@/lib/auth/middleware";
import { handleApiError } from "@/lib/errors/error-handler";

// GET /api/lawyer/clients - Listar mis clientes
export async function GET(req: NextRequest) {
  try {
    const lawyer = requireLawyer(req);

    const clients = await prisma.user.findMany({
      where: {
        lawyerId: lawyer.userId,
        role: "CLIENTE",
      },
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            chats: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: clients,
      count: clients.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
