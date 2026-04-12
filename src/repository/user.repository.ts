import { prisma } from "@/lib/db/prisma";
import type { User } from "@/types";

export interface CreateUserInput {
  email: string;
  name: string;
  nickname?: string;
  password: string;
}

export interface UpdateUserInput {
  name?: string;
  nickname?: string;
  password?: string;
}

function mapToUser(data: {
  id: number;
  email: string;
  name: string;
  nickname: string | null;
  password: string;
  role: "ADMIN" | "ABOGADO" | "CLIENTE";
  status: "PENDIENTE" | "ACTIVO" | "RECHAZADO" | "SUSPENDIDO";
  lawyerId: number | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}): User {
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    nickname: data.nickname ?? undefined,
    password: data.password,
    role: data.role,
    status: data.status,
    lawyerId: data.lawyerId ?? undefined,
    emailVerified: data.emailVerified,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function create(data: CreateUserInput): Promise<User> {
  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      nickname: data.nickname ?? null,
      password: data.password,
    },
  });
  return mapToUser(user);
}

export async function findByEmail(email: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  return user ? mapToUser(user) : null;
}

export async function findById(id: number): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { id },
  });
  return user ? mapToUser(user) : null;
}

export async function update(id: number, data: UpdateUserInput): Promise<User> {
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.nickname !== undefined && { nickname: data.nickname }),
      ...(data.password && { password: data.password }),
    },
  });
  return mapToUser(user);
}

export async function deleteById(id: number): Promise<void> {
  await prisma.user.delete({
    where: { id },
  });
}
