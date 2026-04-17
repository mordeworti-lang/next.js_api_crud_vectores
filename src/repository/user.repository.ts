import { prisma } from "@/lib/db/prisma";
import { User as PrismaUser } from "@prisma/client"; 
// esportamos el tipo user o la tabla user en vez de una interfas y asi aprovechamos el doble tipado y el manejo de los datos crudos de db
import type { User, CreateUserInput, UpdateUserInput } from "@/types";
import * as bcrypt from "bcrypt";
import { NotFoundError } from "@/lib/errors/errors";

// aqui definimos el tipo SafeUser que es el mismo que User pero sin los campos de autenticación
export type SafeUser = Omit<User, 'password'| 'emailCode' | 'emailCodeExpires'>;

// estendemos la interfas user para, que reconosca los campos de autenticación y luego eliminarlos 
type UserWithAuthFields = User & {
  emailCode?: string | null;
  emailCodeExpires?: Date | null;
};
function mapToUserInternal(data: PrismaUser): User {
  return {
    ...data,
    //limpiamos campos que son opcionales en la base de datos pero no en el tipo User
    nickname: data.nickname ?? undefined,
    lawyerId: data.lawyerId ?? undefined,
    // aseguramos que los campos role y status sean del tipo correcto de la interfaz User
    role: data.role as User['role'],
    status: data.status as User['status'],
  } as User 
}
//Eliminamos datos sensibles como password, emailCode y emailCodeExpires con destructuring
export function mapToSafeUser(data: PrismaUser): SafeUser {
  const internalUser = mapToUserInternal(data) as UserWithAuthFields 
  const {password, emailCode, emailCodeExpires, ...safeUser} = internalUser
  return safeUser as SafeUser
}

export async function findByEmail(email: string, forAuth?: boolean): Promise<User | SafeUser | null> {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) return null;
  return forAuth ? mapToUserInternal(user) : mapToSafeUser(user);
}

export async function findById(id: number, forAuth?: boolean): Promise<User| SafeUser | null> {
  const user = await prisma.user.findUnique({
    where: { id },
  });
  if (!user) return null;
  return forAuth ? mapToUserInternal(user) : mapToSafeUser(user);
}

async function handleNotFoundError<T>(promise: Promise<T>, message: string): Promise<T> {
  try {
    return await promise;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      throw new NotFoundError("Usuario", message);
    }
    throw error;
  }
}

async function handleDuplicateError<T>(promise: Promise<T>, email: string): Promise<T> {
  try {
    return await promise;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      throw new Error(`El email ${email} ya está registrado`);
    }
    throw error;
  }
}


//creamos un nuevo usuario con hash de contraseña
export async function create(data: CreateUserInput): Promise<SafeUser> {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const newUSer = await handleDuplicateError(
    prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        nickname: data.nickname ?? null,
        password: hashedPassword,
      },
    }),
    data.email
  );

  return mapToSafeUser(newUSer);
}



export async function update(id: number, data: UpdateUserInput): Promise<SafeUser> {
  const { password, nickname, name } = data;
  
  const updateUser = await handleNotFoundError(
    prisma.user.update({
      where: { id },
      data:{
        //Se usa para decir "Si esto es verdad, haz lo siguiente".
        ...(name && { name }),
        ...(password && {password: await bcrypt.hash(password, 10)}),
        //...: Se usa para "pegar" el resultado dentro del objeto principal.
        ...(nickname !== undefined && { nickname: nickname ?? null}),
      }
    }),
    id.toString()
  );

  return mapToSafeUser(updateUser);
}


export async function deleteById(id: number): Promise<SafeUser | null> {

  // Eliminamos usando handleNotFoundError para validar
  const deletedUser = await handleNotFoundError(
    prisma.user.delete({
      where: { id },
    }),
    id.toString()
  );

  console.log(`[User Repository]: Usuario con email ${deletedUser.email} eliminado.`);
  return mapToSafeUser(deletedUser);
}
