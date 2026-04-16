import { it, describe, expect, beforeAll } from "vitest";

describe("testing correct jwt generation", () => {
  // Payload común para todos los tests
  const mockPayload = {
    userId: 1,
    email: "test@example.com",
    role: "user",
    status: "active",
  };

  beforeAll(async () => {
    // 1. Le damos valor a las variables en memoria ANTES de que se use el archivo jwt
    process.env.JWT_SECRET =
      "superrrrrrr-mega";
    process.env.JWT_EXPIRES_IN = "7d";
  });

  it("must generate a jwt token", async () => {
    const { generateToken } = await import("@/lib/auth/jwt");
    const token = generateToken(mockPayload);

    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
    expect(token.split(".").length).toBe(3);
  });

  it("must verify a jwt token", async () => {
    const { generateToken, verifyToken } = await import("@/lib/auth/jwt");
    const token = generateToken(mockPayload);
    const verified = verifyToken(token);
    
    expect(verified).toBeInstanceOf(Object);
    expect(verified.userId).toBe(1);
    expect(verified.role).toBe('user');
    expect(verified.status).toBe('active');
  });

  it("must throw an error when the token is invalid", async () => {
    const { generateToken, verifyToken } = await import('@/lib/auth/jwt');
    const tokenValido = generateToken(mockPayload);

    // tomamos todo el token menos el ultimo caracter y miramos si termina en a o b y invertimos este dato
    const tokenHackeado = tokenValido.slice(0, -1 ) + (tokenValido.endsWith('a') ? 'b' : 'a');

    // esperamos que lance un error
    expect(() => verifyToken(tokenHackeado)).toThrow();
  });

  it("must decode a jwt token and write the data and don't verify the signature", async () => {
    const { generateToken, decodeToken } = await import ('@/lib/auth/jwt');
    const token = generateToken(mockPayload);
    const decoded = decodeToken(token);

    // verificamos que el token no sea nulo
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(1);
    expect(decoded?.email).toBe("test@example.com");
    expect(decoded?.role).toBe("user");
    expect(decoded?.status).toBe("active");
  });

  it("must return null when the token is invalid", async () => {
    const { decodeToken } = await import ("@/lib/auth/jwt");
    
    // ingresamos un token invalido
    const decoded = decodeToken("invalid-token");
    
    // verificamos que el token sea nulo
    expect(decoded).toBeNull();
  });
});
